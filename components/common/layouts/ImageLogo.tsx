
"use client"
import { useTheme } from 'next-themes';
import React from 'react';
import Image from 'next/image';

interface ImageLogoProps {
    className?: string;
}

export const ImageLogo = ({ className }: ImageLogoProps) => {
    const [logoUrl, setLogoUrl] = React.useState<string>("");
    const theme = useTheme();
    React.useEffect(() => {
        if (theme.theme === 'dark') {
            setLogoUrl('/images/logo-dark.png');
        } else {
            setLogoUrl('/images/logo-light.png');
        }
    }, [theme.theme]);
    return (
        // <img
        //     src={logoUrl}
        //     alt="logo"
        //     className={className}
        // />
        <Image
            src={logoUrl}
            alt="logo"
            className={className}
            loading="lazy"
            width={150}
            height={150}
            priority={false}
        />
    )
}
