'use client';
import Image from 'next/image';
import React from 'react'

export default function AuthImage() {
    return (
        <Image
            src="/images/remove-bg-logo.png"
            alt="Auth Image"
            loading='lazy'
            style={{
                objectFit: 'contain',
            }}
            width={150}
            height={150}
        />
    )
}
