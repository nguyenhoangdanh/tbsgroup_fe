"use client";
import useAuthManager from '@/hooks/useAuthManager';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import UserAvatar from './UserAvatar';
import ThemeSwitcher from '../admin/ThemeSwitcher';
import { useTheme } from 'next-themes';
import ImageLogo from '../ImageLogo';

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
    const { user } = useAuthManager();
    const { theme } = useTheme();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const headerRef = useRef<HTMLElement>(null);

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

    // Handle clicks outside of mobile menu
    useEffect(() => {
        const handleClickOutsideMenu = (event: MouseEvent) => {
            if (isMenuOpen &&
                headerRef.current &&
                !headerRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutsideMenu);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutsideMenu);
        };
    }, [isMenuOpen]);

    // Navigation links with dropdowns
    const navLinks: NavLink[] = [
        { title: 'Trang chủ', path: '/' },
        {
            title: 'Dịch vụ',
            path: '/services',
            dropdown: [
                { title: 'Tư vấn', path: '/services/consulting' },
                { title: 'Phát triển', path: '/services/development' },
                { title: 'Thiết kế UI/UX', path: '/services/design' },
            ]
        },
        {
            title: 'Tài nguyên',
            path: '/resources',
            dropdown: [
                { title: 'Tài liệu', path: '/resources/docs' },
                { title: 'Hướng dẫn', path: '/resources/tutorials' },
                { title: 'Blog', path: '/resources/blog' },
            ]
        },
        { title: 'Giới thiệu', path: '/about' },
        { title: 'Liên hệ', path: '/contact' },
    ];

    // Check if a link is active
    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    // Toggle dropdown visibility
    const toggleDropdown = (title: string) => {
        setActiveDropdown(activeDropdown === title ? null : title);
    };

    return (
        <header
            ref={headerRef}
            className={`sticky top-0 w-full z-50 transition-all bg-white dark:bg-gray-800
                duration-300 ${scrolled ? 'shadow-md' : ''}
                }`}
        >
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-16 md:h-[60px] flex items-center justify-between">
                    {/* Logo và Mobile Menu Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            className="focus:outline-none md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <Link href="/" className="flex-shrink-0">
                            {/* <img
                                src="/images/remove-bg-logo.png"
                                alt="logo"
                                className="h-8 sm:h-9 object-contain"
                            /> */}
                            <ImageLogo
                                variant={theme === 'dark' ? 'dark' : 'light'}
                                className="h-[60px] sm:h-[80px] md:h-[100px] object-contain"
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center justify-between flex-1 ml-10">
                        <nav className="flex items-center space-x-4 lg:space-x-6">
                            {/* {navLinks.map((link) => (
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
                                                className={`flex items-center hover:text-primary gap-1 text-sm lg:text-base font-medium transition-colors ${isActive(link.path)
                                                    ? 'text-primary font-semibold'
                                                    : ''
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
                                                <div className="absolute top-full bg-white dark:bg-gray-700 left-0 mt-2 w-56 rounded-md shadow-lg ring-1 ring-black dark:ring-gray-500 ring-opacity-5 z-10">
                                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                                        {link.dropdown.map((item) => (
                                                            <Link
                                                                key={item.path}
                                                                href={item.path || '#'}
                                                                className={`block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-primary ${isActive(item.path || '')
                                                                    ? 'text-primary font-medium bg-gray-50 dark:bg-gray-600'
                                                                    : ''
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
                                            className={`text-sm hover:text-primary lg:text-base font-medium transition-colors ${isActive(link.path)
                                                ? 'text-primary font-semibold border-b-2 border-primary'
                                                : ''
                                                }`}
                                        >
                                            {link.title}
                                        </Link>
                                    )}
                                </div>
                            ))} */}
                            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                                <div className="flex gap-3">
                                    <Link
                                        href="/admin/users/all"
                                        className={`text-sm lg:text-base font-medium hover:text-primary transition-colors ${pathname?.startsWith('/admin')
                                            ? 'text-primary font-semibold border-b-2 border-primary'
                                            : ''
                                            }`}
                                    >
                                        Quản trị
                                    </Link>
                                    <Link
                                        href="/digital-forms"
                                        className={`text-sm lg:text-base font-medium hover:text-primary transition-colors ${pathname?.startsWith('/admin')
                                            ? 'text-primary font-semibold border-b-2 border-primary'
                                            : ''
                                            }`}
                                    >
                                        Phiếu công đoạn
                                    </Link>
                                </div>
                            )}


                        </nav>

                        <div className="flex items-center gap-3">
                            <ThemeSwitcher />
                            <UserAvatar />
                            {children}
                        </div>
                    </div>

                    {/* Mobile: Theme và Avatar */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeSwitcher />
                        <UserAvatar />
                    </div>
                </div>
            </div>

            {/* Mobile Menu - slide down animation */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen
                    ? 'max-h-[80vh] shadow-lg'
                    : 'max-h-0'
                    }`}
            >
                <nav className="px-4 pt-2 pb-4 bg-white dark:bg-gray-800">
                    {/* {navLinks.map((link) => (
                        <div key={link.path}>
                            {link.dropdown ? (
                                <>
                                    <button
                                        className={`flex items-center justify-between w-full py-3 text-base font-medium border-b border-gray-100 dark:border-gray-700 ${activeDropdown === link.title
                                            ? 'text-primary font-semibold'
                                            : ''
                                            }`}
                                        onClick={() => toggleDropdown(link.title)}
                                    >
                                        {link.title}
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform ${activeDropdown === link.title ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    <div
                                        className={`ml-4 overflow-hidden transition-all duration-300 ${activeDropdown === link.title
                                            ? 'max-h-64'
                                            : 'max-h-0'
                                            }`}
                                    >
                                        {link.dropdown.map((item) => (
                                            <Link
                                                key={item.path || item.title}
                                                href={item.path || '#'}
                                                className={`flex items-center gap-2 py-2 pl-2 text-sm border-b border-gray-50 dark:border-gray-700 ${isActive(item.path || '')
                                                    ? 'text-primary font-medium'
                                                    : ''
                                                    }`}
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <ChevronRight size={12} />
                                                {item.title}
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <Link
                                    href={link.path}
                                    className={`py-3 text-base font-medium border-b border-gray-100 dark:border-gray-700 block ${isActive(link.path)
                                        ? 'text-primary font-semibold'
                                        : ''
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.title}
                                </Link>
                            )}
                        </div>
                    ))} */}
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                        <div className="">
                            <Link
                                href="/admin/users/all"
                                className={`py-3 text-base font-medium border-b border-gray-100 dark:border-gray-700 block ${pathname?.startsWith('/admin')
                                    ? 'text-primary font-semibold'
                                    : ''
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Quản trị
                            </Link>
                            <Link
                                href="/admin/users"
                                className={`py-3 text-base font-medium border-b border-gray-100 dark:border-gray-700 block ${pathname?.startsWith('/admin')
                                    ? 'text-primary font-semibold'
                                    : ''
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Quản trị
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Header;