"use client";
import useAuthManager from '@/hooks/useAuthManager';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, User, Settings, LogOut, ChevronRight } from 'lucide-react';
import { getDisplayInitials } from '@/utils';
import UserAvatar from './UserAvatar';

interface IHeaderProps {
    children?: React.ReactNode;
}

interface NavLink {
    title: string;
    path: string;
    dropdown?: DropdownItem[];
}

interface DropdownItem {
    title: string;
    path?: string;
    icon?: React.ReactNode;
    action?: 'link' | 'function';
    onClick?: () => void;
}

const Header: React.FC<IHeaderProps> = ({ children }) => {
    const { user, logout } = useAuthManager();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle window resize to auto-close mobile menu on larger screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMenuOpen]);

    // Handle clicks outside of dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdown && dropdownRefs.current[activeDropdown] &&
                !dropdownRefs.current[activeDropdown]?.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    // Navigation links with dropdowns
    const navLinks: NavLink[] = [
        { title: 'Home', path: '/' },
        {
            title: 'Services',
            path: '/services',
            dropdown: [
                { title: 'Consulting', path: '/services/consulting' },
                { title: 'Development', path: '/services/development' },
                { title: 'UI/UX Design', path: '/services/design' },
            ]
        },
        {
            title: 'Resources',
            path: '/resources',
            dropdown: [
                { title: 'Documentation', path: '/resources/docs' },
                { title: 'Tutorials', path: '/resources/tutorials' },
                { title: 'Blog', path: '/resources/blog' },
            ]
        },
        { title: 'About', path: '/about' },
        { title: 'Contact', path: '/contact' },
    ];

    // Check if a link is active
    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    // Toggle dropdown visibility
    const toggleDropdown = (title: string) => {
        setActiveDropdown(activeDropdown === title ? null : title);
    };

    return (
        <header
            className={`sticky top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/95'
                }`}
        >
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-16 md:h-[60px] flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0">
                            <img
                                src="/images/remove-bg-logo.png"
                                alt="logo"
                                className="h-[25px] sm:h-[30px] object-contain"
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center justify-between flex-1 ml-10">
                        <nav className="flex items-center space-x-4 lg:space-x-6">
                            {navLinks.map((link) => (
                                <div
                                    key={link.path}
                                    className="relative"
                                    ref={(el) => {
                                        dropdownRefs.current[link.title] = el;
                                        return undefined;
                                    }}
                                >
                                    {link.dropdown ? (
                                        <>
                                            <button
                                                className={`flex items-center gap-1 text-sm lg:text-base font-medium hover:text-gray-900 transition-colors ${isActive(link.path) ? 'text-gray-900 font-semibold' : 'text-gray-600'
                                                    }`}
                                                onClick={() => toggleDropdown(link.title)}
                                                aria-expanded={activeDropdown === link.title}
                                            >
                                                {link.title}
                                                <ChevronDown
                                                    size={16}
                                                    className={`transition-transform ${activeDropdown === link.title ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                            {activeDropdown === link.title && (
                                                <div className="absolute top-full left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                                        {link.dropdown.map((item) => (
                                                            <Link
                                                                key={item.path}
                                                                href={item.path || '#'}
                                                                className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isActive(item.path || '') ? 'bg-gray-50 font-medium' : ''
                                                                    }`}
                                                                onClick={() => setActiveDropdown(null)}
                                                                role="menuitem"
                                                            >
                                                                {item.title}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            href={link.path}
                                            className={`text-sm lg:text-base font-medium hover:text-gray-900 transition-colors ${isActive(link.path)
                                                ? 'text-gray-900 font-semibold border-b-2 border-gray-900'
                                                : 'text-gray-600'
                                                }`}
                                        >
                                            {link.title}
                                        </Link>
                                    )}
                                </div>
                            ))}
                            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                                <Link
                                    href="/admin/dashboard"
                                    className={`text-sm lg:text-base font-medium hover:text-gray-900 transition-colors ${pathname?.startsWith('/admin')
                                        ? 'text-gray-900 font-semibold border-b-2 border-gray-900'
                                        : 'text-gray-600'
                                        }`}
                                >
                                    Admin Dashboard
                                </Link>
                            )}
                        </nav>

                        <div className="flex items-center pl-6">
                            <UserAvatar />
                            {children}
                        </div>
                    </div>

                    {/* Mobile Navigation Button and Avatar */}
                    <div className="flex items-center md:hidden">
                        <UserAvatar />
                        <button
                            className="p-2 ml-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white shadow-lg">
                    <nav className="max-h-[80vh] overflow-y-auto px-4 pt-2 pb-4">
                        {navLinks.map((link) => (
                            <div key={link.path}>
                                {link.dropdown ? (
                                    <>
                                        <button
                                            className={`flex items-center justify-between w-full py-3 text-base font-medium border-b border-gray-100 ${activeDropdown === link.title ? 'text-gray-900 font-semibold' : 'text-gray-600'
                                                }`}
                                            onClick={() => toggleDropdown(link.title)}
                                        >
                                            {link.title}
                                            <ChevronDown
                                                size={16}
                                                className={`transition-transform ${activeDropdown === link.title ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {activeDropdown === link.title && (
                                            <div className="ml-4 py-1">
                                                {link.dropdown.map((item) => (
                                                    <Link
                                                        key={item.path || item.title}
                                                        href={item.path || '#'}
                                                        className={`flex items-center gap-2 py-2 pl-2 text-sm border-b border-gray-50 ${isActive(item.path || '') ? 'text-gray-900 font-medium' : 'text-gray-600'
                                                            }`}
                                                        onClick={() => setIsMenuOpen(false)}
                                                    >
                                                        <ChevronRight size={12} />
                                                        {item.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={link.path}
                                        className={`py-3 text-base font-medium border-b border-gray-100 block ${isActive(link.path) ? 'text-gray-900 font-semibold' : 'text-gray-600'
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.title}
                                    </Link>
                                )}
                            </div>
                        ))}
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                            <Link
                                href="/admin/dashboard"
                                className={`py-3 text-base font-medium border-b border-gray-100 block ${pathname?.startsWith('/admin') ? 'text-gray-900 font-semibold' : 'text-gray-600'
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}

export default Header;