import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Image as ImageIcon,
  Mic,
  MicOff,
  Globe,
  Brain,
  Code2,
  X,
  Paperclip,
} from 'lucide-react';
import { ModelMode, AttachedImage } from '../types';

interface ChatInputProps {
  onSendMessage: (content: string, images?: AttachedImage[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  activeMode: ModelMode;
  onChangeMode: (mode: ModelMode) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStop,
  isStreaming,
  activeMode,
  onChangeMode,
}) => {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!input.trim() && images.length === 0) || isStreaming) return;
    onSendMessage(input.trim(), images.length > 0 ? images : undefined);
    setInput('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImages((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random()}`,
            name: file.name,
            mimeType: file.type,
            base64,
            url: URL.createObjectURL(file),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Clipboard paste image support
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setImages((prev) => [
              ...prev,
              {
                id: `img-${Date.now()}`,
                name: file.name || 'Pasted Image',
                mimeType: file.type,
                base64,
                url: URL.createObjectURL(file),
              },
            ]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      <div className="relative rounded-2xl bg-[#141419] border border-zinc-700/80 shadow-2xl p-2.5 transition focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20">
        {/* Attached image thumbnails */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border-b border-zinc-800">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border border-zinc-700">
                <img src={img.url} alt={img.name} className="w-16 h-16 object-cover" />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-black text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            isListening
              ? 'Listening to your voice... Speak now.'
              : activeMode === 'image'
              ? 'Describe an image to create (e.g. A cyberpunk street with neon reflections)...'
              : activeMode === 'deepthink'
              ? 'Ask a complex reasoning or math problem...'
              : activeMode === 'search'
              ? 'Ask for real-time web info or current events...'
              : 'Message Nova (Ultra-fast intelligence, type /image to create)...'
          }
          rows={1}
          className="w-full bg-transparent text-sm sm:text-[15px] text-zinc-100 placeholder-zinc-500 resize-none outline-none px-2 py-1.5 min-h-[44px] max-h-[220px]"
        />

        {/* Footer toolbar */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 mt-1">
          {/* Quick mode toggles & attachments */}
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* DeepThink toggle */}
            <button
              onClick={() => onChangeMode(activeMode === 'deepthink' ? 'turbo' : 'deepthink')}
              title={activeMode === 'deepthink' ? 'Deep Reasoning enabled' : 'Enable Deep Reasoning'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeMode === 'deepthink'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DeepThink</span>
            </button>

            {/* Web Search toggle */}
            <button
              onClick={() => onChangeMode(activeMode === 'search' ? 'turbo' : 'search')}
              title={activeMode === 'search' ? 'Web Search enabled' : 'Enable Web Search'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeMode === 'search'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Code mode toggle */}
            <button
              onClick={() => onChangeMode(activeMode === 'code' ? 'turbo' : 'code')}
              title={activeMode === 'code' ? 'Code Architect enabled' : 'Enable Code Architect'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeMode === 'code'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Code</span>
            </button>

            {/* Imagine / Image Creator toggle */}
            <button
              onClick={() => onChangeMode(activeMode === 'image' ? 'turbo' : 'image')}
              title={activeMode === 'image' ? 'Image Creator enabled' : 'Create Images'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeMode === 'image'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imagine</span>
            </button>
          </div>

          {/* Right actions: Voice input & Send / Stop */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSpeechRecognition}
              title={isListening ? 'Stop listening' : 'Voice input'}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {isStreaming ? (
              <button
                onClick={onStop}
                title="Stop generation"
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 transition cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && images.length === 0}
                title="Send message"
                className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <ArrowUp className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-zinc-500">
        <span>⚡ 120+ tokens/s • Sub-150ms TTFT • Free Tier Ready</span>
        <span className="hidden sm:inline">Shift + Enter for new line</span>
      </div>
    </div>
  );
};
