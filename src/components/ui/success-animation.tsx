"use client";

import { motion } from "framer-motion";
import { CheckIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  showConfetti?: boolean;
}

export function SuccessAnimation({ 
  show, 
  message = "Success!", 
  onComplete,
  showConfetti = false 
}: SuccessAnimationProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  if (!show) return null;

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          duration: 0.5 
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        onClick={onComplete}
      >
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-background border border-border rounded-2xl p-8 shadow-2xl max-w-sm mx-4"
        >
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.3,
                type: "spring",
                stiffness: 400,
                damping: 15
              }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckIcon className="w-8 h-8 text-white" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-semibold text-foreground">{message}</h3>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

export function FoodLoggedAnimation({ show, foodName, onComplete }: { 
  show: boolean; 
  foodName?: string; 
  onComplete?: () => void; 
}) {
  return (
    <SuccessAnimation
      show={show}
      message={foodName ? `${foodName} added to diary!` : "Food logged successfully!"}
      onComplete={onComplete}
      showConfetti={true}
    />
  );
}

// Micro-interaction components
export function PulseOnHover({ children, className = "" }: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideInFromBottom({ children, delay = 0 }: { 
  children: React.ReactNode; 
  delay?: number; 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({ children, delay = 0 }: { 
  children: React.ReactNode; 
  delay?: number; 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

export function SubtleHover({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.005,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.995 }}
    >
      {children}
    </motion.div>
  );
}