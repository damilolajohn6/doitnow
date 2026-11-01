'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { TiltCard, usePrefersReducedMotion } from './MotionPrimitives';

interface HeroStat {
  value: string;
  label: string;
}

interface SpatialHeroProps {
  eyebrow: string;
  title: ReactNode;
  copy: string;
  image: string;
  imageAlt: string;
  sceneKicker: string;
  sceneTitle: string;
  sceneNote: string;
  sceneHref: string;
  sceneLinkLabel: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  checks?: string[];
  stats?: HeroStat[];
  tone?: 'walnut' | 'sage' | 'ivory';
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] } },
};

export default function SpatialHero({
  eyebrow,
  title,
  copy,
  image,
  imageAlt,
  sceneKicker,
  sceneTitle,
  sceneNote,
  sceneHref,
  sceneLinkLabel,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  checks = [],
  stats = [],
  tone = 'walnut',
}: SpatialHeroProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section className={`spatial-hero spatial-${tone}`}>
      <div className="spatial-ambient" aria-hidden="true" />
      <div className="container spatial-grid">
        <motion.div
          className="spatial-copy"
          variants={containerVariants}
          initial={reduceMotion ? undefined : 'hidden'}
          animate="show"
        >
          <motion.span className="spatial-eyebrow" variants={itemVariants}>
            {eyebrow}
          </motion.span>
          <motion.h1 variants={itemVariants}>{title}</motion.h1>
          <motion.p className="spatial-lead" variants={itemVariants}>
            {copy}
          </motion.p>
          <motion.div className="spatial-actions" variants={itemVariants}>
            <Link href={primaryHref} className="button">
              {primaryLabel} <ArrowUpRight size={18} />
            </Link>
            {secondaryHref && secondaryLabel && (
              <Link href={secondaryHref} className="button button-secondary">
                {secondaryLabel} <ArrowRight size={18} />
              </Link>
            )}
          </motion.div>
          {checks.length > 0 && (
            <motion.div className="spatial-checks" variants={itemVariants}>
              {checks.map((check) => (
                <span key={check}>
                  <Check size={16} /> {check}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="spatial-scene-wrap"
          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.94, x: 34 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          <TiltCard className="spatial-scene" intensity={5}>
            <div className="scene-backplane" aria-hidden="true" />
            <div className="scene-grid-plane" aria-hidden="true" />
            <div className="scene-orbit" aria-hidden="true">
              <i />
            </div>
            <div className="scene-image-card">
              <Image src={image} alt={imageAlt} fill priority sizes="(max-width: 900px) 100vw, 48vw" />
              <div className="scene-image-shade" />
            </div>
            <motion.div
              className="scene-material-card"
              style={{ z: 85, rotateZ: -3, transformStyle: 'preserve-3d' }}
              animate={reduceMotion ? undefined : { y: [0, -10, 0], rotateZ: [-3, -1, -3] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span>{sceneKicker}</span>
              <div className="scene-swatches" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <small>Layered material thinking</small>
            </motion.div>
            <motion.div
              className="scene-depth-chip"
              style={{ z: 70 }}
              animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            >
              3D SPACE STUDY
            </motion.div>
            <motion.div
              className="scene-caption-card"
              style={{ z: 75, rotateZ: 2, transformStyle: 'preserve-3d' }}
              animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            >
              <strong>{sceneTitle}</strong>
              <span>{sceneNote}</span>
              <Link href={sceneHref}>
                {sceneLinkLabel} <ArrowUpRight size={16} />
              </Link>
            </motion.div>
          </TiltCard>
        </motion.div>
      </div>

      {stats.length > 0 && (
        <motion.div
          className="container spatial-stats"
          initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
