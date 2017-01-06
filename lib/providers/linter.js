'use babel';

const TOKENS = ['repoToken', 'includeToken', 'addToken', 'removeToken', 'moveToken',
          'setToken', 'attachToken', 'detachToken', 'networkToken', 'bindToken',
          'unbindToken', 'namespaceToken', 'startToken', 'stopToken',
          'pauseToken', 'comment'];

function relativeToLine(ch, lines) {
	var val = 0;
	for (var i = 0; i < lines.length; i++) {
		var tmp = val + (lines[i].end - lines[i].start) + 1; // + 1 is for \n
		if (tmp >= ch) {
			return ch - val;
		} else {
			val = tmp;
		}
	}
	return ch - val;
}

export default {
	name: 'KevScript',
	grammarScopes: ['source.kevs'],
	scope: 'file',
	lintOnFly: true,
	lintOnFlyInterval: 2500,

	init(kScript, statusView) {
		this.kScript = kScript;
		this.statusView = statusView;
		console.log('linter initiated');
	},

	lint(textEditor) {
		return new Promise((resolve) => {
			const text = textEditor.getText();

			let start = 0;
			var lines = text.split('\n').map(function (line, i) {
				var obj = {
					start: start,
					end: start + line.length,
					line: i
				};
				start += line.length + 1;
				return obj;
			});

			const ctxVars = {};
			var enabled = atom.config.get('language-kevscript.enableLinter');
			if (enabled) {
				const start = Date.now();
				this.statusView.setStatus('linting...');
				this.kScript.parse(text, null, ctxVars, (err, model, warnings) => {
					const end = Date.now();
					this.statusView.setStatus('linted (' + (end - start) + 'ms)');
					const errors = [];
					if (err) {
						if (err.nt) {
							var message = 'Unable to match \'' + err.nt + '\'';
							if (err.nt === 'ws') {
								message = 'Unable to match \'whitespace\'';
							} else if (err.nt === 'kevScript') {
								message = 'A line must start with a statement (add, attach, set, etc.)';
							} else if (TOKENS.indexOf(err.nt) >= 0) {
								message = 'Expected statement or comment (do you mean \'' + (err.nt.split('Token').shift()) + '\'?)';
							}
							errors.push({
								type: 'Error',
								text: message,
								filePath: textEditor.getPath(),
								range: [
									[err.line - 1, relativeToLine((err.col === 0) ? 0 : err.col - 1, lines)],
									[err.line - 1, relativeToLine((err.col === 0) ? 1 : err.col, lines)]
								]
							});
						} else if (err.pos) {
							let line = -1;
							for (let i = 0; i < lines.length; i++) {
								if ((err.pos[0] >= lines[i].start) && (err.pos[1] <= lines[i].end)) {
									line = lines[i].line;
									break;
								}
							}
							errors.push({
								type: 'Error',
								text: err.message,
								filePath: textEditor.getPath(),
								range: [
										[line, relativeToLine(err.pos[0], lines)],
										[line, relativeToLine(err.pos[1], lines)]
									]
							});
						} else {
							errors.push({
								type: 'Error',
								text: err.message,
								filePath: textEditor.getPath()
							});
						}
					}
					resolve(errors.concat(warnings.map(warn => {
						let line = -1;
						for (let i = 0; i < lines.length; i++) {
							if ((warn.pos[0] >= lines[i].start) && (warn.pos[1] <= lines[i].end)) {
								line = lines[i].line;
								break;
							}
						}
						return {
							type: 'Warning',
							text: warn.message,
							filePath: textEditor.getPath(),
							range: [
								[line, relativeToLine(warn.pos[0], lines)],
								[line, relativeToLine(warn.pos[1], lines)]
							]
						};
					})));
				});
			} else {
				this.statusView.setStatus('linter disabled');
				resolve([]);
			}
		});
	}
}
