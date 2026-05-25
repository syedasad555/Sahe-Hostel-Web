import { motion } from 'framer-motion';

export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const floatAnimation = (y1 = -10, y2 = 10) => ({
  y: [0, y1, y2, 0],
  transition: {
    duration: 4,
    ease: 'easeInOut',
    repeat: Infinity,
    repeatType: 'reverse'
  }
});

export const hoverTapProps = {
  whileHover: { 
    scale: 1.03,
    transition: { duration: 0.2 }
  },
  whileTap: { 
    scale: 0.97 
  }
};

export const AnimatedDiv = motion.div;
export const AnimatedH2 = motion.h2;
export const AnimatedP = motion.p;
export const AnimatedButton = motion.button;
