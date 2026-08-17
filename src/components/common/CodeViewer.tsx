import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { useToast } from './Toast';

interface CodeViewerProps {
  code: string;
  language?: string;
  maxLines?: number;
  showLineNumbers?: boolean;
}

export function CodeViewer({
  code,
  language = 'tsx',
  maxLines = 25,
  showLineNumbers = true,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code.');
    }
  };

  const lines = code.trim().split('\n');
  const isLong = lines.length > maxLines;
  const displayedLines = isLong && !expanded ? lines.slice(0, maxLines) : lines;

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-xs font-mono shadow-xl my-3">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 text-slate-400">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
            {language}
          </span>
          <span className="text-[10px] text-slate-500 font-normal">
            ({lines.length} lines)
          </span>
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-medium transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Container */}
      <div className="overflow-x-auto p-4 text-slate-200 leading-relaxed font-mono selection:bg-indigo-500/30">
        <table className="w-full border-collapse">
          <tbody>
            {displayedLines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-900/50">
                {showLineNumbers && (
                  <td className="select-none text-right pr-4 text-slate-600 font-sans text-[11px] w-8">
                    {idx + 1}
                  </td>
                )}
                <td className="whitespace-pre">
                  {highlightSyntaxLine(line, language)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand/Collapse Bar */}
      {isLong && (
        <div className="border-t border-slate-800 bg-slate-900/90 px-4 py-2 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-sans font-medium hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Show All {lines.length} Lines
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Lightweight, safe syntax highlight helper for keywords and strings
function highlightSyntaxLine(line: string, _lang: string) {
  if (!line) return <span>&nbsp;</span>;

  // Render comments nicely
  if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('/*')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }

  return (
    <span>
      {line.split(/(\s+)/).map((part, i) => {
        const keywords = [
          'import', 'export', 'default', 'function', 'const', 'let', 'var', 'return',
          'interface', 'type', 'from', 'class', 'extends', 'if', 'else', 'for', 'while',
          'async', 'await', 'try', 'catch', 'new', 'def', 'import', 'from', 'as'
        ];

        const cleanPart = part.trim();
        if (keywords.includes(cleanPart)) {
          return <span key={i} className="text-purple-400 font-semibold">{part}</span>;
        } else if (cleanPart.startsWith('"') || cleanPart.startsWith("'") || cleanPart.startsWith('`')) {
          return <span key={i} className="text-emerald-300">{part}</span>;
        } else if (/^\d+$/.test(cleanPart)) {
          return <span key={i} className="text-amber-400">{part}</span>;
        } else if (cleanPart.startsWith('<') || cleanPart.startsWith('</') || cleanPart.endsWith('>')) {
          return <span key={i} className="text-cyan-400">{part}</span>;
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
