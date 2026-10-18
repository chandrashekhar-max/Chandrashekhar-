import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Zap,
  Sliders,
  Gauge,
  Download,
  ChevronLeft,
  Filter,
  FileText,
  User as UserIcon,
  Smartphone,
} from 'lucide-react';
import { Conversation, ModelMode, Message } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onOpenCustomInstructions: () => void;
  onOpenBenchmark: () => void;
  onOpenInstall?: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  activeMode: ModelMode;
}

type SearchFilterScope = 'all' | 'title' | 'content';

interface SearchMatchResult {
  conversation: Conversation;
  titleMatches: boolean;
  contentMatchesCount: number;
  matchedSnippets: Array<{
    role: 'user' | 'assistant';
    snippet: string;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  onOpenCustomInstructions,
  onOpenBenchmark,
  onOpenInstall,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchFilterScope>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper to highlight matching text
  const highlightMatch = (text: string, queryStr: string) => {
    if (!queryStr.trim()) return text;
    try {
      const escaped = queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === queryStr.toLowerCase() ? (
          <mark
            key={i}
            className="bg-emerald-500/30 text-emerald-300 font-semibold rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  // Helper to extract relevant snippet around search match
  const getMatchSnippet = (content: string, queryStr: string, maxLen = 65) => {
    const lowerContent = content.toLowerCase();
    const lowerQuery = queryStr.toLowerCase();
    const idx = lowerContent.indexOf(lowerQuery);

    if (idx === -1) {
      return content.length > maxLen ? content.slice(0, maxLen) + '...' : content;
    }

    const start = Math.max(0, idx - 18);
    const end = Math.min(content.length, idx + queryStr.length + 38);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < content.length ? '...' : '';

    return `${prefix}${content.slice(start, end)}${suffix}`;
  };

  // Filter conversations by title or message content
  const searchResults = useMemo<SearchMatchResult[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: SearchMatchResult[] = [];

    for (const conv of conversations) {
      const titleMatches = conv.title.toLowerCase().includes(q);
      const matchingMessages: Message[] = [];

      if (conv.messages && conv.messages.length > 0) {
        for (const msg of conv.messages) {
          if (msg.content && msg.content.toLowerCase().includes(q)) {
            matchingMessages.push(msg);
          }
        }
      }

      const contentMatches = matchingMessages.length > 0;

      let include = false;
      if (searchScope === 'all') {
        include = titleMatches || contentMatches;
      } else if (searchScope === 'title') {
        include = titleMatches;
      } else if (searchScope === 'content') {
        include = contentMatches;
      }

      if (include) {
        // Collect top 2 matched snippets
        const matchedSnippets = matchingMessages.slice(0, 2).map((m) => ({
          role: m.role,
          snippet: getMatchSnippet(m.content, q),
        }));

        results.push({
          conversation: conv,
          titleMatches,
          contentMatchesCount: matchingMessages.length,
          matchedSnippets,
        });
      }
    }

    return results;
  }, [conversations, searchQuery, searchScope]);

  const isSearching = searchQuery.trim().length > 0;

  // Normal grouped conversations when not searching
  const pinned = conversations.filter((c) => c.pinned);
  const unpinned = conversations.filter((c) => !c.pinned);

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const today = unpinned.filter((c) => now - c.updatedAt < oneDay);
  const yesterday = unpinned.filter(
    (c) => now - c.updatedAt >= oneDay && now - c.updatedAt < 2 * oneDay
  );
  const older = unpinned.filter((c) => now - c.updatedAt >= 2 * oneDay);

  const handleStartEdit = (e: React.MouseEvent, c: Conversation) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleExport = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(conv, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const renderConversationItem = (c: Conversation, searchInfo?: SearchMatchResult) => {
    const isActive = c.id === activeId;
    const isEditing = c.id === editingId;

    return (
      <div
        key={c.id}
        onClick={() => onSelectConversation(c.id)}
        className={`group relative flex flex-col gap-1 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
          isActive
            ? 'bg-zinc-800/90 text-white font-medium border border-zinc-700/60 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
        }`}
      >
        <div className="flex items-center gap-2.5 w-full">
          <MessageSquare
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-400'
            }`}
          />

          {isEditing ? (
            <div
              className="flex items-center gap-1.5 flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-emerald-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(e as any, c.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
              />
              <button
                onClick={(e) => handleSaveEdit(e, c.id)}
                className="text-emerald-400 hover:text-emerald-300 p-1"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-zinc-400 hover:text-zinc-300 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="truncate flex-1 text-left text-sm select-none">
              {isSearching ? highlightMatch(c.title, searchQuery) : c.title}
            </span>
          )}

          {!isEditing && (
            <div className="hidden group-hover:flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(c.id);
                }}
                title={c.pinned ? 'Unpin' : 'Pin to top'}
                className={`p-1 rounded hover:bg-zinc-700/60 ${
                  c.pinned ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleStartEdit(e, c)}
                title="Rename"
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleExport(e, c)}
                title="Export chat"
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(c.id);
                }}
                title="Delete"
                className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-700/60"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content match snippets preview when searching */}
        {searchInfo && searchInfo.matchedSnippets.length > 0 && (
          <div className="mt-1 pl-6 space-y-1">
            {searchInfo.matchedSnippets.map((snip, i) => (
              <div
                key={i}
                className="text-[11px] text-zinc-400/90 leading-tight flex items-start gap-1.5 p-1 rounded bg-black/20"
              >
                <span className="text-[10px] text-zinc-500 uppercase shrink-0 font-semibold">
                  {snip.role === 'user' ? 'You:' : 'Nova:'}
                </span>
                <span className="truncate italic">
                  {highlightMatch(snip.snippet, searchQuery)}
                </span>
              </div>
            ))}
            {searchInfo.contentMatchesCount > 2 && (
              <p className="text-[10px] text-emerald-400/80 font-medium">
                +{searchInfo.contentMatchesCount - 2} more matching message
                {searchInfo.contentMatchesCount - 2 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col w-72 bg-[#101014] border-r border-zinc-800/80 transition-transform duration-300 ease-in-out ${
          isOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none lg:overflow-hidden'
        }`}
      >
        {/* Brand & Toggle */}
        <div className="p-3.5 flex items-center justify-between border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-4 h-4 text-zinc-950 fill-zinc-950" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#101014] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">NovaChat</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 rounded-full">
                  v3.8
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Ultra-Fast Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={onToggleOpen}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons: New Chat & Search Input */}
        <div className="p-3 space-y-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-950/40 cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-700/60 text-emerald-100 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Quick Search Bar with scope filters */}
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchQuery('');
                }}
                placeholder="Search title or content (Ctrl+F)..."
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8.5 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  title="Clear search (Esc)"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Scope Filter Pills (All / Title / Content) */}
            {isSearching && (
              <div className="flex items-center justify-between px-0.5 text-[10px]">
                <div className="flex items-center gap-1 bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => setSearchScope('all')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      searchScope === 'all'
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSearchScope('title')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      searchScope === 'title'
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Title
                  </button>
                  <button
                    onClick={() => setSearchScope('content')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      searchScope === 'content'
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Content
                  </button>
                </div>

                <span className="text-zinc-500 font-mono">
                  {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Conversation List / Search Results List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-1">
          {isSearching ? (
            <div>
              <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Search Results</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-emerald-400 hover:text-emerald-300 lowercase text-[10px] font-normal cursor-pointer"
                >
                  clear
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((res) => renderConversationItem(res.conversation, res))}
                </div>
              ) : (
                <div className="text-center py-10 px-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 mx-auto flex items-center justify-center text-zinc-600 mb-2">
                    <Search className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-zinc-300 font-medium">No results found</p>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    No conversations matched "{searchQuery}". Try different keywords.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <div>
                  <div className="px-3 mb-1 text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Pin className="w-3 h-3" />
                    <span>Pinned</span>
                  </div>
                  <div className="space-y-0.5">
                    {pinned.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {today.length > 0 && (
                <div>
                  <div className="px-3 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Today
                  </div>
                  <div className="space-y-0.5">
                    {today.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {yesterday.length > 0 && (
                <div>
                  <div className="px-3 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Yesterday
                  </div>
                  <div className="space-y-0.5">
                    {yesterday.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {older.length > 0 && (
                <div>
                  <div className="px-3 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Previous Chats
                  </div>
                  <div className="space-y-0.5">
                    {older.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {conversations.length === 0 && (
                <div className="text-center py-10 px-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 mx-auto flex items-center justify-center text-zinc-600 mb-2">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">No conversations yet</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Start a fast dialogue or ask complex questions.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-zinc-800/80 space-y-1 bg-[#0c0c0f]">
          <button
            onClick={onOpenCustomInstructions}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition text-left cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-zinc-400" />
            <span className="flex-1 font-medium">Custom Instructions</span>
          </button>

          <button
            onClick={onOpenBenchmark}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition text-left cursor-pointer"
          >
            <Gauge className="w-4 h-4 text-purple-400" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-tight">Speed & Smarts</p>
              <p className="text-[10px] text-zinc-500 truncate">
                ~120 tokens/s • Sub-150ms TTFT
              </p>
            </div>
          </button>

          {onOpenInstall && (
            <button
              onClick={onOpenInstall}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20 border border-emerald-900/30 transition text-left cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight flex items-center gap-1.5">
                  <span>Install App / APK</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    All Devices
                  </span>
                </p>
                <p className="text-[10px] text-emerald-500/80 truncate">
                  Android APK • iOS • Desktop
                </p>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
