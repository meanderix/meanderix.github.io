define('ace/mode/custom', [], function(require, exports, module) {
  var oop = require("ace/lib/oop");
  var TextMode = require("ace/mode/text").Mode;
  var Tokenizer = require("ace/tokenizer").Tokenizer;
  var CustomHighlightRules = require("ace/mode/custom_highlight_rules").CustomHighlightRules;

  var Mode = function() {
    this.HighlightRules = CustomHighlightRules;
  };
  oop.inherits(Mode, TextMode);

  (function() {}).call(Mode.prototype);
  exports.Mode = Mode;
});

define('ace/mode/custom_highlight_rules', [], function(require, exports, module) {
  var oop = require("ace/lib/oop");
  var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

  var CustomHighlightRules = function() {
    var keywordMapper = this.createKeywordMapper({
        "variable.language": "this",
        "keyword.control":
          "rule|program|selector|cellsize|hashsize|center|isosurface|duration|startshape|background|camerarule" +
          "|camerafov|cameramode|linerule|normal|angle|target|render|void|function|vertexshader|fragmentshader" +
          "|endshader|uniform|attribute|varying|precision|maxdepth|maxiter|minsize|evalmode|wrapmode",
        "keyword.operator":
          "abs|sign|ceil|floor|trunc|frac|acos|asin|atan|cos|sin|tan|cosh|sinh|tanh|exp|log|log10|sqrt|frame|newline",
        "support.function":
          "x|y|z|rx|ry|rz|fx|fy|fz|fxyz|s|xyz",    
        "constant.language":
          "true|false|null",
        "support.type":
          "bool|int|float|vec2|vec3|vec4|mat2|mat3|mat4"
    }, "text", true);

    this.$rules = {
        "start": [            
            {token : "punctuation.definition.comment", regex: "//.*$"},            
            {token : "punctuation.definition.comment", regex: "/\*.*\*/"}, 
            {token: 'punctuation.definition.comment', regex: '/\\*',
              push: [{
                    token: 'punctuation.definition.comment',
                    regex: '/*\\)',
                    next: 'pop'
                },
                { defaultToken: 'comment.block.one' }
              ]               
            },        
            {token : "string",  regex : /".+"/},
            {token : "paren.lparen", regex : "[\\[({]"},
            {token : "paren.rparen", regex : "[\\])}]"},
            {token : "constant.numeric", regex: "\\b((0(x|X)[0-9a-fA-F]*)|(([0-9]+\\.?[0-9]*)|(\\.[0-9]+))((e|E)(\\+|-)?[0-9]+)?)(d|a|r|i|o|f|t|c|s)?\\b"},
            {regex : "\\w+\\b", token: keywordMapper}
        ]
    };
    this.normalizeRules()
  };
  oop.inherits(CustomHighlightRules, TextHighlightRules);
  exports.CustomHighlightRules = CustomHighlightRules;
});

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/custom");