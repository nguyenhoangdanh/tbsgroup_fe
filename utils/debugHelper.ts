/**
 * Utility to track render cycles and component mounts
 */
export function debugRender(componentName: string, props?: any) {
  console.log(`🔍 ${componentName} render`, props ? { props } : '');
}

/**
 * Utility to track dialog state
 */
export function debugDialog(state: {
  open: boolean;
  type?: string;
  data?: any;
  title?: string;
}) {
  console.log('📝 Dialog state:', {
    open: state.open,
    type: state.type,
    title: state.title,
    hasData: !!state.data,
    dataType: state.data ? typeof state.data : 'none',
    dataKeys: state.data ? Object.keys(state.data) : []
  });
}

/**
 * Debug hook to check if component is mounted in the DOM
 */
export function debugDOMMount(componentName: string, selector: string) {
  if (typeof document !== 'undefined') {
    setTimeout(() => {
      const element = document.querySelector(selector);
      console.log(`🔍 ${componentName} DOM mount check:`, {
        mounted: !!element,
        element: element
      });
    }, 500);
  }
}
