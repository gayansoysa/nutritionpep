"use client";

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: -20,
    scale: 0.98
  }
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'anticipate' as const,
  duration: 0.4
};

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={`${className} ${isLoading ? 'pointer-events-none' : ''}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Slide transition for mobile navigation
export function SlideTransition({ children, direction = 'right' }: { 
  children: ReactNode; 
  direction?: 'left' | 'right' 
}) {
  const pathname = usePathname();

  const slideVariants = {
    initial: {
      x: direction === 'right' ? '100%' : '-100%',
      opacity: 0
    },
    in: {
      x: 0,
      opacity: 1
    },
    out: {
      x: direction === 'right' ? '-100%' : '100%',
      opacity: 0
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={slideVariants}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Fade transition for subtle changes
export function FadeTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const fadeVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={fadeVariants}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}