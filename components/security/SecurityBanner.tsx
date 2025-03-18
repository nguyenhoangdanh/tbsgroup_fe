'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ShieldCheck, X } from 'lucide-react';
import { useAuthContext } from '@/context/AuthProvider';

type SecurityMessage = {
    id: string;
    type: 'warning' | 'info' | 'success';
    message: string;
    showOnce?: boolean;
    expiry?: number; // thời gian hết hạn tính bằng ms
};

export default function SecurityBanner() {
    const { isAuthenticated, user } = useAuthContext();
    const [messages, setMessages] = useState<SecurityMessage[]>([]);
    const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

    console.log('SecurityBanner render');

    // Kiểm tra các vấn đề bảo mật và hiển thị thông báo
    // useEffect(() => {
    //     const securityMessages: SecurityMessage[] = [];

    //     // Kiểm tra nếu đang sử dụng HTTP
    //     if (typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
    //         securityMessages.push({
    //             id: 'insecure-connection',
    //             type: 'warning',
    //             message: 'Bạn đang sử dụng kết nối không an toàn. Khuyến nghị chuyển sang HTTPS.',
    //         });
    //     }

    //     // Kiểm tra trình duyệt cũ
    //     const isOldBrowser = () => {
    //         const userAgent = navigator.userAgent;
    //         // Kiểm tra IE hoặc trình duyệt cũ khác
    //         return /MSIE|Trident/.test(userAgent);
    //     };

    //     if (typeof window !== 'undefined' && isOldBrowser()) {
    //         securityMessages.push({
    //             id: 'old-browser',
    //             type: 'warning',
    //             message: 'Bạn đang sử dụng trình duyệt cũ có thể gây ra rủi ro bảo mật. Vui lòng cập nhật trình duyệt của bạn.',
    //         });
    //     }

    //     // Kiểm tra thời gian không hoạt động dài
    //     if (isAuthenticated && localStorage.getItem('last_activity')) {
    //         const lastActivity = parseInt(localStorage.getItem('last_activity') || '0');
    //         const inactiveTime = Date.now() - lastActivity;

    //         // Hiển thị cảnh báo nếu không hoạt động >10 phút
    //         if (inactiveTime > 10 * 60 * 1000) {
    //             securityMessages.push({
    //                 id: 'inactive-session',
    //                 type: 'info',
    //                 message: 'Phiên của bạn sẽ hết hạn sau một khoảng thời gian không hoạt động.',
    //                 expiry: 30000, // tự động biến mất sau 30 giây
    //             });
    //         }
    //     }

    //     // Thông báo đăng nhập thành công cho người dùng mới đăng nhập
    //     const lastLoginTime = localStorage.getItem('last_login_time');
    //     if (isAuthenticated && lastLoginTime) {
    //         const loginTime = parseInt(lastLoginTime);
    //         const currentTime = Date.now();

    //         // Nếu đăng nhập trong vòng 1 phút qua
    //         if (currentTime - loginTime < 60000) {
    //             securityMessages.push({
    //                 id: 'successful-login',
    //                 type: 'success',
    //                 message: `Đăng nhập thành công vào lúc ${new Date(loginTime).toLocaleTimeString()}`,
    //                 showOnce: true,
    //                 expiry: 10000, // biến mất sau 10 giây
    //             });
    //         }
    //     }

    //     // Lọc bỏ các thông báo đã bị dismissed
    //     const filteredMessages = securityMessages.filter(msg => !dismissed[msg.id]);

    //     setMessages(filteredMessages);
    // }, [isAuthenticated, user, dismissed]);

    // // Xử lý các thông báo có thời hạn
    // useEffect(() => {
    //     const timeouts = messages.map(msg => {
    //         if (msg.expiry) {
    //             return setTimeout(() => {
    //                 setDismissed(prev => ({ ...prev, [msg.id]: true }));
    //             }, msg.expiry);
    //         }
    //         return null;
    //     }).filter(Boolean);

    //     return () => {
    //         timeouts.forEach(timeout => {
    //             if (timeout) clearTimeout(timeout);
    //         });
    //     };
    // }, [messages]);

    const dismissMessage = (id: string) => {
        setDismissed(prev => ({ ...prev, [id]: true }));

        // Lưu trạng thái dismissed cho thông báo hiển thị một lần
        const message = messages.find(msg => msg.id === id);
        if (message?.showOnce) {
            localStorage.setItem(`dismissed_${id}`, 'true');
        }
    };

    if (messages.length === 0) return null;

    return (
        <div className="w-full">
            {messages.map(msg => (
                <div
                    key={msg.id}
                    className={`p-4 mb-2 rounded-md flex items-center justify-between ${msg.type === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        msg.type === 'info' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-green-100 text-green-800 border border-green-200'
                        }`}
                >
                    <div className="flex items-center space-x-3">
                        {msg.type === 'warning' ? (
                            <AlertCircle className="h-5 w-5" />
                        ) : msg.type === 'info' ? (
                            <ShieldCheck className="h-5 w-5" />
                        ) : (
                            <ShieldCheck className="h-5 w-5" />
                        )}
                        <span>{msg.message}</span>
                    </div>
                    <button
                        onClick={() => dismissMessage(msg.id)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Đóng"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}