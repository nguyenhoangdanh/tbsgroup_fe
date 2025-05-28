'use client';
import { m, LazyMotion, domAnimation } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AccessDeniedMessage = () => {
  return (
    <LazyMotion features={domAnimation}>
      <div className="flex justify-center items-center h-[calc(100vh-100px)] bg-gradient-to-br from-slate-50 to-indigo-50">
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 20,
            duration: 0.3,
          }}
          className="w-full max-w-md"
        >
          <Alert
            className="relative border border-red-200 bg-white/90 backdrop-blur-sm 
                        shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 
                        group py-6 px-6"
          >
            {/* Subtle gradient overlay */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-red-50/20 via-pink-50/10 to-red-50/20 
                            opacity-40 group-hover:opacity-60 transition-opacity duration-300"
            />

            {/* Header section with icon and title side by side */}
            <div className="flex items-center mb-5">
              {/* Icon container with refined animation */}
              <div className="relative mr-4 flex-shrink-0">
                <div className="absolute -inset-1 bg-red-100/50 rounded-full blur-sm" />
                <div
                  className="relative p-3 bg-gradient-to-br from-red-100 to-red-50 rounded-full 
                                shadow-sm group-hover:shadow-md transition-all duration-300"
                >
                  <ShieldAlert className="h-8 w-8 text-red-600/90" />
                </div>

                {/* Subtle pulse ring */}
                <div
                  className="absolute inset-0 rounded-full bg-red-400/10 animate-[ping_2.5s_ease-in-out_infinite] 
                                opacity-75"
                />
              </div>

              {/* Title aligned with icon */}
              <AlertTitle className="text-xl font-semibold text-slate-800 tracking-tight text-left">
                TRUY CẬP BỊ TỪ CHỐI
              </AlertTitle>
            </div>

            <AlertDescription className="space-y-3 text-center">
              <p className="text-gray-700 text-lg leading-relaxed">
                ⚠️ Bạn không có quyền truy cập trang này
              </p>
              <p className="text-gray-600 text-md">
                Vui lòng liên hệ{' '}
                <span className="text-red-600 font-medium hover:underline cursor-pointer">
                  quản trị viên
                </span>
                <br />
                nếu bạn cho rằng đây là sự nhầm lẫn
              </p>
            </AlertDescription>

            {/* Refined decorative elements */}
            <div className="mt-6 flex justify-center space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 bg-red-300/70 rounded-full 
                                    animate-[pulse_${1.5 + i * 0.3}s_ease-in-out_infinite]`}
                />
              ))}
            </div>
          </Alert>
        </m.div>
      </div>
    </LazyMotion>
  );
};

export default AccessDeniedMessage;
