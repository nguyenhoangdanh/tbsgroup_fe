'use client';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
interface IProps {
    width?: number;
    height?: number;
    className?: string;
    isGoBack?: boolean;
}

export default function AuthImage({ width, height, className, isGoBack = false }: IProps) {
    const router = useRouter();

    return (

        <div className={`relative flex flex-col items-center justify-center w-full ${className || ''}`}>
            {isGoBack && (
                <button
                    type="button"
                    title="Quay lại"
                    className="flex items-center absolute top-2 left-4 z-10 transition-colors
                           sm:left-4 md:top-4 md:left-4"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className='rounded-full bg-gray-200 md:size-6 sm:size-5' />
                    <span className="ml-2 text-sm md:text-base font-medium hover:font-bold">Quay lại</span>
                </button>
            )}

            <div className={isGoBack ? `relative mt-12 md:mt-16 flex justify-center w-full` : ""}>
                <Image
                    src="/images/remove-bg-logo.png"
                    alt="Auth Image"
                    loading="lazy"
                    className="max-w-full h-auto"
                    style={{
                        objectFit: 'contain',
                    }}
                    width={width || 150}
                    height={height || 150}
                    priority={false}
                />
            </div>
        </div>
    );
}