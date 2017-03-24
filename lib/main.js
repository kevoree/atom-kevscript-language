'use babel';

import { CompositeDisposable } from 'atom';
import * as url from 'url';
import * as path from 'path';
import KevScript from 'kevoree-kevscript';
import { CONFIG_PATH } from 'kevoree-const';
import KevoreeLogger from 'kevoree-commons/lib/Logger';
import config from 'tiny-conf';

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
			description: 'The Kevoree registry URL used to resolve TypeDefinitions and DeployUnits',
			type: 'string',
			default: 'https://registry.kevoree.org'
		},
		cacheRoot: {
			title: 'Kevoree Cache Root',
			description: 'Location of the KevScript cached model files',
			type: 'string',
			default: path.join(CONFIG_PATH, '..', 'tdefs')
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

		// config listener for cache root
		this.configCacheRootListener = atom.config.observe('language-kevscript.cacheRoot', this.updateCacheRoot);
		this.updateCacheRoot(atom.config.get('language-kevscript.cacheRoot'));
		// config listener for cache ttl
		this.configCacheTtlListener = atom.config.observe('language-kevscript.cacheTtl', this.updateCacheTtl);
		this.updateCacheTtl(atom.config.get('language-kevscript.cacheTtl'));

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
		if (this.configCacheRootListener) {
			this.configCacheRootListener.dispose();
		}
		if (this.configCacheTtlListener) {
			this.configCacheTtlListener.dispose();
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
			ignoreCtxVars: true,
			resolver: KevScript.Resolvers.tagResolverFactory(logger,
				KevScript.Resolvers.modelResolverFactory(logger,
					KevScript.Resolvers.fsResolverFactory(logger,
						KevScript.Resolvers.registryResolverFactory(logger))))
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
		config.set('registry', {
			host: registryUrl.host,
			port: port,
			ssl: (registryUrl.protocol === 'https:') ? true : false
		});
	},

	updateCacheRoot(value) {
		config.set('cache.root', value);
	},

	updateCacheTtl(value) {
		config.set('cache.ttl', value);
	}
}
