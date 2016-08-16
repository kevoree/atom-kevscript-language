var autocompleteProvider, linterProvider;

autocompleteProvider = require('./providers/autocomplete');

linterProvider = require('./providers/linter');

module.exports = {
  activate: function() {
    return autocompleteProvider.loadProperties();
  },
  provide: function() {
    return autocompleteProvider;
  },
  provideLinter: function() {
    return linterProvider;
  }
};
