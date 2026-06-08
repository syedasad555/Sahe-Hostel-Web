import { MapPin, Phone, Mail } from 'lucide-react';

/** Development team — update names here */
const DEVELOPMENT_TEAM = {
  facultyCoordinator: {
    name: 'Dr. K. Suvarna Vani',
    linkedIn: 'https://www.linkedin.com/in/dr-suvarna-vani-koneru-3046a1103/',
  },
  developers: [
    {
      name: 'Syed Asad',
      linkedIn: 'https://www.linkedin.com/in/syed-asadullah-4101652a4/',
    },
    {
      name: 'Guttikonda Sahith',
      linkedIn: 'https://www.linkedin.com/in/sahith-guttikonda-3b89402a3/',
    },
  ],
};

const QUICK_LINKS = [
  { name: 'Home', href: '#home' },
  { name: 'Amenities', href: '#amenities' },
  { name: 'About Us', href: '#about' },
  { name: 'Complaint', href: '#contact' },
];

const CONTACT_ITEMS = [
  {
    name: 'SAHE, Kanuru, Vijayawada, AP',
    icon: <MapPin className="w-4 h-4 mr-2 text-amber-500" />,
    href: '#',
  },
  {
    name: '8247690587',
    icon: <Phone className="w-4 h-4 mr-2 text-amber-500" />,
    href: 'tel:8247690587',
  },
  {
    name: 'sugirlshostels@gmail.com',
    icon: <Mail className="w-4 h-4 mr-2 text-amber-500" />,
    href: 'mailto:sugirlshostels@gmail.com',
  },
];

export default function Footer({ scrollToSection }) {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (href) => {
    if (href.startsWith('#') && href.length > 1) {
      scrollToSection(href.replace('#', ''));
    }
  };

  return (
    <footer className="bg-black text-white pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4">
              SAHE<span className="text-amber-400"> Hostelers</span>
            </h3>
            <p className="text-gray-400 mb-6">
              A Comfortable Stay for Bright Minds. Experience premium hostel living with modern
              amenities, excellent facilities, and a supportive environment for academic success.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(item.href)}
                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm w-full text-left"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact Us</h4>
            <ul className="space-y-3">
              {CONTACT_ITEMS.map((item) => (
                <li key={item.name}>
                  {item.href.startsWith('#') ? (
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.href)}
                      className="flex items-center text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm w-full text-left"
                    >
                      {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                      {item.name}
                    </button>
                  ) : (
                    <a
                      href={item.href}
                      className="flex items-center text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm"
                    >
                      {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                      {item.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-4">
              Developed by
            </p>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Faculty Coordinator</p>
                <a
                  href={DEVELOPMENT_TEAM.facultyCoordinator.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-200 font-medium hover:text-amber-400 transition-colors duration-300"
                >
                  {DEVELOPMENT_TEAM.facultyCoordinator.name}
                </a>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Developers</p>
                <ul className="space-y-2">
                  {DEVELOPMENT_TEAM.developers.map((dev) => (
                    <li key={dev.name}>
                      <a
                        href={dev.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-200 font-medium hover:text-amber-400 transition-colors duration-300"
                      >
                        {dev.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} SAHE Hostelers. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
