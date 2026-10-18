import React, { useState, useRef, useEffect } from 'react';
import { Zap, Brain, Globe, Code2, ChevronDown, Check, Sparkles } from 'lucide-react';
import { ModelMode } from '../types';

interface ModelSelectorProps {
  currentMode: ModelMode;
  onChangeMode: (mode: ModelMode) => void;
}

interface ModeInfo {
  id: ModelMode;
  name: string;
  tagline: string;
  speed: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge: string;
}

const MODES: ModeInfo[] = [
  {
    id: 'turbo',
    name: 'Nova Turbo',
    tagline: 'Ultra-fast, lowest latency, general tasks & conversation',
    speed: '~120+ tokens/s (Fastest)',
    icon: Zap,
    accentColor: 'text-amber-400',
    badge: 'Blazing Fast',
  },
  {
    id: 'deepthink',
    name: 'Nova DeepThink',
    tagline: 'Deep chain-of-thought reasoning, math, logic, & edge cases',
    speed: 'High Reasoning',
    icon: Brain,
    accentColor: 'text-purple-400',
    badge: 'o1 / Deep Reasoning',
  },
  {
    id: 'search',
    name: 'Nova Web Grounded',
    tagline: 'Live real-time web search with verified sources & citations',
    speed: 'Real-time Intel',
    icon: Globe,
    accentColor: 'text-cyan-400',
    badge: 'Live Search',
  },
  {
    id: 'code',
    name: 'Nova Code Architect',
    tagline: 'Optimized for clean code, systems design & interactive canvas',
    speed: 'Production Code',
    icon: Code2,
    accentColor: 'text-emerald-400',
    badge: 'Full Sandbox',
  },
  {
    id: 'image',
    name: 'Nova Imagine',
    tagline: 'Generate visual artwork, concepts & high-detail SVG illustrations',
    speed: 'Diffusion & Vector',
    icon: Sparkles,
    accentColor: 'text-pink-400',
    badge: 'Image Creator',
  },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({ currentMode, onChangeMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModeInfo = MODES.find((m) => m.id === currentMode) || MODES[0];
  const Icon = activeModeInfo.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700/80 text-xs sm:text-sm font-medium text-zinc-200 transition shadow-xs cursor-pointer"
      >
        <div className={`p-1 rounded-md bg-zinc-800 ${activeModeInfo.accentColor}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white">{activeModeInfo.name}</span>
          <span className="text-[10px] hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
            {activeModeInfo.badge}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#141419] border border-zinc-800/90 shadow-2xl p-2 z-50 animate-in fade-in-0 zoom-in-95">
          <div className="px-2.5 py-1.5 mb-1 border-b border-zinc-800/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Select AI Engine
            </span>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Gemini 3.8 Backbone
            </span>
          </div>

          <div className="space-y-1">
            {MODES.map((mode) => {
              const ModeIcon = mode.icon;
              const isSelected = mode.id === currentMode;

              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    onChangeMode(mode.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800/80 border border-zinc-700/60'
                      : 'hover:bg-zinc-900/60 text-zinc-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5 ${mode.accentColor}`}
                  >
                    <ModeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs sm:text-sm text-white">
                        {mode.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                      {mode.tagline}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-medium text-emerald-400/90">
                      ⚡ {mode.speed}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
