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
  const inputRef = useRef(null);

  // Generate session ID on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('chatSessionId');
      if (!id) {
        id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatSessionId', id);
      }
      setSessionId(id);

      // Load conversation history
      const saved = localStorage.getItem('chatHistory');
      if (saved) {
        try {
          const history = JSON.parse(saved);
          if (Array.isArray(history) && history.length > 0) {
            setMessages(history.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })));
          }
        } catch (e) {
          console.error('Failed to load chat history:', e);
        }
      }
    }
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversation history
  useEffect(() => {
    if (messages.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Welcome message when opened first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'bot',
        content: '👋 Hej! Jag är din SEO-assistent. Hur kan jag hjälpa dig?',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !sessionId) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Gather context
      const context = {
        currentPage: typeof window !== 'undefined' ? window.location.pathname : null,
        analysisId: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null,
        conversationHistory: messages.slice(-6) // Last 3 exchanges
      };

      const response = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
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
          logId: data.logId
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

  const submitFeedback = async (logId, helpful) => {
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
  };

  const clearHistory = () => {
    if (confirm('Vill du rensa chatthistoriken?')) {
      setMessages([{
        role: 'bot',
        content: '👋 Hej! Jag är din SEO-assistent. Hur kan jag hjälpa dig?',
        timestamp: new Date()
      }]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chatHistory');
      }
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
              <img
                src="/images/chatbot-avatar.png"
                alt="SEO Assistant"
                className="chatbot-avatar"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'inline';
                }}
              />
              <span className="chatbot-avatar" style={{display: 'none'}}>🤖</span>
              <div>
                <h3>SEO Assistent</h3>
                <p className="chatbot-status">
                  <span className="status-dot"></span> Online
                </p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-action-btn"
                onClick={clearHistory}
                aria-label="Rensa historik"
                title="Rensa historik"
              >
                🗑️
              </button>
              <button
                className="chatbot-close"
                onClick={() => setIsOpen(false)}
                aria-label="Stäng chat"
              >
                ✕
              </button>
            </div>
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
              ref={inputRef}
              className="chatbot-input"
              placeholder="Skriv din fråga..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              disabled={isLoading}
              maxLength={500}
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

          {/* Quick Questions (only show on first message) */}
          {messages.length === 1 && (
            <div className="chatbot-quick-questions">
              <p>Vanliga frågor:</p>
              <button onClick={() => setInput('Kostar det något?')}>
                💰 Kostar det något?
              </button>
              <button onClick={() => setInput('Hur funkar AI-analysen?')}>
                🧠 Hur funkar AI-analysen?
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
