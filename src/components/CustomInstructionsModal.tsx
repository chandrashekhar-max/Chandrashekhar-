import React, { useState } from 'react';
import { Sliders, X, Check, Sparkles } from 'lucide-react';

interface CustomInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedInstructions: string;
  onSave: (instructions: string) => void;
}

const PRESETS = [
  {
    title: 'Code Specialist',
    desc: 'Focus on minimal explanations, clean TypeScript, performance, and complete runnable code.',
    text: 'You are an expert full-stack engineer. Always prioritize clean, typed, modular code with minimal boilerplate. Provide complete solutions without skipping lines. When relevant, write self-contained runnable artifacts.',
  },
  {
    title: 'Deep Analytical & Concise',
    desc: 'Bullet-point insights, avoid flattery, direct and data-backed.',
    text: 'Be extremely direct, structured, and analytical. Cut all conversational filler, pleasantries, and disclaimers. Use bullet points and markdown tables where applicable.',
  },
  {
    title: 'Academic & Rigorous',
    desc: 'Mathematical formalisms, citations, edge cases, step-by-step logic.',
    text: 'Respond with academic precision. Define variables, analyze edge cases, and verify logical validity step-by-step.',
  },
];

export const CustomInstructionsModal: React.FC<CustomInstructionsModalProps> = ({
  isOpen,
  onClose,
  savedInstructions,
  onSave,
}) => {
  const [instructions, setInstructions] = useState(savedInstructions);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(instructions.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#141419] border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Custom Instructions</h2>
            <p className="text-xs text-zinc-400">
              Customize how Nova behaves and responds across all your chats.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Quick Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInstructions(p.text)}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 group-hover:text-emerald-400">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{p.title}</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight mt-1 line-clamp-2">
                  {p.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions Textarea */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            How would you like Nova to respond?
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            placeholder="e.g. What role do you want Nova to adopt? What tone or style? Should answers be concise or elaborate? Are there specific technologies or languages you prefer?"
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none transition"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setInstructions('')}
            className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Clear instructions
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
