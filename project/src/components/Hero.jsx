import { MapPin, ChevronDown } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Hero({ onBookNow, onStudentRegister }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFacultyHovered, setIsFacultyHovered] = useState(false);
  const heroRef = useRef(null);

  // Enhanced floating animation variants with smoother motion
  const floatVariants = {
    initial: { y: 0, rotate: 0, scale: 1 },
    float: (i) => ({
      y: [0, -15, 0, -10, 0],
      rotate: i % 2 === 0 ? [0, 2, -1, 3, 0] : [0, -2, 1, -3, 0],
      scale: [1, 1.02, 0.99, 1.01, 1],
      transition: {
        y: {
          duration: 12 + Math.random() * 6,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
        },
        rotate: {
          duration: 15 + Math.random() * 6,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
        },
        scale: {
          duration: 8 + Math.random() * 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    })
  };

  // Ultra-smooth fade in up animation with staggered children
  const fadeInUp = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.98,
      filter: 'blur(2px)'
    },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 1.2,
        delay: i * 0.15,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.2,
        opacity: {
          duration: 1.5,
          ease: [0.4, 0, 0.2, 1]
        },
        y: {
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1]
        }
      }
    })
  };

  // Ultra-smooth stagger children with 3D perspective
  const item = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      rotateX: -5,
      filter: 'blur(4px)'
    },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 1.2,
        delay: 0.2 + (i * 0.15),
        ease: [0.22, 1, 0.36, 1],
        perspective: 1000,
        opacity: {
          duration: 1.5,
          ease: [0.4, 0, 0.2, 1]
        },
        y: {
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1]
        },
        filter: {
          duration: 1.5,
          ease: [0.4, 0, 0.2, 1]
        }
      }
    }),
    hover: {
      scale: 1.02,
      y: -2,
      transition: { 
        duration: 0.5, 
        ease: [0.4, 0, 0.2, 1],
        scale: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }
      }
    }
  };

  // Background elements animation
  const bgElement = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (i) => ({
      opacity: 0.6,
      scale: 1,
      transition: {
        duration: 1,
        delay: i * 0.2,
        ease: 'easeOut'
      }
    })
  };
  return (
    <motion.div 
      id="home"
      ref={heroRef}
      className="relative h-screen flex items-center justify-center overflow-hidden"
      initial="hidden"
      animate="visible"
    >
      {/* Dimmed background image */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://www.vrsiddhartha.ac.in/wp-content/uploads/2020/06/Engineering-College-Girls-Hostel-I.jpg)',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            filter: 'brightness(0.5)'
          }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, scale: 1.02 },
            visible: { 
              opacity: 1,
              scale: 1,
              transition: { 
                duration: 1.5,
                ease: [0.6, 0.01, 0.4, 1]
              }
            }
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Enhanced animated particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => {
          const size = Math.random() * 6 + 2;
          const delay = Math.random() * 5;
          const duration = Math.random() * 10 + 10;
          return (
            <motion.div
              key={i}
              className="absolute bg-amber-400/20 rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: [0, 0.5, 0],
                y: [0, -100],
                x: [0, (Math.random() - 0.5) * 100],
              }}
              transition={{
                duration: duration,
                delay: delay,
                repeat: Infinity,
                repeatDelay: Math.random() * 5,
                ease: 'linear'
              }}
            />
          );
        })}
      </div>

      {/* Content with ultra-smooth staggered animations */}
      <motion.div 
        className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        custom={0}
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div 
          className="flex items-center justify-center mb-6 space-x-2"
          variants={item}
          custom={1}
        >
          <motion.div 
            animate={{
              scale: [1, 1.1, 0.95, 1.05, 1],
              rotate: [0, 5, -3, 2, 0],
              y: [0, -5, 0, -3, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: 'loop',
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.25, 0.5, 0.75, 1]
            }}
          >
          </motion.div>
          
          <motion.div 
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              duration: 3,
              delay: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut'
            }}
          >
          </motion.div>
        </motion.div>

        <motion.h1 
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          variants={item}
          custom={2}
          whileHover="hover"
        >
          Welcome to
          <motion.span 
            className="block bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mt-3"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              backgroundSize: '200% 200%',
            }}
          >
            SAHE Hostelers
          </motion.span>
        </motion.h1>

        <motion.p 
          className="text-xl sm:text-2xl text-gray-200 mb-6 max-w-3xl mx-auto leading-relaxed"
          variants={item}
          custom={3}
          whileHover={{ 
            scale: 1.02,
            textShadow: '0 0 15px rgba(245, 158, 11, 0.5)'
          }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
         Experience premium hostel living with modern amenities, excellent facilities, and a supportive environment designed for academic success and personal growth.
        </motion.p>

        <motion.div 
          className="flex items-center justify-center space-x-2 text-gray-300 mb-10 cursor-pointer"
          variants={item}
          custom={4}
          whileHover={{ 
            scale: 1.05,
            color: '#f59e0b',
            transition: { duration: 0.3 }
          }}
          onClick={() => {
            const contactSection = document.getElementById('contact');
            if (contactSection) {
              contactSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <motion.div
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <MapPin size={20} className="text-amber-400" />
          </motion.div>
          <span>Kanuru , Vijayawada</span>
        </motion.div>

        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
          variants={item}
          custom={5}
        >
          <motion.button
            onClick={onStudentRegister}
            className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-lg font-semibold rounded-full overflow-hidden"
            initial={false}
            animate={{
              y: [0, -5, 0],
              transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            whileHover={{ 
              y: -8,
              scale: 1.05,
              boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.3)',
              transition: {
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
                scale: {
                  type: 'spring',
                  stiffness: 400,
                  damping: 10
                },
                y: {
                  type: 'spring',
                  stiffness: 200,
                  damping: 10
                }
              }
            }}
            whileTap={{ 
              scale: 0.97,
              y: 0,
              transition: {
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
          >
            <span className="relative z-10 flex items-center">
              Student Register
              <motion.span 
                className="ml-2"
                animate={isHovered ? { x: [0, 5, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
              >
                →
              </motion.span>
            </span>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 z-0"
              initial={{ y: '100%' }}
              whileHover={{ y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </motion.button>

          <motion.button 
            onClick={() => {
              const section = document.getElementById('coordinators');
              if (section) section.scrollIntoView({ behavior: 'smooth' });
            }}
            onMouseEnter={() => setIsFacultyHovered(true)}
            onMouseLeave={() => setIsFacultyHovered(false)}
            className="group relative px-8 py-4 bg-white/20 backdrop-blur-lg border-2 border-white/30 text-white text-lg font-semibold rounded-full overflow-hidden hover:bg-white/30 hover:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-white/10"
            animate={{
              y: [0, -5, 0],
              transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }
            }}
            whileHover={{ 
              y: -8,
              scale: 1.05,
              boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.3)',
              transition: {
                ease: [0.4, 0, 0.2, 1]
              }
            }}
          >
            <span className="relative z-10 flex items-center">
              Coordinators
              <motion.span 
                className="ml-2"
                animate={isFacultyHovered ? { x: [0, 5, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
              >
                →
              </motion.span>
            </span>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 z-0"
              initial={{ y: '100%' }}
              whileHover={{ y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scroll cue: wrapper handles centering so Framer `y` does not drop -translate-x-1/2 */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <motion.div
          className="pointer-events-auto group"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [20, 0, 0, 10],
          }}
          whileHover={{
            scale: 1.1,
            transition: { duration: 0.3 },
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 0.5,
            ease: 'easeInOut',
          }}
        >
        <div className="flex flex-col items-center space-y-2">
          <motion.span 
            className="text-white/70 text-sm uppercase tracking-wider"
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            Scroll to explore
          </motion.span>
          <motion.div 
            className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
            animate={{
              borderColor: ['rgba(255, 255, 255, 0.3)', 'rgba(245, 158, 11, 0.6)', 'rgba(255, 255, 255, 0.3)'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <motion.div 
              className="w-1.5 h-3 bg-amber-400 rounded-full"
              animate={{
                y: [0, 12, 0],
                backgroundColor: ['#f59e0b', '#d97706', '#f59e0b'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </motion.div>
        </div>
        </motion.div>
      </div>
      
    </motion.div>
  );
}
