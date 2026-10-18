import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { ArtifactPanel } from './components/ArtifactPanel';
import { AuthModal } from './components/AuthModal';
import { CustomInstructionsModal } from './components/CustomInstructionsModal';
import { SpeedBenchmarkModal } from './components/SpeedBenchmarkModal';
import { ExportModal } from './components/ExportModal';
import { InstallAppModal } from './components/InstallAppModal';
import {
  Conversation,
  Message,
  ModelMode,
  Artifact,
  AttachedImage,
} from './types';

function ChatApp() {
  const { user } = useAuth();

  // Conversation threads state
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('novachat_conversations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    return localStorage.getItem('novachat_active_id') || null;
  });

  const [activeMode, setActiveMode] = useState<ModelMode>('turbo');
  const [systemInstruction, setSystemInstruction] = useState<string>(() => {
    return localStorage.getItem('novachat_custom_instruction') || '';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio TTS playback state
  const [playingAudioMsgId, setPlayingAudioMsgId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('novachat_conversations', JSON.stringify(conversations));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [conversations]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem('novachat_active_id', activeId);
    }
  }, [activeId]);

  useEffect(() => {
    localStorage.setItem('novachat_custom_instruction', systemInstruction);
  }, [systemInstruction]);

  // Firestore synchronization when user is authenticated
  useEffect(() => {
    if (!user) return;

    const convCol = collection(db, 'users', user.uid, 'conversations');
    const q = query(convCol);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudConversations: Conversation[] = [];
        snapshot.forEach((docSnap) => {
          cloudConversations.push(docSnap.data() as Conversation);
        });

        // Merge cloud with local
        if (cloudConversations.length > 0) {
          cloudConversations.sort((a, b) => b.updatedAt - a.updatedAt);
          setConversations(cloudConversations);
          if (!activeId && cloudConversations.length > 0) {
            setActiveId(cloudConversations[0].id);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/conversations`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Current active conversation
  const activeConversation = conversations.find((c) => c.id === activeId);

  // Sync activeMode from conversation
  useEffect(() => {
    if (activeConversation?.modelMode) {
      setActiveMode(activeConversation.modelMode);
    }
  }, [activeId]);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isStreaming]);

  // Sync a conversation to Firestore if logged in
  const persistConversation = async (conv: Conversation) => {
    if (!user) return;
    try {
      const convRef = doc(db, 'users', user.uid, 'conversations', conv.id);
      await setDoc(convRef, conv);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `users/${user.uid}/conversations/${conv.id}`
      );
    }
  };

  // Start a new chat
  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelMode: activeMode,
      customInstruction: systemInstruction,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setActiveArtifact(null);
    persistConversation(newConv);
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'conversations', id));
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `users/${user.uid}/conversations/${id}`
        );
      }
    }
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, title: newTitle, updatedAt: Date.now() };
          persistConversation(updated);
          return updated;
        }
        return c;
      })
    );
  };

  // Toggle pin
  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, pinned: !c.pinned, updatedAt: Date.now() };
          persistConversation(updated);
          return updated;
        }
        return c;
      })
    );
  };

  // Stop generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send message and stream response from /api/chat/stream
  const handleSendMessage = async (content: string, attachedImages?: AttachedImage[]) => {
    if (isStreaming) return;

    let targetConv = activeConversation;
    let targetConvId = activeId;

    if (!targetConv || !targetConvId) {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: content.slice(0, 35) || 'New Conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelMode: activeMode,
        customInstruction: systemInstruction,
      };
      targetConv = newConv;
      targetConvId = newConv.id;
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      images: attachedImages,
      timestamp: Date.now(),
    };

    const assistantMsgId = `asst-${Date.now() + 1}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      thought: '',
      mode: activeMode,
      timestamp: Date.now(),
    };

    const updatedMessages = [...(targetConv.messages || []), userMsg, assistantMsg];
    const updatedConv: Conversation = {
      ...targetConv,
      title:
        targetConv.messages.length === 0
          ? content.slice(0, 36) || 'Conversation'
          : targetConv.title,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === targetConvId ? updatedConv : c))
    );

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Check if this is an image creation request
    const isImageRequest =
      activeMode === 'image' ||
      content.startsWith('/image') ||
      content.startsWith('/imagine') ||
      content.toLowerCase().startsWith('create an image') ||
      content.toLowerCase().startsWith('generate an image');

    if (isImageRequest) {
      const cleanPrompt = content
        .replace(/^\/(image|imagine)\s*/i, '')
        .replace(/^(create|generate)\s+(an\s+)?image\s+(of\s+)?/i, '')
        .trim();

      try {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanPrompt || content, aspectRatio: '1:1' }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to generate image.');

        const finalAssistantMsg: Message = {
          id: assistantMsgId,
          role: 'assistant',
          content: `Here is your generated artwork for: **"${data.prompt}"**`,
          generatedImage: {
            url: data.imageUrl,
            prompt: data.prompt,
            svgCode: data.svgCode,
            model: data.model,
            note: data.note,
          },
          mode: 'image',
          timestamp: Date.now(),
        };

        const updatedFinal = {
          ...updatedConv,
          messages: updatedConv.messages.map((m) =>
            m.id === assistantMsgId ? finalAssistantMsg : m
          ),
        };

        setConversations((prev) =>
          prev.map((c) => (c.id === targetConvId ? updatedFinal : c))
        );
        persistConversation(updatedFinal);
      } catch (err: any) {
        console.error('Image creation failed:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              const msgs = c.messages.map((m) => {
                if (m.id === assistantMsgId) {
                  return {
                    ...m,
                    content: `⚠️ **Image generation failed:** ${err.message || 'Could not produce image.'}`,
                  };
                }
                return m;
              });
              return { ...c, messages: msgs };
            }
            return c;
          })
        );
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    try {
      // Build payload for server
      const payloadMessages = updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
        images: m.images?.map((img) => ({
          mimeType: img.mimeType,
          base64: img.base64,
        })),
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          modelMode: activeMode,
          systemInstruction,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to read response stream.');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let accumulatedThought = '';
      let accumulatedSources: any[] = [];
      let finalStats: any = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.replace('event: ', '').trim();
          } else if (line.startsWith('data: ')) {
            const rawData = line.replace('data: ', '').trim();
            if (!rawData) continue;

            try {
              const parsed = JSON.parse(rawData);

              if (currentEvent === 'text') {
                accumulatedText += parsed.text || '';
              } else if (currentEvent === 'thought') {
                accumulatedThought += parsed.text || '';
              } else if (currentEvent === 'source') {
                if (!accumulatedSources.some((s) => s.uri === parsed.uri)) {
                  accumulatedSources.push(parsed);
                }
              } else if (currentEvent === 'done') {
                finalStats = {
                  durationMs: parsed.durationMs,
                  estimatedTokens: parsed.estimatedTokens,
                  tokensPerSec: parsed.tokensPerSec,
                };
                if (parsed.sources) {
                  accumulatedSources = parsed.sources;
                }
              } else if (currentEvent === 'error') {
                accumulatedText += `\n\n*Error: ${parsed.message}*`;
              }

              // Update the assistant message in conversation
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    const msgs = c.messages.map((m) => {
                      if (m.id === assistantMsgId) {
                        return {
                          ...m,
                          content: accumulatedText,
                          thought: accumulatedThought || undefined,
                          sources:
                            accumulatedSources.length > 0
                              ? accumulatedSources
                              : undefined,
                          stats: finalStats || undefined,
                        };
                      }
                      return m;
                    });
                    return { ...c, messages: msgs, updatedAt: Date.now() };
                  }
                  return c;
                })
              );
            } catch (err) {
              console.warn('Failed to parse SSE line:', line);
            }
          }
        }
      }

      // Check for code blocks to offer instant interactive preview
      const htmlBlockMatch = accumulatedText.match(/```(html|svg)[\s\S]*?```/i);
      if (htmlBlockMatch && activeMode === 'code') {
        const rawCode = htmlBlockMatch[0]
          .replace(/^```(html|svg)\s*\n?/i, '')
          .replace(/\n?```$/, '');
        setActiveArtifact({
          id: `artifact-${Date.now()}`,
          title: 'Interactive Preview',
          language: 'html',
          code: rawCode,
          type: 'html',
        });
      }

      // Final persistence
      const finalConv = {
        ...updatedConv,
        messages: updatedConv.messages.map((m) => {
          if (m.id === assistantMsgId) {
            return {
              ...m,
              content: accumulatedText,
              thought: accumulatedThought || undefined,
              sources: accumulatedSources.length > 0 ? accumulatedSources : undefined,
              stats: finalStats || undefined,
            };
          }
          return m;
        }),
      };
      persistConversation(finalConv);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream stopped by user.');
      } else {
        console.error('Chat stream failed:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              const msgs = c.messages.map((m) => {
                if (m.id === assistantMsgId) {
                  return {
                    ...m,
                    content:
                      m.content ||
                      `⚠️ **Request failed:** ${err.message || 'Unable to communicate with the model.'}`,
                  };
                }
                return m;
              });
              return { ...c, messages: msgs };
            }
            return c;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Text-To-Speech Playback
  const handlePlayTTS = async (text: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setPlayingAudioMsgId(null);
      return;
    }

    try {
      setPlayingAudioMsgId('loading');
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS server error');
      const data = await response.json();

      if (data.audio) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        currentAudioRef.current = audio;
        setPlayingAudioMsgId('playing');

        audio.onended = () => {
          setPlayingAudioMsgId(null);
          currentAudioRef.current = null;
        };

        audio.onerror = () => {
          setPlayingAudioMsgId(null);
          currentAudioRef.current = null;
        };

        await audio.play();
      }
    } catch (err) {
      console.warn('TTS server failed, using browser speech synthesis fallback:', err);
      // Browser SpeechSynthesis fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.onend = () => setPlayingAudioMsgId(null);
        utterance.onerror = () => setPlayingAudioMsgId(null);
        setPlayingAudioMsgId('playing');
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayingAudioMsgId(null);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0d11] text-zinc-100 font-sans">
      {/* ChatGPT-style Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          setSidebarOpen(false);
        }}
        onNewChat={() => {
          handleNewChat();
          setSidebarOpen(false);
        }}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        onOpenCustomInstructions={() => setInstructionsModalOpen(true)}
        onOpenBenchmark={() => setBenchmarkModalOpen(true)}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        activeMode={activeMode}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentMode={activeMode}
          onChangeMode={(mode) => {
            setActiveMode(mode);
            if (activeConversation) {
              const updated = { ...activeConversation, modelMode: mode };
              setConversations((prev) =>
                prev.map((c) => (c.id === activeConversation.id ? updated : c))
              );
              persistConversation(updated);
            }
          }}
          onOpenBenchmark={() => setBenchmarkModalOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenExport={() => setExportModalOpen(true)}
          onOpenInstall={() => setInstallModalOpen(true)}
          onNewChat={handleNewChat}
        />

        {/* Messages / Empty State scroll area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <EmptyState
              activeMode={activeMode}
              onSelectPrompt={(prompt, mode) => {
                if (mode) setActiveMode(mode);
                handleSendMessage(prompt);
              }}
            />
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {activeConversation.messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id || index}
                  message={msg}
                  isStreaming={
                    isStreaming &&
                    index === activeConversation.messages.length - 1 &&
                    msg.role === 'assistant'
                  }
                  onRegenerate={() => {
                    const lastUserMsg = [...activeConversation.messages]
                      .reverse()
                      .find((m) => m.role === 'user');
                    if (lastUserMsg) {
                      handleSendMessage(lastUserMsg.content, lastUserMsg.images);
                    }
                  }}
                  onOpenArtifact={(artifact) => setActiveArtifact(artifact)}
                  onPlayTTS={() => handlePlayTTS(msg.content)}
                  isPlayingAudio={playingAudioMsgId !== null}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStop={handleStop}
          isStreaming={isStreaming}
          activeMode={activeMode}
          onChangeMode={(mode) => {
            setActiveMode(mode);
            if (activeConversation) {
              const updated = { ...activeConversation, modelMode: mode };
              setConversations((prev) =>
                prev.map((c) => (c.id === activeConversation.id ? updated : c))
              );
            }
          }}
        />
      </div>

      {/* Artifacts / Canvas Right Panel */}
      <ArtifactPanel
        artifact={activeArtifact}
        onClose={() => setActiveArtifact(null)}
      />

      {/* Authentication Modal (Login with Email, Signup, Google) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Custom Instructions / Persona Modal */}
      <CustomInstructionsModal
        isOpen={instructionsModalOpen}
        onClose={() => setInstructionsModalOpen(false)}
        savedInstructions={systemInstruction}
        onSave={(inst) => setSystemInstruction(inst)}
      />

      {/* Speed & Smarts Benchmark Modal */}
      <SpeedBenchmarkModal
        isOpen={benchmarkModalOpen}
        onClose={() => setBenchmarkModalOpen(false)}
      />

      {/* Export Conversation Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        conversation={activeConversation || null}
      />

      {/* Install / APK Modal */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}
