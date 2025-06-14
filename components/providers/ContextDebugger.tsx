'use client';

import React, { useEffect } from 'react';
import { useFormHandling } from 'react-table-power';

const ContextDebugger = () => {
  useEffect(() => {
    try {
      // Kiểm tra FormHandlingContext có hoạt động không
      console.log('[Context Debugger] Testing FormHandlingContext...');
      
      const formHandling = useFormHandling();
      if (formHandling) {
        console.log('[Context Debugger] FormHandlingContext is available!', {
          availableMethods: Object.keys(formHandling)
        });
      }
    } catch (err) {
      console.error('[Context Debugger] FormHandlingContext is NOT available!', err);
    }
    
    // Kiểm tra DOM được render
    console.log('[Context Debugger] Checking for dialog elements in DOM...');
    setTimeout(() => {
      // Kiểm tra dialog elements có được render không
      const dialogElements = document.querySelectorAll('.rpt-dialog-container, .rpt-dialog-backdrop, .rpt-dialog');
      console.log(`[Context Debugger] Found ${dialogElements.length} dialog elements`);
      
      // Kiểm tra z-index
      dialogElements.forEach(el => {
        if (el instanceof HTMLElement) {
          const style = window.getComputedStyle(el);
          const elName = el.className;
          console.log(`[Context Debugger] ${elName} - z-index: ${style.zIndex}, position: ${style.position}`);
        }
      });
    }, 2000);
  }, []);

  return null; // Component này không render bất kỳ giao diện nào
};

export default ContextDebugger;
