'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface TreeNode {
  id: string;
  label: string;
  name: string;
  detail: string;
  children: TreeNode[];
}

function parseIndentedTree(text: string): TreeNode[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const root: TreeNode[] = [];
  const stack: { node: TreeNode; depth: number }[] = [];
  const childCounters = new Map<string, number>();

  for (const line of lines) {
    const spaces = line.match(/^ */)?.[0].length ?? 0;
    const depth = Math.floor(spaces / 2);
    const label = line.trim();
    const [namePart, ...rest] = label.split(':');
    const detail = rest.join(':').trim();

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    const parentId = stack.length > 0 ? stack[stack.length - 1].node.id : 'root';
    const idx = childCounters.get(parentId) ?? 0;
    childCounters.set(parentId, idx + 1);
    const id = parentId === 'root' ? `n${idx}` : `${parentId}-${idx}`;

    const node: TreeNode = { id, label, name: namePart.trim(), detail, children: [] };

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ node, depth });
  }

  return root;
}

function collectAllIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  const walk = (n: TreeNode) => {
    if (n.children.length > 0) {
      ids.push(n.id);
      n.children.forEach(walk);
    }
  };
  nodes.forEach(walk);
  return ids;
}

function findMatchesAndAncestors(nodes: TreeNode[], query: string) {
  const q = query.trim().toLowerCase();
  const matches = new Set<string>();
  const ancestors = new Set<string>();
  if (!q) return { matches, ancestors };

  const visit = (node: TreeNode, path: string[]): boolean => {
    const isMatch = node.label.toLowerCase().includes(q);
    if (isMatch) matches.add(node.id);

    let childMatch = false;
    for (const child of node.children) {
      if (visit(child, [...path, node.id])) childMatch = true;
    }

    if (isMatch || childMatch) {
      path.forEach((id) => ancestors.add(id));
      if (childMatch) ancestors.add(node.id);
    }
    return isMatch || childMatch;
  };

  nodes.forEach((n) => visit(n, []));
  return { matches, ancestors };
}

const btnClass =
  'px-2 py-1 text-xs rounded border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors';

// ---------- List view ----------

function NodeView({
  node,
  depth,
  openSet,
  onToggle,
  matches,
  registerRef,
}: {
  node: TreeNode;
  depth: number;
  openSet: Set<string>;
  onToggle: (id: string) => void;
  matches: Set<string>;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}) {
  const hasChildren = node.children.length > 0;
  const open = openSet.has(node.id);
  const isMatch = matches.has(node.id);

  return (
    <div>
      <div
        ref={(el) => registerRef(node.id, el)}
        className={`flex items-center gap-1 py-0.5 rounded hover:bg-gray-800/60 cursor-pointer font-mono text-sm transition-colors ${
          isMatch ? 'bg-yellow-500/10 ring-1 ring-yellow-500/40' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        <span className="w-4 text-gray-500 shrink-0 text-xs">
          {hasChildren ? (open ? '▾' : '▸') : '·'}
        </span>
        <span className={hasChildren ? 'text-blue-300' : 'text-gray-400'}>{node.name}</span>
        {node.detail && (
          <span className="text-yellow-300 ml-1">
            <span className="text-gray-500">: </span>
            {node.detail}
          </span>
        )}
        {hasChildren && (
          <span className="ml-1 text-xs text-gray-600">({node.children.length})</span>
        )}
      </div>
      {open &&
        hasChildren &&
        node.children.map((child) => (
          <NodeView
            key={child.id}
            node={child}
            depth={depth + 1}
            openSet={openSet}
            onToggle={onToggle}
            matches={matches}
            registerRef={registerRef}
          />
        ))}
    </div>
  );
}

function ListView({
  nodes,
  openSet,
  onToggle,
  matches,
  registerRef,
}: {
  nodes: TreeNode[];
  openSet: Set<string>;
  onToggle: (id: string) => void;
  matches: Set<string>;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="overflow-auto h-full py-2">
      {nodes.map((node) => (
        <NodeView
          key={node.id}
          node={node}
          depth={0}
          openSet={openSet}
          onToggle={onToggle}
          matches={matches}
          registerRef={registerRef}
        />
      ))}
    </div>
  );
}

// ---------- Diagram view ----------

const NODE_H = 36;
const V_GAP = 64;
const H_GAP = 20;
const CHAR_W = 6.5;
const MIN_W = 90;
const MAX_W = 240;

interface PosNode extends TreeNode {
  x: number;
  y: number;
  w: number;
  visKids: PosNode[];
}

function measureWidth(text: string): number {
  return Math.min(MAX_W, Math.max(MIN_W, text.length * CHAR_W + 28));
}

function truncate(text: string, boxWidth: number): string {
  const maxChars = Math.max(3, Math.floor((boxWidth - 12) / (CHAR_W - 0.5)));
  return text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
}

function layoutTree(nodes: TreeNode[], openSet: Set<string>) {
  let cursor = 0;

  const place = (node: TreeNode, depth: number): PosNode => {
    const isOpen = openSet.has(node.id);
    const kids = isOpen ? node.children : [];
    const w = measureWidth(node.detail ? `${node.name}: ${node.detail}` : node.name);

    let x: number;
    let visKids: PosNode[] = [];
    if (kids.length === 0) {
      x = cursor + w / 2;
      cursor += w + H_GAP;
    } else {
      visKids = kids.map((k) => place(k, depth + 1));
      x = (visKids[0].x + visKids[visKids.length - 1].x) / 2;
    }

    return { ...node, x, y: depth * V_GAP, w, visKids };
  };

  const roots = nodes.map((n) => place(n, 0));
  const width = cursor > 0 ? cursor - H_GAP : 0;
  return { roots, width };
}

function flattenLayout(roots: PosNode[]) {
  const flat: PosNode[] = [];
  const edges: { parentId: string; childId: string }[] = [];
  let maxY = 0;

  const walk = (n: PosNode) => {
    flat.push(n);
    maxY = Math.max(maxY, n.y);
    for (const c of n.visKids) {
      edges.push({ parentId: n.id, childId: c.id });
      walk(c);
    }
  };
  roots.forEach(walk);
  return { flat, edges, maxY };
}

interface DragOffset {
  dx: number;
  dy: number;
}

const DRAG_PAD = 32;
const DRAG_THRESHOLD = 4;

function computeBounds(
  effNodes: { ex: number; ey: number; w: number }[],
  fallbackWidth: number,
  fallbackHeight: number
) {
  if (effNodes.length === 0) {
    return { minX: 0, minY: 0, maxX: fallbackWidth, maxY: fallbackHeight };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of effNodes) {
    minX = Math.min(minX, n.ex - n.w / 2);
    maxX = Math.max(maxX, n.ex + n.w / 2);
    minY = Math.min(minY, n.ey - NODE_H / 2);
    maxY = Math.max(maxY, n.ey + NODE_H / 2);
  }
  return {
    minX: Math.min(0, minX) - DRAG_PAD,
    minY: Math.min(0, minY) - DRAG_PAD,
    maxX: Math.max(fallbackWidth, maxX) + DRAG_PAD,
    maxY: Math.max(fallbackHeight, maxY) + DRAG_PAD,
  };
}

function DiagramView({
  nodes,
  openSet,
  onToggle,
  matches,
}: {
  nodes: TreeNode[];
  openSet: Set<string>;
  onToggle: (id: string) => void;
  matches: Set<string>;
}) {
  const [zoom, setZoom] = useState(1);
  const [overrides, setOverrides] = useState<Map<string, DragOffset>>(new Map());
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Manual node positions only make sense for the AST that produced them.
  const [prevNodes, setPrevNodes] = useState(nodes);
  if (nodes !== prevNodes) {
    setPrevNodes(nodes);
    setOverrides(new Map());
  }

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    baseDx: number;
    baseDy: number;
    moved: boolean;
  } | null>(null);

  const { roots, width } = useMemo(() => layoutTree(nodes, openSet), [nodes, openSet]);
  const { flat, edges, maxY } = useMemo(() => flattenLayout(roots), [roots]);

  const padding = 24;
  const baseWidth = Math.max(width + padding * 2, 200);
  const baseHeight = maxY + NODE_H + padding * 2;

  const effNodes = useMemo(
    () =>
      flat.map((n) => {
        const o = overrides.get(n.id);
        return { ...n, ex: n.x + (o?.dx ?? 0), ey: n.y + (o?.dy ?? 0) };
      }),
    [flat, overrides]
  );
  const posById = useMemo(() => new Map(effNodes.map((n) => [n.id, n])), [effNodes]);
  const bounds = useMemo(() => computeBounds(effNodes, baseWidth, baseHeight), [effNodes, baseWidth, baseHeight]);

  const svgWidth = bounds.maxX - bounds.minX;
  const svgHeight = bounds.maxY - bounds.minY;

  const handlePointerDown = (e: ReactPointerEvent<SVGGElement>, id: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const base = overrides.get(id) ?? { dx: 0, dy: 0 };
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, baseDx: base.dx, baseDy: base.dy, moved: false };
    setDraggingId(id);
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dxScreen = e.clientX - drag.startX;
    const dyScreen = e.clientY - drag.startY;
    if (Math.abs(dxScreen) > DRAG_THRESHOLD || Math.abs(dyScreen) > DRAG_THRESHOLD) {
      drag.moved = true;
    }
    const dx = drag.baseDx + dxScreen / zoom;
    const dy = drag.baseDy + dyScreen / zoom;
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(drag.id, { dx, dy });
      return next;
    });
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGGElement>, node: PosNode) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDraggingId(null);
    if (drag && !drag.moved && node.children.length > 0) {
      onToggle(node.id);
    }
  };

  const resetPositions = () => setOverrides(new Map());

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-800 bg-gray-900/60 shrink-0">
        <button className={btnClass} onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}>
          −
        </button>
        <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button className={btnClass} onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}>
          +
        </button>
        <button className={btnClass} onClick={() => setZoom(1)}>
          Reset zoom
        </button>
        {overrides.size > 0 && (
          <button className={btnClass} onClick={resetPositions}>
            Reordenar auto
          </button>
        )}
        <span className="text-xs text-gray-600 ml-auto">Arrastra un nodo para reacomodarlo</span>
      </div>
      <div className="flex-1 overflow-auto bg-gray-950">
        <svg
          width={svgWidth * zoom}
          height={svgHeight * zoom}
          viewBox={`${bounds.minX} ${bounds.minY} ${svgWidth} ${svgHeight}`}
        >
          {edges.map((e, i) => {
            const parent = posById.get(e.parentId);
            const child = posById.get(e.childId);
            if (!parent || !child) return null;
            const x1 = parent.ex;
            const y1 = parent.ey + NODE_H / 2;
            const x2 = child.ex;
            const y2 = child.ey - NODE_H / 2;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
                fill="none"
                stroke="#4b5563"
                strokeWidth={1.5}
              />
            );
          })}
          {effNodes.map((n) => {
            const hasChildren = n.children.length > 0;
            const isOpen = openSet.has(n.id);
            const isMatch = matches.has(n.id);
            const isDragging = draggingId === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.ex - n.w / 2}, ${n.ey - NODE_H / 2})`}
                className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                onPointerDown={(e) => handlePointerDown(e, n.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={(e) => handlePointerUp(e, n)}
              >
                <title>{n.label}</title>
                <rect
                  width={n.w}
                  height={NODE_H}
                  rx={6}
                  fill={isMatch ? 'rgba(234,179,8,0.15)' : '#111827'}
                  stroke={isMatch ? '#eab308' : hasChildren ? '#3b82f6' : '#374151'}
                  strokeWidth={isMatch ? 1.5 : 1}
                />
                <text
                  x={n.w / 2}
                  y={n.detail ? NODE_H / 2 - 6 : NODE_H / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontFamily="monospace"
                  fill={hasChildren ? '#93c5fd' : '#9ca3af'}
                >
                  {truncate(n.name, n.w)}
                </text>
                {n.detail && (
                  <text
                    x={n.w / 2}
                    y={NODE_H / 2 + 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9.5}
                    fontFamily="monospace"
                    fill="#fde047"
                  >
                    {truncate(n.detail, n.w)}
                  </text>
                )}
                {hasChildren && (
                  <text x={n.w - 6} y={9} textAnchor="end" fontSize={9} fontFamily="monospace" fill="#6b7280">
                    {isOpen ? '−' : `+${n.children.length}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ---------- Root component ----------

export default function AstTree({ raw }: { raw: string }) {
  const nodes = useMemo(() => parseIndentedTree(raw), [raw]);
  const [mode, setMode] = useState<'list' | 'diagram'>('list');
  const [query, setQuery] = useState('');
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set(collectAllIds(nodes)));
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());

  // Reset expand/collapse state whenever a new AST is parsed (derived during render, not an effect).
  const [prevNodes, setPrevNodes] = useState(nodes);
  if (nodes !== prevNodes) {
    setPrevNodes(nodes);
    setOpenSet(new Set(collectAllIds(nodes)));
  }

  const { matches, ancestors } = useMemo(() => findMatchesAndAncestors(nodes, query), [nodes, query]);

  const effectiveOpen = useMemo(() => {
    if (!query.trim()) return openSet;
    const merged = new Set(openSet);
    ancestors.forEach((id) => merged.add(id));
    return merged;
  }, [openSet, ancestors, query]);

  useEffect(() => {
    if (!query.trim() || matches.size === 0) return;
    const firstId = Array.from(matches)[0];
    const el = nodeRefs.current.get(firstId);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [query, matches]);

  const toggle = (id: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenSet(new Set(collectAllIds(nodes)));
  const collapseAll = () => setOpenSet(new Set());

  const registerRef = (id: string, el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm font-mono">
        Sin AST
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-gray-800 bg-gray-900/60 shrink-0">
        <div className="flex rounded border border-gray-700 overflow-hidden">
          <button
            className={`px-2 py-1 text-xs transition-colors ${
              mode === 'list' ? 'bg-gray-800 text-green-400' : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setMode('list')}
          >
            Lista
          </button>
          <button
            className={`px-2 py-1 text-xs transition-colors border-l border-gray-700 ${
              mode === 'diagram' ? 'bg-gray-800 text-green-400' : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setMode('diagram')}
          >
            Diagrama
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nodo..."
          className="flex-1 min-w-[120px] max-w-xs bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />
        {query.trim() && (
          <span className="text-xs text-gray-500">
            {matches.size} coincidencia{matches.size === 1 ? '' : 's'}
          </span>
        )}

        <div className="flex gap-1 ml-auto">
          <button className={btnClass} onClick={expandAll}>
            Expandir todo
          </button>
          <button className={btnClass} onClick={collapseAll}>
            Colapsar todo
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {mode === 'list' ? (
          <ListView
            nodes={nodes}
            openSet={effectiveOpen}
            onToggle={toggle}
            matches={matches}
            registerRef={registerRef}
          />
        ) : (
          <DiagramView nodes={nodes} openSet={effectiveOpen} onToggle={toggle} matches={matches} />
        )}
      </div>
    </div>
  );
}
