import React, { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { useToast } from './Toast';

interface PromptViewerProps {
  prompt: string;
}

export function PromptViewer({ prompt }: PromptViewerProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy prompt.');
    }
  };

  return (
    <div className="relative my-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-5 shadow-lg overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-2xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-amber-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            AI Prompt
          </span>
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/40'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prompt Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Prompt</span>
            </>
          )}
        </button>
      </div>

      {/* Prompt Body */}
      <div className="text-sm leading-relaxed text-slate-100 font-sans whitespace-pre-wrap selection:bg-amber-500/30 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
        {prompt}
      </div>
    </div>
  );
}
