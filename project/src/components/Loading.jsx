import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Loading = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          const loadingElement = document.getElementById('loading-screen');
          if (loadingElement) {
            loadingElement.style.display = 'none';
          }
        }, 1200); // Increased to match the exit transition duration
      }, 200); // Reduced delay for smoother transition
    }, 4000); // Set to exactly 4 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="loading-screen"
          className="fixed inset-0 z-[99999] w-screen h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-slate-950 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }
          }}
        >
          {/* Plain color background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900">
            {/* Enhanced gradient orbs with more movement */}
            <motion.div
              className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-600 rounded-full mix-blend-multiply filter blur-[100px]"
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px]"
              animate={{
                x: [0, -100, 0],
                y: [0, -50, 0],
                scale: [1.3, 1, 1.3],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-[120px]"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          <div className="relative z-10">
            {/* Logo container with enhanced effects */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                transition: {
                  duration: 1,
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.2
                }
              }}
              className="relative"
            >
              <motion.div
                className="w-48 h-48 md:w-56 md:h-56 relative"
                animate={{
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
              >
                {/* Multi-layer glow effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 rounded-full blur-2xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full blur-3xl"
                    animate={{
                      scale: [1.2, 1, 1.2],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                  />

                  {/* Logo with enhanced shadow */}
                  <motion.img
                    src="/logo/logo.jpeg"
                    alt="SAHE Logo"
                    className="w-3/4 h-3/4 object-contain relative z-10"
                    style={{
                      filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 60px rgba(245, 158, 11, 0.4))',
                    }}
                    animate={{
                      filter: [
                        'drop-shadow(0 0 30px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 60px rgba(245, 158, 11, 0.4))',
                        'drop-shadow(0 0 40px rgba(245, 158, 11, 1)) drop-shadow(0 0 80px rgba(245, 158, 11, 0.6))',
                        'drop-shadow(0 0 30px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 60px rgba(245, 158, 11, 0.4))',
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>

                {/* Multiple elegant rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{
                    borderColor: 'rgba(245, 158, 11, 0.6)',
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 0.2, 0.6],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-amber-400"
                  animate={{
                    scale: [1.1, 1.3, 1.1],
                    opacity: [0.3, 0, 0.3],
                    rotate: [360, 180, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />

                {/* Orbiting dots */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                      marginTop: '-4px',
                      marginLeft: '-4px',
                    }}
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                      delay: i * 1,
                    }}
                  >
                    <motion.div
                      className="w-full h-full"
                      style={{
                        transform: `translateX(${90 + i * 10}px)`,
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Enhanced text section */}
            <motion.div
              className="mt-12 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                transition: {
                  delay: 0.8,
                  duration: 0.8,
                  ease: [0.34, 1.56, 0.64, 1]
                }
              }}
            >
              <motion.div
                className="text-white font-light text-2xl md:text-3xl tracking-[0.2em] mb-2 uppercase"
                style={{
                  textShadow: '0 0 30px rgba(147, 51, 234, 0.8), 0 0 60px rgba(147, 51, 234, 0.4)'
                }}
                animate={{
                  textShadow: [
                    '0 0 30px rgba(147, 51, 234, 0.8), 0 0 60px rgba(147, 51, 234, 0.4)',
                    '0 0 40px rgba(147, 51, 234, 1), 0 0 80px rgba(147, 51, 234, 0.6)',
                    '0 0 30px rgba(147, 51, 234, 0.8), 0 0 60px rgba(147, 51, 234, 0.4)',
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                SAHE
              </motion.div>

              <motion.div
                className="text-amber-300 font-light text-sm md:text-base tracking-[0.3em] mb-8 uppercase"
                style={{
                  textShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
                }}
              >
                Hostelers
              </motion.div>

              {/* Animated loading spinner with gradient */}
              <motion.div
                className="w-12 h-12 mx-auto mb-6"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <svg
                  className="w-full h-full"
                  viewBox="0 0 50 50"
                >
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="url(#gradient1)"
                    strokeWidth="3"
                    strokeDasharray="100 31.4"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="25"
                    cy="25"
                    r="15"
                    fill="none"
                    stroke="url(#gradient2)"
                    strokeWidth="2"
                    strokeDasharray="70 22"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
                      <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Progress bar without percentage */}
              <div className="w-64 mx-auto mb-6">
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 rounded-full"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      boxShadow: '0 0 20px rgba(245, 158, 11, 0.8)',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Enhanced dots */}
              <div className="flex justify-center space-x-3">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="relative"
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400"
                      animate={{
                        scale: [1, 2, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400"
                      animate={{
                        scale: [1, 3, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Corner accents */}
          <motion.div
            className="absolute top-0 left-0 w-40 h-40"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 0.3,
              scale: 1,
              transition: { delay: 1, duration: 1 }
            }}
          >
            <div className="w-full h-full border-t-2 border-l-2 border-amber-500/30 rounded-tl-3xl" />
          </motion.div>
          <motion.div
            className="absolute bottom-0 right-0 w-40 h-40"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 0.3,
              scale: 1,
              transition: { delay: 1, duration: 1 }
            }}
          >
            <div className="w-full h-full border-b-2 border-r-2 border-amber-500/30 rounded-br-3xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loading;
