/**
 * Debugging utility for dialog issues
 */

export function inspectDialog() {
  if (typeof window === 'undefined') return;

  setTimeout(() => {
    // Check if the dialog container exists
    const dialogContainer = document.querySelector('.rpt-dialog-container');
    console.log(`Dialog container found: ${!!dialogContainer}`);

    if (dialogContainer) {
      // Check visibility
      const containerStyle = window.getComputedStyle(dialogContainer);
      console.log('Dialog container style:', {
        display: containerStyle.display,
        visibility: containerStyle.visibility,
        opacity: containerStyle.opacity,
        position: containerStyle.position,
        zIndex: containerStyle.zIndex
      });

      // Check backdrop
      const backdrop = document.querySelector('.rpt-dialog-backdrop');
      console.log(`Dialog backdrop found: ${!!backdrop}`);

      if (backdrop) {
        const backdropStyle = window.getComputedStyle(backdrop);
        console.log('Backdrop style:', {
          display: backdropStyle.display,
          visibility: backdropStyle.visibility,
          opacity: backdropStyle.opacity,
          position: backdropStyle.position,
          zIndex: backdropStyle.zIndex
        });
      }

      // Check dialog itself
      const dialog = document.querySelector('.rpt-dialog');
      console.log(`Dialog itself found: ${!!dialog}`);

      if (dialog) {
        const dialogStyle = window.getComputedStyle(dialog);
        console.log('Dialog style:', {
          display: dialogStyle.display,
          visibility: dialogStyle.visibility,
          opacity: dialogStyle.opacity,
          position: dialogStyle.position,
          transform: dialogStyle.transform,
          zIndex: dialogStyle.zIndex
        });

        // Check for form inside dialog
        const formInside = dialog.querySelector('form');
        console.log(`Form inside dialog found: ${!!formInside}`);
      }
    }
  }, 200);
}

export default { inspectDialog };
