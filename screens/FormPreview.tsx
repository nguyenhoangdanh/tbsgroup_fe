"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FormPreviewProps {
    data: Record<string, any>;
}

const FormPreview: React.FC<FormPreviewProps> = ({ data }) => {
    // Helper function to format data values for display
    const formatValue = (key: string, value: any): string => {
        if (value === undefined || value === null) {
            return "—";
        }

        if (value instanceof Date) {
            return value.toLocaleString();
        }

        if (typeof value === "boolean") {
            return value ? "Có" : "Không";
        }

        if (typeof value === "object") {
            return JSON.stringify(value);
        }

        return String(value);
    };

    // Group data by category for better organization
    const groupedData = Object.entries(data).reduce((acc, [key, value]) => {
        // Simple categorization based on key prefixes/patterns
        let category = "Khác";

        if (key.includes("name") || key.includes("email") || key.includes("phone")) {
            category = "Thông tin cá nhân";
        } else if (key.includes("password") || key.includes("username")) {
            category = "Tài khoản";
        } else if (key.includes("department") || key.includes("position") || key.includes("bio")) {
            category = "Hồ sơ";
        } else if (key.includes("contact") || key.includes("notification") || key.includes("theme")) {
            category = "Tùy chọn";
        }

        if (!acc[category]) {
            acc[category] = [];
        }

        acc[category].push({ key, value });
        return acc;
    }, {} as Record<string, Array<{ key: string, value: any }>>);

    // Labels for form fields (for better display)
    const fieldLabels: Record<string, string> = {
        fullName: "Họ và tên",
        email: "Email",
        phoneNumber: "Số điện thoại",
        username: "Tên đăng nhập",
        password: "Mật khẩu",
        department: "Phòng ban",
        position: "Vị trí",
        bio: "Giới thiệu",
        contactMethod: "Phương thức liên hệ",
        receiveNotifications: "Nhận thông báo",
        theme: "Giao diện",
        agreeTerms: "Đồng ý điều khoản",
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Xem trước dữ liệu form</CardTitle>
                <CardDescription>Dữ liệu hiện tại của form</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {Object.entries(groupedData).map(([category, fields]) => (
                        <div key={category} className="border rounded-md overflow-hidden">
                            <div className="bg-gray-100 px-4 py-2 font-medium">{category}</div>
                            <div className="p-4">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {fields.map(({ key, value }) => (
                                            <tr key={key} className="border-b last:border-0">
                                                <td className="py-2 text-gray-600 w-1/3">{fieldLabels[key] || key}</td>
                                                <td className="py-2 font-medium break-words">
                                                    {key === "password" ? "••••••••" : formatValue(key, value)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default FormPreview;