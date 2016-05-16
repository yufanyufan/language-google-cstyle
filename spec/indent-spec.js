'use babel';

import {properlyIndent} from "../lib/indent";

describe("indent", function() {
  var editor = null;
  var grammar = null;
  beforeEach(function() {
    return waitsForPromise(function() {
      return atom.packages.activatePackage('language-google-cstyle')
      .then(function() {
          editor = atom.workspace.buildTextEditor();
          grammar = atom.grammars.grammarForScopeName('source.cpp.google');
          expect(grammar.scopeName).toBe('source.cpp.google');
          editor.setGrammar(grammar);
      });
    });
  });
  it("grammar", function() {
    expect(editor.getGrammar().scopeName).toBe('source.cpp.google');
  });
  it("int a;", function() {
    editor.insertText("int a;\n");
    editor.setCursorBufferPosition([1, 0])
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(1)).toBe('');
  });
  it("  int a", function() {
    editor.insertText("  int a;\n");
    editor.setCursorBufferPosition([1, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(1)).toBe(' '.repeat(2));
  });
  it("  int a; // comment", function() {
    editor.insertText("  int a; // coment\n");
    editor.setCursorBufferPosition([1, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(1)).toBe(' '.repeat(2));
  });
  it("int f() {", function() {
    editor.insertText("int f() {\n");
    editor.setCursorBufferPosition([1, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(1)).toBe(' '.repeat(2));
  });
  it("int f (", function() {
    editor.insertText("int f(\n");
    editor.setCursorBufferPosition([1, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(1)).toBe(' '.repeat(4));
  });
  it("int f (\\na,", function() {
    editor.insertText("int f(\na);\n");
    editor.setCursorBufferPosition([2, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(2)).toBe(' '.repeat(0));
  });
  it("int f(a,", function() {
    editor.insertText("int f(a,\n");
    editor.setCursorBufferPosition([1, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(1).length).toBe(6);
  });
  it("int f(a,\\nb,", function() {
    editor.insertText("int f(a,\n      b,\n");
    editor.setCursorBufferPosition([2, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(2).length).toBe(6);
  });
  it("int f(a,\\n      b);", function() {
    editor.insertText("int f(a,\n      b);\n");
    editor.setCursorBufferPosition([2, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(2).length).toBe(0);
  });
  it("class a : public d<", function() {
    editor.insertText("class a : public d<\n");
    editor.setCursorBufferPosition([1, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(1).length).toBe(4);
  });
  it("int f(a,\\n      b) {\\n", function() {
    editor.insertText("int f(a,\n      b) {\n");
    editor.setCursorBufferPosition([2, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(2).length).toBe(2);
  });
  it("int a(aaaa\\n,      bbbbb) {  \\n  if(1) {\\n", function() {
    editor.insertText("int a(aaaa\n,      bbbbb) {  \n  if(1) {\n");
    editor.setCursorBufferPosition([3, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(3).length).toBe(4);
  });
  it("a = f(aaaa, f(bbbbb,\n       ccccc),\\n", function() {
    editor.insertText("a = f(aaaa, f(bbbbb,\n       ccccc),\n");
    editor.setCursorBufferPosition([2, 0]);
    properlyIndent(null, editor);
    expect(editor.buffer.lineForRow(2).length).toBe(6);
  });
});
