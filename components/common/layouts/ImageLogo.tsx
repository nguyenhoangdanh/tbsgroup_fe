"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ImageLogoProps {
    className?: string;
    variant?: 'light' | 'dark';
    width?: number;
    height?: number;
}

export default function ImageLogo({
    className = "",
    variant = 'light',
    width = 150,
    height = 150
}: ImageLogoProps) {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Chỉ đặt src ở phía client để tránh lỗi hydration
        const src = variant === 'light'
            ? '/images/logo-light.png'
            : '/images/logo-dark.png';

        setImageSrc(src);
        setLoading(false);
    }, [variant]);

    // Xử lý lỗi hình ảnh
    const handleError = () => {
        console.error(`Failed to load image: ${imageSrc}`);
        setError(true);
    };

    // if (loading) {
    //     return (
    //         <div
    //             className={`${className} flex items-center justify-center bg-gray-100`}
    //             style={{ width, height }}
    //         >
    //             <span className="text-gray-400">Loading...</span>
    //         </div>
    //     );
    // }

    // if (error || !imageSrc) {
    //     return (
    //         <div
    //             className={`${className} flex items-center justify-center bg-gray-100`}
    //             style={{ width, height }}
    //         >
    //             <span className="text-gray-500">TBS</span>
    //         </div>
    //     );
    // }

    return (
        <Image
            src={imageSrc}
            alt="logo"
            width={width}
            height={height}
            className={`${className} object-contain`}
            onError={handleError}
            priority={true}
        />
    );
}











// import React from 'react';
// import Image from 'next/image';

// interface ImageLogoProps {
//     className?: string;
//     variant?: 'light' | 'dark';
// }

// export default function ImageLogo({ className = "", variant = 'light' }: ImageLogoProps) {
//     const src = variant === 'light'
//         ? '/images/logo-light.png'
//         : '/images/logo-dark.png';

//     return (
//         <Image
//             src={src}
//             alt="logo"
//             className={`${className} object-contain`}
//             loading="lazy"
//             width={150}
//             height={150}
//             priority={false}
//         />
//     )
// }
