import React from 'react';
import {
  Sparkles,
  Zap,
  Brain,
  Globe,
  Code2,
  ArrowRight,
} from 'lucide-react';
import { ModelMode } from '../types';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string, mode?: ModelMode) => void;
  activeMode: ModelMode;
}

const STARTERS = [
  {
    icon: Code2,
    mode: 'code' as ModelMode,
    title: 'Interactive Code & Artifacts',
    prompt: 'Build a beautiful, interactive Pomodoro timer app in single-file HTML with Tailwind CSS and sound alerts.',
    color: 'text-emerald-400 group-hover:border-emerald-500/50',
    badge: 'Runs in Canvas',
  },
  {
    icon: Brain,
    mode: 'deepthink' as ModelMode,
    title: 'Deep Logical Reasoning',
    prompt: 'A farmer is standing on one bank of a river with a fox, a goose, and a bag of grain. Explain the optimal solution step-by-step with safety proof.',
    color: 'text-purple-400 group-hover:border-purple-500/50',
    badge: 'Full Reasoning',
  },
  {
    icon: Globe,
    mode: 'search' as ModelMode,
    title: 'Live Web Grounding',
    prompt: 'What are the major scientific and technological milestones announced in AI and quantum computing recently?',
    color: 'text-cyan-400 group-hover:border-cyan-500/50',
    badge: 'Live Sources',
  },
  {
    icon: Zap,
    mode: 'turbo' as ModelMode,
    title: 'Ultra-Fast Analysis',
    prompt: 'Explain the difference between Zero-Knowledge Proofs and Homomorphic Encryption in simple bullet points with real-world use cases.',
    color: 'text-amber-400 group-hover:border-amber-500/50',
    badge: 'Sub-150ms TTFT',
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center text-center">
      {/* Hero Badge */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/25">
          <Sparkles className="w-8 h-8 text-zinc-950 fill-zinc-950" />
        </div>
        <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-zinc-950 ring-4 ring-[#0d0d11]">
          v3.8
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        What can Nova solve for you today?
      </h1>
      <p className="mt-2 text-sm text-zinc-400 max-w-lg leading-relaxed">
        Engineered for extreme speed, deep chain-of-thought reasoning, real-time web intelligence, and live code sandboxes.
      </p>

      {/* Feature Highlights */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-[11px] text-zinc-300 font-medium">
        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          ~120+ tokens/s Throughput
        </span>
        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          Extended Reasoning Traces
        </span>
        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          Google Search Grounding
        </span>
      </div>

      {/* Starter Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8 text-left">
        {STARTERS.map((item, idx) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt, item.mode)}
              className={`group p-4 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/90 transition shadow-sm text-left cursor-pointer flex flex-col justify-between ${item.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ItemIcon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 group-hover:text-zinc-300 leading-relaxed line-clamp-2">
                  "{item.prompt}"
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition">
                <span>Start prompt</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
