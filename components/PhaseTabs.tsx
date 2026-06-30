'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { RunResponse } from '@/lib/types';
import TokenTable from './TokenTable';
import AstTree from './AstTree';

const AssemblyView = dynamic(() => import('./AssemblyView'), { ssr: false });

type PhaseKey = 'tokens' | 'ast' | 'codegen';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  output: RunResponse | null;
  loading: boolean;
  phaseCache: Partial<Record<PhaseKey, string>>;
  phaseLoading: Partial<Record<PhaseKey, boolean>>;
  onFetchPhase: (phase: PhaseKey) => void;
}

const TABS = [
  { id: 'output', label: 'Output' },
  { id: 'errors', label: 'Errores' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'ast', label: 'AST' },
  { id: 'codegen', label: 'Assembly' },
];

const PHASE_TABS = new Set<string>(['tokens', 'ast', 'codegen']);

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-500 text-sm font-mono">
      {label}
    </div>
  );
}

function PhaseLoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full gap-2 text-gray-400 text-sm">
      <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
      Ejecutando fase...
    </div>
  );
}

export default function PhaseTabs({
  activeTab,
  onTabChange,
  output,
  loading,
  phaseCache,
  phaseLoading,
  onFetchPhase,
}: Props) {
  // Fetch phase data lazily when a phase tab becomes active
  useEffect(() => {
    if (!output || loading) return;
    if (!PHASE_TABS.has(activeTab)) return;
    const phase = activeTab as PhaseKey;
    if (phaseCache[phase] === undefined && !phaseLoading[phase]) {
      onFetchPhase(phase);
    }
  }, [activeTab, output, loading, phaseCache, phaseLoading, onFetchPhase]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full gap-2 text-gray-400 text-sm">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
          Ejecutando...
        </div>
      );
    }

    if (!output) {
      return <Placeholder label="Presiona ▶ Run para ejecutar" />;
    }

    switch (activeTab) {
      case 'output':
        if (!output.stdout && !output.stderr) return <Placeholder label="Sin output" />;
        return (
          <div className="font-mono text-sm p-4 whitespace-pre-wrap overflow-auto h-full">
            {output.stdout && <div className="text-green-400">{output.stdout}</div>}
            {output.stderr && !output.stdout && <div className="text-red-400">{output.stderr}</div>}
          </div>
        );

      case 'errors':
        if (!output.stderr) {
          return (
            <div className="flex items-center justify-center h-full gap-2 text-green-400 text-sm">
              ✓ Sin errores
            </div>
          );
        }
        return (
          <div className="font-mono text-sm p-4 whitespace-pre-wrap overflow-auto h-full text-red-400">
            {output.stderr}
          </div>
        );

      case 'tokens':
        if (phaseLoading.tokens) return <PhaseLoadingSpinner />;
        if (phaseCache.tokens === undefined) return <Placeholder label="Cargando tokens..." />;
        return <TokenTable raw={phaseCache.tokens} />;

      case 'ast':
        if (phaseLoading.ast) return <PhaseLoadingSpinner />;
        if (phaseCache.ast === undefined) return <Placeholder label="Cargando AST..." />;
        return <AstTree raw={phaseCache.ast} />;

      case 'codegen':
        if (phaseLoading.codegen) return <PhaseLoadingSpinner />;
        if (phaseCache.codegen === undefined) return <Placeholder label="Cargando assembly..." />;
        return <AssemblyView raw={phaseCache.codegen} />;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-700 bg-gray-900 shrink-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-green-500 text-green-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
            {tab.id === 'errors' && output?.stderr && (
              <span className="ml-1.5 text-xs bg-red-600 text-white rounded-full px-1.5">!</span>
            )}
          </button>
        ))}
      </div>
      <div
        className={`flex-1 overflow-auto bg-gray-950 ${
          output && !output.ok && activeTab === 'output' ? 'ring-1 ring-red-800 ring-inset' : ''
        }`}
      >
        {renderContent()}
      </div>
    </div>
  );
}
