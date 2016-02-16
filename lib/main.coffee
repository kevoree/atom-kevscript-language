autocompleteProvider = require './providers/autocomplete'
linterProvider = require './providers/linter.coffee'

module.exports =
  activate: -> autocompleteProvider.loadProperties()
  provide: -> autocompleteProvider
  provideLinter: -> linterProvider
