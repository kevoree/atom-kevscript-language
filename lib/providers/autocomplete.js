'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  selector: '.source.kevs',
  disableForSelector: '.source.kevs .comment',
  statements: [],
  getSuggestions: function(arg) {
    var completions = [];
    var tagCompletions = this.getStatementCompletions({
      bufferPosition: arg.bufferPosition,
      editor: arg.editor,
      prefix: arg.prefix
    });
    completions = completions.concat(tagCompletions);
    return completions;
  },
  getStatementCompletions: function(arg) {
    var completions = [];
    if (arg.prefix) {
      for (var i = 0, len = this.statements.length; i < len; i++) {
        var statement = this.statements[i];
        if (statement.name.substr(0, 1).toLowerCase() === arg.prefix.substr(0, 1).toLowerCase()) {
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
    this.statements = null;
    return this.statements;
  },
  loadProperties: function() {
    const completions = path.resolve('..', '..', 'completions.json');
    fs.readFile(completions, function (err, content) {
      if (!err) {
        this.statements = JSON.parse(content).statements;
      }
    }.bind(this));
  }
};
