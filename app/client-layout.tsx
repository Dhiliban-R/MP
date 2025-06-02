"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Optimized page transition variants for smoother and faster transitions
const pageVariants = {
  initial: {
    opacity: 0,
    y: 10, // Reduced vertical offset for faster transitions
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15, // Faster duration for better performance
      ease: "easeOut",
      when: "beforeChildren", // Animate parent before children
    }
  },
  exit: {
    opacity: 0,
    y: -10, // Reduced slide out distance
    transition: {
      duration: 0.1, // Even faster exit transition
      ease: "easeIn",
    }
  }
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // Skip animation on initial render
  useEffect(() => {
    // This effect runs once after the initial render
    setIsInitialRender(false);
  }, []); // Empty dependency array ensures it runs only once
  
  return (
    <AnimatePresence mode="wait"> {/* Use "wait" mode to ensure exit animation completes before new component enters */}
      <motion.div
        key={pathname}
        initial={isInitialRender ? false : "initial"} // Skip initial animation on first load
        animate="in"
        exit="exit"
        variants={pageVariants}
        className="relative z-10 min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}