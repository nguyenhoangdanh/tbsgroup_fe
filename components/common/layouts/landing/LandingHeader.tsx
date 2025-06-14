'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { useAuthManager } from '@/hooks/auth/useAuthManager';

import ThemeSwitcher from '../admin/ThemeSwitcher';
import UserAvatar from '../client/UserAvatar';
import ImageLogo from '../ImageLogo';


const navLinks = [
  { title: 'Trang chủ', path: '/' },
  {
    title: 'Sản phẩm',
    path: '/products',
    children: [
      { title: 'Túi xách', path: '/products/handbags' },
      { title: 'Balo', path: '/products/backpacks' },
      { title: 'Ví da', path: '/products/wallets' }
    ]
  },
  { title: 'Giới thiệu', path: '/about' },
  { title: 'Tin tức', path: '/news' },
  { title: 'Liên hệ', path: '/contact' }
];

const LandingHeader = () => {
  const { user } = useAuthManager();
  const { theme } = useTheme();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Enhanced scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl border-b border-gray-200 dark:border-slate-700'
          : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-md'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ImageLogo
                  variant={scrolled ? (theme === 'dark' ? 'dark' : 'light') : 'light'}
                  width={100}
                  height={40}
                  className="h-10 w-auto object-contain"
                  showGradient={false}
                  fallbackText="TBS"
                />
              </div>
              <div className={`hidden sm:block transition-colors duration-500 ${scrolled
                  ? 'text-slate-900 dark:text-white'
                  : theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                <div className={`font-bold text-lg leading-tight ${!scrolled && theme === 'dark' ? 'drop-shadow-lg text-shadow-strong' : ''
                  }`}>
                  Thoai Son
                </div>
                <div className={`text-xs opacity-90 leading-tight ${!scrolled && theme === 'dark' ? 'drop-shadow-md text-shadow' : ''
                  }`}>
                  Handbag Factory
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link, index) => (
              <div key={link.path} className="relative">
                {link.children ? (
                  <div
                    className="group"
                    onMouseEnter={() => setActiveDropdown(link.title)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button
                      className={`flex items-center space-x-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ${scrolled
                          ? 'text-slate-800 dark:text-slate-200 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : theme === 'dark'
                            ? 'text-white hover:text-white hover:bg-white/20 backdrop-blur-sm border border-transparent hover:border-white/40'
                            : 'text-slate-800 hover:text-green-600 hover:bg-green-50 backdrop-blur-sm border border-transparent hover:border-green-200'
                        } ${isActive(link.path) ? (
                          scrolled
                            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                            : theme === 'dark'
                              ? 'text-white bg-white/25 backdrop-blur-sm border border-white/50'
                              : 'text-green-600 bg-green-50 backdrop-blur-sm border border-green-200'
                        ) : ''}`}
                    >
                      <span className={!scrolled && theme === 'dark' ? 'drop-shadow-sm text-shadow-strong' : ''}>{link.title}</span>
                      <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === link.title && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden backdrop-blur-xl"
                        >
                          {link.children.map((child) => (
                            <Link
                              key={child.path}
                              href={child.path}
                              className="block px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 font-medium"
                            >
                              {child.title}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href={link.path}
                    className={`py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ${scrolled
                        ? 'text-slate-800 dark:text-slate-200 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : theme === 'dark'
                          ? 'text-white hover:text-white hover:bg-white/20 backdrop-blur-sm border border-transparent hover:border-white/40'
                          : 'text-slate-800 hover:text-green-600 hover:bg-green-50 backdrop-blur-sm border border-transparent hover:border-green-200'
                      } ${isActive(link.path) ? (
                        scrolled
                          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                          : theme === 'dark'
                            ? 'text-white bg-white/25 backdrop-blur-sm border border-white/50'
                            : 'text-green-600 bg-green-50 backdrop-blur-sm border border-green-200'
                      ) : ''}`}
                  >
                    <span className={!scrolled && theme === 'dark' ? 'drop-shadow-sm text-shadow-strong' : ''}>{link.title}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Switcher */}
            <div className={`${!scrolled ? 'backdrop-blur-sm bg-white/15 dark:bg-white/15 rounded-lg p-1.5 border border-white/30 dark:border-white/30' : ''}`}>
              <ThemeSwitcher />
            </div>

            {user ? (
              <div className={`${!scrolled ? 'backdrop-blur-sm bg-white/15 dark:bg-white/15 rounded-lg p-1.5 border border-white/30 dark:border-white/30' : ''}`}>
                <UserAvatar />
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={`font-medium transition-all duration-300 ${scrolled
                      ? 'text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : theme === 'dark'
                        ? 'text-white hover:text-white hover:bg-white/20 backdrop-blur-sm border border-white/50'
                        : 'text-slate-700 hover:text-green-600 hover:bg-green-50 backdrop-blur-sm border border-green-200'
                    }`}
                >
                  <Link href="/login">
                    <span className={!scrolled && theme === 'dark' ? 'drop-shadow-sm text-shadow-strong' : ''}>Đăng nhập</span>
                  </Link>
                </Button>
                {/* <Button 
                  size="sm" 
                  asChild
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href="/register">Đăng ký</Link>
                </Button> */}
              </div>
            )}

            {/* Admin Link */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className={`border-2 transition-all duration-300 font-medium ${scrolled
                    ? 'border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                    : theme === 'dark'
                      ? 'border-white/60 text-white hover:bg-white/20 backdrop-blur-sm'
                      : 'border-green-200 text-green-600 hover:bg-green-50 backdrop-blur-sm'
                  }`}
              >
                <Link href="/admin/dashboard">
                  <span className={!scrolled && theme === 'dark' ? 'drop-shadow-sm text-shadow-strong' : ''}>Quản trị</span>
                </Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2.5 rounded-lg transition-all duration-300 ${scrolled
                  ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : theme === 'dark'
                    ? 'text-white hover:bg-white/20 backdrop-blur-sm border border-white/40'
                    : 'text-slate-700 hover:bg-slate-100 backdrop-blur-sm border border-slate-200'
                }`}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.div>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-white dark:bg-slate-900 backdrop-blur-xl border-t border-gray-200 dark:border-slate-700 shadow-xl"
          >
            <div className="container mx-auto px-4 py-6 max-h-[70vh] overflow-y-auto">
              <nav className="space-y-2">
                {navLinks.map((link) => (
                  <div key={link.path}>
                    {link.children ? (
                      <div>
                        <button
                          onClick={() => setActiveDropdown(
                            activeDropdown === link.title ? null : link.title
                          )}
                          className="flex items-center justify-between w-full py-3 px-4 text-left font-medium text-slate-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                        >
                          {link.title}
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === link.title ? 'rotate-180' : ''
                            }`} />
                        </button>
                        <AnimatePresence>
                          {activeDropdown === link.title && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-4 space-y-1 mt-2 pl-4 border-l-2 border-green-200 dark:border-green-700"
                            >
                              {link.children.map((child) => (
                                <Link
                                  key={child.path}
                                  href={child.path}
                                  className="block py-2 px-3 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-all duration-200 font-medium"
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {child.title}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={link.path}
                        className={`block py-3 px-4 font-medium rounded-lg transition-all duration-200 ${isActive(link.path)
                            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                            : 'text-slate-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.title}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              {/* Mobile Auth Buttons */}
              {!user && (
                <div className="flex flex-col space-y-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <Button variant="outline" asChild className="w-full h-12 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                    <Link href="/login">Đăng nhập</Link>
                  </Button>
                  {/* <Button asChild className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <Link href="/register">Đăng ký</Link>
                  </Button> */}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default LandingHeader;
