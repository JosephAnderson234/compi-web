'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Toolbar from '@/components/Toolbar';
import PhaseTabs from '@/components/PhaseTabs';
import { runCode } from '@/lib/run';
import { RunResponse } from '@/lib/types';
import { EXAMPLES } from '@/lib/examples';

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false });

type PhaseKey = 'tokens' | 'ast' | 'codegen';

const DEFAULT_CODE = EXAMPLES[0].code;

export default function Home() {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [output, setOutput] = useState<RunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('output');
  const [phaseCache, setPhaseCache] = useState<Partial<Record<PhaseKey, string>>>({});
  const [phaseLoading, setPhaseLoading] = useState<Partial<Record<PhaseKey, boolean>>>({});

  const handleRun = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setOutput(null);
    setPhaseCache({});
    setPhaseLoading({});
    try {
      const result = await runCode(code);
      setOutput(result);
      setActiveTab(result.stderr && !result.stdout ? 'errors' : 'output');
    } catch {
      setOutput({ ok: false, stdout: '', stderr: 'Error al conectar con el servidor.', exitCode: 1 });
      setActiveTab('errors');
    } finally {
      setLoading(false);
    }
  }, [code, loading]);

  const handleFetchPhase = useCallback(async (phase: PhaseKey) => {
    setPhaseLoading((prev) => ({ ...prev, [phase]: true }));
    try {
      const res = await fetch('/api/phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, phase }),
      });
      const data = await res.json();
      setPhaseCache((prev) => ({ ...prev, [phase]: data.output ?? '' }));
    } catch {
      setPhaseCache((prev) => ({ ...prev, [phase]: 'Error al obtener la fase.' }));
    } finally {
      setPhaseLoading((prev) => ({ ...prev, [phase]: false }));
    }
  }, [code]);

  const handleExampleSelect = useCallback((newCode: string) => {
    setCode(newCode);
    setOutput(null);
    setPhaseCache({});
    setPhaseLoading({});
  }, []);

  const handleClear = useCallback(() => {
    setOutput(null);
    setPhaseCache({});
    setPhaseLoading({});
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun]);

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        onRun={handleRun}
        loading={loading}
        onExampleSelect={handleExampleSelect}
        onClear={handleClear}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-gray-700 bg-gray-900">
          <CodeEditor value={code} onChange={setCode} />
        </div>
        <div className="w-1/2 flex flex-col">
          <PhaseTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            output={output}
            loading={loading}
            phaseCache={phaseCache}
            phaseLoading={phaseLoading}
            onFetchPhase={handleFetchPhase}
          />
        </div>
      </div>
    </div>
  );
}
