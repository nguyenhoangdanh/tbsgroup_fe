'use client';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import React from 'react';

import { UserStatusEnum } from '@/common/enum';
import { useAuthManager } from '@/hooks/auth/useAuthManager';

interface IProps {
  width?: number;
  height?: number;
  className?: string;
  isGoBack?: boolean;
}

export default function AuthImage({ width, height, className, isGoBack = false }: IProps) {
  const router = useRouter();
  const { user } = useAuthManager();
  const { theme } = useTheme();
  const [logoUrl, setLogoUrl] = React.useState<string>('/images/logo-light.png');

  React.useEffect(() => {
    // Set a default logo immediately to avoid the missing src error
    setLogoUrl(theme === 'dark' ? '/images/logo-dark.png' : '/images/logo-light.png');
  }, [theme]);

  return (
    <div className={`relative flex flex-col items-center justify-center w-full ${className || ''}`}>
      {isGoBack && user?.status !== UserStatusEnum.PENDING_ACTIVATION && (
        <button
          type="button"
          title="Quay lại"
          className="flex items-center absolute top-2 left-4 z-10 transition-colors dark:hover:bg-gray-800 dark:bg-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1
                           sm:left-4 md:top-4 md:left-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="rounded-full bg-gray-200 dark:bg-gray-600 md:size-6 sm:size-5" />
          <span className="ml-2 text-sm md:text-base font-medium hover:font-bold">Quay lại</span>
        </button>
      )}

      <div className={isGoBack ? `relative mt-0 flex justify-center w-full` : ''}>
        {logoUrl && (
          <Image
            src={logoUrl}
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
        )}
      </div>
    </div>
  );
}
