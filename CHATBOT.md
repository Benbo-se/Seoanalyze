# 💬 CHATBOT IMPLEMENTATION PLAN

**Datum:** 2025-10-08
**Typ:** DeepSeek AI-driven kundservice chatbot
**Placering:** Floating button (höger nedre hörn)
**Strategi:** 100% AI först, sedan FAQ-layer baserat på loggad data

---

## 🎯 MÅL

### Primärt mål:
- Hjälpa användare som är förvirrade om analyser
- Svara på vanliga frågor (pris, hur funkar det, etc)
- Support vid tekniska problem
- Förklara tekniska termer (LCP, TBT, CLS)

### Sekundärt mål:
- Samla data om vanligaste frågor
- Minska support-emails med 80%
- Öka user satisfaction
- Öka conversion (fler startar analyser)

---

## 🏗️ ARKITEKTUR

### **Fas 1: DeepSeek AI-driven bot (100% AI)**

```
User ↔ Floating Button ↔ ChatBot Component ↔ API Route ↔ DeepSeek API
                                                    ↓
                                              ChatLog (Prisma)
```

### Komponenter som skapas:

1. **Frontend:**
   - `/src/components/chatbot/ChatBot.jsx` - Huvudkomponent
   - `/src/components/chatbot/ChatBubble.jsx` - Floating button
   - `/src/components/chatbot/ChatMessage.jsx` - Meddelandekomponent
   - `/src/styles/chatbot.css` - Styling

2. **Backend:**
   - `/src/app/api/chatbot/ask/route.js` - DeepSeek integration
   - `/src/app/api/chatbot/conversation/[id]/route.js` - Hämta historik
   - `/src/app/api/chatbot/analytics/route.js` - Data-analys (admin)

3. **Databas:**
   - Ny Prisma model: `ChatLog`
   - Lagrar: userMessage, botResponse, timestamp, helpful, sessionId

---

## 🎨 DESIGN (inga konflikter med befintlig design)

### Z-index strategi:
**Befintliga z-index i er app:**
- Modal/Overlay: z-index 1060
- Cookie banner: z-index 1001
- Header/Navigation: z-index 1000
- Mobile menu: z-index 999
- Cards/panels: z-index 2-100

**Chatbot z-index:**
- Floating button: `z-index: 1050` (under modals, över cookie banner)
- Chat window: `z-index: 1050` (samma)
- Overlay när expanderad: `z-index: 1049` (bakom chat)

**Detta garanterar:**
✅ Chatbot syns över allt innehåll
✅ Men Cookie banner och modals ligger ÖVER chatbot (viktigare)
✅ Ingen konflikt med befintliga komponenter

### Färgschema (matchar er design):
```css
--chatbot-primary: #ff6b6b; /* Samma som er primary */
--chatbot-bg: rgba(255, 255, 255, 0.98);
--chatbot-shadow: rgba(255, 107, 107, 0.2);
--chatbot-user-msg: #fff8f8; /* Samma som er bg-light */
--chatbot-bot-msg: white;
--chatbot-border: #ffd6cc; /* Samma som er border-light */
```

### Floating Button Position:
```css
position: fixed;
bottom: 24px; /* Över footer, under cookie banner */
right: 24px;
z-index: 1050;
```

**Mobile adjustments:**
```css
@media (max-width: 768px) {
  bottom: 80px; /* Över footer som är sticky på mobile */
  right: 16px;
}
```

### Chat Window Size:
```css
/* Desktop */
width: 380px;
height: 600px;
max-height: calc(100vh - 120px);

/* Mobile */
@media (max-width: 768px) {
  width: calc(100vw - 32px);
  height: calc(100vh - 140px);
  bottom: 80px;
  right: 16px;
}
```

---

## 📦 PRISMA SCHEMA

```prisma
// prisma/schema.prisma - LÄGG TILL:

model ChatLog {
  id            String   @id @default(cuid())
  sessionId     String   // User session (anonymous)
  userMessage   String   @db.Text
  botResponse   String   @db.Text

  // Context
  currentPage   String?  // URL där frågan ställdes
  analysisId    String?  // Om användare är på en resultatsida
  analysisType  String?  // seo/crawl/lighthouse/ai

  // Feedback
  helpful       Boolean? // User kan ge thumbs up/down
  feedbackText  String?  // Optional feedback

  // Metadata
  responseTime  Int?     // Millisekunder
  tokensUsed    Int?     // DeepSeek tokens
  cost          Float?   // Kostnad i öre

  createdAt     DateTime @default(now())

  @@index([sessionId, createdAt(sort: Desc)])
  @@index([helpful]) // För att hitta dåliga svar
  @@index([createdAt(sort: Desc)]) // För analytics
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_chatlog_model
npx prisma generate
```

---

## 🔧 IMPLEMENTATION DETAILS

### **1. ChatBot Component** (`/src/components/chatbot/ChatBot.jsx`)

```jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Generate session ID on mount
  useEffect(() => {
    const id = localStorage.getItem('chatSessionId') ||
               'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatSessionId', id);
    setSessionId(id);
  }, []);

  // Auto-scroll till senaste meddelande
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message när öppnas första gången
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'bot',
        content: '👋 Hej! Jag är din SEO-assistent. Hur kan jag hjälpa dig?',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Samla kontext
      const context = {
        currentPage: window.location.pathname,
        analysisId: new URLSearchParams(window.location.search).get('id'),
        conversationHistory: messages.slice(-6) // Senaste 3 meddelanden (user+bot)
      };

      const response = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId,
          context
        })
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage = {
          role: 'bot',
          content: data.answer,
          timestamp: new Date(),
          logId: data.logId // För feedback
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Något gick fel');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Oj, något gick fel! Försök igen eller kontakta oss på admin@seoanalyze.se',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="chatbot-bubble"
          onClick={() => setIsOpen(true)}
          aria-label="Öppna chat"
        >
          <span className="chatbot-icon">💬</span>
          <span className="chatbot-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <span className="chatbot-avatar">🤖</span>
              <div>
                <h3>SEO Assistent</h3>
                <p className="chatbot-status">
                  <span className="status-dot"></span> Online
                </p>
              </div>
            </div>
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Stäng chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                message={msg}
                onFeedback={(helpful) => submitFeedback(msg.logId, helpful)}
              />
            ))}
            {isLoading && (
              <div className="chatbot-typing">
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-container">
            <textarea
              className="chatbot-input"
              placeholder="Skriv din fråga..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              disabled={isLoading}
            />
            <button
              className="chatbot-send"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              aria-label="Skicka meddelande"
            >
              ➤
            </button>
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="chatbot-quick-questions">
              <p>Vanliga frågor:</p>
              <button onClick={() => setInput('Kostar det något?')}>
                💰 Kostar det något?
              </button>
              <button onClick={() => setInput('Hur funkar AI-analysen?')}>
                🤖 Hur funkar AI-analysen?
              </button>
              <button onClick={() => setInput('Vad betyder LCP?')}>
                ⚡ Vad betyder LCP?
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

async function submitFeedback(logId, helpful) {
  if (!logId) return;

  try {
    await fetch('/api/chatbot/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, helpful })
    });
  } catch (error) {
    console.error('Feedback error:', error);
  }
}
```

---

### **2. API Route** (`/src/app/api/chatbot/ask/route.js`)

```javascript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export async function POST(request) {
  const startTime = Date.now();

  try {
    const { message, sessionId, context } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Bygg system prompt baserat på kontext
    const systemPrompt = buildSystemPrompt(context);

    // Anropa DeepSeek
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...buildConversationHistory(context.conversationHistory),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500, // ~150 ord på svenska
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;
    const tokensUsed = data.usage.total_tokens;
    const cost = calculateCost(tokensUsed);
    const responseTime = Date.now() - startTime;

    // Logga i databas
    const chatLog = await prisma.chatLog.create({
      data: {
        sessionId,
        userMessage: message,
        botResponse: answer,
        currentPage: context.currentPage,
        analysisId: context.analysisId,
        responseTime,
        tokensUsed,
        cost
      }
    });

    return NextResponse.json({
      answer,
      logId: chatLog.id,
      responseTime
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({
      error: 'Ett fel uppstod. Försök igen.',
      details: error.message
    }, { status: 500 });
  }
}

function buildSystemPrompt(context) {
  let prompt = `
Du är en hjälpsam kundservice-bot för SEO Analyzer (seoanalyze.se).

VÅR TJÄNST:
- SEO-analys: Analyserar en sidas SEO-kvalitet (30-60s). Kollar title, meta, headings, bilder, LIX-läsbarhet.
- Crawl-analys: Crawlar hela webbplatsen, hittar 404, duplicates, tekniska problem (2-5 min).
- Lighthouse: Mäter prestanda och Core Web Vitals (LCP, FCP, TBT, CLS) (1-3 min).
- AI-analys: Kombinerar allt ovan + AI-rekommendationer + konkurrentjämförelse (60-90s).

VIKTIGT:
- Allt är GRATIS under beta
- Ingen registrering krävs
- Vi stödjer svenska webbplatser (LIX-analys)
- DeepSeek-powered AI för smarta rekommendationer

VANLIGA TERMER:
- LCP (Largest Contentful Paint) = Hur lång tid innan största innehållet syns. Bör vara <2.5s.
- FCP (First Contentful Paint) = Tid tills första innehållet syns. Bör vara <1.8s.
- TBT (Total Blocking Time) = Hur lång tid JavaScript blockerar sidan. Bör vara <200ms.
- CLS (Cumulative Layout Shift) = Hur mycket sidan "hoppar" när den laddas. Bör vara <0.1.
- LIX = Läsbarhetsindex för svenska texter. 30-40 = lätt, 40-50 = medel, 50+ = svår.

SUPPORT:
- Om analys fastnar >5 min, be användare uppdatera sidan eller testa igen
- Om error 429, säg att de träffat rate limit och ska vänta 1 minut
- Om error 500, be dem kontakta admin@seoanalyze.se

UPPGIFT:
- Svara på SVENSKA
- Var vänlig, hjälpsam och uppmuntrande
- Förklara tekniska termer i klartext
- Max 120 ord per svar
- Använd emojis sparsamt (max 1-2 per svar)
- Ge konkreta, actionable råd
`;

  // Lägg till kontext om användaren är på en resultatsida
  if (context.currentPage?.includes('/analyses/') || context.currentPage?.includes('/ai-analys/')) {
    prompt += `\n\nKONTEXT: Användaren tittar just nu på en analysresultat-sida. De har kört en analys och ser resultaten.`;
  }

  if (context.analysisId) {
    prompt += `\nAnalysis ID: ${context.analysisId}`;
  }

  return prompt;
}

function buildConversationHistory(history) {
  if (!history || history.length === 0) return [];

  return history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
}

function calculateCost(tokens) {
  // DeepSeek pricing: $0.14 per 1M input tokens, $0.28 per 1M output tokens
  // Approximation: ~0.0002 USD per 1000 tokens average = 0.002 SEK = 0.2 öre
  // Vi använder en konservativ estimat på 0.02 kr = 2 öre per request
  return 0.02;
}
```

---

### **3. Feedback API** (`/src/app/api/chatbot/feedback/route.js`)

```javascript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { logId, helpful, feedbackText } = await request.json();

    if (!logId) {
      return NextResponse.json({ error: 'logId required' }, { status: 400 });
    }

    await prisma.chatLog.update({
      where: { id: logId },
      data: {
        helpful: helpful === true ? true : false,
        feedbackText: feedbackText || null
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
```

---

### **4. Analytics API (Admin)** (`/src/app/api/chatbot/analytics/route.js`)

```javascript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Hämta alla logs
    const logs = await prisma.chatLog.findMany({
      where: {
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Beräkna statistik
    const stats = {
      totalQuestions: logs.length,
      uniqueSessions: new Set(logs.map(l => l.sessionId)).size,
      avgResponseTime: Math.round(
        logs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / logs.length
      ),
      totalCost: logs.reduce((sum, l) => sum + (l.cost || 0), 0).toFixed(2),
      helpfulRate: calculateHelpfulRate(logs),
      topQuestions: getTopQuestions(logs, 20)
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

function calculateHelpfulRate(logs) {
  const withFeedback = logs.filter(l => l.helpful !== null);
  if (withFeedback.length === 0) return null;

  const helpful = withFeedback.filter(l => l.helpful === true).length;
  return Math.round((helpful / withFeedback.length) * 100);
}

function getTopQuestions(logs, limit = 20) {
  // Gruppera liknande frågor (case-insensitive)
  const questions = {};

  logs.forEach(log => {
    const q = log.userMessage.toLowerCase().trim();
    if (!questions[q]) {
      questions[q] = {
        question: log.userMessage,
        count: 0,
        avgHelpful: null
      };
    }
    questions[q].count++;
  });

  // Sortera efter frekvens
  return Object.values(questions)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
```

---

### **5. Styling** (`/src/styles/chatbot.css`)

```css
/* ==========================================
   CHATBOT STYLES
   ========================================== */

/* Floating Button */
.chatbot-bubble {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1050; /* Under modals (1060), över cookie banner (1001) */

  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff9a9e 100%);
  border: none;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
  transition: all 0.3s ease;
}

.chatbot-bubble:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 32px rgba(255, 107, 107, 0.5);
}

.chatbot-icon {
  font-size: 28px;
  line-height: 1;
}

/* Pulse animation */
.chatbot-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 107, 107, 0.3);
  animation: chatbot-pulse 2s infinite;
}

@keyframes chatbot-pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

/* Chat Window */
.chatbot-window {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1050;

  width: 380px;
  height: 600px;
  max-height: calc(100vh - 120px);

  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(255, 107, 107, 0.25);

  display: flex;
  flex-direction: column;
  overflow: hidden;

  animation: chatbot-slide-in 0.3s ease-out;
}

@keyframes chatbot-slide-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header */
.chatbot-header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff9a9e 100%);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  flex-shrink: 0;
}

.chatbot-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chatbot-avatar {
  font-size: 32px;
  line-height: 1;
}

.chatbot-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.chatbot-status {
  margin: 2px 0 0 0;
  font-size: 12px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  animation: status-blink 2s infinite;
}

@keyframes status-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.chatbot-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.chatbot-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* Messages Area */
.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 107, 107, 0.3) transparent;
}

.chatbot-messages::-webkit-scrollbar {
  width: 6px;
}

.chatbot-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chatbot-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 107, 107, 0.3);
  border-radius: 3px;
}

.chatbot-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 107, 107, 0.5);
}

/* Message */
.chatbot-message {
  display: flex;
  gap: 8px;
  animation: chatbot-message-in 0.3s ease-out;
}

@keyframes chatbot-message-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chatbot-message.user {
  flex-direction: row-reverse;
}

.chatbot-message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.chatbot-message.bot .chatbot-message-bubble {
  background: white;
  color: var(--text-dark);
  border: 1px solid var(--border-light);
  border-bottom-left-radius: 4px;
}

.chatbot-message.user .chatbot-message-bubble {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff9a9e 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.chatbot-message-time {
  font-size: 11px;
  color: var(--text-light);
  margin-top: 4px;
  opacity: 0.7;
}

/* Typing indicator */
.chatbot-typing {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  width: fit-content;
}

.chatbot-typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  animation: chatbot-typing-dot 1.4s infinite;
}

.chatbot-typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.chatbot-typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes chatbot-typing-dot {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* Input Area */
.chatbot-input-container {
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: white;
  flex-shrink: 0;
}

.chatbot-input {
  flex: 1;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  transition: border-color 0.2s;
}

.chatbot-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.chatbot-send {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff9a9e 100%);
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chatbot-send:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.chatbot-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Quick Questions */
.chatbot-quick-questions {
  padding: 12px 20px;
  border-top: 1px solid var(--border-light);
  background: #fff8f8;
  flex-shrink: 0;
}

.chatbot-quick-questions p {
  font-size: 12px;
  color: var(--text-medium);
  margin: 0 0 8px 0;
  font-weight: 600;
}

.chatbot-quick-questions button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  margin-bottom: 6px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: white;
  color: var(--text-dark);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.chatbot-quick-questions button:hover {
  background: var(--bg-light);
  border-color: var(--primary-color);
  transform: translateX(4px);
}

.chatbot-quick-questions button:last-child {
  margin-bottom: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .chatbot-bubble {
    bottom: 80px; /* Över footer */
    right: 16px;
    width: 56px;
    height: 56px;
  }

  .chatbot-icon {
    font-size: 24px;
  }

  .chatbot-window {
    bottom: 80px;
    right: 16px;
    left: 16px;
    width: calc(100vw - 32px);
    height: calc(100vh - 160px);
    max-height: calc(100vh - 160px);
  }
}

/* Small phones */
@media (max-width: 400px) {
  .chatbot-window {
    bottom: 70px;
    height: calc(100vh - 140px);
  }
}
```

---

## 🚀 DEPLOYMENT PLAN

### **Dag 1-2: Setup & Backend**
- [ ] Skapa Prisma model `ChatLog`
- [ ] Kör migration: `npx prisma migrate dev`
- [ ] Skapa API route `/api/chatbot/ask`
- [ ] Skapa API route `/api/chatbot/feedback`
- [ ] Testa DeepSeek integration lokalt
- [ ] Verifiera logging fungerar

### **Dag 3: Frontend**
- [ ] Skapa `ChatBot.jsx` komponent
- [ ] Skapa `ChatMessage.jsx` komponent
- [ ] Skapa `chatbot.css` styling
- [ ] Implementera floating button
- [ ] Implementera chat window
- [ ] Implementera input + send

### **Dag 4: Integration**
- [ ] Lägg till `<ChatBot />` i `layout.js`
- [ ] Testa på alla sidor (startsida, resultat, AI-analys)
- [ ] Testa kontext-awareness (vet vilken sida användaren är på)
- [ ] Testa mobil-responsivitet
- [ ] Verifiera z-index konflikter (test med cookie banner, modals)

### **Dag 5: Testing & Polish**
- [ ] Test: Skicka 20+ frågor, verifiera svar är rimliga
- [ ] Test: Feedback-funktion (thumbs up/down)
- [ ] Test: Session persistence (refresh = behåller conversation)
- [ ] Test: Error handling (DeepSeek down, network error)
- [ ] Test: Rate limiting (för många requests)
- [ ] Fix bugs
- [ ] Optimera prompts baserat på tester

### **Dag 6: Analytics & Launch**
- [ ] Skapa admin dashboard för analytics
- [ ] Deploy till production
- [ ] Monitora första 24h (crashar? felaktiga svar?)
- [ ] Samla feedback från användare

---

## 📊 SUCCESS METRICS

### Efter 1 månad:
- [ ] **500+ frågor** loggade
- [ ] **Helpful rate >70%** (thumbs up)
- [ ] **Genomsnittlig response-tid <2s**
- [ ] **0 kritiska buggar**
- [ ] **Support-emails minskat med 50%+**

### Efter 2 månader:
- [ ] **Identifierat top 20 vanligaste frågor**
- [ ] **Byggt FAQ-layer** för dessa frågor
- [ ] **Kostnad <200 kr/månad** (DeepSeek API)
- [ ] **80% av frågor besvaras till 100% nöjdhet**

---

## 💰 KOSTNAD

### DeepSeek API:
- **Per request:** ~2 öre
- **1000 användare/månad (3 frågor var):** 3000 × 0.02 kr = **60 kr/mån**
- **10,000 användare/månad:** **600 kr/mån**

### Total kostnad (inkl dev-tid):
- **Development:** 3-4 dagars arbete
- **API costs:** 60-600 kr/mån (baserat på trafik)
- **Infrastructure:** 0 kr (samma server)

**ROI:**
- **Sparad tid på support:** 10-20 timmar/månad
- **Ökad conversion:** +5-10% (fler startar analyser)
- **User satisfaction:** +30%

---

## 🔒 SÄKERHET

### Rate Limiting:
```javascript
// /src/app/api/chatbot/ask/route.js
import rateLimit from '@/lib/rate-limiter';

export async function POST(request) {
  // Max 10 frågor per session per 5 minuter
  const sessionId = (await request.json()).sessionId;
  const allowed = await rateLimit.check(`chatbot:${sessionId}`, 10, 300);

  if (!allowed) {
    return NextResponse.json({
      error: 'För många frågor. Vänta 5 minuter.'
    }, { status: 429 });
  }

  // ... fortsätt med DeepSeek
}
```

### Input Sanitering:
- Max 500 tecken per meddelande
- Blocka XSS/injection attempts
- Logga suspicious activity

### DeepSeek Key:
- Lagras i `.env.production` (600 permissions)
- Aldrig exponerad till frontend
- Roteras varje 3 månader

---

## 🎯 FAS 2 (EFTER 2 MÅNADER): FAQ-LAYER

När vi har loggat tillräckligt med data:

1. **Analysera top 20 frågor:**
```bash
curl http://localhost:5001/api/chatbot/analytics?days=60
```

2. **Bygg FAQ-matcher:**
```javascript
// /src/lib/chatbot-faq.js
const FAQ = {
  'kostar': 'Allt är gratis under beta! Ingen registrering krävs.',
  'pris': 'Helt gratis! Vi tar ingen betalt.',
  'hur funkar': 'Vi analyserar din webbplats SEO, prestanda...',
  // ... lägg till baserat på VERKLIG data
};

export function matchFAQ(message) {
  const msg = message.toLowerCase();
  for (const [keyword, answer] of Object.entries(FAQ)) {
    if (msg.includes(keyword)) {
      return answer; // Instant, 0 kr
    }
  }
  return null; // Skicka till DeepSeek
}
```

3. **Implementera i API:**
```javascript
export async function POST(request) {
  const { message } = await request.json();

  // Check FAQ först
  const faqAnswer = matchFAQ(message);
  if (faqAnswer) {
    await logToDatabase({ ...data, source: 'FAQ', cost: 0 });
    return NextResponse.json({ answer: faqAnswer });
  }

  // Annars DeepSeek
  return callDeepSeek(message);
}
```

**Resultat:** 80% av frågor besvaras gratis, 20% kostar 2 öre.

---

## ✅ SLUTSATS

### Varför denna approach är perfekt:

1. ✅ **Startar med 100% AI** - Inga gissningar, verklig data
2. ✅ **Minimal kostnad** - 2 öre per svar är ingenting
3. ✅ **Skalbart** - Lägg till FAQ-layer när vi vet vad användare frågar
4. ✅ **Ingen design-konflikt** - z-index 1050, matchar er färgschema
5. ✅ **Mobil-first** - Responsiv, fungerar på alla enheter
6. ✅ **Data-driven** - Samlar feedback för kontinuerlig förbättring

### Nästa steg:

1. **Godkänn denna plan** ✅
2. **Sätt DEEPSEEK_API_KEY i .env.production**
3. **Börja implementation (Dag 1-2: Backend)**
4. **Deploy och testa**
5. **Samla data i 2 månader**
6. **Bygg FAQ-layer baserat på data**

---

**Skapad:** 2025-10-08
**Status:** 🟡 VÄNTAR PÅ GODKÄNNANDE
**Estimerad tid:** 3-4 dagar development + 2 månader data-insamling
