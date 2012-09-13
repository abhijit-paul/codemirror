function forEach(arr, f) {
  for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
}

function addDoc(cm, width, height) {
  var content = [], line = "";
  for (var i = 0; i < width; ++i) line += "x";
  for (var i = 0; i < height; ++i) content.push(line);
  cm.setValue(content.join("\n"));
}

function byClassName(elt, cls) {
  if (elt.getElementsByClassName) return elt.getElementsByClassName(cls);
  var found = [], re = new RegExp("\\b" + cls + "\\b");
  function search(elt) {
    if (elt.nodeType == 3) return;
    if (re.test(elt.className)) found.push(elt);
    for (var i = 0, e = elt.childNodes.length; i < e; ++i)
      search(elt.childNodes[i]);
  }
  search(elt);
  return found;
}

var ie_lt8 = /MSIE [1-7]\b/.test(navigator.userAgent);
var phantom = /PhantomJS/.test(navigator.userAgent);

test("core_fromTextArea", function() {
  var te = document.getElementById("code");
  te.value = "CONTENT";
  var cm = CodeMirror.fromTextArea(te);
  is(!te.offsetHeight);
  eq(cm.getValue(), "CONTENT");
  cm.setValue("foo\nbar");
  eq(cm.getValue(), "foo\nbar");
  cm.save();
  is(/^foo\r?\nbar$/.test(te.value));
  cm.setValue("xxx");
  cm.toTextArea();
  is(te.offsetHeight);
  eq(te.value, "xxx");
});

testCM("getRange", function(cm) {
  eq(cm.getLine(0), "1234");
  eq(cm.getLine(1), "5678");
  eq(cm.getLine(2), null);
  eq(cm.getLine(-1), null);
  eq(cm.getRange({line: 0, ch: 0}, {line: 0, ch: 3}), "123");
  eq(cm.getRange({line: 0, ch: -1}, {line: 0, ch: 200}), "1234");
  eq(cm.getRange({line: 0, ch: 2}, {line: 1, ch: 2}), "34\n56");
  eq(cm.getRange({line: 1, ch: 2}, {line: 100, ch: 0}), "78");
}, {value: "1234\n5678"});

testCM("replaceRange", function(cm) {
  eq(cm.getValue(), "");
  cm.replaceRange("foo\n", {line: 0, ch: 0});
  eq(cm.getValue(), "foo\n");
  cm.replaceRange("a\nb", {line: 0, ch: 1});
  eq(cm.getValue(), "fa\nboo\n");
  eq(cm.lineCount(), 3);
  cm.replaceRange("xyzzy", {line: 0, ch: 0}, {line: 1, ch: 1});
  eq(cm.getValue(), "xyzzyoo\n");
  cm.replaceRange("abc", {line: 0, ch: 0}, {line: 10, ch: 0});
  eq(cm.getValue(), "abc");
  eq(cm.lineCount(), 1);
});

testCM("selection", function(cm) {
  cm.setSelection({line: 0, ch: 4}, {line: 2, ch: 2});
  is(cm.somethingSelected());
  eq(cm.getSelection(), "11\n222222\n33");
  eqPos(cm.getCursor(false), {line: 2, ch: 2});
  eqPos(cm.getCursor(true), {line: 0, ch: 4});
  cm.setSelection({line: 1, ch: 0});
  is(!cm.somethingSelected());
  eq(cm.getSelection(), "");
  eqPos(cm.getCursor(true), {line: 1, ch: 0});
  cm.replaceSelection("abc");
  eq(cm.getSelection(), "abc");
  eq(cm.getValue(), "111111\nabc222222\n333333");
  cm.replaceSelection("def", "end");
  eq(cm.getSelection(), "");
  eqPos(cm.getCursor(true), {line: 1, ch: 3});
  cm.setCursor({line: 2, ch: 1});
  eqPos(cm.getCursor(true), {line: 2, ch: 1});
  cm.setCursor(1, 2);
  eqPos(cm.getCursor(true), {line: 1, ch: 2});
}, {value: "111111\n222222\n333333"});

testCM("lines", function(cm) {
  eq(cm.getLine(0), "111111");
  eq(cm.getLine(1), "222222");
  eq(cm.getLine(-1), null);
  cm.removeLine(1);
  cm.setLine(1, "abc");
  eq(cm.getValue(), "111111\nabc");
}, {value: "111111\n222222\n333333"});

testCM("indent", function(cm) {
  cm.indentLine(1);
  eq(cm.getLine(1), "   blah();");
  cm.setOption("indentUnit", 8);
  cm.indentLine(1);
  eq(cm.getLine(1), "\tblah();");
  cm.setOption("indentUnit", 10);
  cm.setOption("tabSize", 4);
  cm.indentLine(1);
  eq(cm.getLine(1), "\t\t  blah();");
}, {value: "if (x) {\nblah();\n}", indentUnit: 3, indentWithTabs: true, tabSize: 8});

test("core_defaults", function() {
  var defsCopy = {}, defs = CodeMirror.defaults;
  for (var opt in defs) defsCopy[opt] = defs[opt];
  defs.indentUnit = 5;
  defs.value = "uu";
  defs.enterMode = "keep";
  defs.tabindex = 55;
  var place = document.getElementById("testground"), cm = CodeMirror(place);
  try {
    eq(cm.getOption("indentUnit"), 5);
    cm.setOption("indentUnit", 10);
    eq(defs.indentUnit, 5);
    eq(cm.getValue(), "uu");
    eq(cm.getOption("enterMode"), "keep");
    eq(cm.getInputField().tabIndex, 55);
  }
  finally {
    for (var opt in defsCopy) defs[opt] = defsCopy[opt];
    place.removeChild(cm.getWrapperElement());
  }
});

testCM("lineInfo", function(cm) {
  eq(cm.lineInfo(-1), null);
  var mark = document.createElement("span");
  var lh = cm.setGutterMarker(1, "FOO", mark);
  var info = cm.lineInfo(1);
  eq(info.text, "222222");
  eq(info.gutterMarkers.FOO, mark);
  eq(info.line, 1);
  eq(cm.lineInfo(2).gutterMarkers, null);
  cm.setGutterMarker(lh, "FOO", null);
  eq(cm.lineInfo(1).gutterMarkers, null);
  cm.setGutterMarker(1, "FOO", mark);
  cm.setGutterMarker(0, "FOO", mark);
  cm.clearGutter("FOO");
  eq(cm.lineInfo(0).gutterMarkers, null);
  eq(cm.lineInfo(1).gutterMarkers, null);
}, {value: "111111\n222222\n333333"});

testCM("coords", function(cm) {
  cm.setSize(null, 100);
  addDoc(cm, 32, 200);
  var top = cm.charCoords({line: 0, ch: 0});
  var bot = cm.charCoords({line: 200, ch: 30});
  is(top.left < bot.left);
  is(top.top < bot.top);
  is(top.top < top.bottom);
  cm.scrollTo(null, 100);
  var top2 = cm.charCoords({line: 0, ch: 0});
  is(top.top > top2.top);
  eq(top.left, top2.left);
});

testCM("coordsChar", function(cm) {
  addDoc(cm, 35, 70);
  for (var ch = 0; ch <= 35; ch += 5) {
    for (var line = 0; line < 70; line += 5) {
      cm.setCursor(line, ch);
      var coords = cm.charCoords({line: line, ch: ch});
      var pos = cm.coordsChar({left: coords.left, top: coords.top + 5});
      eqPos(pos, {line: line, ch: ch});
    }
  }
});

testCM("posFromIndex", function(cm) {
  cm.setValue(
    "This function should\n" +
    "convert a zero based index\n" +
    "to line and ch."
  );

  var examples = [
    { index: -1, line: 0, ch: 0  }, // <- Tests clipping
    { index: 0,  line: 0, ch: 0  },
    { index: 10, line: 0, ch: 10 },
    { index: 39, line: 1, ch: 18 },
    { index: 55, line: 2, ch: 7  },
    { index: 63, line: 2, ch: 15 },
    { index: 64, line: 2, ch: 15 }  // <- Tests clipping
  ];

  for (var i = 0; i < examples.length; i++) {
    var example = examples[i];
    var pos = cm.posFromIndex(example.index);
    eq(pos.line, example.line);
    eq(pos.ch, example.ch);
    if (example.index >= 0 && example.index < 64)
      eq(cm.indexFromPos(pos), example.index);
  }
});

testCM("undo", function(cm) {
  cm.setLine(0, "def");
  eq(cm.historySize().undo, 1);
  cm.undo();
  eq(cm.getValue(), "abc");
  eq(cm.historySize().undo, 0);
  eq(cm.historySize().redo, 1);
  cm.redo();
  eq(cm.getValue(), "def");
  eq(cm.historySize().undo, 1);
  eq(cm.historySize().redo, 0);
  cm.setValue("1\n\n\n2");
  cm.clearHistory();
  eq(cm.historySize().undo, 0);
  for (var i = 0; i < 20; ++i) {
    cm.replaceRange("a", {line: 0, ch: 0});
    cm.replaceRange("b", {line: 3, ch: 0});
  }
  eq(cm.historySize().undo, 40);
  for (var i = 0; i < 40; ++i)
    cm.undo();
  eq(cm.historySize().redo, 40);
  eq(cm.getValue(), "1\n\n\n2");
}, {value: "abc"});

testCM("undoMultiLine", function(cm) {
  cm.replaceRange("x", {line:0, ch: 0});
  cm.replaceRange("y", {line:1, ch: 0});
  cm.undo();
  eq(cm.getValue(), "abc\ndef\nghi");
  cm.replaceRange("y", {line:1, ch: 0});
  cm.replaceRange("x", {line:0, ch: 0});
  cm.undo();
  eq(cm.getValue(), "abc\ndef\nghi");
  cm.replaceRange("y", {line:2, ch: 0});
  cm.replaceRange("x", {line:1, ch: 0});
  cm.replaceRange("z", {line:2, ch: 0});
  cm.undo();
  eq(cm.getValue(), "abc\ndef\nghi");
}, {value: "abc\ndef\nghi"});

testCM("markTextSingleLine", function(cm) {
  forEach([{a: 0, b: 1, c: "", f: 2, t: 5},
           {a: 0, b: 4, c: "", f: 0, t: 2},
           {a: 1, b: 2, c: "x", f: 3, t: 6},
           {a: 4, b: 5, c: "", f: 3, t: 5},
           {a: 4, b: 5, c: "xx", f: 3, t: 7},
           {a: 2, b: 5, c: "", f: 2, t: 3},
           {a: 2, b: 5, c: "abcd", f: 6, t: 7},
           {a: 2, b: 6, c: "x", f: null, t: null},
           {a: 3, b: 6, c: "", f: null, t: null},
           {a: 0, b: 9, c: "hallo", f: null, t: null},
           {a: 4, b: 6, c: "x", f: 3, t: 4},
           {a: 4, b: 8, c: "", f: 3, t: 4},
           {a: 6, b: 6, c: "a", f: 3, t: 6},
           {a: 8, b: 9, c: "", f: 3, t: 6}], function(test) {
    cm.setValue("1234567890");
    var r = cm.markText({line: 0, ch: 3}, {line: 0, ch: 6}, "foo");
    cm.replaceRange(test.c, {line: 0, ch: test.a}, {line: 0, ch: test.b});
    var f = r.find();
    eq(f && f.from.ch, test.f); eq(f && f.to.ch, test.t);
  });
});

testCM("markTextMultiLine", function(cm) {
  function p(v) { return v && {line: v[0], ch: v[1]}; }
  forEach([{a: [0, 0], b: [0, 5], c: "", f: [0, 0], t: [2, 5]},
           {a: [0, 0], b: [0, 5], c: "foo\n", f: [1, 0], t: [3, 5]},
           {a: [0, 1], b: [0, 10], c: "", f: [0, 1], t: [2, 5]},
           {a: [0, 5], b: [0, 6], c: "x", f: [0, 6], t: [2, 5]},
           {a: [0, 0], b: [1, 0], c: "", f: [0, 0], t: [1, 5]},
           {a: [0, 6], b: [2, 4], c: "", f: [0, 5], t: [0, 7]},
           {a: [0, 6], b: [2, 4], c: "aa", f: [0, 5], t: [0, 9]},
           {a: [1, 2], b: [1, 8], c: "", f: [0, 5], t: [2, 5]},
           {a: [0, 5], b: [2, 5], c: "xx", f: null, t: null},
           {a: [0, 0], b: [2, 10], c: "x", f: null, t: null},
           {a: [1, 5], b: [2, 5], c: "", f: [0, 5], t: [1, 5]},
           {a: [2, 0], b: [2, 3], c: "", f: [0, 5], t: [2, 2]},
           {a: [2, 5], b: [3, 0], c: "a\nb", f: [0, 5], t: [2, 5]},
           {a: [2, 3], b: [3, 0], c: "x", f: [0, 5], t: [2, 3]},
           {a: [1, 1], b: [1, 9], c: "1\n2\n3", f: [0, 5], t: [4, 5]}], function(test) {
    cm.setValue("aaaaaaaaaa\nbbbbbbbbbb\ncccccccccc\ndddddddd\n");
    var r = cm.markText({line: 0, ch: 5}, {line: 2, ch: 5}, "CodeMirror-matchingbracket");
    cm.replaceRange(test.c, p(test.a), p(test.b));
    var f = r.find();
    eqPos(f && f.from, p(test.f)); eqPos(f && f.to, p(test.t));
  });
});

testCM("markTextUndo", function(cm) {
  var marker1 = cm.markText({line: 0, ch: 1}, {line: 0, ch: 3}, "CodeMirror-matchingbracket");
  var marker2 = cm.markText({line: 0, ch: 0}, {line: 2, ch: 1}, "CodeMirror-matchingbracket");
  var bookmark = cm.setBookmark({line: 1, ch: 5});
  cm.replaceRange("foo", {line: 0, ch: 2});
  cm.replaceRange("bar\baz\bug\n", {line: 2, ch: 0}, {line: 3, ch: 0});
  cm.setValue("");
  eq(marker1.find(), null); eq(marker2.find(), null); eq(bookmark.find(), null);
  cm.undo();
  eqPos(bookmark.find(), {line: 1, ch: 5});
  cm.undo(); cm.undo();
  var m1Pos = marker1.find(), m2Pos = marker2.find();
  eqPos(m1Pos.from, {line: 0, ch: 1}); eqPos(m1Pos.to, {line: 0, ch: 3});
  eqPos(m2Pos.from, {line: 0, ch: 0}); eqPos(m2Pos.to, {line: 2, ch: 1});
  eqPos(bookmark.find(), {line: 1, ch: 5});
}, {value: "1234\n56789\n00\n"});

testCM("markClearBetween", function(cm) {
  cm.setValue("aaa\nbbb\nccc\nddd\n");
  cm.markText({line: 0, ch: 0}, {line: 2}, "foo");
  cm.replaceRange("aaa\nbbb\nccc", {line: 0, ch: 0}, {line: 2});
  eq(cm.findMarksAt({line: 1, ch: 1}).length, 0);
});

testCM("bookmark", function(cm) {
  function p(v) { return v && {line: v[0], ch: v[1]}; }
  forEach([{a: [1, 0], b: [1, 1], c: "", d: [1, 4]},
           {a: [1, 1], b: [1, 1], c: "xx", d: [1, 7]},
           {a: [1, 4], b: [1, 5], c: "ab", d: [1, 6]},
           {a: [1, 4], b: [1, 6], c: "", d: null},
           {a: [1, 5], b: [1, 6], c: "abc", d: [1, 5]},
           {a: [1, 6], b: [1, 8], c: "", d: [1, 5]},
           {a: [1, 4], b: [1, 4], c: "\n\n", d: [3, 1]},
           {bm: [1, 9], a: [1, 1], b: [1, 1], c: "\n", d: [2, 8]}], function(test) {
    cm.setValue("1234567890\n1234567890\n1234567890");
    var b = cm.setBookmark(p(test.bm) || {line: 1, ch: 5});
    cm.replaceRange(test.c, p(test.a), p(test.b));
    eqPos(b.find(), p(test.d));
  });
});

testCM("bug577", function(cm) {
  cm.setValue("a\nb");
  cm.clearHistory();
  cm.setValue("fooooo");
  cm.undo();
});

testCM("scrollSnap", function(cm) {
  cm.setSize(100, 100);
  addDoc(cm, 200, 200);
  cm.setCursor({line: 100, ch: 180});
  var info = cm.getScrollInfo();
  is(info.left > 0 && info.top > 0);
  cm.setCursor({line: 0, ch: 0});
  info = cm.getScrollInfo();
  is(info.left == 0 && info.top == 0, "scrolled clean to top");
  cm.setCursor({line: 100, ch: 180});
  cm.setCursor({line: 199, ch: 0});
  info = cm.getScrollInfo();
  is(info.left == 0 && info.top + 2 > info.height - cm.getScrollerElement().clientHeight, "scrolled clean to bottom");
});

testCM("selectionPos", function(cm) {
  cm.setSize(100, 100);
  addDoc(cm, 200, 100);
  cm.setSelection({line: 1, ch: 100}, {line: 98, ch: 100});
  var lineWidth = cm.charCoords({line: 0, ch: 200}, "local").left;
  var lineHeight = (cm.charCoords({line: 99}).top - cm.charCoords({line: 0}).top) / 100;
  cm.scrollTo(0, 0);
  var selElt = byClassName(cm.getWrapperElement(), "CodeMirror-selected");
  var outer = cm.getWrapperElement().getBoundingClientRect();
  var sawMiddle, sawTop, sawBottom;
  for (var i = 0, e = selElt.length; i < e; ++i) {
    var box = selElt[i].getBoundingClientRect();
    var atLeft = box.left - outer.left < 30;
    var width = box.right - box.left;
    var atRight = box.right - outer.left > .8 * lineWidth;
    if (atLeft && atRight) {
      sawMiddle = true;
      is(box.bottom - box.top > 90 * lineHeight, "middle high");
      is(width > .9 * lineWidth, "middle wide");
    } else {
      is(width > .4 * lineWidth, "top/bot wide enough");
      is(width < .6 * lineWidth, "top/bot slim enough");
      if (atLeft) {
        sawBottom = true;
        is(box.top - outer.top > 96 * lineHeight, "bot below");
      } else if (atRight) {
        sawTop = true;
        is(box.top - outer.top < 2 * lineHeight, "top above");
      }
    }
  }
  is(sawTop && sawBottom && sawMiddle, "all parts");
}, null);

testCM("restoreHistory", function(cm) {
  cm.setValue("abc\ndef");
  cm.compoundChange(function() {cm.setLine(1, "hello");});
  cm.compoundChange(function() {cm.setLine(0, "goop");});
  cm.undo();
  var storedVal = cm.getValue(), storedHist = cm.getHistory();
  if (window.JSON) storedHist = JSON.parse(JSON.stringify(storedHist));
  eq(storedVal, "abc\nhello");
  cm.setValue("");
  cm.clearHistory();
  eq(cm.historySize().undo, 0);
  cm.setValue(storedVal);
  cm.setHistory(storedHist);
  cm.redo();
  eq(cm.getValue(), "goop\nhello");
  cm.undo(); cm.undo();
  eq(cm.getValue(), "abc\ndef");
});

testCM("doubleScrollbar", function(cm) {
  var dummy = document.body.appendChild(document.createElement("p"));
  dummy.style.cssText = "height: 50px; overflow: scroll; width: 50px";
  var scrollbarWidth = dummy.offsetWidth + 1 - dummy.clientWidth;
  document.body.removeChild(dummy);
  cm.setSize(null, 100);
  addDoc(cm, 1, 300);
  var wrap = cm.getWrapperElement();
  is(wrap.offsetWidth - byClassName(wrap, "CodeMirror-lines")[0].offsetWidth <= scrollbarWidth + 1);
});

testCM("weirdLinebreaks", function(cm) {
  cm.setValue("foo\nbar\rbaz\r\nquux\n\rplop");
  is(cm.getValue(), "foo\nbar\nbaz\nquux\n\nplop");
  is(cm.lineCount(), 6);
  cm.setValue("\n\n");
  is(cm.lineCount(), 3);
});

testCM("setSize", function(cm) {
  cm.setSize(100, 100);
  var wrap = cm.getWrapperElement();
  is(wrap.offsetWidth, 100);
  is(wrap.offsetHeight, 100);
  cm.setSize("100%", "3em");
  is(wrap.style.width, "100%");
  is(wrap.style.height, "3em");
  cm.setSize(null, 40);
  is(wrap.style.width, "100%");
  is(wrap.style.height, "40px");
});

testCM("hiddenLines", function(cm) {
  addDoc(cm, 4, 10);
  var folded = cm.foldLines(4, 5), unfolded = 0;
  CodeMirror.on(folded, "unfold", function() {unfolded++;});
  cm.setCursor({line: 3, ch: 0});
  CodeMirror.commands.goLineDown(cm);
  eqPos(cm.getCursor(), {line: 5, ch: 0});
  cm.setLine(3, "abcdefg");
  cm.setCursor({line: 3, ch: 6});
  CodeMirror.commands.goLineDown(cm);
  eqPos(cm.getCursor(), {line: 5, ch: 4});
  cm.setLine(3, "ab");
  cm.setCursor({line: 3, ch: 2});
  CodeMirror.commands.goLineDown(cm);
  eqPos(cm.getCursor(), {line: 5, ch: 2});
  cm.unfoldLines(folded); cm.unfoldLines(folded);
  eq(unfolded, 1);
});

testCM("hiddenLinesAutoUnfold", function(cm) {
  var folded = cm.foldLines(1, 3, true), unfolded = 0;
  CodeMirror.on(folded, "unfold", function() {unfolded++;});
  cm.setCursor({line: 3, ch: 0});
  eq(unfolded, 0);
  cm.execCommand("goCharLeft");
  eq(unfolded, 1);
  var folded = cm.foldLines(1, 3, true), unfolded = 0;
  CodeMirror.on(folded, "unfold", function() {unfolded++;});
  eqPos(cm.getCursor(), {line: 3, ch: 0});
  cm.setCursor({line: 0, ch: 3});
  cm.execCommand("goCharRight");
  eq(unfolded, 1);
}, {value: "abc\ndef\nghi\njkl"});

testCM("hiddenLinesSelectAll", function(cm) {  // Issue #484
  addDoc(cm, 4, 20);
  cm.foldLines(0, 10); cm.foldLines(11, 20);
  CodeMirror.commands.selectAll(cm);
  eqPos(cm.getCursor(true), {line: 10, ch: 0});
  eqPos(cm.getCursor(false), {line: 10, ch: 4});
});

testCM("wrappingAndResizing", function(cm) {
  cm.setSize(null, "auto");
  cm.setOption("lineWrapping", true);
  var wrap = cm.getWrapperElement(), h0 = wrap.offsetHeight, w = 50;
  var doc = "xxx xxx xxx xxx xxx";
  cm.setValue(doc);
  for (var step = 10;; w += step) {
    cm.setSize(w);
    if (wrap.offsetHeight == h0) {
      if (step == 10) { w -= 10; step = 1; }
      else { w--; break; }
    }
  }
  // Ensure that putting the cursor at the end of the maximally long
  // line doesn't cause wrapping to happen.
  cm.setCursor({line: 0, ch: doc.length});
  eq(wrap.offsetHeight, h0);
  cm.replaceSelection("x");
  is(wrap.offsetHeight > h0, "wrapping happens");
  // Now add a max-height and, in a document consisting of
  // almost-wrapped lines, go over it so that a scrollbar appears.
  cm.setValue(doc + "\n" + doc + "\n");
  cm.getScrollerElement().style.maxHeight = "100px";
  cm.replaceRange("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n!\n", {line: 2, ch: 0});
  forEach([{line: 0, ch: doc.length}, {line: 0, ch: doc.length - 1},
           {line: 0, ch: 0}, {line: 1, ch: doc.length}, {line: 1, ch: doc.length - 1}],
          function(pos) {
    var coords = cm.charCoords(pos);
    eqPos(pos, cm.coordsChar({left: coords.left + 2, top: coords.top + 5}));
  });
}, null, ie_lt8);

testCM("measureEndOfLine", function(cm) {
  cm.setSize(null, "auto");
  var inner = byClassName(cm.getWrapperElement(), "CodeMirror-lines")[0].firstChild;
  var w = 20, lh = inner.offsetHeight;
  for (var step = 10;; w += step) {
    cm.setSize(w);
    if (inner.offsetHeight < 2.5 * lh) {
      if (step == 10) { w -= 10; step = 1; }
      else { break; }
    }
  }
  cm.setValue(cm.getValue() + "\n\n");
  var endPos = cm.charCoords({line: 0, ch: 18}, "local");
  is(endPos.top > lh * .8, "not at top");
  is(endPos.left > w - 20, "not at right");
  endPos = cm.charCoords({line: 0, ch: 18});
  eqPos(cm.coordsChar({left: endPos.left, top: endPos.top + 5}), {line: 0, ch: 18});
}, {mode: "text/html", value: "<!-- foo barrr -->", lineWrapping: true});

testCM("scrollVerticallyAndHorizontally", function(cm) {
  cm.setSize(100, 100);
  addDoc(cm, 40, 40);
  cm.setCursor(39);
  var wrap = cm.getWrapperElement(), bar = byClassName(wrap, "CodeMirror-vscrollbar")[0];
  is(bar.offsetHeight < wrap.offsetHeight, "vertical scrollbar limited by horizontal one");
  var cursorBox = byClassName(wrap, "CodeMirror-cursor")[0].getBoundingClientRect();
  var editorBox = wrap.getBoundingClientRect();
  is(cursorBox.bottom < editorBox.top + cm.getScrollerElement().clientHeight,
     "bottom line visible");
}, {lineNumbers: true});

testCM("moveVstuck", function(cm) {
  var lines = byClassName(cm.getWrapperElement(), "CodeMirror-lines")[0].firstChild, h0 = lines.offsetHeight;
  var val = "fooooooooooooooooooooooooo baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaar\n";
  cm.setValue(val);
  for (var w = 50;; w += 5) {
    cm.setSize(w);
    if (lines.offsetHeight <= 3 * h0) break;
  }
  cm.setCursor({line: 0, ch: val.length - 1});
  cm.moveV(-1, "line");
  eqPos(cm.getCursor(), {line: 0, ch: 26});
}, {lineWrapping: true});

testCM("clickTab", function(cm) {
  var p0 = cm.charCoords({line: 0, ch: 0}), p1 = cm.charCoords({line: 0, ch: 1});
  eqPos(cm.coordsChar({left: p0.left + 5, top: p0.top + 5}), {line: 0, ch: 0});
  eqPos(cm.coordsChar({left: p1.left - 5, top: p1.top + 5}), {line: 0, ch: 1});
}, {value: "\t\n\n", lineWrapping: true, tabSize: 8});

testCM("verticalScroll", function(cm) {
  cm.setSize(100, 200);
  cm.setValue("foo\nbar\nbaz\n");
  var sc = cm.getScrollerElement(), baseWidth = sc.scrollWidth;
  cm.setLine(0, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaah");
  is(sc.scrollWidth > baseWidth, "scrollbar present");
  cm.setLine(0, "foo");
  eq(sc.scrollWidth, baseWidth, "scrollbar gone");
  cm.setLine(0, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaah");
  cm.setLine(1, "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbh");
  is(sc.scrollWidth > baseWidth, "present again");
  var curWidth = sc.scrollWidth;
  cm.setLine(0, "foo");
  is(sc.scrollWidth < curWidth, "scrollbar smaller");
  is(sc.scrollWidth > baseWidth, "but still present");
});

testCM("extraKeys", function(cm) {
  var outcome;
  function fakeKey(expected, code, props) {
    if (typeof code == "string") code = code.charCodeAt(0);
    var e = {type: "keydown", keyCode: code, preventDefault: function(){}, stopPropagation: function(){}};
    if (props) for (var n in props) e[n] = props[n];
    outcome = null;
    cm.triggerOnKeyDown(e);
    eq(outcome, expected);
  }
  CodeMirror.commands.testCommand = function() {outcome = "tc";};
  CodeMirror.commands.goTestCommand = function() {outcome = "gtc";};
  cm.setOption("extraKeys", {"Shift-X": function() {outcome = "sx";},
                             "X": function() {outcome = "x";},
                             "Ctrl-Alt-U": function() {outcome = "cau";},
                             "End": "testCommand",
                             "Home": "goTestCommand",
                             "Tab": false});
  fakeKey(null, "U");
  fakeKey("cau", "U", {ctrlKey: true, altKey: true});
  fakeKey(null, "U", {shiftKey: true, ctrlKey: true, altKey: true});
  fakeKey("x", "X");
  fakeKey("sx", "X", {shiftKey: true});
  fakeKey("tc", 35);
  fakeKey(null, 35, {shiftKey: true});
  fakeKey("gtc", 36);
  fakeKey("gtc", 36, {shiftKey: true});
  fakeKey(null, 9);
});

testCM("wordMovementCommands", function(cm) {
  cm.execCommand("goWordLeft");
  eqPos(cm.getCursor(), {line: 0, ch: 0});
  cm.execCommand("goWordRight"); cm.execCommand("goWordRight");
  eqPos(cm.getCursor(), {line: 0, ch: 7});
  cm.execCommand("goWordLeft");
  eqPos(cm.getCursor(), {line: 0, ch: 5});
  cm.execCommand("goWordRight"); cm.execCommand("goWordRight");
  eqPos(cm.getCursor(), {line: 0, ch: 12});
  cm.execCommand("goWordLeft");
  eqPos(cm.getCursor(), {line: 0, ch: 9});
  cm.execCommand("goWordRight"); cm.execCommand("goWordRight"); cm.execCommand("goWordRight");
  eqPos(cm.getCursor(), {line: 1, ch: 1});
  cm.execCommand("goWordRight");
  eqPos(cm.getCursor(), {line: 1, ch: 9});
  cm.execCommand("goWordRight");
  eqPos(cm.getCursor(), {line: 1, ch: 13});
  cm.execCommand("goWordRight"); cm.execCommand("goWordRight");
  eqPos(cm.getCursor(), {line: 2, ch: 0});
}, {value: "this is (the) firstline.\na foo12\u00e9\u00f8\u00d7bar\n"});

testCM("charMovementCommands", function(cm) {
  cm.execCommand("goCharLeft"); cm.execCommand("goColumnLeft");
  eqPos(cm.getCursor(), {line: 0, ch: 0});
  cm.execCommand("goCharRight"); cm.execCommand("goCharRight");
  eqPos(cm.getCursor(), {line: 0, ch: 2});
  cm.setCursor({line: 1, ch: 0});
  cm.execCommand("goColumnLeft");
  eqPos(cm.getCursor(), {line: 1, ch: 0});
  cm.execCommand("goCharLeft");
  eqPos(cm.getCursor(), {line: 0, ch: 5});
  cm.execCommand("goColumnRight");
  eqPos(cm.getCursor(), {line: 0, ch: 5});
  cm.execCommand("goCharRight");
  eqPos(cm.getCursor(), {line: 1, ch: 0});
  cm.execCommand("goLineEnd");
  eqPos(cm.getCursor(), {line: 1, ch: 5});
  cm.execCommand("goLineStartSmart");
  eqPos(cm.getCursor(), {line: 1, ch: 1});
  cm.execCommand("goLineStartSmart");
  eqPos(cm.getCursor(), {line: 1, ch: 0});
  cm.setCursor({line: 2, ch: 0});
  cm.execCommand("goCharRight"); cm.execCommand("goColumnRight");
  eqPos(cm.getCursor(), {line: 2, ch: 0});
}, {value: "line1\n ine2\n"});

testCM("verticalMovementCommands", function(cm) {
  cm.execCommand("goLineUp");
  eqPos(cm.getCursor(), {line: 0, ch: 0});
  cm.execCommand("goLineDown");
  if (!phantom) // This fails in PhantomJS, though not in a real Webkit
    eqPos(cm.getCursor(), {line: 1, ch: 0});
  cm.setCursor({line: 1, ch: 12});
  cm.execCommand("goLineDown");
  eqPos(cm.getCursor(), {line: 2, ch: 5});
  cm.execCommand("goLineDown");
  eqPos(cm.getCursor(), {line: 3, ch: 0});
  cm.execCommand("goLineUp");
  eqPos(cm.getCursor(), {line: 2, ch: 5});
  cm.execCommand("goLineUp");
  eqPos(cm.getCursor(), {line: 1, ch: 12});
  cm.execCommand("goPageDown");
  eqPos(cm.getCursor(), {line: 5, ch: 0});
  cm.execCommand("goPageDown"); cm.execCommand("goLineDown");
  eqPos(cm.getCursor(), {line: 5, ch: 0});
  cm.execCommand("goPageUp");
  eqPos(cm.getCursor(), {line: 0, ch: 0});
}, {value: "line1\nlong long line2\nline3\n\nline5\n"});

testCM("verticalMovementCommandsWrapping", function(cm) {
  cm.setSize(120);
  cm.setCursor({line: 0, ch: 5});
  cm.execCommand("goLineDown");
  eq(cm.getCursor().line, 0);
  is(cm.getCursor().ch > 5, "moved beyond wrap");
  for (var i = 0; ; ++i) {
    is(i < 20, "no endless loop");
    cm.execCommand("goLineDown");
    var cur = cm.getCursor();
    if (cur.line == 1) eq(cur.ch, 5);
    if (cur.line == 2) { eq(cur.ch, 1); break; }
  }
}, {value: "a very long line that wraps around somehow so that we can test cursor movement\nshortone\nk",
    lineWrapping: true});

testCM("rtlMovement", function(cm) {
  forEach(["خحج", "خحabcخحج", "abخحخحجcd", "abخde", "abخح2342خ1حج", "خ1ح2خح3حxج", "خحcd", "1خحcd", "abcdeح1ج"], function(line) {
    var inv = line.charAt(0) == "خ";
    cm.setValue(line + "\n"); cm.execCommand(inv ? "goLineEnd" : "goLineStart");
    var cursor = byClassName(cm.getWrapperElement(), "CodeMirror-cursor")[0];
    var prevX = cursor.offsetLeft, prevY = cursor.offsetTop;
    for (var i = 0; i <= line.length; ++i) {
      cm.execCommand("goCharRight");
      if (i == line.length) is(cursor.offsetTop > prevY, "next line");
      else is(cursor.offsetLeft > prevX, "moved right");
      prevX = cursor.offsetLeft; prevY = cursor.offsetTop;
    }
    cm.setCursor(0, 0); cm.execCommand(inv ? "goLineStart" : "goLineEnd");
    prevX = cursor.offsetLeft;
    for (var i = 0; i < line.length; ++i) {
      cm.execCommand("goCharLeft");
      is(cursor.offsetLeft < prevX, "moved left");
      prevX = cursor.offsetLeft;
    }
  });
});

testCM("movebyTextUnit", function(cm) {
  cm.setValue("בְּרֵאשִ\ńéée\n");
  cm.execCommand("goLineEnd");
  for (var i = 0; i < 4; ++i) cm.execCommand("goCharRight");
  eqPos(cm.getCursor(), {line: 0, ch: 0});
  cm.execCommand("goCharRight");
  eqPos(cm.getCursor(), {line: 1, ch: 0});
  cm.execCommand("goCharRight");
  cm.execCommand("goCharRight");
  eqPos(cm.getCursor(), {line: 1, ch: 3});
  cm.execCommand("goCharRight");
  cm.execCommand("goCharRight");
  eqPos(cm.getCursor(), {line: 1, ch: 6});
});

testCM("lineChangeEvents", function(cm) {
  addDoc(cm, 3, 5);
  var log = [], want = ["ch 0", "ch 1", "del 2", "ch 0", "ch 0", "del 1", "del 3", "del 4"];
  for (var i = 0; i < 5; ++i) {
    CodeMirror.on(cm.getLineHandle(i), "delete", function(i) {
      return function() {log.push("del " + i);};
    }(i));
    CodeMirror.on(cm.getLineHandle(i), "change", function(i) {
      return function() {log.push("ch " + i);};
    }(i));
  }
  cm.replaceRange("x", {line: 0, ch: 1});
  cm.replaceRange("xy", {line: 1, ch: 1}, {line: 2});
  cm.replaceRange("foo\nbar", {line: 0, ch: 1});
  cm.replaceRange("", {line: 0, ch: 0}, {line: cm.lineCount()});
  eq(log.length, want.length, "same length");
  for (var i = 0; i < log.length; ++i)
    eq(log[i], want[i]);
});

testCM("scrollEntirelyToRight", function(cm) {
  addDoc(cm, 500, 2);
  cm.setCursor({line: 0, ch: 500});
  var wrap = cm.getWrapperElement(), cur = byClassName(wrap, "CodeMirror-cursor")[0];
  is(wrap.getBoundingClientRect().right > cur.getBoundingClientRect().left);
});

testCM("lineWidgets", function(cm) {
  addDoc(cm, 500, 3);
  var last = cm.charCoords({line: 2, ch: 0});
  var node = document.createElement("div");
  node.innerHTML = "hi";
  var widget = cm.addLineWidget(1, node);
  is(last.top < cm.charCoords({line: 2, ch: 0}).top, "took up space");
  cm.setCursor({line: 1, ch: 1});
  cm.execCommand("goLineDown");
  eqPos(cm.getCursor(), {line: 2, ch: 1});
  cm.execCommand("goLineUp");
  eqPos(cm.getCursor(), {line: 1, ch: 1});
});

testCM("getLineNumber", function(cm) {
  addDoc(cm, 2, 20);
  var h1 = cm.getLineHandle(1);
  eq(cm.getLineNumber(h1), 1);
  cm.replaceRange("hi\nbye\n", {line: 0, ch: 0});
  eq(cm.getLineNumber(h1), 3);
  cm.setValue("");
  eq(cm.getLineNumber(h1), null);
});
