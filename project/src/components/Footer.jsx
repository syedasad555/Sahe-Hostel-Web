import { Facebook, Twitter, Instagram, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer({ scrollToSection }) {
  const currentYear = new Date().getFullYear();
  
  const links = [
    {
      title: 'Quick Links',
      items: [
        { name: 'Home', href: '#home' },
        { name: 'Amenities', href: '#amenities' },
        { name: 'About Us', href: '#about' },
        { name: 'Complaint', href: '#contact' },
      ],
    },
    {
      title: 'Support',
      items: [
        { name: 'FAQs', href: '#' },
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Cancellation Policy', href: '#' },
      ],
    },
    {
      title: 'Contact Us',
      items: [
        { 
          name: '123 Beachfront Road, Seminyak, Bali', 
          icon: <MapPin className="w-4 h-4 mr-2 text-amber-500" />,
          href: '#'
        },
        { 
          name: '+1 (555) 123-4567', 
          icon: <Phone className="w-4 h-4 mr-2 text-amber-500" />,
          href: 'tel:+15551234567'
        },
        { 
          name: 'hello@serenityhaven.com', 
          icon: <Mail className="w-4 h-4 mr-2 text-amber-500" />,
          href: 'mailto:hello@serenityhaven.com'
        },
      ],
    },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
  ];

  return (
    <footer className="bg-black text-white pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4">
              SAHE<span className="text-amber-400"> Hostelers</span>
            </h3>
            <p className="text-gray-400 mb-6">
               A Comfortable Stay for Bright Minds. Experience premium hostel living with modern amenities, excellent facilities, and a supportive environment for academic success.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-400 hover:text-amber-400 transition-colors duration-300"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {links.map((section) => (
            <div key={section.title}>
              <h4 className="text-lg font-semibold mb-4 text-white">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const sectionId = item.href.replace('#', '');
                        scrollToSection(sectionId);
                      }}
                      className="flex items-center text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm w-full text-left"
                    >
                      {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} SAHE Hostelers. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-amber-400 text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-400 text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-400 text-sm">
                Sitemap
              </a>
            </div>
          </div>
          
          <div className="mt-6 text-center md:text-right">
            
          </div>
        </div>
      </div>
    </footer>
  );
}
