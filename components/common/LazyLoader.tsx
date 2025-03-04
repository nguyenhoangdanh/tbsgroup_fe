import { Loader } from "lucide-react";
import React from "react";
import AuthImage from "./layouts/auth/AuthImage";

const LazyLoader = () => {
    return (
        <div className="fixed inset-0 flex flex-col gap-1 items-center justify-center bg-white dark:bg-gray-900 z-[9999]">
            <AuthImage width={100} height={100} />
            <div className="flex flex-row items-center justify-center bg-white dark:bg-gray-900 ">
                <Loader className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-blue-500 animate-spin" />
                <span className="text-gray-800 dark:text-white font-medium">Loading...</span>
            </div>
        </div>
    );
};

export default LazyLoader;