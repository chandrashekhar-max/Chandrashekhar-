import React, { useState } from 'react';
import {
  X,
  Play,
  Code2,
  Copy,
  Check,
  Download,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import { Artifact } from '../types';

interface ArtifactPanelProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ artifact, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (!artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext =
      artifact.language === 'javascript' || artifact.language === 'js'
        ? 'js'
        : artifact.language === 'svg'
        ? 'svg'
        : artifact.language === 'css'
        ? 'css'
        : 'html';
    const blob = new Blob([artifact.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Generate complete HTML bundle for preview
  const getPreviewHtml = () => {
    if (artifact.type === 'svg' || artifact.language === 'svg') {
      return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f0f13; }
      svg { max-width: 90vw; max-height: 90vh; }
    </style>
  </head>
  <body>
    ${artifact.code}
  </body>
</html>`;
    }

    // Check if code is already a full HTML document
    if (artifact.code.includes('<html') || artifact.code.includes('<!DOCTYPE')) {
      return artifact.code;
    }

    // Wrap snippet in Tailwind sandbox
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 1.5rem;
        background-color: #0f0f13;
        color: #e4e4e7;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      }
    </style>
  </head>
  <body>
    ${artifact.code}
  </body>
</html>`;
  };

  return (
    <div
      className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[#121217] border-l border-zinc-800 shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'w-full' : 'w-full lg:w-[48%] xl:w-[42%]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#16161c]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-white truncate">{artifact.title}</h3>
            <span className="text-[11px] font-mono text-zinc-400 uppercase">
              {artifact.language}
            </span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              activeTab === 'code'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
        </div>

        {/* Header toolbar */}
        <div className="flex items-center gap-1">
          {activeTab === 'preview' && (
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              title="Reload preview"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy code"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            title="Download file"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            title="Close panel"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-hidden relative bg-[#0d0d11]">
        {activeTab === 'preview' ? (
          <iframe
            key={reloadKey}
            srcDoc={getPreviewHtml()}
            title="Artifact Preview"
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-none bg-[#0f0f13]"
          />
        ) : (
          <div className="h-full overflow-auto p-4 font-mono text-xs text-zinc-200 leading-relaxed bg-[#0c0c10]">
            <pre>
              <code>{artifact.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
