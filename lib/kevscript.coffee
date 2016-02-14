provider = require './autocomplete-kevscript-provider'

module.exports =
  activate: -> provider.loadProperties()

  provide: -> provider
