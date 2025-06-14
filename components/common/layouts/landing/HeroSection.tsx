'use client';

import { motion } from 'framer-motion';
import { ChevronDown, Play, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const { theme } = useTheme();

  return (
    <section className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-100 via-white to-slate-200'
    }`}>
      {/* Background Pattern */}
      <div className={`absolute inset-0 bg-[url('/images/grid-pattern.svg')] transition-opacity duration-500 ${
        theme === 'dark' ? 'opacity-20' : 'opacity-10'
      }`}></div>
      
      {/* Animated Background Shapes */}
      <motion.div
        className={`absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl transition-colors duration-500 ${
          theme === 'dark' ? 'bg-green-500/15' : 'bg-green-500/20'
        }`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: theme === 'dark' ? [0.15, 0.25, 0.15] : [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl transition-colors duration-500 ${
          theme === 'dark' ? 'bg-emerald-500/15' : 'bg-emerald-500/20'
        }`}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: theme === 'dark' ? [0.1, 0.2, 0.1] : [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium mb-6 transition-colors duration-500 ${
                theme === 'dark' 
                  ? 'bg-green-500/10 border-green-500/20 text-green-300'
                  : 'bg-green-50 border-green-200 text-green-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                theme === 'dark' ? 'bg-green-400' : 'bg-green-500'
              }`}></span>
              Tổ hợp công nghiệp hàng đầu Việt Nam
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              <span className={`block ${theme === 'dark' ? 'text-shadow-strong' : ''}`}>TỔ HỢP</span>
              <span className="block bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 bg-clip-text text-transparent">
                TÚI XÁCH
              </span>
              <span className={`block ${theme === 'dark' ? 'text-shadow-strong' : ''}`}>THOẠI SƠN</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className={`text-lg sm:text-xl mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed transition-colors duration-500 ${
                theme === 'dark' 
                  ? 'text-slate-300 text-shadow' 
                  : 'text-slate-700'
              }`}
            >
              Chuyên sản xuất và kinh doanh túi xách chất lượng cao, phục vụ thị trường trong nước và xuất khẩu với công nghệ hiện đại và đội ngũ chuyên nghiệp.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Link href="/about" className="flex items-center">
                  Khám phá ngay
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className={`border-2 font-semibold px-8 py-4 rounded-full transition-all duration-300 group ${
                  theme === 'dark' 
                    ? 'border-slate-600 text-white hover:bg-slate-800' 
                    : 'border-slate-400 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Xem video giới thiệu
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className={`grid grid-cols-3 gap-6 mt-12 pt-8 border-t transition-colors duration-500 ${
                theme === 'dark' ? 'border-slate-700' : 'border-slate-300'
              }`}
            >
              <div className="text-center lg:text-left">
                <div className={`text-2xl sm:text-3xl font-bold transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>25+</div>
                <div className={`text-sm transition-colors duration-500 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>Năm kinh nghiệm</div>
              </div>
              <div className="text-center lg:text-left">
                <div className={`text-2xl sm:text-3xl font-bold transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>1000+</div>
                <div className={`text-sm transition-colors duration-500 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>Sản phẩm</div>
              </div>
              <div className="text-center lg:text-left">
                <div className={`text-2xl sm:text-3xl font-bold transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>50+</div>
                <div className={`text-sm transition-colors duration-500 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>Quốc gia xuất khẩu</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Image */}
              <motion.div
                className="relative z-10 rounded-2xl overflow-hidden shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src="/images/slider-01.jpg"
                  alt="TBS Factory"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </motion.div>

              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className={`absolute -bottom-6 -left-6 backdrop-blur-lg rounded-xl p-4 border transition-colors duration-500 ${
                  theme === 'dark' 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/90 border-white/50 shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">✓</span>
                  </div>
                  <div>
                    <div className={`font-semibold transition-colors duration-500 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>Chất lượng ISO</div>
                    <div className={`text-sm transition-colors duration-500 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>Tiêu chuẩn quốc tế</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className={`absolute -top-6 -right-6 backdrop-blur-lg rounded-xl p-4 border transition-colors duration-500 ${
                  theme === 'dark' 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/90 border-white/50 shadow-lg'
                }`}
              >
                <div className="text-center">
                  <div className={`text-2xl font-bold transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>24/7</div>
                  <div className={`text-sm transition-colors duration-500 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>Hỗ trợ khách hàng</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`cursor-pointer transition-colors duration-500 ${
              theme === 'dark' 
                ? 'text-slate-400 hover:text-white' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChevronDown className="w-6 h-6 mx-auto" />
            <span className={`text-sm block mt-2 ${theme === 'dark' ? 'text-shadow' : ''}`}>
              Cuộn xuống để khám phá
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
