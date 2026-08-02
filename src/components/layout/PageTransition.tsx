import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

export function PageTransition({ children, ...props }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col w-full h-full"
      {...props}
    >
      {children}
    </motion.div>
  );
}
