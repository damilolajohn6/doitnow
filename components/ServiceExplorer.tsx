'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Armchair, ArrowUpRight, Check, CookingPot, PanelsTopLeft, Palette, Ruler, Tv } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { usePrefersReducedMotion } from './MotionPrimitives';

interface Service {
  id: string;
  name: string;
  tagline: string;
  image: string;
  imageAlt: string;
  description: string;
  deliverables: string[];
  considerations: string[];
  designSlug: string;
  designLabel: string;
  icon: LucideIcon;
}

const services: Service[] = [
  {
    id: 'custom-furniture',
    name: 'Custom furniture',
    tagline: 'Proportioned for the room and the routine.',
    image: '/images/designs/living-01.webp',
    imageAlt: 'Warm living room with curved seating and pale timber furniture',
    description:
      'Furniture should solve a practical need without overwhelming the room. We shape each direction around use, circulation, storage and a restrained material palette.',
    deliverables: [
      'Furniture concept and proportion',
      'Storage and usage planning',
      'Material and hardware direction',
    ],
    considerations: [
      'Living and dining pieces',
      'Consoles and occasional furniture',
      'Room-specific storage',
    ],
    designSlug: 'soft-curves-warm-neutrals',
    designLabel: 'Explore warm minimal living',
    icon: Armchair,
  },
  {
    id: 'kitchen-design',
    name: 'Kitchen design',
    tagline: 'Workflow, windows and clearances before cabinetry.',
    image: '/images/designs/kitchen-02.webp',
    imageAlt: 'Ivory and walnut kitchen with a central island and coordinated windows',
    description:
      'A good kitchen begins with the working sequence. We consider island and no-island layouts, landing space, appliance clearances, windows and the materials that tie everything together.',
    deliverables: [
      'Layout and workflow direction',
      'Cabinet and storage planning',
      'Worktop, finish and lighting palette',
    ],
    considerations: [
      'Island and no-island options',
      'Window and service coordination',
      'Appliance and access clearances',
    ],
    designSlug: 'ivory-walnut-kitchen-island',
    designLabel: 'Explore kitchen directions',
    icon: CookingPot,
  },
  {
    id: 'wardrobes-storage',
    name: 'Wardrobes & storage',
    tagline: 'A calm elevation with a useful interior.',
    image: '/images/designs/wardrobe-01.webp',
    imageAlt: 'Simple ivory wardrobe with walnut edging and separate overhead cabinets',
    description:
      'We resolve the outside and inside together: door rhythm, overhead storage, hanging, folded items, drawers and the clearances that make daily use comfortable.',
    deliverables: [
      'Elevation and door-layout direction',
      'Internal storage zoning',
      'Finish, edging and handle guidance',
    ],
    considerations: [
      'Main doors and separate overheads',
      'Bedside and door-swing clearance',
      'Actual wall dimensions',
    ],
    designSlug: 'simple-ivory-walnut-wardrobe',
    designLabel: 'Explore wardrobe directions',
    icon: PanelsTopLeft,
  },
  {
    id: 'tv-feature-walls',
    name: 'TV & feature walls',
    tagline: 'One strong feature, not visual noise.',
    image: '/images/designs/tv-wall-01.webp',
    imageAlt: 'White stone-look TV wall with walnut console and open shelving',
    description:
      'We balance the screen, console, shelving, finishes and concealed services so the wall feels composed. Shelving, cable access and equipment needs are considered together.',
    deliverables: [
      'Feature composition and proportions',
      'Console and open-shelf planning',
      'Lighting and cable-access direction',
    ],
    considerations: [
      'Screen size and seated sightlines',
      'Device ventilation and sockets',
      'Door-free or enclosed storage',
    ],
    designSlug: 'white-marble-walnut-tv-wall',
    designLabel: 'Explore TV wall directions',
    icon: Tv,
  },
  {
    id: 'material-interiors',
    name: 'Materials & interior direction',
    tagline: 'A palette that works beyond a single screen.',
    image: '/images/designs/bedroom-01.webp',
    imageAlt: 'Upholstered bedroom with a tall headboard and coordinated furniture',
    description:
      'We bring finishes, textiles, timber tones, hard surfaces and lighting into one conversation. The aim is a room with depth and warmth, not a collection of unrelated samples.',
    deliverables: [
      'Room-specific mood and palette',
      'Material and finish combinations',
      'Warm layered-lighting direction',
    ],
    considerations: [
      'Daylight and evening appearance',
      'Tactile and maintenance needs',
      'Existing finishes worth retaining',
    ],
    designSlug: 'upholstered-bed-tall-headboard',
    designLabel: 'Explore bedroom direction',
    icon: Palette,
  },
  {
    id: 'planning-installation',
    name: 'Planning & installation coordination',
    tagline: 'Details carried through to the final fit.',
    image: '/images/designs/office-01.webp',
    imageAlt: 'Built-in home office with coordinated desk and storage',
    description:
      'Design decisions are only useful when they translate clearly. Dimensions, services, hardware, access and relevant site work are aligned before the final installation review.',
    deliverables: [
      'Measurement and scope alignment',
      'Production-detail coordination',
      'Installation and handover review',
    ],
    considerations: [
      'Fixed walls and site conditions',
      'Access for relevant trades',
      'Care and maintenance needs',
    ],
    designSlug: 'built-in-home-office',
    designLabel: 'Explore built-in office direction',
    icon: Ruler,
  },
];

export default function ServiceExplorer() {
  const [activeId, setActiveId] = useState(services[0].id);
  const reduceMotion = usePrefersReducedMotion();
  const activeIndex = services.findIndex((service) => service.id === activeId);
  const active = services[activeIndex];
  const ActiveIcon = active.icon;

  return (
    <div className="service-explorer">
      <fieldset className="service-selector" aria-label="Explore services">
        {services.map((service, index) => {
          const Icon = service.icon;
          const selected = service.id === active.id;
          return (
            <button
              key={service.id}
              type="button"
              className={selected ? 'active' : ''}
              onClick={() => setActiveId(service.id)}
              aria-pressed={selected}
            >
              <span className="service-selector-icon">
                <Icon size={21} />
              </span>
              <span>
                <small>0{index + 1}</small>
                <strong>{service.name}</strong>
              </span>
              <ArrowUpRight size={17} />
            </button>
          );
        })}
      </fieldset>

      <article className="service-panel">
        <div className="service-panel-image">
          {services.map((service) => {
            const selected = service.id === active.id;
            return (
              <motion.div
                key={service.id}
                className="service-image-layer"
                initial={false}
                animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : 1.035 }}
                transition={{ duration: reduceMotion ? 0 : 0.45 }}
                aria-hidden={!selected}
              >
                <Image
                  src={service.image}
                  alt={selected ? service.imageAlt : ''}
                  fill
                  sizes="(max-width: 900px) 100vw, 55vw"
                />
              </motion.div>
            );
          })}
          <span>0{activeIndex + 1}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            className="service-panel-body"
            initial={reduceMotion ? false : { opacity: 0, x: 28, rotateY: -3 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -18, rotateY: 2 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformPerspective: 1100 }}
          >
            <span className="service-panel-icon">
              <ActiveIcon size={25} />
            </span>
            <span className="section-kicker">{active.tagline}</span>
            <h2>{active.name}</h2>
            <p>{active.description}</p>
            <div className="service-panel-lists">
              <div>
                <h3>What we shape</h3>
                <ul>
                  {active.deliverables.map((item) => (
                    <li key={item}>
                      <Check size={16} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>What we consider</h3>
                <ul>
                  {active.considerations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="service-panel-actions">
              <Link href={`/designs/${active.designSlug}`} className="text-link">
                {active.designLabel} <ArrowUpRight size={17} />
              </Link>
              <Link href="/contact#enquire" className="button button-small">
                Discuss this service <ArrowUpRight size={16} />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </article>
    </div>
  );
}
