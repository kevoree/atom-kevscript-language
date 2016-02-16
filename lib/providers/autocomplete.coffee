fs = require 'fs'
path = require 'path'

module.exports =
  selector: '.source.kevs'
  disableForSelector: '.source.kevs .comment'

  getSuggestions: ({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) ->
    completions = []
    tagCompletions = @getStatementCompletions({bufferPosition, editor, prefix})
    completions = completions.concat(tagCompletions)

    completions

  getStatementCompletions: ({bufferPosition, editor, prefix}) ->
    completions = []
    if prefix
      for statement in @statements when firstCharsEqual(statement.name, prefix)
        completions.push(@buildStatementCompletion(statement))
    completions

  buildStatementCompletion: (statement) ->
    type: 'keyword'
    displayText: statement.name
    description: statement.description
    snippet: statement.snippet
    rightLabel: ''

  dispose: -> @statements = null

  loadProperties: ->
    fs.readFile path.resolve(__dirname, '..', '..', 'completions.json'), (error, content) =>
      {@statements} = JSON.parse(content) unless error?
      return

# static methods:
firstCharsEqual = (str1, str2) ->
  str1[0].toLowerCase() is str2[0].toLowerCase()
