import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/about.css';

const WhyChoose = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 40, 
      scale: 0.95 
    },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        delay: i * 0.1,
        ease: [0.16, 1, 0.3, 1],
        opacity: { duration: 0.8 },
        y: { duration: 0.8 },
        scale: { duration: 0.8 }
      }
    })
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  const features = [
    {
      number: '01',
      title: 'Prime Location',
      description: 'Strategically located near major educational institutions with excellent connectivity to public transport.',
      icon: '📍',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      number: '02',
      title: 'Affordable Pricing',
      description: 'Competitive pricing with flexible payment options and transparent fee structure without hidden charges.',
      icon: '💰',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      number: '03',
      title: 'Experienced Management',
      description: 'Over 3 decades of experience in student accommodation with a proven track record of excellence.',
      icon: '🏆',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      number: '04',
      title: 'Student-Centric Approach',
      description: 'All policies and facilities are designed keeping student needs and preferences at the center.',
      icon: '🎓',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  /** Images live in `public/coordinators/` (served as `/coordinators/...`) */
  const teamMembers = [
    {
      name: 'Dr. K. Suvarna Vani ',
      role: 'Chief Warden',
      image: 'Suvarna-Vani-K.webp',
    },
    {
      name: 'P. Ramadevi',
      role: 'Assistant Warden',
      image: 'ramadevi.jpeg',
    },
    {
      name: 'Dr. P. Sukanya',
      role: 'Assistant Warden',
      image: 'sukanya.png',
    },
    {
      name: 'Dr. M.V.D.N.S Madhavi',
      role: 'Assistant Warden',
      image: 'madhavi.png',
    },
    {
      name: 'G.Sunitha',
      role: 'Supervisor',
      image: 'sunitha.jpeg',
    },
    {
      name: 'S. Aparna',
      role: 'Supervisor',
      image: 'aparna.jpeg',
    },
    {
      name: 'M . VENKATA RAGHU PRASAD RAO',
      role: 'Clerk',
      image: 'clerk.jpeg',
    },
    {
      name: 'Murugudu Bala Venkata Naga Rama',
      role: 'Data Entry Operator',
      image: 'dataentry.jpeg',
    },
  ];

  return (
    <div id="about" className="about-page">
      {/* Why Choose Section */}
      <section className="why-choose-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <span className="section-badge">Why Choose Us</span>
            <h2 className="section-title">Why Choose SAHE Hostels?</h2>
            <p className="section-subtitle">
              Discover what makes us the preferred choice for student accommodation
            </p>
            <div className="title-underline">
              <div className="underline-bar"></div>
            </div>
          </motion.div>

          <motion.div 
            className="features-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                custom={index}
                variants={itemVariants}
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  transition: { 
                    duration: 0.3, 
                    ease: "easeOut",
                    boxShadow: { duration: 0.3 }
                  }
                }}
              >
                <div className={`feature-icon-wrapper bg-gradient-to-br ${feature.gradient}`}>
                  <span className="feature-icon">{feature.icon}</span>
                </div>
                <div className="feature-number">{feature.number}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className={`feature-glow bg-gradient-to-br ${feature.gradient}`}></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section — layout matches “Meet Our Team” reference cards */}
      <section id="coordinators" className="team-section team-section--meet">
        <div className="container team-section__inner">
          <motion.div
            className="section-header team-section__header"
            initial={{ opacity: 0, y: -16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h2 className="section-title team-section__title">Meet the Coordinators</h2>
          </motion.div>

          <motion.div sky
            className="team-grid team-grid--coordinators"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={containerVariants}
          >
            {teamMembers.map((member, index) => (
              <motion.article
                key={member.image}
                className="team-card team-card--coordinator"
                custom={index}
                variants={itemVariants}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.2, ease: 'easeOut' },
                }}
              >
                <div className="team-photo-wrap">
                  <img
                    src={`/coordinators/${member.image}`}
                    alt={member.name}
                    loading="lazy"
                  />
                </div>
                <div className="team-content">
                  <h3 className="team-name">{member.name.trim()}</h3>
                  <p className="team-role">{member.role}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default WhyChoose;
