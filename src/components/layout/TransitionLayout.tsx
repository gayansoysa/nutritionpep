"use client";

import { ReactNode } from 'react';
import { PageTransition } from '@/components/ui/page-transition';

interface TransitionLayoutProps {
  children: ReactNode;
  className?: string;
}

export function TransitionLayout({ children, className }: TransitionLayoutProps) {
  return (
    <PageTransition className={className}>
      {children}
    </PageTransition>
  );
}