'use client';

interface ParsedToken {
  type: string;
  text: string;
  line: number;
  col: number;
}

const TOKEN_REGEX = /^TOKEN\((\w+),\s*"(.*?)",\s*(\d+):(\d+)\)$/;

function parseTokens(raw: string): ParsedToken[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const m = TOKEN_REGEX.exec(line);
      if (!m) return [];
      return [{ type: m[1], text: m[2], line: parseInt(m[3]), col: parseInt(m[4]) }];
    });
}

function tokenColor(type: string): string {
  if (/^(INT|CHAR|FLOAT|DOUBLE|VOID|BOOL|AUTO|STRUCT|RETURN|IF|ELSE|WHILE|FOR|DO|SWITCH|CASE|DEFAULT|BREAK|CONTINUE|TEMPLATE|TYPENAME)$/.test(type))
    return 'text-purple-400';
  if (/^(MALLOC|FREE|PRINTF|SIZEOF)$/.test(type))
    return 'text-orange-400';
  if (/^(NUM|FLOAT_LIT|TRUE|FALSE|STRING|CHAR_LIT|BIN)$/.test(type))
    return 'text-yellow-300';
  if (/^(IDENTIFIER|ID)$/.test(type))
    return 'text-green-300';
  if (/^ERR$/.test(type))
    return 'text-red-400';
  if (/^(END|EOF)$/.test(type))
    return 'text-gray-600';
  return 'text-cyan-400';
}

export default function TokenTable({ raw }: { raw: string }) {
  const tokens = parseTokens(raw);

  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm font-mono">
        Sin tokens
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm font-mono border-collapse">
        <thead className="sticky top-0 bg-gray-950 z-10">
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-right py-2 px-3 w-12 font-normal">#</th>
            <th className="text-left py-2 px-3 font-normal">Tipo</th>
            <th className="text-left py-2 px-3 font-normal">Texto</th>
            <th className="text-left py-2 px-3 font-normal">Línea:Col</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((tok, i) => (
            <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
              <td className="py-1 px-3 text-gray-600 text-right">{i + 1}</td>
              <td className={`py-1 px-3 font-semibold ${tokenColor(tok.type)}`}>{tok.type}</td>
              <td className="py-1 px-3 text-gray-200">
                {tok.text ? (
                  <span className="bg-gray-800 rounded px-1">{tok.text}</span>
                ) : (
                  <span className="text-gray-600 italic">vacío</span>
                )}
              </td>
              <td className="py-1 px-3 text-gray-500">{tok.line}:{tok.col}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
