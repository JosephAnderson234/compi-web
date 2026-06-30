'use client';

import { EXAMPLES } from '@/lib/examples';

interface Props {
  onRun: () => void;
  loading: boolean;
  onExampleSelect: (code: string) => void;
  onClear: () => void;
}

export default function Toolbar({ onRun, loading, onExampleSelect, onClear }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700">
      <span className="text-white font-mono font-bold text-lg mr-2">C<span className="text-green-400">--</span></span>

      <button
        onClick={onRun}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
            Ejecutando...
          </>
        ) : (
          '▶ Run'
        )}
      </button>

      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            const ex = EXAMPLES.find((x) => x.name === e.target.value);
            if (ex) onExampleSelect(ex.code);
          }
          e.target.value = '';
        }}
        className="bg-gray-800 border border-gray-600 hover:border-gray-400 rounded px-3 py-1.5 text-sm transition-colors cursor-pointer"
      >
        <option value="" disabled>Ejemplos...</option>
        {EXAMPLES.map((ex) => (
          <option key={ex.name} value={ex.name}>{ex.name}</option>
        ))}
      </select>

      <button
        onClick={onClear}
        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded transition-colors"
      >
        Limpiar
      </button>

      <div className="ml-auto text-xs text-gray-500 font-mono">
        Ctrl+Enter para ejecutar
      </div>
    </div>
  );
}
