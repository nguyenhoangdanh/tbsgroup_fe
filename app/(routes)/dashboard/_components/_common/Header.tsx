"use client"
import Logo from '@/components/logo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const Header = () => {
    const pathName = usePathname();
    return (
        <header
            className='sticky top-0 z-50 flex h-16 items-center gap-4 !bg-[#43217c] px-4 md:px-6'>
            <nav className=' gap-6 h-full text-lg font-medium md:flex md:flex-row'>
                <div className="flex items-center mr-5 pr-8 border-r border-gray-600">
                    <Logo url='/dashboard' />
                    <span className='sr-only'>Formy</span>
                </div>
                <ul className='flex flex-row'>
                    <li className='relative h-full'>
                        <Link href='/dashboard'
                            className='text-white/90 text[16px] font-normal z-[999] flex items-center px-3 justify-center
                    h-full transition-colors hover:text-opacity-90'
                        >
                            Dashboard
                        </Link>
                        {pathName === '/dashboard' && (
                            <div className='absolute top-0 left-0 right-0 h-[52px] bg-primary transition-colors ease-in-out rounded-b-xl -z-[1]' />
                        )}
                    </li>
                </ul>
            </nav>
        </header>
    )
}

export default Header