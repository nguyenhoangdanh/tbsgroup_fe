// ClientSideProviders.tsx
'use client';
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store/store';

const SagaProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <Provider store={store}>{children}</Provider>;
};

export default SagaProviders;