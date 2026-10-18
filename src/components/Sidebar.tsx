import React, { useState } from 'react';
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
  ChevronRight,
} from 'lucide-react';
import { Conversation, ModelMode } from '../types';

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
  isOpen: boolean;
  onToggleOpen: () => void;
  activeMode: ModelMode;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = filteredConversations.filter((c) => c.pinned);
  const unpinned = filteredConversations.filter((c) => !c.pinned);

  // Group unpinned by time
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

  const renderConversationItem = (c: Conversation) => {
    const isActive = c.id === activeId;
    const isEditing = c.id === editingId;

    return (
      <div
        key={c.id}
        onClick={() => onSelectConversation(c.id)}
        className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
          isActive
            ? 'bg-zinc-800/90 text-white font-medium border border-zinc-700/60 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
        }`}
      >
        <MessageSquare
          className={`w-4 h-4 shrink-0 ${
            isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-400'
          }`}
        />

        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
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
          <span className="truncate flex-1 text-left select-none">{c.title}</span>
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
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none lg:overflow-hidden'
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
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons: New Chat & Search */}
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

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-1">
          {pinned.length > 0 && (
            <div>
              <div className="px-3 mb-1 text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="w-3 h-3" />
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5">{pinned.map(renderConversationItem)}</div>
            </div>
          )}

          {today.length > 0 && (
            <div>
              <div className="px-3 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Today
              </div>
              <div className="space-y-0.5">{today.map(renderConversationItem)}</div>
            </div>
          )}

          {yesterday.length > 0 && (
            <div>
              <div className="px-3 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Yesterday
              </div>
              <div className="space-y-0.5">{yesterday.map(renderConversationItem)}</div>
            </div>
          )}

          {older.length > 0 && (
            <div>
              <div className="px-3 mb-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Previous Chats
              </div>
              <div className="space-y-0.5">{older.map(renderConversationItem)}</div>
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
