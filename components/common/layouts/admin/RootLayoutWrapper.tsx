'use client';

import React from 'react';

import GlobalDialog from '../../table/actions/GlobalDialog';

const RootLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <GlobalDialog />
    </>
  );
};

export default RootLayoutWrapper;
