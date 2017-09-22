'use babel';

import { CompositeDisposable } from 'atom';
import * as url from 'url';
import * as path from 'path';
import KevScript from 'kevoree-kevscript';
import loggerFactory from 'kevoree-logger';
import config from 'tiny-conf';

import linterProvider from './providers/linter';
import StatusView from './views/status';
// import TooltipView from './views/tooltip';
// const autocompleteProvider = require('./providers/autocomplete');

export default {
  config: {
    enableLinter: {
      title: 'Enable Linter',
      type: 'boolean',
      default: true
    },
    registry: {
      title: 'Kevoree Registry',
      description: 'The Kevoree registry URL used to resolve TypeDefinitions and DeployUnits',
      type: 'string',
      default: 'https://registry.kevoree.org'
    },
    cacheTtl: {
      title: 'Kevoree Cache TTL',
      description: 'Time in milliseconds before cached model files are invalidated (defaults to 24 hours)',
      type: 'number',
      default: 1000 * 60 * 60 * 24 // 24 hours
    }
  },

  activate() {
    // config listener for registry
    this.configRegistryListener = atom.config.observe('language-kevscript.registry', this.updateRegistry);
    this.updateRegistry(atom.config.get('language-kevscript.registry'));

    // create status view
    this.statusView = new StatusView('unknown');

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // mouse move handler
    // const mouseMoveHandler = (event) => this.mouseMove(event);

    // register an event listener on pane changes
    this.subscriptions.add(
      atom.workspace.observeActivePaneItem((item) => {
        if (item && item.tokenizedBuffer && item.tokenizedBuffer.grammar && item.tokenizedBuffer.grammar.scopeName === 'source.kevs') {
          this.statusView.show();

          // this.textBufferOnDidChangeModified = item.buffer.onDidChangeModified(() => {
          //   this.statusView.setStatus('save to lint');
          // });
          // atom.views.getView(atom.workspace).addEventListener('mousemove', mouseMoveHandler);
        } else {
          // if (this.textBufferOnDidChangeModified) {
          //   this.textBufferOnDidChangeModified.dispose();
          // }
          this.statusView.hide();
          // atom.views.getView(atom.workspace).removeEventListener('mousemove', mouseMoveHandler);
        }
      }));

    const projectPath = atom.project.getPaths()[0];
    try {
      const kConf = require(path.join(projectPath, 'kevoree.json'));
      if (kConf.registry) {
        config.merge('registry', kConf.registry);
      }
    } catch (ignore) {/* noop */}
  },

  // mouseMove(event) {
  //   if (event.path[0].classList.contains('syntax--kevscript')
  //     //  syntax--other syntax--attribute-name syntax--string syntax--kevscript
  //     && event.path[0].classList.contains('syntax--string')
  //     && event.path[0].classList.contains('syntax--attribute-name')
  //     && event.path[0].classList.contains('syntax--other')) {
  //     this.mouseOverKevScript(event);
  //   } else {
  //     this.mouseOutKevScript();
  //   }
  // },
  //
  // mouseOverKevScript(event) {
  //   console.log('attach', event);
  //   // create tooltip view
  //   this.tooltipView = new TooltipView(event.target);
  // },
  //
  // mouseOutKevScript() {
  //   console.log('detach');
  //   this.tooltipView.destroy();
  // },

  deactivate() {
    if (this.configRegistryListener) {
      this.configRegistryListener.dispose();
    }
    if (this.statusPanel) {
      this.statusPanel.dispose();
    }
    if (this.statusView) {
      this.statusView.destroy();
    }

    this.subscriptions.dispose();
  },

  serialize() {
    return {
      status: this.statusView.serialize()
    };
  },

  consumeStatusBar(statusBar) {
    statusBar.addLeftTile({
      item: this.statusView.getElement(),
      visible: true
    });
  },

  provideAutoComplete() {
    // return autocompleteProvider;
  },

  provideLinter() {
    const options = {
      ignoreCtxVars: true,
      resolver: KevScript.Resolvers.tagResolverFactory(loggerFactory.create('TagResolver'),
        KevScript.Resolvers.modelResolverFactory(loggerFactory.create('ModelResolver'),
          KevScript.Resolvers.registryResolverFactory(loggerFactory.create('RegistryResolver'))))
    };
    const kScript = new KevScript(loggerFactory.create('KevScript'), options);
    linterProvider.init(kScript, this.statusView);
    return linterProvider;
  },

  updateRegistry(value) {
    const registryUrl = url.parse(value);
    let port;
    if (!registryUrl.port) {
      if (registryUrl.protocol === 'https:') {
        port = 443;
      } else {
        port = 80;
      }
    } else {
      port = registryUrl.port;
    }
    config.set('registry', {
      host: registryUrl.host,
      port: port,
      ssl: (registryUrl.protocol === 'https:') ? true : false
    });
  }
};
