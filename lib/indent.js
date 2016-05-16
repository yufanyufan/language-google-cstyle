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
const findPreviousIndent = function(indentLevel, row, editor) {
  for (let i = 2; i <= row; i++) {
    let previous_statment = stripComment(
      editor.lineTextForBufferRow(row - i));
    if (previous_statment == "") {
        continue;
    }
    if (previous_statment.match(/[;{}]$/)) {
      for (let p = 1; p < i; p++) {
        if (editor.lineTextForBufferRow(row - i + p) != "") {
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
const properlyIndent = function(e, test_editor = null) {
  if (atom.workspace.getModalPanels().length > 0) {
    return;
  }
  const editor = atom.workspace.getActiveTextEditor() || test_editor;
  if (editor.getGrammar().scopeName != 'source.cpp.google') {
    return;
  }
  const row = editor.getCursorBufferPosition().row;
  const privous_row = stripComment(editor.lineTextForBufferRow(row - 1));
  var indentLevel = editor.indentationForBufferRow(row - 1);
  if (privous_row.match(/^#|^namespace|}$/)) {
  } else if (privous_row.match(/{$/)) {
    indentLevel = findPreviousIndent(indentLevel, row, editor) + 1;
  } else if (privous_row.match(/[([]$/)) {
    indentLevel += 2;
  } else if (privous_row.match(/;$/)) {
    indentLevel = findPreviousIndent(indentLevel, row, editor);
  } else if (privous_row.match(/:$/)) {
    indentLevel = 1;
  } else if (privous_row.match(/ +.*(?!;)$/)) {
    let openParathesis = findOpenParathesis(editor, row - 1);
    if (openParathesis >= 0) {
      indentLevel = openParathesis / 2 + 0.5;
    } else if (row < 2 || stripComment(editor.lineTextForBufferRow(row - 2))
          .match(/[{};]$/)) {
      indentLevel += 2;
    }
  }
  if (stripComment(editor.lineTextForBufferRow(row)).match(/ *}$/)) {
    indentLevel -= 1;
  }
  editor.setIndentationForBufferRow(row, indentLevel);
};

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
    return this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'editor:newline': (function(_this) {
        return function() {
          return properlyIndent(event);
        };
      })(this)
    }));
  },
  deactivate: function() {
    return this.subscriptions.dispose();
  },
  properlyIndent : properlyIndent
};
