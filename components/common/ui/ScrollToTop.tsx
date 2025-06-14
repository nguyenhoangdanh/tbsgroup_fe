'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface ScrollToTopProps {
  showAfter?: number;
  className?: string;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ 
  showAfter = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState({
    scrollY: 0,
    documentHeight: 0,
    windowHeight: 0,
    maxScroll: 0,
    canScroll: false
  });

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = documentHeight - windowHeight;
      const canScroll = maxScroll > 0;
      
      let scrollPercent = 0;
      if (maxScroll > 0) {
        scrollPercent = (scrollY / maxScroll) * 100;
      }
      const scrollPercentRounded = Math.max(0, Math.min(100, Math.round(scrollPercent)));
      
      setScrollProgress(scrollPercentRounded);
      
      // TEMPORARY: Force show button for testing when page is too short
      const shouldShow = scrollY > showAfter || !canScroll;
      setIsVisible(shouldShow);
      
      setDebugInfo({
        scrollY: Math.round(scrollY),
        documentHeight: Math.round(documentHeight),
        windowHeight: Math.round(windowHeight),
        maxScroll: Math.round(maxScroll),
        canScroll
      });
      
      console.log('=== SCROLL DEBUG DETAILED ===', {
        'scrollY': scrollY,
        'documentHeight': documentHeight,
        'windowHeight': windowHeight,
        'maxScroll': maxScroll,
        'canScroll': canScroll,
        'shouldShow': shouldShow,
        'scrollPercent': scrollPercentRounded,
        'pageCanScroll': canScroll ? 'YES' : 'NO - PAGE TOO SHORT'
      });
    };

    toggleVisibility();

    const handleScroll = () => {
      console.log('SCROLL EVENT TRIGGERED');
      toggleVisibility();
    };

    // Multiple event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', toggleVisibility, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // Force check every 2 seconds for debugging
    const debugInterval = setInterval(() => {
      console.log('FORCE DEBUG CHECK');
      toggleVisibility();
    }, 2000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', toggleVisibility);
      document.removeEventListener('scroll', handleScroll);
      clearInterval(debugInterval);
    };
  }, [showAfter]);

  const scrollToTop = () => {
    console.log('ScrollToTop clicked - attempting scroll');
    
    try {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      console.log('Scroll executed successfully');
    } catch (error) {
      console.error('Scroll error:', error);
    }
  };

  const addTestContent = () => {
    // Add temporary content to make page scrollable
    const testDiv = document.createElement('div');
    testDiv.id = 'scroll-test-content';
    testDiv.style.cssText = `
      height: 2000px;
      background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
      padding: 20px;
      margin: 20px 0;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      color: #374151;
    `;
    testDiv.innerHTML = `
      <div style="padding: 40px;">
        <h2>🧪 TEST CONTENT FOR SCROLLING</h2>
        <p>This content was added to test scroll functionality</p>
        <p style="margin-top: 1000px;">Middle of test content</p>
        <p style="margin-top: 800px;">End of test content</p>
      </div>
    `;
    
    // Add after the main content
    const main = document.querySelector('main');
    if (main && !document.getElementById('scroll-test-content')) {
      main.appendChild(testDiv);
      console.log('Test content added to make page scrollable');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999999,
        pointerEvents: 'auto'
      }}
      className={className}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Progress ring */}
            <div className="relative w-16 h-16">
              <svg 
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  stroke="#e5e7eb"
                  strokeWidth="2"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#22c55e"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="100"
                  strokeDashoffset={100 - scrollProgress}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  style={{
                    transition: 'stroke-dashoffset 0.3s ease'
                  }}
                />
              </svg>

              {/* Main button */}
              <button
                onClick={scrollToTop}
                className="absolute inset-0 w-16 h-16 rounded-full bg-white shadow-xl hover:shadow-2xl border-2 border-green-200 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-green-400/30"
                style={{
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                }}
              >
                <ChevronUp 
                  size={20} 
                  className="text-green-600" 
                  strokeWidth={3}
                />
              </button>
            </div>

            {/* Progress percentage */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {scrollProgress}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScrollToTop;
