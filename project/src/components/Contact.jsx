import { Mail, Phone, MapPin, Clock, Send, ClipboardList } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useState } from 'react';
import axios from 'axios';

export default function Contact() {
  const [ref, isVisible] = useScrollAnimation();
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: null, text: '' });
    setSubmitting(true);
    try {
      const { data } = await axios.post('/api/complaints', {
        name: formData.name,
        rollNumber: formData.rollNumber,
        phone: formData.phone,
        message: formData.message,
      });
      setFeedback({ type: 'success', text: data.message || 'Complaint submitted successfully.' });
      setFormData({ name: '', rollNumber: '', phone: '', message: '' });
    } catch (err) {
      let msg = err.response?.data?.message;
      if (!msg) {
        if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
          msg =
            'Cannot reach the server. Start the API on port 5000 and open the site via npm run dev (or npm start) so /api requests are proxied.';
        } else {
          msg = 'Something went wrong. Please try again or contact the hostel office.';
        }
      }
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: ['Supervisor 1: +91  8247690587', 'Supervisor 2: +91  8686699318'],
      color: 'from-blue-400 to-blue-600',
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['hostel@vrsiddhartha.ac.in', 'sahe.support@college.edu'],
      color: 'from-amber-400 to-amber-600',
    },
    {
      icon: MapPin,
      title: 'Location',
      details: ['Siddhartha Academy Of Higher Education', 'Kanuru, Vijayawada, Andhra Pradesh'],
      color: 'from-green-400 to-green-600',
    },
    {
      icon: Clock,
      title: 'Hours',
      details: ['Complaint desk: 9 AM – 5 PM (Mon–Sat)', 'Warden on call after hours'],
      color: 'from-purple-400 to-purple-600',
    },
  ];

  return (
    <section id="contact" className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`text-center mb-10 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Raise a <span className="text-amber-600">Complaint</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Share your concern with the hostel office. We will review and respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div
              className={`bg-white rounded-3xl shadow-xl p-8 md:p-12 transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
            >
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                  <ClipboardList className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Complaint box</h3>
              </div>

              {feedback.type && (
                <div
                  className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                  role="status"
                >
                  {feedback.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="group">
                    <label htmlFor="complaint-name" className="block text-gray-700 font-medium mb-2">
                      Name
                    </label>
                    <input
                      id="complaint-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors duration-300 group-hover:border-gray-300"
                      placeholder="Your full name"
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="group">
                    <label htmlFor="complaint-roll" className="block text-gray-700 font-medium mb-2">
                      Roll number
                    </label>
                    <input
                      id="complaint-roll"
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors duration-300 group-hover:border-gray-300"
                      
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="complaint-phone" className="block text-gray-700 font-medium mb-2">
                    Phone number
                  </label>
                  <input
                    id="complaint-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors duration-300 group-hover:border-gray-300"
      
                    required
                    autoComplete="tel"
                  />
                </div>

                <div className="group">
                  <label htmlFor="complaint-message" className="block text-gray-700 font-medium mb-2">
                    Raise a complaint
                  </label>
                  <textarea
                    id="complaint-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors duration-300 resize-none group-hover:border-gray-300"
                    placeholder="Describe your issue clearly (room,ragging, meals, maintenance, etc.)"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full md:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-lg font-semibold rounded-full overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-60 disabled:pointer-events-none disabled:hover:scale-100"
                >
                  <span className="relative z-10">{submitting ? 'Submitting…' : 'Submit complaint'}</span>
                  <Send className="relative z-10" size={20} />
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className={`group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 cursor-default transform hover:-translate-y-1 ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                  >
                    <info.icon className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors duration-300">
                      {info.title}
                    </h4>
                    {info.details.map((detail, i) => (
                      <p key={i} className="text-gray-600 text-sm">
                        {detail}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`rounded-3xl overflow-hidden shadow-2xl transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="relative h-96 bg-gray-200">
            <iframe
              src="https://maps.google.com/maps?q=16.4853,80.6916&hl=en&z=15&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
              title="Siddhartha Academy Of Higher Education"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
