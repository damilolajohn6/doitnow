'use client';

import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(reducedMotionQuery);
    const updatePreference = () => setReduceMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);

  return reduceMotion;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}

export function Reveal({ children, className = '', delay = 0, distance = 28 }: RevealProps) {
  const reduceMotion = usePrefersReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.68, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export function TiltCard({ children, className = '', intensity = 6 }: TiltCardProps) {
  const reduceMotion = usePrefersReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 180,
    damping: 24,
    mass: 0.6,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 180,
    damping: 24,
    mass: 0.6,
  });

  function trackPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  function resetPointer() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <motion.div
      className={className}
      onPointerMove={trackPointer}
      onPointerLeave={resetPointer}
      style={
        reduceMotion
          ? undefined
          : {
              rotateX,
              rotateY,
              transformPerspective: 1200,
              transformStyle: 'preserve-3d',
            }
      }
    >
      {children}
    </motion.div>
  );
}

export function ScrollProgress() {
  const reduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
  if (reduceMotion) return null;
  return <motion.div className="scroll-progress" aria-hidden="true" style={{ scaleX }} />;
}
