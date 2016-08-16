var firstCharsEqual, fs, path;

fs = require('fs');

path = require('path');

module.exports = {
  selector: '.source.kevs',
  disableForSelector: '.source.kevs .comment',
  getSuggestions: function(arg) {
    var activatedManually, bufferPosition, completions, editor, prefix, scopeDescriptor, tagCompletions;
    editor = arg.editor, bufferPosition = arg.bufferPosition, scopeDescriptor = arg.scopeDescriptor, prefix = arg.prefix, activatedManually = arg.activatedManually;
    completions = [];
    tagCompletions = this.getStatementCompletions({
      bufferPosition: bufferPosition,
      editor: editor,
      prefix: prefix
    });
    completions = completions.concat(tagCompletions);
    return completions;
  },
  getStatementCompletions: function(arg) {
    var bufferPosition, completions, editor, i, len, prefix, ref, statement;
    bufferPosition = arg.bufferPosition, editor = arg.editor, prefix = arg.prefix;
    completions = [];
    if (prefix) {
      ref = this.statements;
      for (i = 0, len = ref.length; i < len; i++) {
        statement = ref[i];
        if (firstCharsEqual(statement.name, prefix)) {
          completions.push(this.buildStatementCompletion(statement));
        }
      }
    }
    return completions;
  },
  buildStatementCompletion: function(statement) {
    return {
      type: 'keyword',
      displayText: statement.name,
      description: statement.description,
      snippet: statement.snippet,
      rightLabel: ''
    };
  },
  dispose: function() {
    return this.statements = null;
  },
  loadProperties: function() {
    return fs.readFile(path.resolve(__dirname, '..', '..', 'completions.json'), (function(_this) {
      return function(error, content) {
        if (error == null) {
          _this.statements = JSON.parse(content).statements;
        }
      };
    })(this));
  }
};

firstCharsEqual = function(str1, str2) {
  return str1[0].toLowerCase() === str2[0].toLowerCase();
};
