'use babel';

import { CompositeDisposable } from 'atom';
import * as url from 'url';
import KevScript from 'kevoree-kevscript';
import KevoreeLogger from 'kevoree-commons/lib/Logger';
import TinyConf from 'tiny-conf';

import linterProvider from './providers/linter';
import StatusView from './views/status';
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
			description: 'The Kevoree registry URL used by the KevScript iKevScriptStatusViewnterpreter to resolve TypeDefinitions and DeployUnits',
			type: 'string',
			default: 'https://registry.kevoree.org'
		}
	},

	activate() {
		this.configRegistryListener = atom.config.observe('language-kevscript.registry', this.updateRegistry);
		this.updateRegistry(atom.config.get('language-kevscript.registry'));

		// create status view
		this.statusView = new StatusView('unknown');

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

		// register an event listener on pane changes
		this.subscriptions.add(
			atom.workspace.observeActivePaneItem((item) => {
				if (item && item.tokenizedBuffer && item.tokenizedBuffer.grammar && item.tokenizedBuffer.grammar.scopeName === 'source.kevs') {
					this.statusView.show();
				} else {
					this.statusView.hide();
				}
			}));
	},

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
		const logger = new KevoreeLogger('KevScript');
		const options = {
			ignoreCtxVars: true
		};
		const kScript = new KevScript(logger, options);
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
		TinyConf.set('registry', {
			host: registryUrl.host,
			port: port,
			ssl: (registryUrl.protocol === 'https:') ? true : false
		});
	}
}
