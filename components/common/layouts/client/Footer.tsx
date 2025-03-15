import React from 'react'
import dayjs from 'dayjs'

const Footer = () => {
    return (
        <footer className="w-full py-4 sm:py-6 border-t-2">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Logo */}
                    <div className="mb-3 sm:mb-0">
                        <img
                            src="/images/remove-bg-logo.png"
                            alt="logo"
                            className="h-[40px] sm:h-[50px] object-contain"
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
                            className="hover:opacity-80 transition-opacity"
                        >
                            <img src="/images/facebook-icon.png" alt="facebook" className="h-8 sm:h-10" />
                        </a>
                        <a
                            href="mailto:hoangdanh54317@gmail.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Email"
                            className="hover:opacity-80 transition-opacity"
                        >
                            <img src="/images/mail-icon.png" alt="email" className="h-8 sm:h-10" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer