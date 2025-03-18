"use client";
import React, { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Facebook, Mail, PhoneCall } from 'lucide-react';
import { useTheme } from 'next-themes';
import ImageLogo from '../ImageLogo';

const Footer = () => {
    const footerRef = useRef<HTMLElement>(null);
    const { theme } = useTheme();

    // Thêm hiệu ứng fade-in khi footer hiển thị
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('opacity-100');
                        entry.target.classList.remove('opacity-0', 'translate-y-10');
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (footerRef.current) {
            observer.observe(footerRef.current);
        }

        return () => {
            if (footerRef.current) {
                observer.unobserve(footerRef.current);
            }
        };
    }, []);

    return (
        <footer
            ref={footerRef}
            className="w-full py-4 sm:py-6 border-t transition-all duration-500 ease-in-out opacity-0 translate-y-10"
        >
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Logo */}
                    <div className="mb-3 sm:mb-0">
                        {/* <img
                            src="/images/remove-bg-logo.png"
                            alt="logo"
                            className="h-[40px] sm:h-[50px] object-contain"
                        /> */}
                        <ImageLogo
                            variant={theme === 'dark' ? 'dark' : 'light'}
                            className="h-[100px] sm:h-[120px] md:h-[140px] object-contain"
                        />
                    </div>

                    {/* Footer text - always visible */}
                    <div className="text-center mb-3 sm:mb-0 sm:text-left">
                        <p className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm">
                            © {dayjs().format('YYYY')} TBS Group. Thoai Son Handbag Factory
                        </p>
                    </div>

                    {/* Contact icons */}
                    <div className="flex flex-row gap-4 sm:gap-3">
                        <a
                            href="https://www.facebook.com/groups/nhamaytuixachthoaison"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="hover:opacity-80 transition-all hover:scale-110"
                        >
                            <div className="bg-blue-600 text-white p-2 rounded-full">
                                <Facebook size={20} />
                            </div>
                        </a>
                        <a
                            href="mailto:hoangdanh54317@gmail.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Email"
                            className="hover:opacity-80 transition-all hover:scale-110"
                        >
                            <div className="bg-red-500 text-white p-2 rounded-full">
                                <Mail size={20} />
                            </div>
                        </a>
                        <a
                            href="tel:+84909090909"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Phone"
                            className="hover:opacity-80 transition-all hover:scale-110"
                        >
                            <div className="bg-green-500 text-white p-2 rounded-full">
                                <PhoneCall size={20} />
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;