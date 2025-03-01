"use client"
import React from 'react'

interface IHeaderProps {
    children: React.ReactNode;
}

const Header: React.FC<IHeaderProps> = ({ children }) => {
    return (
        <div className="w-full h-[60px]">
            <div className="w-[60%] h-full flex items-center justify-between mx-auto border border-gray-200
            shadow-sm px-4 rounded-xl">
                <div className="flex items-center gap-2">
                    <img src="/images/remove-bg-logo.png" alt="logo" className="w-[100px] h-[30px]" />
                </div>
                <div className="flex items-center justify-between gap-10">
                    <div className="flex items-center gap-5 text-gray-500 mx-auto sm:flex hidden">
                        <a href="#" className="text-lg font-medium">Home</a>
                        <a href="#" className="text-lg font-medium">About</a>
                        <a href="#" className="text-lg font-medium">Contact</a>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Header