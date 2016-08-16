var helpers, kevscript, tokens,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

kevscript = require('kevoree-kevscript');

helpers = require('atom-linter');

tokens = ['repoToken', 'includeToken', 'addToken', 'removeToken', 'moveToken',
          'setToken', 'attachToken', 'detachToken', 'networkToken', 'bindToken',
          'unbindToken', 'namespaceToken', 'startToken', 'stopToken',
          'pauseToken', 'comment'];

module.exports = {
  name: 'KevScript',
  grammarScopes: ['source.kevs'],
  scope: 'file',
  lintOnFly: true,
  lint: (function(_this) {
    return function(textEditor) {
      var col, err, error, errors, filePath, line, maxCol, message, parser, range, ref, res, text;
      filePath = textEditor.getPath();
      text = textEditor.getText();
      parser = new kevscript.Parser;
      errors = [];
      try {
        res = parser.parse(text);
        if (res.nt) {
          throw res;
        }
      } catch (error) {
        err = error;
        line = err.line - 1;
        col = err.col;
        maxCol = textEditor.getBuffer().lineLengthForRow(line);
        if (col > maxCol) {
          col = maxCol;
        }
        range = helpers.rangeFromLineNumber(textEditor, line, col);
        message = "Unable to match '" + err.nt + "'";
        if (err.nt === 'ws') {
          message = "Unable to match 'whitespace'";
        } else if (ref = err.nt, indexOf.call(tokens, ref) >= 0) {
          message = "Expected statement or comment (do you mean '" + (err.nt.split('Token').shift()) + "'?)";
        }
        errors.push({
          type: 'Error',
          text: message,
          filePath: filePath,
          range: range
        });
      }
      return errors;
    };
  })(this)
};
