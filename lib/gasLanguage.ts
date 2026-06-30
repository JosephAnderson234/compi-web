import type { Monaco } from '@monaco-editor/react';

export function registerGasLanguage(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((l: { id: string }) => l.id === 'gas')) return;

  monaco.languages.register({ id: 'gas' });

  monaco.languages.setMonarchTokensProvider('gas', {
    tokenizer: {
      root: [
        [/#.*$/, 'comment'],
        [/\.[a-zA-Z_][a-zA-Z0-9_]*/, 'keyword'],
        [/[a-zA-Z_][a-zA-Z0-9_]*:/, 'type.identifier'],
        [/%[a-zA-Z0-9]+/, 'variable'],
        [/\$-?(?:0x[0-9a-fA-F]+|[0-9]+)/, 'number'],
        [/-?(?:0x[0-9a-fA-F]+|[0-9]+)/, 'number'],
        [/"[^"]*"/, 'string'],
        [/[a-zA-Z][a-zA-Z0-9]*/, 'identifier'],
        [/[(),\[\]]/, 'delimiter'],
      ],
    },
  });

  monaco.editor.defineTheme('gas-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'type.identifier', foreground: '4EC9B0' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'identifier', foreground: 'DCDCAA' },
    ],
    colors: {},
  });
}
