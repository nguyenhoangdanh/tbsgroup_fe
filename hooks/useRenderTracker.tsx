'use client';

import React, { useRef, useEffect } from 'react';

// Hook này có thể sử dụng để theo dõi khi nào một component re-render và nguyên nhân
export function useRenderTracker(
  componentName: string,
  props: Record<string, any>,
  onlyWarnIfChanged = true,
) {
  const renderCount = useRef(0);
  const prevProps = useRef<Record<string, any>>(props);

  useEffect(() => {
    renderCount.current += 1;

    if (renderCount.current > 1) {
      const changedProps: Record<string, { from: any; to: any }> = {};
      let hasChanged = false;

      // So sánh các props để xác định cái nào đã thay đổi
      Object.keys(props).forEach(key => {
        if (props[key] !== prevProps.current[key]) {
          changedProps[key] = {
            from: prevProps.current[key],
            to: props[key],
          };
          hasChanged = true;
        }
      });

      // Kiểm tra props mới thêm vào
      Object.keys(props).forEach(key => {
        if (!(key in prevProps.current)) {
          changedProps[key] = {
            from: 'undefined',
            to: props[key],
          };
          hasChanged = true;
        }
      });

      // Kiểm tra props bị xóa
      Object.keys(prevProps.current).forEach(key => {
        if (!(key in props)) {
          changedProps[key] = {
            from: prevProps.current[key],
            to: 'undefined',
          };
          hasChanged = true;
        }
      });

      if (!onlyWarnIfChanged || hasChanged) {
        console.log(`[RenderTracker] ${componentName} re-rendered (${renderCount.current} times)`);
        if (hasChanged) {
          console.log('Props thay đổi:', changedProps);
        } else {
          console.log('Re-render không phải do props thay đổi');
        }
      }
    }

    prevProps.current = { ...props };
  });
}

// HOC để gói component trong một Profiler để theo dõi thời gian render
export function withRenderProfiler<P extends object>(
  Component: React.ComponentType<P>,
  id: string,
) {
  const ProfiledComponent = (props: P) => (
    <React.Profiler
      id={id}
      onRender={(id, phase, actualDuration) => {
        if (actualDuration > 5) {
          // Chỉ log nếu thời gian render > 5ms
          console.log(
            `[RenderProfiler] ${id} (${phase}) took ${actualDuration.toFixed(2)}ms to render`,
          );
        }
      }}
    >
      <Component {...props} />
    </React.Profiler>
  );

  ProfiledComponent.displayName = `ProfiledComponent(${Component.displayName || Component.name || 'Component'})`;
  return ProfiledComponent;
}

//Utility để tạo một custom comparator cho React.memo
export function createShallowEqualsMemoComparator<T extends Record<string, any>>(
  propsToCompare: (keyof T)[] = [],
) {
  return (prevProps: T, nextProps: T) => {
    // Nếu không chỉ định props cụ thể, so sánh tất cả các props
    const keys =
      propsToCompare.length > 0 ? propsToCompare : (Object.keys(prevProps) as (keyof T)[]);

    for (const key of keys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }

    return true;
  };
}
