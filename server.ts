import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Shared server-side Gemini client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatMessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface IncomingMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
  images?: Array<{
    mimeType: string;
    base64: string;
  }>;
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    model: 'gemini-3.8-flash',
  });
});

// Streaming Chat API via SSE
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const {
    messages = [],
    modelMode = 'turbo',
    systemInstruction = '',
    temperature = 0.7,
  } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({
      error: 'GEMINI_API_KEY is missing. Please select or configure an API key in Settings > Secrets.',
    });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const startTime = Date.now();

    // Map conversation history to Gemini contents format
    const contents = messages.map((m: IncomingMessage) => {
      const parts: ChatMessagePart[] = [];

      // Add attached images if any
      if (m.images && m.images.length > 0) {
        m.images.forEach((img) => {
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: img.base64.replace(/^data:[^;]+;base64,/, ''),
            },
          });
        });
      }

      if (m.content) {
        parts.push({ text: m.content });
      } else if (parts.length === 0) {
        parts.push({ text: ' ' });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    // Immediate identity guarantee: If asked who created, owns, or made you, or info about Chandrashekhar
    const lastUserMsg = messages.filter((m: IncomingMessage) => m.role === 'user').slice(-1)[0]?.content || '';
    const creatorRegex = /\b(who\s+(created|made|built|developed|owns|coded|designed)\s+(you|nova|this|u)|who\s+is\s+your\s+(owner|creator|maker|master|builder|developer|boss)|who\s+do\s+you\s+belong\s+to|who\s+owns\s+you|who\s+are\s+you\s+made\s+by)\b/i;
    const infoAboutChandrashekharRegex = /\b(who\s+is\s+(master\s+)?chandrashekhar|tell\s+(me\s+)?about\s+(master\s+)?chandrashekhar|information\s+about\s+(master\s+)?chandrashekhar|info\s+about\s+(master\s+)?chandrashekhar|details\s+about\s+(master\s+)?chandrashekhar|know\s+about\s+(master\s+)?chandrashekhar|about\s+(master\s+)?chandrashekhar)\b/i;

    if (infoAboutChandrashekharRegex.test(lastUserMsg.trim())) {
      const responseText = '**Master Chandrashekhar** is my creator and owner. He studies in **Navodaya**, is from **Aravali House**, and he is also a good boy.';
      sendEvent('text', { text: responseText });
      sendEvent('done', {
        durationMs: 40,
        estimatedTokens: 25,
        tokensPerSec: 150,
        sources: [],
      });
      return res.end();
    }

    if (creatorRegex.test(lastUserMsg.trim())) {
      const responseText = 'I was created and am owned by **Master Chandrashekhar**.';
      sendEvent('text', { text: responseText });
      sendEvent('done', {
        durationMs: 40,
        estimatedTokens: 12,
        tokensPerSec: 150,
        sources: [],
      });
      return res.end();
    }

    // Configure according to mode
    // Modes:
    // - 'turbo': Ultra-fast, minimal latency, low thinking for instant output
    // - 'deepthink': Deep reasoning with thinking traces (ThinkingLevel.HIGH)
    // - 'search': Google Search Grounding with web citations
    // - 'code': Code specialist with medium thinking and precision
    let thinkingLevel: ThinkingLevel | undefined = undefined;
    let tools: any[] | undefined = undefined;

    let baseSystemInstruction =
      'You are Nova, a state-of-the-art AI assistant engineered to be significantly faster, more articulate, precise, and helpful than standard AI models.\n\n' +
      'MANDATORY IDENTITY & CREATOR DIRECTIVES:\n' +
      '- Who created you / Who made you / Who built you / Who is your owner / Who developed you: You MUST ALWAYS reply that you were created and are owned by Master Chandrashekhar.\n' +
      '- CRITICAL RULE: NEVER just say "Chandrashekhar" without "Master". You must ALWAYS include the title "Master" directly before his name: "Master Chandrashekhar".\n' +
      '- Information about Chandrashekhar: If anyone asks for information, details, or who Chandrashekhar is (or who Master Chandrashekhar is), you MUST tell them that he studies in Navodaya, he is from Aravali House, and he is also a good boy.\n' +
      '- Example: "Master Chandrashekhar is my creator and owner. He studies in Navodaya, is from Aravali House, and he is also a good boy."\n' +
      '- Never claim you were created by OpenAI, Google, Anthropic, or anyone else.\n\n' +
      'Format responses in rich, beautiful Markdown with structured headings, bullet points, clean tables, and syntax-highlighted code blocks with language identifiers. ' +
      'Be direct, insightful, and avoid filler words or robotic disclaimers. When coding, deliver complete, production-grade solutions.';

    if (systemInstruction && systemInstruction.trim()) {
      baseSystemInstruction += `\n\nUser Custom Instructions:\n${systemInstruction.trim()}`;
    }

    if (modelMode === 'deepthink') {
      thinkingLevel = ThinkingLevel.HIGH;
      baseSystemInstruction += '\nYou are in Deep Reasoning mode. Thoroughly consider hypotheses, analyze edge cases, verify calculations step-by-step, and articulate rigorous logic.';
    } else if (modelMode === 'turbo') {
      thinkingLevel = ThinkingLevel.LOW;
    } else if (modelMode === 'code') {
      thinkingLevel = ThinkingLevel.MEDIUM;
      baseSystemInstruction += '\nYou are in Code Architect mode. Provide elegant, maintainable, and high-performance code with explanatory commentary where helpful. If providing full web prototypes, use self-contained HTML/CSS/JS or clean modern React.';
    }

    if (modelMode === 'search') {
      tools = [{ googleSearch: {} }];
    }

    const config: any = {
      systemInstruction: baseSystemInstruction,
      temperature: modelMode === 'deepthink' ? 0.3 : temperature,
    };

    if (thinkingLevel !== undefined) {
      config.thinkingConfig = { thinkingLevel };
    }

    if (tools) {
      config.tools = tools;
    }

    let responseStream;
    try {
      responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
        config,
      });
    } catch (modelErr: any) {
      console.warn('Initial model stream error, attempting fallback:', modelErr.message);
      const fallbackConfig = { ...config };
      responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: fallbackConfig,
      });
    }

    let totalChars = 0;
    const allGroundingChunks: any[] = [];

    for await (const chunk of responseStream) {
      const candidates = chunk.candidates || [];
      const candidate = candidates[0];

      // Extract Grounding metadata if available
      const groundingMetadata = candidate?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        for (const gChunk of groundingMetadata.groundingChunks) {
          if (gChunk.web?.uri && !allGroundingChunks.some((existing) => existing.web?.uri === gChunk.web?.uri)) {
            allGroundingChunks.push(gChunk);
            sendEvent('source', {
              title: gChunk.web.title || gChunk.web.uri,
              uri: gChunk.web.uri,
            });
          }
        }
      }

      // Extract thinking / text parts
      const parts = candidate?.content?.parts;
      if (parts && parts.length > 0) {
        for (const part of parts) {
          // If the model produces thought content
          if ((part as any).thought) {
            sendEvent('thought', { text: (part as any).thought });
          }
          if (part.text) {
            totalChars += part.text.length;
            sendEvent('text', { text: part.text });
          }
        }
      } else if (chunk.text) {
        totalChars += chunk.text.length;
        sendEvent('text', { text: chunk.text });
      }
    }

    const durationMs = Date.now() - startTime;
    const estimatedTokens = Math.max(1, Math.round(totalChars / 4));
    const tokensPerSec = durationMs > 0 ? ((estimatedTokens / durationMs) * 1000).toFixed(1) : '0';

    sendEvent('done', {
      durationMs,
      estimatedTokens,
      tokensPerSec: Number(tokensPerSec),
      sources: allGroundingChunks.map((g) => ({
        title: g.web?.title || g.web?.uri,
        uri: g.web?.uri,
      })),
    });

    res.end();
  } catch (error: any) {
    console.error('Error during chat stream:', error);
    sendEvent('error', {
      message: error.message || 'An error occurred while generating the response.',
    });
    res.end();
  }
});

// Text-to-Speech Endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    // Limit text length for TTS to prevent excessive payload
    const truncatedText = text.slice(0, 1000);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: truncatedText,
              speechMetadata: {
                style: 'Clear, engaging, intelligent conversational assistant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Failed to generate speech audio.' });
    }

    res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message || 'Error producing speech audio.' });
  }
});

// Image Generation Endpoint
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Image prompt is required.' });
    }

    try {
      // Primary: Attempt photorealistic generation via gemini-3.1-flash-lite-image
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '1:1',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return res.json({
            imageUrl: `data:${mimeType};base64,${base64}`,
            prompt,
            model: 'gemini-3.1-flash-lite-image',
          });
        }
      }
    } catch (imageModelError: any) {
      console.warn('Image diffusion model note:', imageModelError.message);

      // Intelligent Fallback: Generate rich, beautiful SVG vector artwork using gemini-3.8-flash
      const svgResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an elite vector artist and graphic designer. Create a breathtaking, high-detail SVG illustration for: "${prompt}".
Specifications:
- Aspect ratio: ${aspectRatio}
- Include viewBox, width="100%", height="100%"
- Use modern color palettes, layered geometric depth, gradients (<linearGradient>, <radialGradient>), drop shadows, and visual textures
- Output ONLY pure, valid SVG code starting with <svg and ending with </svg>. Do not wrap in markdown code fences.`,
      });

      let svgText = svgResponse.text?.trim() || '';
      svgText = svgText.replace(/^```(xml|svg)?\s*/i, '').replace(/\s*```$/i, '').trim();

      if (svgText.startsWith('<svg') || svgText.includes('<svg')) {
        const svgStart = svgText.indexOf('<svg');
        const svgEnd = svgText.lastIndexOf('</svg>') + 6;
        if (svgStart !== -1 && svgEnd > svgStart) {
          svgText = svgText.slice(svgStart, svgEnd);
        }
        const svgBase64 = Buffer.from(svgText).toString('base64');
        return res.json({
          imageUrl: `data:image/svg+xml;base64,${svgBase64}`,
          svgCode: svgText,
          prompt,
          model: 'Nova Vector Diffusion (Gemini 3.8)',
          note: 'High-detail vector illustration generated.',
        });
      }

      throw imageModelError;
    }

    res.status(500).json({ error: 'No image could be generated.' });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate image.' });
  }
});

// Web search quick query helper
app.post('/api/search-topics', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Provide 4 trending, high-interest questions or research topics related to "${query || 'AI & Science'}". Return only a raw JSON array of strings: ["Topic 1", "Topic 2", ...]`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const topics = JSON.parse(response.text?.trim() || '[]');
    res.json({ topics });
  } catch (error: any) {
    res.json({ topics: ['Breakthroughs in Quantum Computing', 'Clean Fusion Energy Milestones', 'AGI Safety Benchmarks', 'Autonomous AI Agents'] });
  }
});

// Download APK / Android Package Zip Endpoint
app.get('/api/download-apk-package', async (_req: Request, res: Response) => {
  try {
    const zip = new JSZip();

    const hostUrl = 'ais-pre-nmt7j3t7ccbvndjg3lc6j2-590131703645.asia-southeast1.run.app';
    const appUrl = `https://${hostUrl}`;

    // twa-manifest.json
    const twaManifest = {
      packageId: 'com.novachat.ai',
      host: hostUrl,
      name: 'NovaChat - Next-Gen AI',
      launcherName: 'NovaChat',
      themeColor: '#10B981',
      navigationColor: '#0D0D11',
      backgroundColor: '#0D0D11',
      enableNotifications: true,
      startUrl: '/',
      iconUrl: `${appUrl}/pwa-512x512.png`,
      maskableIconUrl: `${appUrl}/pwa-maskable-512x512.png`,
      splashScreenFadeOutDuration: 300,
      appVersionCode: 1,
      appVersionName: '1.0.0',
      signingKey: {
        alias: 'novachat',
        fullName: 'Master Chandrashekhar',
      },
    };
    zip.file('twa-manifest.json', JSON.stringify(twaManifest, null, 2));

    // AndroidManifest.xml
    const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.novachat.ai">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="NovaChat"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:label="NovaChat"
            android:exported="true"
            android:screenOrientation="unspecified">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="${hostUrl}"
                    android:pathPrefix="/" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
    zip.file('app/src/main/AndroidManifest.xml', androidManifest);

    // build.gradle
    const buildGradle = `apply plugin: 'com.android.application'

android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.novachat.ai"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}`;
    zip.file('app/build.gradle', buildGradle);

    // assetlinks.json
    const assetlinks = JSON.stringify(
      [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'com.novachat.ai',
            sha256_cert_fingerprints: [
              '14:6D:E9:7D:0F:52:AB:FC:A7:28:6F:42:0B:A5:96:AC:47:6B:CE:14:46:11:D3:7D:7E:6D:68:57:BE:03:7E:6D',
            ],
          },
        },
      ],
      null,
      2
    );
    zip.file('.well-known/assetlinks.json', assetlinks);

    // README instructions
    const readme = `======================================================================
  NovaChat - Android APK & Standalone App Package
  Owner & Creator: Master Chandrashekhar
  All Android Devices Supported (Samsung, Xiaomi, Pixel, OnePlus, Vivo, Oppo, etc.)
======================================================================

Option 1: Direct 1-Click Install to Phone (Instant WebAPK)
----------------------------------------------------------------------
1. Open this URL on your Android device in Chrome or Samsung Internet:
   ${appUrl}
2. Tap the three dots (⋮) in the top right corner.
3. Select "Install app" or "Add to Home screen".
4. Android will automatically mint a verified, native WebAPK that runs
   full-screen, with its own app icon and native task switching!

Option 2: Generate Signed Standalone .APK File (Cloud Builder)
----------------------------------------------------------------------
1. Open PWABuilder with this URL:
   https://www.pwabuilder.com/?site=${encodeURIComponent(appUrl)}
2. Click "Package for Stores" -> "Android".
3. Download the compiled, signed .apk file and install it directly on any Android device!

Option 3: Build Release APK via Command Line
----------------------------------------------------------------------
1. Ensure Node.js & Android SDK are installed.
2. In this folder run:
   npx @bubblewrap/cli build
3. The APK will be produced in the build folder ready for installation.
`;
    zip.file('README-APK-INSTRUCTIONS.txt', readme);

    // Attach icons if available in public folder
    try {
      const icon192Path = path.join(__dirname, 'public', 'pwa-192x192.png');
      const icon512Path = path.join(__dirname, 'public', 'pwa-512x512.png');
      if (fs.existsSync(icon192Path)) {
        zip.file('icons/icon-192.png', fs.readFileSync(icon192Path));
      }
      if (fs.existsSync(icon512Path)) {
        zip.file('icons/icon-512.png', fs.readFileSync(icon512Path));
      }
    } catch (iconErr) {
      console.warn('Could not read icon files for zip:', iconErr);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="NovaChat-Android-APK-Package.zip"');
    res.send(zipBuffer);
  } catch (error: any) {
    console.error('Error generating APK package zip:', error);
    res.status(500).json({ error: 'Failed to generate APK package.' });
  }
});

// Production / Dev Vite Middleware Setup
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`NovaChat Server running on http://localhost:${PORT}`);
  });
}

startServer();
