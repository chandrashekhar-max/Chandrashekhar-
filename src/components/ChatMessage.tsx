import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Code2,
  Sparkles,
  Zap,
  Brain,
  Globe,
  User as UserIcon,
  Play,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { Message, Artifact } from '../types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onOpenArtifact?: (artifact: Artifact) => void;
  onPlayTTS?: (text: string) => void;
  isPlayingAudio?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
  onOpenArtifact,
  onPlayTTS,
  isPlayingAudio = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [showThought, setShowThought] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const getModeBadge = () => {
    switch (message.mode) {
      case 'deepthink':
        return { label: 'Nova DeepThink', icon: Brain, color: 'text-purple-400 bg-purple-950/40 border-purple-800/50' };
      case 'search':
        return { label: 'Web Grounded', icon: Globe, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50' };
      case 'code':
        return { label: 'Code Architect', icon: Code2, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' };
      case 'image':
        return { label: 'Nova Imagine', icon: Sparkles, color: 'text-pink-400 bg-pink-950/40 border-pink-800/50' };
      default:
        return { label: 'Nova Turbo', icon: Zap, color: 'text-amber-400 bg-amber-950/40 border-amber-800/50' };
    }
  };

  const badgeInfo = getModeBadge();
  const BadgeIcon = badgeInfo.icon;

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 group">
        <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
          {/* Attached images */}
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {message.images.map((img) => (
                <div key={img.id} className="relative rounded-xl overflow-hidden border border-zinc-700 max-w-[200px]">
                  <img src={img.url} alt={img.name} className="w-full h-auto object-cover max-h-48" />
                </div>
              ))}
            </div>
          )}

          {/* User message bubble */}
          <div className="flex items-start gap-3 justify-end">
            <div className="bg-zinc-800/90 text-zinc-100 px-4 py-3 rounded-2xl rounded-tr-xs border border-zinc-700/60 shadow-sm text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-zinc-400">
              <UserIcon className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  let codeBlockCounter = 0;

  return (
    <div className="flex items-start gap-3.5 mb-7 group">
      {/* Nova Avatar */}
      <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shrink-0 mt-1 shadow-md shadow-emerald-500/20">
        <Sparkles className="w-4 h-4 text-zinc-950 fill-zinc-950" />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Model Identifier & Mode Tag */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs sm:text-sm text-white">Nova</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeInfo.color}`}
          >
            <BadgeIcon className="w-3 h-3" />
            <span>{badgeInfo.label}</span>
          </span>

          {message.stats && (
            <span className="text-[11px] text-zinc-500 hidden sm:inline-flex items-center gap-1.5 ml-1">
              <span>•</span>
              <span className="text-emerald-400/90 font-mono font-medium">
                {message.stats.durationMs}ms
              </span>
              <span>•</span>
              <span className="text-zinc-400 font-mono">
                {message.stats.tokensPerSec} t/s
              </span>
            </span>
          )}
        </div>

        {/* Thought / Reasoning Stream (Collapsible like OpenAI o1 / DeepSeek R1) */}
        {message.thought && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 overflow-hidden text-xs">
            <button
              onClick={() => setShowThought(!showThought)}
              className="w-full flex items-center justify-between px-3 py-2 text-purple-300 hover:text-purple-200 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-medium">
                  {showThought ? 'Hide reasoning process' : 'Thought process & logical deduction'}
                </span>
              </div>
              {showThought ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showThought && (
              <div className="px-3.5 py-2.5 border-t border-purple-500/20 text-zinc-300 font-mono text-[12px] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-black/30">
                {message.thought}
              </div>
            )}
          </div>
        )}

        {/* Markdown Content */}
        <div className="markdown-body text-zinc-200 leading-relaxed break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const codeText = String(children).replace(/\n$/, '');
                const currentIdx = codeBlockCounter++;

                if (!inline && language) {
                  const isPreviewable = ['html', 'javascript', 'jsx', 'tsx', 'svg', 'css'].includes(
                    language.toLowerCase()
                  );

                  return (
                    <div className="my-3 rounded-xl border border-zinc-800 bg-[#121217] overflow-hidden text-xs">
                      {/* Code Block Header */}
                      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 font-mono">
                        <span className="uppercase text-[11px] font-semibold text-emerald-400">
                          {language}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isPreviewable && onOpenArtifact && (
                            <button
                              onClick={() =>
                                onOpenArtifact({
                                  id: `artifact-${Date.now()}-${currentIdx}`,
                                  title: `${language.toUpperCase()} Component`,
                                  language,
                                  code: codeText,
                                  type: language === 'svg' ? 'svg' : 'html',
                                })
                              }
                              className="flex items-center gap-1 px-2 py-0.8 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-sans text-[11px] font-medium transition cursor-pointer"
                            >
                              <Play className="w-3 h-3" />
                              <span>Live Preview</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyCode(codeText, currentIdx)}
                            className="flex items-center gap-1 px-2 py-0.8 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition font-sans text-[11px] cursor-pointer"
                          >
                            {copiedCodeIndex === currentIdx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      {/* Code Body */}
                      <div className="p-3.5 overflow-x-auto font-mono text-[13px] leading-relaxed text-zinc-200">
                        <pre>
                          <code>{codeText}</code>
                        </pre>
                      </div>
                    </div>
                  );
                }

                return (
                  <code
                    className="px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-emerald-300 font-mono text-[13px]"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>

          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse rounded-xs" />
          )}
        </div>

        {/* Generated Image Showcase Card */}
        {message.generatedImage && (
          <div className="rounded-2xl border border-zinc-800 bg-[#121217] overflow-hidden shadow-xl max-w-xl">
            <div className="relative group/img overflow-hidden bg-black/40 flex items-center justify-center min-h-[220px]">
              <img
                src={message.generatedImage.url}
                alt={message.generatedImage.prompt}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[460px] object-contain transition-transform duration-300 group-hover/img:scale-[1.01]"
              />
            </div>

            <div className="p-3.5 bg-zinc-900/90 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-200 line-clamp-2">
                    "{message.generatedImage.prompt}"
                  </p>
                  <span className="text-[10px] text-pink-400 font-mono">
                    {message.generatedImage.model || 'Nova Imagine'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {message.generatedImage.svgCode && onOpenArtifact && (
                    <button
                      onClick={() =>
                        onOpenArtifact({
                          id: `artifact-img-${Date.now()}`,
                          title: `Vector Graphic: ${message.generatedImage?.prompt.slice(0, 20)}`,
                          language: 'svg',
                          code: message.generatedImage!.svgCode!,
                          type: 'svg',
                        })
                      }
                      title="Open in Canvas"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 text-xs font-medium transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Canvas</span>
                    </button>
                  )}

                  <a
                    href={message.generatedImage.url}
                    download={`nova_image_${Date.now()}.${message.generatedImage.svgCode ? 'svg' : 'png'}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {message.generatedImage.note && (
                <p className="text-[10px] text-zinc-500 leading-tight">
                  {message.generatedImage.note}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Grounding Sources (Google Search Citations) */}
        {message.sources && message.sources.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-zinc-400">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verified Web Sources ({message.sources.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.sources.map((src, i) => {
                let domain = '';
                try {
                  domain = new URL(src.uri).hostname.replace(/^www\./, '');
                } catch {
                  domain = src.uri;
                }
                return (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition group/src text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-zinc-200 truncate group-hover/src:text-white">
                        {src.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">{domain}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover/src:text-cyan-400 shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Actions Toolbar */}
        {!isStreaming && (
          <div className="flex items-center gap-1.5 pt-1 text-zinc-500">
            <button
              onClick={handleCopy}
              title="Copy answer"
              className="p-1.5 rounded-lg hover:text-zinc-200 hover:bg-zinc-800/80 transition cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {onPlayTTS && (
              <button
                onClick={() => onPlayTTS(message.content)}
                title={isPlayingAudio ? 'Stop reading' : 'Read aloud with AI voice'}
                className={`p-1.5 rounded-lg hover:bg-zinc-800/80 transition cursor-pointer ${
                  isPlayingAudio ? 'text-emerald-400' : 'hover:text-zinc-200'
                }`}
              >
                {isPlayingAudio ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            )}

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                title="Regenerate response"
                className="p-1.5 rounded-lg hover:text-zinc-200 hover:bg-zinc-800/80 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
