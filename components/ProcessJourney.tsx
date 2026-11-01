'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, Hammer, Palette, Ruler, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { usePrefersReducedMotion } from './MotionPrimitives';

interface ProcessStep {
  title: string;
  short: string;
  description: string;
  align: string[];
  outcome: string;
  icon: LucideIcon;
}

const steps: ProcessStep[] = [
  {
    title: 'Discover + measure',
    short: 'Understand the room before drawing the answer.',
    description:
      'We begin with the way the room needs to work, its fixed conditions and your priorities. Photos and approximate sizes can start the conversation; production dimensions are confirmed before manufacture.',
    align: [
      'Room use and daily routine',
      'Walls, windows, services and access',
      'Priorities, reference designs and scope',
    ],
    outcome: 'A grounded brief based on the real room—not a generic furniture list.',
    icon: Search,
  },
  {
    title: 'Design + palette',
    short: 'Turn the brief into a clear visual direction.',
    description:
      'Layout, proportion, storage, finishes and lighting are developed as one composition. Selected catalogue directions can help us understand your preferences without forcing your room to copy them exactly.',
    align: [
      'Layout and circulation',
      'Materials, colours and tactile finishes',
      'Ambient, task and accent lighting intent',
    ],
    outcome: 'A coherent direction with enough detail to discuss and refine.',
    icon: Palette,
  },
  {
    title: 'Detail + confirm',
    short: 'Resolve the decisions that production depends on.',
    description:
      'The approved direction is checked against actual dimensions and practical requirements. This is where clearances, internal storage, hardware and service access become specific.',
    align: [
      'Confirmed dimensions and technical sizes',
      'Door, drawer, hardware and storage details',
      'Scope, services and final approvals',
    ],
    outcome: 'Clearer production information and fewer unresolved assumptions.',
    icon: Ruler,
  },
  {
    title: 'Build + coordinate',
    short: 'Carry the approved details into production.',
    description:
      'Production and finishing follow the agreed information, while relevant site requirements remain visible. Access, services and coordination with other work are considered before installation.',
    align: [
      'Production and finishing details',
      'Site readiness and relevant trade coordination',
      'Delivery and installation access',
    ],
    outcome: 'Work coordinated around the approved design and actual site conditions.',
    icon: Hammer,
  },
  {
    title: 'Install + handover',
    short: 'Fit, inspect and make the result easy to live with.',
    description:
      'Installation is followed by adjustment and a practical review. Care or maintenance considerations are discussed so the finished piece can be used with confidence.',
    align: [
      'Fit, alignment and adjustment',
      'Visual and practical inspection',
      'Care and maintenance guidance',
    ],
    outcome: 'A resolved installation and a clear handover.',
    icon: CheckCircle2,
  },
];

export default function ProcessJourney() {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = usePrefersReducedMotion();
  const active = steps[activeIndex];
  const ActiveIcon = active.icon;

  return (
    <div className="process-journey">
      <div className="process-progress" aria-hidden="true">
        <motion.div animate={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }} />
      </div>
      <fieldset className="process-step-buttons" aria-label="Project stages">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <button
              key={step.title}
              type="button"
              className={index === activeIndex ? 'active' : ''}
              onClick={() => setActiveIndex(index)}
              aria-pressed={index === activeIndex}
            >
              <span>0{index + 1}</span>
              <Icon size={21} />
              <strong>{step.title}</strong>
            </button>
          );
        })}
      </fieldset>

      <AnimatePresence mode="wait">
        <motion.article
          key={active.title}
          className="process-detail-card"
          initial={reduceMotion ? false : { opacity: 0, y: 22, rotateX: -3 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformPerspective: 1100 }}
          aria-live="polite"
        >
          <div className="process-detail-heading">
            <span className="process-detail-icon">
              <ActiveIcon size={29} />
            </span>
            <span className="section-kicker">STAGE 0{activeIndex + 1} / 05</span>
            <h2>{active.title}</h2>
            <strong>{active.short}</strong>
            <p>{active.description}</p>
          </div>
          <div className="process-alignment">
            <h3>What we align</h3>
            <ul>
              {active.align.map((item) => (
                <li key={item}>
                  <Check size={17} /> {item}
                </li>
              ))}
            </ul>
            <div className="process-outcome">
              <span>THE OUTCOME</span>
              <p>{active.outcome}</p>
            </div>
            {activeIndex < steps.length - 1 ? (
              <button type="button" className="text-link" onClick={() => setActiveIndex(activeIndex + 1)}>
                Next: {steps[activeIndex + 1].title} <ArrowRight size={17} />
              </button>
            ) : (
              <Link href="/contact#enquire" className="text-link">
                Start your project brief <ArrowUpRight size={17} />
              </Link>
            )}
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
