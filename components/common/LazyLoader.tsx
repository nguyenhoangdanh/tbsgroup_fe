// import { Loader } from "lucide-react";
// import React from "react";
// import AuthImage from "./layouts/auth/AuthImage";

// const LazyLoader = () => {
//     return (
//         <div className="fixed inset-0 flex flex-col gap-1 items-center justify-center bg-white dark:bg-gray-900 z-[9999]">
//             <AuthImage width={100} height={100} />
//             <div className="flex flex-row items-center justify-center bg-white dark:bg-gray-900 ">
//                 <Loader className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-blue-500 animate-spin" />
//                 <span className="text-gray-800 dark:text-white font-medium">Loading...</span>
//             </div>
//         </div>
//     );
// };

// export default LazyLoader;

import React from 'react';

const LazyLoader = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="text-center flex flex-col items-center">
                <div className="relative w-20 h-20 mb-6">
                    {/* Loader with multiple layers for depth and visual interest */}
                    <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-b-primary-foreground border-l-primary-foreground rounded-full animate-spin-reverse"></div>
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-gray-800 tracking-wide animate-pulse-slow">
                        Đang tải
                    </h2>
                    <p className="text-gray-600 text-lg animate-pulse">
                        Vui lòng chờ trong giây lát...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LazyLoader;