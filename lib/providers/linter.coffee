kevscript = require 'kevoree-kevscript'
helpers = require 'atom-linter'

tokens = ['repoToken','includeToken', 'addToken', 'removeToken', 'moveToken',
          'setToken', 'attachToken', 'detachToken', 'networkToken', 'bindToken',
          'unbindToken', 'namespaceToken', 'startToken', 'stopToken',
          'pauseToken', 'comment']

module.exports =
  name: 'KevScript'
  grammarScopes: ['source.kevs']
  scope: 'file'
  lintOnFly: true
  lint: (textEditor) =>
    filePath = textEditor.getPath()
    text = textEditor.getText()
    parser = new kevscript.Parser

    errors = []
    try
      res = parser.parse(text)
      if res.nt then throw res
    catch err
      line = err.line - 1
      col = err.col
      maxCol = textEditor.getBuffer().lineLengthForRow(line)
      col = maxCol if col > maxCol
      range = helpers.rangeFromLineNumber(textEditor, line, col)
      message = "Unable to match '#{err.nt}'"

      if err.nt is 'ws'
        message = "Unable to match 'whitespace'"
      else if err.nt in tokens
        message = "Expected statement or comment (do you mean '#{err.nt.split('Token').shift()}'?)"

      errors.push {
        type: 'Error'
        text: message
        filePath
        range
      }

    errors
