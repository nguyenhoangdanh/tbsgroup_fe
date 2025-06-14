import React, { useMemo } from 'react';

interface IAuthLayoutProps {
  title: string;
  isLogin?: boolean;
  children: React.ReactNode;
  imageChildren?: React.ReactNode;
}

const _AuthLayout: React.FC<IAuthLayoutProps> = ({ title, imageChildren, children }) => {
  // Memoize the title element to prevent re-renders
  const titleElement = useMemo(() => (
    <h1 className="text-3xl font-bold text-center mb-5">{title}</h1>
  ), [title]);

  // Memoize the container classes to prevent recalculations
  const containerClasses = "w-full h-full flex items-center justify-center border-2 border-gray-200 rounded-lg max-h-[550px] max-w-[450px] shadow-lg overflow-hidden sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] 2xl:max-w-[900px]";

  return (
    <div className="w-full h-screen flex items-center justify-center px-4">
      <div className={containerClasses}>
        <div className="w-full h-full flex flex-col items-center justify-between">
          {imageChildren && (
            <div className="w-full h-full max-h-[150px] flex items-center justify-center">
              {imageChildren}
            </div>
          )}
          <div className="w-full h-full flex flex-col items-center py-6">
            <div className="w-full max-w-[450px] mx-auto h-auto">
              {titleElement}
            </div>
            <div className="w-full max-w-[450px] mx-auto h-auto">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Use React.memo with a custom comparison function to prevent unnecessary re-renders
const AuthLayout = React.memo(_AuthLayout, (prevProps, nextProps) => {
  // Only re-render if title changes or if children/imageChildren references change
  return (
    prevProps.title === nextProps.title &&
    prevProps.children === nextProps.children &&
    prevProps.imageChildren === nextProps.imageChildren
  );
});

AuthLayout.displayName = 'AuthLayout';
export default AuthLayout;
