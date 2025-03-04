'use client';
import Image from 'next/image';
import React from 'react'

interface IProps {
    width?: number;
    height?: number;
}

export default function AuthImage({ width, height }: IProps) {
    return (
        <Image
            src="/images/remove-bg-logo.png"
            alt="Auth Image"
            loading='lazy'
            style={{
                objectFit: 'contain',
            }}
            width={width || 150}
            height={height || 150}
        />
    )
}
