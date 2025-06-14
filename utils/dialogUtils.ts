/**
 * Utility functions for handling dialog rendering issues
 */

/**
 * Checks if dialog elements are properly mounted and visible
 */
export function inspectDialogs() {
  const dialogContainers = document.querySelectorAll('.rpt-dialog-container');
  console.log(`Found ${dialogContainers.length} dialog containers`);
  
  if (dialogContainers.length === 0) {
    console.log('No dialog containers found in DOM');
    return false;
  }
  
  // Check container styles
  const container = dialogContainers[0] as HTMLElement;
  const containerStyle = window.getComputedStyle(container);
  
  console.log('Dialog container styles:', {
    display: containerStyle.display,
    visibility: containerStyle.visibility,
    opacity: containerStyle.opacity,
    position: containerStyle.position,
    zIndex: containerStyle.zIndex
  });
  
  // Check backdrop
  const backdrops = document.querySelectorAll('.rpt-dialog-backdrop');
  console.log(`Found ${backdrops.length} dialog backdrops`);
  
  // Check dialog box
  const dialogs = document.querySelectorAll('.rpt-dialog');
  console.log(`Found ${dialogs.length} dialog boxes`);
  
  return dialogContainers.length > 0;
}

/**
 * Force renders dialog elements with inline styles
 * Use this as a last resort if dialog CSS isn't being applied
 */
export function forceRenderDialogs() {
  const dialogContainers = document.querySelectorAll('.rpt-dialog-container');
  
  if (dialogContainers.length === 0) {
    console.log('No dialog containers to force render');
    return false;
  }
  
  dialogContainers.forEach(container => {
    const el = container as HTMLElement;
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.zIndex = '9999';
    
    // Also set backdrop styles
    const backdrop = container.querySelector('.rpt-dialog-backdrop') as HTMLElement;
    if (backdrop) {
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.width = '100%';
      backdrop.style.height = '100%';
      backdrop.style.display = 'flex';
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      backdrop.style.zIndex = '10000';
    }
    
    // And dialog box
    const dialog = container.querySelector('.rpt-dialog') as HTMLElement;
    if (dialog) {
      dialog.style.backgroundColor = '#ffffff';
      dialog.style.borderRadius = '8px';
      dialog.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
      dialog.style.display = 'flex';
      dialog.style.flexDirection = 'column';
      dialog.style.width = '500px';
      dialog.style.maxWidth = '90vw';
      dialog.style.maxHeight = '90vh';
      dialog.style.overflow = 'hidden';
      dialog.style.zIndex = '10001';
    }
  });
  
  return true;
}

/**
 * Add the dialog utility to window for easy access from console
 */
export function exposeDialogUtilsToWindow() {
  if (typeof window !== 'undefined') {
    (window as any).__dialogUtils = {
      inspect: inspectDialogs,
      forceRender: forceRenderDialogs
    };
    console.log('Dialog utilities exposed to window.__dialogUtils');
  }
}

/**
 * Fix common dialog styling issues
 */
export function fixDialogStyling() {
  // Create a style element for our dialog CSS fixes
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .rpt-dialog-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 9999 !important;
    }
    
    .rpt-dialog-backdrop {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-color: rgba(0, 0, 0, 0.5) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 10000 !important;
    }
    
    .rpt-dialog {
      background-color: #ffffff !important;
      border-radius: 0.5rem !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
      width: 500px !important;
      max-width: 90vw !important;
      max-height: 90vh !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      z-index: 10001 !important;
      position: relative !important;
    }
  `;
  
  document.head.appendChild(styleElement);
  console.log('Added dialog style fixes');
  
  return () => {
    document.head.removeChild(styleElement);
  };
}

export default {
  inspectDialogs,
  forceRenderDialogs,
  exposeDialogUtilsToWindow,
  fixDialogStyling
};
