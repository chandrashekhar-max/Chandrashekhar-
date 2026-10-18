export type ModelMode = 'turbo' | 'deepthink' | 'search' | 'code' | 'image';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AttachedImage {
  id: string;
  name: string;
  mimeType: string;
  base64: string;
  url: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  svgCode?: string;
  model?: string;
  note?: string;
}

export interface MessageStats {
  durationMs: number;
  estimatedTokens: number;
  tokensPerSec: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  images?: AttachedImage[];
  generatedImage?: GeneratedImage;
  sources?: GroundingSource[];
  stats?: MessageStats;
  mode?: ModelMode;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  modelMode: ModelMode;
  customInstruction?: string;
}

export interface Artifact {
  id: string;
  title: string;
  language: string;
  code: string;
  type: 'code' | 'html' | 'svg' | 'markdown';
}
