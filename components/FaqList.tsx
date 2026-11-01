'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { usePrefersReducedMotion } from './MotionPrimitives';

export interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqList({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const open = index === openIndex;
        return (
          <article key={item.question} className={open ? 'open' : ''}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : index)}
              aria-expanded={open}
              aria-controls={`faq-answer-${index}`}
            >
              <span>0{index + 1}</span>
              <strong>{item.question}</strong>
              <motion.i
                animate={{ rotate: open ? 45 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25 }}
              >
                <Plus size={21} />
              </motion.i>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={`faq-answer-${index}`}
                  className="faq-answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p>{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </article>
        );
      })}
    </div>
  );
}
