import { motion } from 'framer-motion';
import './Amenities.css';

const amenities = [
  {
    title: 'Rooms',
    description: 'Experience comfort in our well-furnished rooms',
    image: 'https://www.vrsiddhartha.ac.in/wp-content/uploads/2020/06/Twin-Sharing-Rooms.jpg',
    gradient: 'from-blue-600 to-indigo-700',
    icon: '🏨',
  },
  {
    title: 'Dining',
    description: 'Savor delicious and hygienic meals in our spacious dining area',
    image: 'https://www.vrsiddhartha.ac.in/wp-content/uploads/2021/02/Dining-Hall-1024x678.jpg',
    gradient: 'from-amber-600 to-orange-600',
    icon: '🍽️',
  },
  {
    title: 'Fitness Center',
    description: 'Stay fit with our state-of-the-art gym equipment',
    image: 'https://www.vrsiddhartha.ac.in/wp-content/uploads/2020/06/GYM-Room.jpg',
    gradient: 'from-rose-600 to-pink-700',
    icon: '💪',
  },
  {
    title: 'WiFi Service',
    description: 'High-speed internet connectivity throughout the premises',
    image: 'https://img.freepik.com/free-vector/business-people-using-laptop-smartphone-with-wifi-connection-wi-fi-connection-wifi-communication-technology-free-internet-services-concept-bright-vibrant-violet-isolated-illustration_335657-973.jpg',
    gradient: 'from-indigo-600 to-purple-700',
    icon: '📶',
  },
  {
    title: 'Laundry Service',
    description: 'Professional laundry and dry cleaning services available',
    image: 'https://media.istockphoto.com/id/1329135522/photo/stack-of-folded-clean-sheets-surgical-clothes-and-industrial-iron-in-an-industrial-laundry.jpg?s=612x612&w=0&k=20&c=0IEKirVnN0C9m2XHIRdDF0HQjruZx_E4fY5Df6qyqLc=',
    gradient: 'from-cyan-600 to-blue-700',
    icon: '👕',
  },
  {
    title: 'Sports',
    description: 'Engage in various indoor and outdoor sports activities',
    image: 'https://thumbs.dreamstime.com/z/two-players-play-table-tennis-28117325.jpg',
    gradient: 'from-emerald-600 to-teal-700',
    icon: '⚽',
  },
  {
    title: '24/7 Security',
    description: 'Round-the-clock security with CCTV surveillance and trained personnel',
    image: 'https://dfsservices.co.in/blog/wp-content/uploads/2023/09/blog1.jpg',
    gradient: 'from-blue-500 to-blue-700',
    hoverGradient: 'from-blue-400 to-blue-600',
    textHover: 'text-blue-900',
    hoverText: 'group-hover:text-white',
    hoverBg: 'group-hover:from-blue-500 group-hover:to-blue-700',
    icon: '👮',
  },
  {
    title: 'Study Room',
    description: 'Quiet and well-lit study area with individual workstations',
    image: 'https://www.vrsiddhartha.ac.in/wp-content/uploads/2020/06/Girls-Hostel-Computer-Library.jpg',
    gradient: 'from-purple-500 to-indigo-700',
    hoverGradient: 'from-purple-500 to-indigo-600',
    textHover: 'text-purple-900',
    hoverText: 'group-hover:text-white',
    hoverBg: 'group-hover:from-purple-600 group-hover:to-indigo-700',
    icon: '📚',
  },
  {
    title: 'Sick Room',
    description: 'Dedicated medical room with first-aid facilities and basic care',
    image: 'https://www.vrsiddhartha.ac.in/wp-content/uploads/2020/06/Sick-Room.jpg',
    gradient: 'from-green-500 to-emerald-700',
    hoverGradient: 'from-green-400 to-emerald-600',
    textHover: 'text-green-900',
    hoverText: 'group-hover:text-white',
    hoverBg: 'group-hover:from-green-500 group-hover:to-emerald-700',
    icon: '🏥',
  },
];

const Amenities = () => {
  // This ID will be used for navigation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.4,
        delayChildren: 0.3,
        when: 'beforeChildren',
        staggerDirection: 1,
      },
    },
  };

  const fadeInUp = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.98,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    },
  };

  const item = (delay = 0) => ({
    hidden: { 
      y: 40, 
      opacity: 0,
      scale: 0.95,
    },
    show: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: delay,
        duration: 0.8,
      },
    },
    hover: {
      y: -15,
      scale: 1.03,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15,
        duration: 0.4,
      },
    },
  });

  const imageHover = {
    scale: 1.1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  };

  return (
    <section id="amenities" className="relative overflow-hidden py-10 md:py-14 bg-gradient-to-b from-slate-50 to-white">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ 
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.1
          }}
        >
          <span className="text-amber-500 font-semibold tracking-wider uppercase text-sm">Our Amenities</span>
          <h2 className="mt-2 text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Best<span className="bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text">Facilities</span>
          </h2>
          <div className="mt-4 h-1 w-24 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full"></div>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {amenities.map((amenity, index) => (
            <motion.div
              key={index}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 bg-white"
              variants={item(index * 0.1)}
              whileHover="hover"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <div className="relative h-2/3 group-hover:h-3/5 transition-all duration-500 ease-in-out overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                <motion.img 
                  src={amenity.image} 
                  alt={amenity.title}
                  className="w-full h-full object-cover"
                  whileHover={imageHover}
                  initial={{ scale: 1 }}
                />
                <div className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-white/90 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                  {amenity.icon}
                </div>
                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${amenity.gradient} z-20`}></div>
              </div>
              
              <motion.div 
                className={`relative h-1/3 group-hover:h-2/5 transition-all duration-500 ease-in-out overflow-hidden ${
                  index === 0 ? 'group-hover:bg-blue-400' : 
                  index === 1 ? 'group-hover:bg-orange-400' : 
                  index === 2 ? 'group-hover:bg-rose-400' : 
                  index === 3 ? 'group-hover:bg-indigo-400' : 
                  index === 4 ? 'group-hover:bg-cyan-400' : 
                  'group-hover:bg-emerald-400'}`}
                variants={fadeInUp}
                viewport={{ once: true }}
              >
                <div className={`p-6 relative h-full flex flex-col justify-center bg-white group-hover:bg-gradient-to-br ${
                  index === 0 ? 'group-hover:from-blue-400 group-hover:to-blue-500' : 
                  index === 1 ? 'group-hover:from-amber-400 group-hover:to-orange-500' : 
                  index === 2 ? 'group-hover:from-rose-400 group-hover:to-pink-500' : 
                  index === 3 ? 'group-hover:from-indigo-400 group-hover:to-purple-500' : 
                  index === 4 ? 'group-hover:from-cyan-400 group-hover:to-blue-500' : 
                  'group-hover:from-emerald-400 group-hover:to-teal-500'} transform group-hover:-translate-y-1 transition-all duration-500`}>
                  <motion.h3 
                    className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                      index === 0 ? 'text-gray-900 group-hover:text-blue-900' : 
                      index === 1 ? 'text-gray-900 group-hover:text-orange-900' : 
                      index === 2 ? 'text-gray-900 group-hover:text-rose-900' : 
                      index === 3 ? 'text-gray-900 group-hover:text-indigo-900' : 
                      index === 4 ? 'text-gray-900 group-hover:text-cyan-900' : 
                      'text-gray-900 group-hover:text-emerald-900'}`}
                  >
                    {amenity.title}
                  </motion.h3>
                  <motion.p 
                    className={`text-gray-600 group-hover:text-gray-900 font-medium transition-colors duration-500`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + (index * 0.1) }}
                  >
                    {amenity.description}
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Amenities;
