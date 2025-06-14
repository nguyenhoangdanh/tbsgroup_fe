'use client';

import React from 'react';
import HeroSection from '@/components/common/layouts/landing/HeroSection';
import FeaturesSection from '@/components/common/layouts/landing/FeaturesSection';
import AboutSection from '@/components/common/layouts/landing/AboutSection';

export default function Home() {
  return (
    <>
      {/* Multiple scroll targets for better compatibility */}
      <div id="page-top" style={{ position: 'absolute', top: 0, left: 0, height: '1px', width: '100%' }} />
      <span id="top" style={{ position: 'absolute', top: 0, left: 0 }} />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
    </>
  );
}
