'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, LoaderCircle, Send, Sparkles } from 'lucide-react';
import type { Design } from '@/lib/designs';
import { WHATSAPP_URL } from '@/lib/contact';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: 'ai' | 'catalogue';
  recommendations?: Design[];
}

export default function DesignConcierge() {
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Tell me about your room, the atmosphere you like and any practical priorities. I will suggest verified catalogue directions without inventing prices or specifications.',
    },
  ]);
  async function ask(value: string) {
    const message = value.trim();
    if (message.length < 3 || pending) return;
    setInput('');
    setPending(true);
    const next = [...messages, { id: crypto.randomUUID(), role: 'user' as const, content: message }];
    setMessages(next);
    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: next.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'The concierge is unavailable.');
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          mode: data.mode,
          recommendations: data.recommendations,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Please try again.',
        },
      ]);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="concierge-shell">
      <div className="concierge-messages" aria-live="polite">
        {messages.map((message) => (
          <article key={message.id} className={`concierge-message ${message.role}`}>
            <span>{message.role === 'assistant' ? <Sparkles size={18} /> : 'You'}</span>
            <div>
              <p>{message.content}</p>
              {message.mode && (
                <small>
                  {message.mode === 'ai'
                    ? 'AI-gateway wording · verified catalogue results'
                    : 'Catalogue-grounded guidance'}
                </small>
              )}
              {message.recommendations && (
                <div className="concierge-recommendations">
                  {message.recommendations.map((design) => (
                    <Link href={`/designs/${design.slug}`} key={design.slug}>
                      <Image
                        src={design.image}
                        alt=""
                        width={104}
                        height={104}
                        unoptimized={design.image.startsWith('http')}
                      />
                      <span>
                        <strong>{design.title}</strong>
                        <small>{design.category}</small>
                        <p>{design.summary}</p>
                        <b>
                          Open design <ArrowRight size={14} />
                        </b>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
        {pending && (
          <div className="concierge-thinking">
            <LoaderCircle className="spin" size={18} />
            Checking the catalogue…
          </div>
        )}
      </div>
      {messages.length === 1 && (
        <div className="concierge-prompts">
          {[
            'I need a simple wardrobe with useful internal storage.',
            'Show me warm kitchen directions with an island.',
            'I want a classic TV wall with open shelves.',
          ].map((prompt) => (
            <button key={prompt} type="button" onClick={() => ask(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      )}
      <div className="concierge-input">
        <label htmlFor="concierge-question" className="sr-only">
          Ask the design concierge
        </label>
        <textarea
          id="concierge-question"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your room, style and practical needs…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
        />
        <button
          type="button"
          className="button"
          disabled={pending || input.trim().length < 3}
          onClick={() => ask(input)}
        >
          {pending ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />} Ask
        </button>
      </div>
      <a className="concierge-handoff" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
        Continue with the design team on WhatsApp <ArrowRight size={14} />
      </a>
      <p className="concierge-disclaimer">
        Guidance is informational, not a quotation or construction specification. Final scope, dimensions and
        materials are confirmed with the team.
      </p>
    </div>
  );
}
