'use client';

import Editor from '@monaco-editor/react';
import { registerGasLanguage } from '@/lib/gasLanguage';

export default function AssemblyView({ raw }: { raw: string }) {
  return (
    <Editor
      height="100%"
      language="gas"
      value={raw}
      theme="gas-dark"
      beforeMount={registerGasLanguage}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        scrollBeyondLastLine: false,
        wordWrap: 'off',
        renderLineHighlight: 'line',
        selectionHighlight: false,
      }}
    />
  );
}
