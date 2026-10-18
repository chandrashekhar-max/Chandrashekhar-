import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  X,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
  Globe,
  Share2,
  Apple,
  Monitor,
  Package,
  Layers,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DeviceTab = 'android' | 'ios' | 'desktop';

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<DeviceTab>(isIOS ? 'ios' : 'android');
  const [downloadingPackage, setDownloadingPackage] = useState(false);

  if (!isOpen) return null;

  const publicUrl = window.location.origin.includes('localhost')
    ? 'https://ais-pre-nmt7j3t7ccbvndjg3lc6j2-590131703645.asia-southeast1.run.app'
    : window.location.origin;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
      onClose();
    }
  };

  const handleDownloadApkPackage = () => {
    setDownloadingPackage(true);
    const link = document.createElement('a');
    link.href = '/api/download-apk-package';
    link.download = 'NovaChat-Android-APK-Package.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadingPackage(false), 2000);
  };

  // QR Code URL using public quickchart API so mobile users can scan right from the screen
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}&bgcolor=14-14-19&color=10-185-129`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-[#141419] border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-emerald-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Download APK & Install App
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
                  Universal
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                All Android devices, iOS iPhones, and Desktop PCs supported.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Switcher Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-2 flex items-center gap-2 border-b border-zinc-800/60 bg-zinc-950/40">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'android'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Android (APK & WebAPK)</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Apple className="w-4 h-4 text-purple-400" />
            <span>iPhone / iOS</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span>PC & Mac</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* TAB 1: ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Option A: Direct WebAPK Minting (Android Native) */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 relative overflow-hidden">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Recommended for All Android Devices
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">
                      1-Click Instant Android Installation (WebAPK)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Google Chrome and Android create a verified native <strong>WebAPK</strong> that installs to your home screen with its own app icon, splash screen, and offline storage.
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                    No Dev Mode Needed
                  </span>
                </div>

                {isInstallable ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-950/40 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install WebAPK on This Device</span>
                  </button>
                ) : isInstalled ? (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>NovaChat is already installed as a native app on this device!</span>
                  </div>
                ) : (
                  <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
                    <p className="font-medium text-emerald-400 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      How to install on any Android phone (Samsung, Pixel, Xiaomi, OnePlus, etc.):
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-zinc-400 text-[11px] leading-relaxed">
                      <li>Open the public link in <strong>Chrome</strong> or <strong>Samsung Internet</strong> on your phone.</li>
                      <li>Tap the <strong>three dots (⋮)</strong> menu in the upper right.</li>
                      <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                      <li>Android will compile and install the verified APK icon to your app drawer.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Option B: Download Android APK Package (.ZIP) */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-white">
                      Download Complete Android APK Package
                    </h4>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
                      .ZIP
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm">
                    Includes preconfigured `AndroidManifest.xml`, `twa-manifest.json`, `build.gradle`, high-res icons, and build instructions.
                  </p>
                </div>

                <button
                  onClick={handleDownloadApkPackage}
                  disabled={downloadingPackage}
                  className="flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 font-semibold text-xs border border-zinc-700 transition cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingPackage ? 'Packaging...' : 'Download APK Bundle'}</span>
                </button>
              </div>

              {/* Option C: Cloud Signed APK Generator (PWABuilder) */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>Cloud .APK Generator (PWABuilder)</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Generate a signed Android package (`.apk` or `.aab`) in seconds using PWABuilder (official Google & Microsoft tool):
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.pwabuilder.com/?site=${encodeURIComponent(publicUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium text-xs border border-zinc-700 transition cursor-pointer"
                >
                  <span>Open PWABuilder Cloud APK Generator</span>
                  <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: IPHONE / IOS */}
          {activeTab === 'ios' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-purple-500/30">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                  Apple iOS Support (iPhone & iPad)
                </span>
                <h3 className="text-sm font-semibold text-white mt-0.5">
                  Install Fullscreen on iPhone / iPad
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Apple iOS allows web apps to run in standalone full-screen mode with zero Safari browser chrome.
                </p>

                <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                  <p className="font-semibold text-purple-300">Quick 3-step setup in Safari:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-zinc-400 text-[11px] leading-relaxed">
                    <li>Open this public app URL in <strong>Safari</strong> on your iPhone or iPad.</li>
                    <li>Tap the <strong>Share</strong> button (the square with an arrow pointing up at the bottom).</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                    <li>Tap <strong>"Add"</strong> in the top-right corner. NovaChat will launch from your home screen like a native App Store app!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESKTOP (WINDOWS, MAC, LINUX) */}
          {activeTab === 'desktop' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-cyan-500/30">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Desktop App Support
                </span>
                <h3 className="text-sm font-semibold text-white mt-0.5">
                  Install on Windows 11/10, macOS & Linux
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Run NovaChat in its own desktop window with keyboard shortcuts, app icon, and taskbar/dock integration.
                </p>

                <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                  <p className="font-semibold text-cyan-300">How to install on Chrome or Edge:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-zinc-400 text-[11px] leading-relaxed">
                    <li>Look at the right side of the address bar at the top of your browser.</li>
                    <li>Click the <strong>Install App icon (computer with down arrow)</strong>.</li>
                    <li>Click <strong>"Install"</strong> to add NovaChat to your Start Menu, Applications folder, and Taskbar.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Public Link & QR Code Section */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* QR Code */}
              <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="Scan QR code to install on phone"
                  className="w-24 h-24 object-contain"
                />
              </div>

              <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Scan with Phone Camera to Install</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Point your Android or iPhone camera at this QR code to instantly open and install.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition cursor-pointer shrink-0"
                  >
                    {copiedUrl ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <p className="text-[11px] text-zinc-500">
            Crafted for <span className="text-zinc-300 font-semibold">Master Chandrashekhar</span> • NovaChat v3.8
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
