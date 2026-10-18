import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileText,
  FileCode,
  FileJson,
  Globe,
  Share2,
} from 'lucide-react';
import { Conversation } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

type ExportFormat = 'markdown' | 'text' | 'json' | 'html';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  conversation,
}) => {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !conversation) return null;

  // Format generators
  const generateMarkdown = () => {
    let md = `# ${conversation.title}\n\n`;
    md += `*Exported from NovaChat on ${new Date().toLocaleString()}*\n`;
    md += `*Engine: ${conversation.modelMode.toUpperCase()}*\n\n---\n\n`;

    conversation.messages.forEach((msg) => {
      const role = msg.role === 'user' ? '### 👤 User' : '### ✨ Nova';
      md += `${role}\n\n`;
      if (msg.thought) {
        md += `> **Reasoning Thought:**\n> ${msg.thought.split('\n').join('\n> ')}\n\n`;
      }
      md += `${msg.content}\n\n`;

      if (msg.sources && msg.sources.length > 0) {
        md += `**Sources:**\n`;
        msg.sources.forEach((s) => {
          md += `- [${s.title}](${s.uri})\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    return md;
  };

  const generatePlainText = () => {
    let txt = `CONVERSATION: ${conversation.title}\n`;
    txt += `DATE: ${new Date().toLocaleString()}\n`;
    txt += `ENGINE: ${conversation.modelMode}\n`;
    txt += `=========================================\n\n`;

    conversation.messages.forEach((msg) => {
      const speaker = msg.role === 'user' ? 'USER' : 'NOVA';
      txt += `[${speaker}]:\n${msg.content}\n\n`;
      if (msg.sources && msg.sources.length > 0) {
        txt += `SOURCES:\n` + msg.sources.map((s) => `• ${s.title}: ${s.uri}`).join('\n') + `\n\n`;
      }
      txt += `-----------------------------------------\n\n`;
    });

    return txt;
  };

  const generateJSON = () => {
    return JSON.stringify(conversation, null, 2);
  };

  const generateHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${conversation.title} - NovaChat Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f0f13; color: #ececed; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #10b981; border-bottom: 1px solid #27272a; padding-bottom: 12px; }
    .msg { margin-bottom: 24px; padding: 16px; border-radius: 12px; background: #18181b; border: 1px solid #27272a; }
    .user { background: #27272a; border-color: #3f3f46; }
    .role { font-weight: 700; margin-bottom: 8px; color: #34d399; }
    .user .role { color: #60a5fa; }
    pre { background: #09090b; padding: 12px; border-radius: 8px; overflow-x: auto; color: #38bdf8; font-family: monospace; }
    blockquote { border-left: 3px solid #a855f7; padding-left: 12px; color: #a1a1aa; font-style: italic; }
  </style>
</head>
<body>
  <h1>${conversation.title}</h1>
  <p><small>Exported from NovaChat on ${new Date().toLocaleString()}</small></p>
  ${conversation.messages
    .map(
      (m) => `
    <div class="msg ${m.role}">
      <div class="role">${m.role === 'user' ? 'User' : 'Nova'}</div>
      <div>${m.content.replace(/\n/g, '<br/>')}</div>
    </div>
  `
    )
    .join('')}
</body>
</html>`;
  };

  const getExportData = () => {
    switch (format) {
      case 'markdown':
        return { content: generateMarkdown(), ext: 'md', mime: 'text/markdown' };
      case 'text':
        return { content: generatePlainText(), ext: 'txt', mime: 'text/plain' };
      case 'json':
        return { content: generateJSON(), ext: 'json', mime: 'application/json' };
      case 'html':
        return { content: generateHTML(), ext: 'html', mime: 'text/html' };
    }
  };

  const handleCopy = () => {
    const { content } = getExportData();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const { content, ext, mime } = getExportData();
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.href = url;
    a.download = `${safeTitle || 'novachat_export'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const exportData = getExportData();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#141419] border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Conversation</h2>
              <p className="text-xs text-zinc-400 truncate max-w-md">
                "{conversation.title}" ({conversation.messages.length} messages)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="grid grid-cols-4 gap-2 my-4">
          <button
            onClick={() => setFormat('markdown')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
              format === 'markdown'
                ? 'bg-zinc-800 border-emerald-500/70 text-emerald-400'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span className="text-xs font-semibold">Markdown</span>
            <span className="text-[10px] text-zinc-500">.md</span>
          </button>

          <button
            onClick={() => setFormat('text')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
              format === 'text'
                ? 'bg-zinc-800 border-emerald-500/70 text-emerald-400'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-xs font-semibold">Plain Text</span>
            <span className="text-[10px] text-zinc-500">.txt</span>
          </button>

          <button
            onClick={() => setFormat('json')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
              format === 'json'
                ? 'bg-zinc-800 border-emerald-500/70 text-emerald-400'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span className="text-xs font-semibold">JSON</span>
            <span className="text-[10px] text-zinc-500">.json</span>
          </button>

          <button
            onClick={() => setFormat('html')}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
              format === 'html'
                ? 'bg-zinc-800 border-emerald-500/70 text-emerald-400'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-semibold">HTML Doc</span>
            <span className="text-[10px] text-zinc-500">.html</span>
          </button>
        </div>

        {/* Live Preview Container */}
        <div className="flex-1 overflow-auto rounded-xl bg-zinc-950 border border-zinc-800/80 p-3.5 font-mono text-xs text-zinc-300 leading-relaxed min-h-[180px] max-h-[300px]">
          <pre className="whitespace-pre-wrap">{exportData.content.slice(0, 3000)}</pre>
          {exportData.content.length > 3000 && (
            <p className="text-[10px] text-zinc-500 mt-2 italic">
              ... ({exportData.content.length - 3000} more characters in complete export)
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-800">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-xs font-medium text-zinc-200 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Transcript</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs transition shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .{exportData.ext}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
