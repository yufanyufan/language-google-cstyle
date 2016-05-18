'use babel';

import {CompositeDisposable} from 'atom';

const findOpenParathesis = function(editor, row) {
  let count = 0;
  while (row >= 0) {
    const line = stripComment(editor.lineTextForBufferRow(row));
    for (let i = line.length - 1; i >= 0; i--) {
      if (line[i] == ")" || line[i] == "]") {
        count -= 1;
      } else if (line[i] == "(" || line[i] == "[") {
        count += 1;
      }
      if (count > 0) {
        return i;
      }
    }
    if (count >= 0) {
      break;
    }
    row -= 1;
  }
  return -1;
};

const stripComment = function(line) {
  return line.replace(/ *(\/\/.*)?$/g, '');
};
const findNonEmptyRow = function(row, editor) {
  while (row >= 0
    && editor.lineTextForBufferRow(row).match(/^\w*$/) != null) {
    row -= 1;
  }
  if (row < 0) row = 0;
  return row;
}
const findPreviousIndent = function(indentLevel, row, editor) {
  for (let i = 1; i <= row; i++) {
    let previous_statment = stripComment(
      editor.lineTextForBufferRow(row - i));
    if (previous_statment == "") {
        continue;
    }
    if (previous_statment.match(/[;{}]$/)) {
      for (let p = 1; p < i; p++) {
        if (editor.lineTextForBufferRow(row - i + p).match(/^\w*$/) == null) {
          indentLevel = editor.indentationForBufferRow(row - i + p);
          break;
        }
      }
      break;
    }
    if ( i == row) {
      indentLevel = 0;
    }
  }
  return indentLevel;
};
const calculateIndent = function(editor) {
  const row = editor.getCursorBufferPosition().row;
  const previous_non_empty_row = findNonEmptyRow(row - 1, editor)
  const privous_row = stripComment(
    editor.lineTextForBufferRow(previous_non_empty_row));
  var indentLevel = editor.indentationForBufferRow(previous_non_empty_row);
  if (privous_row.match(/^#|^namespace|}$/)) {
  } else if (privous_row.match(/{$/)) {
    indentLevel = findPreviousIndent(
      indentLevel, previous_non_empty_row, editor) + 1;
  } else if (privous_row.match(/[([]$/)) {
    indentLevel += 2;
  } else if (privous_row.match(/;$/)) {
    indentLevel = findPreviousIndent(
      indentLevel, previous_non_empty_row, editor);
  } else if (privous_row.match(/:$/)) {
    indentLevel = 1;
  } else if (privous_row.match(/ +.*(?!;)$/)) {
    let openParathesis = findOpenParathesis(editor, previous_non_empty_row);
    if (openParathesis >= 0) {
      indentLevel = openParathesis / 2 + 0.5;
    } else if (row < 2
      || stripComment(editor.lineTextForBufferRow(previous_non_empty_row - 1))
          .match(/[{};]$/)) {
      indentLevel += 2;
    }
  }
  if (stripComment(editor.lineTextForBufferRow(row)).match(/ *}$/)) {
    indentLevel -= 1;
  }
  return indentLevel
}

const properlyIndent = function(e, test_editor = null) {
  if (atom.workspace.getModalPanels().length > 0) {
    return;
  }
  const editor = atom.workspace.getActiveTextEditor() || test_editor;
  if (editor.getGrammar().scopeName != 'source.cpp.google') {
    return;
  }
  editor.setIndentationForBufferRow(
    editor.getCursorBufferPosition().row, calculateIndent(editor));
};

const Tab = function(e, test_editor = null) {
  if (atom.workspace.getModalPanels().length > 0) {
    return;
  }
  const editor = atom.workspace.getActiveTextEditor() || test_editor;
  if (editor.getGrammar().scopeName != 'source.cpp.google') {
    return;
  }
  const range = editor.getSelectedBufferRange();
  for (let row = range.start.row; row <= range.end.row; row++) {
    var indentLevel = editor.indentationForBufferRow(row) - 1;
    var previous_indent = calculateIndent(editor);
    if (indentLevel < previous_indent) {
      indentLevel = previous_indent;
    } else {
      indentLevel += 1;
    }
    editor.setIndentationForBufferRow(row, indentLevel);
  }
}

const CloseBracket = function(editor, event) {
  if (event.text != "}") {
    return;
  }
  const row = editor.getCursorBufferPosition().row;
  const text = editor.lineTextForBufferRow(row);
  if (editor.lineTextForBufferRow(row).match(/^\s+}$/)) {
    const indentLevel = editor.indentationForBufferRow(row);
    editor.setIndentationForBufferRow(
    editor.getCursorBufferPosition().row, indentLevel - 1);
  }
}

module.exports = {
  config: {
    hangingIndentTabs: {
      type: 'number',
      "default": 1,
      description: 'Number of tabs used for _hanging_ indents',
      "enum": [1, 2]
    }
  },
  activate: function() {
    this.subscriptions = new CompositeDisposable;
    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'editor:newline': event => properlyIndent(event),
      'editor:indent': event => Tab(event)
    }));
    this.subscriptions.add(atom.workspace.observeTextEditors(
      editor => {
        if (editor.getGrammar().scopeName != 'source.cpp.google') {
          return;
        }
        this.subscriptions.add(editor.onDidInsertText(event => {
          CloseBracket(editor, event);
        }));
      }));
  },
  deactivate: function() {
    return this.subscriptions.dispose();
  },
  properlyIndent : properlyIndent
};
