'use client';

import { useState } from 'react';

interface TreeNode {
  label: string;
  children: TreeNode[];
}

function parseIndentedTree(text: string): TreeNode[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const root: TreeNode[] = [];
  const stack: { node: TreeNode; depth: number }[] = [];

  for (const line of lines) {
    const spaces = line.match(/^ */)?.[0].length ?? 0;
    const depth = Math.floor(spaces / 2);
    const label = line.trim();
    const node: TreeNode = { label, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ node, depth });
  }

  return root;
}

function NodeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  const [nodeName, ...rest] = node.label.split(':');
  const detail = rest.join(':').trim();

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 rounded hover:bg-gray-800/60 cursor-pointer font-mono text-sm transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        <span className="w-4 text-gray-500 shrink-0 text-xs">
          {hasChildren ? (open ? '▾' : '▸') : '·'}
        </span>
        <span className={hasChildren ? 'text-blue-300' : 'text-gray-400'}>
          {nodeName}
        </span>
        {detail && (
          <span className="text-yellow-300 ml-1">
            <span className="text-gray-500">: </span>
            {detail}
          </span>
        )}
        {hasChildren && (
          <span className="ml-1 text-xs text-gray-600">({node.children.length})</span>
        )}
      </div>
      {open &&
        hasChildren &&
        node.children.map((child, i) => (
          <NodeView key={i} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function AstTree({ raw }: { raw: string }) {
  const nodes = parseIndentedTree(raw);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm font-mono">
        Sin AST
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full py-2">
      {nodes.map((node, i) => (
        <NodeView key={i} node={node} />
      ))}
    </div>
  );
}
