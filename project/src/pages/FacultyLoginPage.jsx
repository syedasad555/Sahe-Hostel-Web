import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User } from 'lucide-react';

const INPUT_CLASS =
  'block w-full pl-11 pr-4 py-3 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-[box-shadow,border-color] duration-150 ease-out placeholder-slate-400 shadow-inner';

const FacultyLoginPage = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const iconRef = useRef(null);
  const iconMoveRaf = useRef(null);
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  const handleMouseMove = (e) => {
    if (!iconRef.current) return;
    if (iconMoveRaf.current != null) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    iconMoveRaf.current = requestAnimationFrame(() => {
      iconMoveRaf.current = null;
      const el = iconRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateY = (x - centerX) / 20;
      const rotateX = (centerY - y) / 20;
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
  };

  const handleMouseLeave = () => {
    if (iconMoveRaf.current != null) {
      cancelAnimationFrame(iconMoveRaf.current);
      iconMoveRaf.current = null;
    }
    if (!iconRef.current) return;
    iconRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    setIsHovered(false);
  };

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      if (iconMoveRaf.current != null) {
        cancelAnimationFrame(iconMoveRaf.current);
        iconMoveRaf.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      const response = await fetch('/api/auth/faculty/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store authentication token and faculty data
        localStorage.setItem('facultyToken', data.token);
        localStorage.setItem('facultyData', JSON.stringify(data.faculty));
        localStorage.setItem('facultyAuthenticated', 'true');
        
        // Close the popup and redirect to faculty page
        if (onClose) onClose();
        navigate('/faculty');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-slate-900/80"
        onClick={onClose}
      ></div>

      {/* Popup Content */}
      <div className="relative w-full max-w-md group">
        <button
          onClick={onClose}
          className="absolute -top-10 -right-2 p-2 text-slate-200 hover:bg-white/10 rounded-full transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-cyan-700 px-8 pt-12 pb-8 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_25%)]"></div>
            <div className="relative flex flex-col items-center">
              <div
                ref={iconRef}
                className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white -mt-8 hover:shadow-2xl hover:shadow-blue-500/30 [transform-style:preserve-3d]"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
              >
                <User
                  className={`h-10 w-10 text-white transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}
                  strokeWidth={2}
                />
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 bg-white transition-opacity duration-300"></div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-100/80">Secure Access</p>
                <h2 className="text-2xl font-bold text-white">Faculty Portal</h2>
                <p className="text-indigo-100 text-sm font-medium">Sign in to manage academic operations</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pt-8 pb-8 bg-white">
            {error && (
              <div className="mb-6 p-3 bg-rose-50 border border-rose-100 rounded-lg shadow-sm flex items-start space-x-2">
                <span className="text-rose-500 text-sm font-semibold">!</span>
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Email Field */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password Field */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  className="group relative w-full py-3.5 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 shadow-lg hover:shadow-indigo-200/50 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 whitespace-nowrap overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="truncate">Sign In</span>
                  </span>
                </button>
                <p className="text-xs text-slate-500 text-center">Use your official faculty credentials to access the dashboard.</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLoginPage;
