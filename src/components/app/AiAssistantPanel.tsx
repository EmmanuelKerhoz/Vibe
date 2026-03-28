import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Loader2 } from '../ui/icons';
import { useTranslation } from '../../i18n';
import { generateContentWithRetry } from '../../utils/aiUtils';
import { AI_MODEL_NAME } from '../../utils/aiUtils';
import { useModalState } from '../../contexts/ModalContext';
import knowledgeEn from '../../knowledge/en.md?raw';
import knowledgeFr from '../../knowledge/fr.md?raw';

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

interface Props {
  onClose: () => void;
}

const PROMPT_TEMPLATE = `You are a contextual songwriting assistant embedded in a lyric editor. The user is currently in <<<page>>> using <<<mode>>>. Only provide concise, actionable guidance (max 2 sentences unless the user asks for more). Answer in the user's detected language. Do not recap the context. You are not a chatbot — you are a contextual creative assistant.

Knowledge base:
<<<knowledge>>>`;

function getKnowledgeBase(language: string): string {
  return language === 'fr' ? knowledgeFr : knowledgeEn;
}

export function AiAssistantPanel({ onClose }: Props) {
  const { t, language } = useTranslation();
  const { uiState } = useModalState();
  const currentPage = uiState.activeTab;
  const editMode = uiState.editMode;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const buildSystemPrompt = useCallback(() => {
    const knowledge = getKnowledgeBase(language);
    return PROMPT_TEMPLATE
      .replace('<<<page>>>', currentPage)
      .replace('<<<mode>>>', editMode)
      .replace('<<<knowledge>>>', knowledge);
  }, [language, currentPage, editMode]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    setInput('');
    setHasInteracted(true);

    const userMessage: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const systemPrompt = buildSystemPrompt();
      // Build conversation history for context
      const history = [...messages, userMessage];
      const fullContents = [
        `[SYSTEM]\n${systemPrompt}`,
        ...history.map(m => `[${m.role === 'user' ? 'USER' : 'ASSISTANT'}]\n${m.text}`),
      ].join('\n\n');

      const response = await generateContentWithRetry({
        model: AI_MODEL_NAME,
        contents: fullContents,
        config: { maxOutputTokens: 512, temperature: 0.7 },
        signal: controller.signal,
      });

      const answer = response.text?.trim() ?? t.aiAssistant.error;
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages(prev => [...prev, { role: 'assistant', text: t.aiAssistant.error }]);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, messages, buildSystemPrompt, t.aiAssistant.error]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="mt-4 flex flex-col rounded-lg border border-[var(--accent-color)]/30 bg-[var(--bg-app)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            {t.aiAssistant.title}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label={t.aiAssistant.close}
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-2 px-3 py-3 max-h-48 overflow-y-auto custom-scrollbar">
        {!hasInteracted && messages.length === 0 && (
          <p className="text-xs text-[var(--text-secondary)] italic">
            {t.aiAssistant.onboarding}
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'text-[var(--text-primary)] self-end bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 rounded-lg px-2.5 py-1.5 max-w-[85%]'
                : 'text-[var(--text-secondary)] self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] self-start">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{t.aiAssistant.thinking}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-3 py-2 border-t border-[var(--border-color)]">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.aiAssistant.placeholder}
          rows={1}
          aria-label={t.aiAssistant.placeholder}
          className="flex-1 resize-none bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 outline-none leading-relaxed py-1"
          style={{ maxHeight: '72px', overflowY: 'auto' }}
        />
        <button
          onClick={() => void handleSend()}
          disabled={!input.trim() || isThinking}
          aria-label={t.aiAssistant.send}
          className="px-2.5 py-1 text-xs rounded-lg bg-[var(--accent-color)]/80 hover:bg-[var(--accent-color)] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {t.aiAssistant.send}
        </button>
      </div>
    </div>
  );
}
