// components/security/ActivityMonitor.tsx
'use client';

import { throttle } from 'lodash';
import { useEffect } from 'react';

import { useSecurityContext } from '@/contexts/security/SecurityContext';

export default function ActivityMonitor() {
  const { updateActivity } = useSecurityContext();

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];

    // Chỉ kích hoạt tối đa mỗi 5 giây
    const throttledActivity = throttle(() => {
      updateActivity();
    }, 5000);

    events.forEach(event => {
      window.addEventListener(event, throttledActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledActivity);
      });
    };
  }, [updateActivity]);

  return null;
}
