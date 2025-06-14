/**
 * Tiện ích giúp debug các vấn đề với dialog
 */

export function checkDialogComponents(builtInActions: any) {
  // Check which form components are defined
  const formComponents = {
    createFormComponent: !!builtInActions?.createFormComponent,
    editFormComponent: !!builtInActions?.editFormComponent,
    viewFormComponent: !!builtInActions?.viewFormComponent,
    deleteFormComponent: !!builtInActions?.deleteFormComponent,
    customFormComponent: !!builtInActions?.customFormComponent
  };
  
  console.log('Form components status:', formComponents);
  
  // Check action types
  const actionTypes = {
    create: !!builtInActions?.create,
    edit: !!builtInActions?.edit,
    view: !!builtInActions?.view,
    delete: !!builtInActions?.delete
  };
  
  console.log('Action types status:', actionTypes);
  
  // Check for mismatches - action enabled but no form component
  const mismatches = [];
  
  if (actionTypes.create && !formComponents.createFormComponent) {
    mismatches.push('Create action is enabled but no createFormComponent provided');
  }
  
  if (actionTypes.edit && !formComponents.editFormComponent) {
    mismatches.push('Edit action is enabled but no editFormComponent provided');
  }
  
  if (actionTypes.view && !formComponents.viewFormComponent) {
    mismatches.push('View action is enabled but no viewFormComponent provided');
  }
  
  if (mismatches.length > 0) {
    console.warn('Dialog component configuration issues found:', mismatches);
    return false;
  }
  
  return true;
}

export function inspectDialogMounting(): void {
  if (typeof window === 'undefined') return;

  setTimeout(() => {
    // Kiểm tra DOM cho các dialog element
    const dialogs = document.querySelectorAll('.rpt-dialog-container');
    console.log(`Found ${dialogs.length} dialog containers in DOM`);
    
    if (dialogs.length === 0) {
      console.warn('No dialog containers found in DOM!');
    } else {
      // Check visibility and style của dialog container đầu tiên
      const dialog = dialogs[0];
      const style = window.getComputedStyle(dialog);
      console.log('Dialog container style:', {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        position: style.position,
        zIndex: style.zIndex
      });
      
      // Check backdrop
      const backdrop = document.querySelector('.rpt-dialog-backdrop');
      if (!backdrop) {
        console.warn('No dialog backdrop found!');
      } else {
        const backdropStyle = window.getComputedStyle(backdrop);
        console.log('Dialog backdrop style:', {
          display: backdropStyle.display,
          visibility: backdropStyle.visibility,
          opacity: backdropStyle.opacity,
          position: backdropStyle.position,
          zIndex: backdropStyle.zIndex
        });
      }
      
      // Check actual dialog box
      const dialogBox = document.querySelector('.rpt-dialog');
      if (!dialogBox) {
        console.warn('No dialog box found!');
      } else {
        const dialogBoxStyle = window.getComputedStyle(dialogBox);
        console.log('Dialog box style:', {
          display: dialogBoxStyle.display,
          visibility: dialogBoxStyle.visibility,
          opacity: dialogBoxStyle.opacity,
          position: dialogBoxStyle.position,
          zIndex: dialogBoxStyle.zIndex
        });
      }
    }
    
    // Check for z-index conflicts
    const highZIndexElements = [];
    const allElements = document.querySelectorAll('*');
    
    for (const element of allElements) {
      const style = window.getComputedStyle(element);
      const zIndex = parseInt(style.zIndex, 10);
      
      if (!isNaN(zIndex) && zIndex > 1000) {
        highZIndexElements.push({
          element: element.tagName,
          className: element.className,
          id: element.id,
          zIndex
        });
      }
    }
    
    console.log('High z-index elements:', highZIndexElements.sort((a, b) => b.zIndex - a.zIndex));
  }, 500);
}

export function verifyFormProvidersAvailable(): void {
  if (typeof window === 'undefined') return;
  
  setTimeout(() => {
    try {
      const providerTest = document.createElement('div');
      providerTest.id = 'provider-test';
      providerTest.style.display = 'none';
      document.body.appendChild(providerTest);
      
      // Log all available context attributes on window
      console.log('Window React contexts:', 
        Object.keys(window).filter(key => 
          key.includes('__react') || key.includes('Context') || key.includes('Provider')
        )
      );
      
      // Clean up
      document.body.removeChild(providerTest);
    } catch (err) {
      console.error('Error verifying providers:', err);
    }
  }, 1000);
}

export function forceDialogVisibility(): void {
  if (typeof window === 'undefined') return;
  
  setTimeout(() => {
    try {
      // Tìm và sửa lại styles cho dialog container nếu nó tồn tại
      const dialogContainer = document.querySelector('.rpt-dialog-container');
      if (dialogContainer) {
        (dialogContainer as HTMLElement).style.display = 'flex';
        (dialogContainer as HTMLElement).style.position = 'fixed';
        (dialogContainer as HTMLElement).style.top = '0';
        (dialogContainer as HTMLElement).style.left = '0';
        (dialogContainer as HTMLElement).style.width = '100%';
        (dialogContainer as HTMLElement).style.height = '100%';
        (dialogContainer as HTMLElement).style.zIndex = '9999';
        
        console.log('Fixed dialog container styles');
      } else {
        console.warn('Dialog container not found, cannot fix styles');
      }
      
      // Cũng kiểm tra backdrop và dialog
      const backdrop = document.querySelector('.rpt-dialog-backdrop');
      if (backdrop) {
        (backdrop as HTMLElement).style.display = 'flex';
        (backdrop as HTMLElement).style.opacity = '1';
        console.log('Fixed backdrop styles');
      }
      
      const dialog = document.querySelector('.rpt-dialog');
      if (dialog) {
        (dialog as HTMLElement).style.opacity = '1';
        (dialog as HTMLElement).style.transform = 'none';
        console.log('Fixed dialog box styles');
      }
    } catch (err) {
      console.error('Error forcing dialog visibility:', err);
    }
  }, 1000);
}

export default {
  checkDialogComponents,
  inspectDialogMounting,
  verifyFormProvidersAvailable,
  forceDialogVisibility
};
