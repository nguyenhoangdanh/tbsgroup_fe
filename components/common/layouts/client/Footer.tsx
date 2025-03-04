import React from 'react'
import dayjs from 'dayjs'
const Footer = () => {
    return (
        <div className="w-full h-[100px] border-t-2 flex items-center justify-between px-[15%]">
            {/* logo */}
            <img src="/images/remove-bg-logo.png" alt="logo" className="h-[50px]" />
            {/* footer text */}

            <div className="flex items-center gap-4">
                <p className="text-gray-500 text-sm">
                    © {dayjs().format('YYYY')} TBS Group. Thoai Son Handbag Factory
                </p>
            </div>
            {/* contact */}
            <div className="flex flex-col items-start gap-1">
                <a
                    href="https://www.facebook.com/groups/nhamaytuixachthoaison" target="_blank">
                    <img src="/images/facebook-icon.png" alt="facebook" className="h-10" />

                </a>
                <a
                    href="
                mailto:hoangdanh54317@gmail.com" target="_blank">
                    <img src="/images/mail-icon.png" alt="email" className="h-10" />
                </a>
            </div>
        </ div>
    )
}

export default Footer