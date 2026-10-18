import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Sparkles,
  Zap,
  Gauge,
  User as UserIcon,
  LogOut,
  Mail,
  ChevronDown,
  Plus,
  Share2,
  Smartphone,
} from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { ModelMode } from '../types';
import { useAuth } from '../context/AuthContext';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  currentMode: ModelMode;
  onChangeMode: (mode: ModelMode) => void;
  onOpenBenchmark: () => void;
  onOpenAuth: () => void;
  onOpenExport: () => void;
  onOpenInstall: () => void;
  onNewChat: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  currentMode,
  onChangeMode,
  onOpenBenchmark,
  onOpenAuth,
  onOpenExport,
  onOpenInstall,
  onNewChat,
}) => {
  const { user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-[#101014]/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-20 shrink-0">
      {/* Left section: Sidebar toggle & Model selection */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          title="Toggle sidebar"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onNewChat}
          title="New Chat"
          className="sm:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>

        <ModelSelector currentMode={currentMode} onChangeMode={onChangeMode} />
      </div>

      {/* Right section: Speed Badge & Auth Login button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Speed indicator badge */}
        <button
          onClick={onOpenBenchmark}
          title="View speed & intelligence benchmark"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>120+ tokens/s</span>
        </button>

        {/* Export Chat Button */}
        <button
          onClick={onOpenExport}
          title="Export conversation"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white font-medium transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Install Android APK / PWA Button */}
        <button
          onClick={onOpenInstall}
          title="Install as Android APK / Web App"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-400 font-medium transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install APK</span>
        </button>

        {/* User Account / Email Login */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition cursor-pointer"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-semibold uppercase">
                  {(user.displayName || user.email || 'U')[0]}
                </div>
              )}
              <span className="text-xs font-medium text-zinc-200 hidden sm:inline max-w-[120px] truncate">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#141419] border border-zinc-800 shadow-2xl p-2 z-50 text-xs text-zinc-200">
                <div className="px-3 py-2 border-b border-zinc-800">
                  <p className="font-semibold text-white truncate">
                    {user.displayName || 'Nova User'}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition text-left cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm transition shadow-md shadow-emerald-950/30 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Sign In with Email</span>
          </button>
        )}
      </div>
    </header>
  );
};
