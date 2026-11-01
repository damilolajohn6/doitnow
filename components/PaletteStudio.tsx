'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { TiltCard, usePrefersReducedMotion } from './MotionPrimitives';

const palettes = [
  {
    id: 'warm-minimal',
    label: 'Warm minimal',
    image: '/images/designs/living-01.webp',
    alt: 'Warm minimal living room with curved ivory seating and pale timber',
    summary: 'Soft neutrals, rounded forms and pale timber keep the room calm without making it feel flat.',
    materials: ['Warm ivory upholstery', 'Pale oak or light walnut', 'Soft warm-white walls'],
    swatches: ['#F2EAE0', '#C8B39B', '#7D6048'],
  },
  {
    id: 'ivory-walnut',
    label: 'Ivory + walnut',
    image: '/images/designs/wardrobe-01.webp',
    alt: 'Warm ivory wardrobe with walnut edging and separate overheads',
    summary: 'Light fronts carry the room while walnut edging adds definition, warmth and a crafted rhythm.',
    materials: ['Warm ivory matte fronts', 'Walnut-look edge details', 'Slim warm-metal handles'],
    swatches: ['#EEE9DF', '#9A6B3F', '#3F332B'],
  },
  {
    id: 'sage-oak',
    label: 'Sage + oak',
    image: '/images/designs/kitchen-05.webp',
    alt: 'Muted sage and light oak kitchen without an island',
    summary: 'Muted green adds quiet character, balanced by light oak and a pale, durable working surface.',
    materials: ['Muted sage cabinetry', 'Light oak accents', 'Pale worktop and warm light'],
    swatches: ['#9AA392', '#D4B98E', '#F1EEE5'],
  },
  {
    id: 'greige-darkwood',
    label: 'Greige + darkwood',
    image: '/images/designs/kitchen-06.webp',
    alt: 'Greige kitchen with darkwood accents and a central island',
    summary:
      'A deeper neutral palette with enough contrast to feel grounded, still softened by warm surfaces.',
    materials: ['Warm greige fronts', 'Darkwood tall-unit accents', 'Pale counters and layered light'],
    swatches: ['#B7B0A6', '#4B3A31', '#E7E2D8'],
  },
];

export default function PaletteStudio() {
  const [activeId, setActiveId] = useState(palettes[0].id);
  const reduceMotion = usePrefersReducedMotion();
  const active = palettes.find((palette) => palette.id === activeId) || palettes[0];

  return (
    <div className="palette-studio">
      <TiltCard className="palette-visual" intensity={3}>
        {palettes.map((palette) => {
          const selected = palette.id === active.id;
          return (
            <motion.div
              key={palette.id}
              className="palette-image-layer"
              initial={false}
              animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : 1.025 }}
              transition={{ duration: reduceMotion ? 0 : 0.45 }}
              aria-hidden={!selected}
            >
              <Image
                src={palette.image}
                alt={selected ? palette.alt : ''}
                fill
                sizes="(max-width: 900px) 100vw, 52vw"
              />
            </motion.div>
          );
        })}
        <div className="palette-color-deck">
          {active.swatches.map((swatch) => (
            <i key={swatch} style={{ backgroundColor: swatch }} />
          ))}
          <span>{active.label}</span>
        </div>
      </TiltCard>

      <div className="palette-controls">
        <span className="section-kicker">INTERACTIVE MATERIAL MOOD</span>
        <h2>Find the feeling before the finish.</h2>
        <p>
          Compare four starting points. Each can be adapted to your room, existing finishes and practical
          needs.
        </p>
        <fieldset className="palette-options" aria-label="Choose a material mood">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              type="button"
              className={palette.id === active.id ? 'active' : ''}
              onClick={() => setActiveId(palette.id)}
              aria-pressed={palette.id === active.id}
            >
              <span aria-hidden="true">
                {palette.swatches.map((swatch) => (
                  <i key={swatch} style={{ backgroundColor: swatch }} />
                ))}
              </span>
              {palette.label}
            </button>
          ))}
        </fieldset>
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            className="palette-active-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            aria-live="polite"
          >
            <h3>{active.label}</h3>
            <p>{active.summary}</p>
            <ul>
              {active.materials.map((material) => (
                <li key={material}>
                  <Check size={16} /> {material}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
        {/* <small className="palette-note">
          Digital colours are indicative. Review physical samples together in the room’s real light.
        </small> */}
      </div>
    </div>
  );
}
