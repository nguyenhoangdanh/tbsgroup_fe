"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, User, Briefcase, CalendarClock, ArrowRight } from "lucide-react";

interface FormSuccessProps {
    data: Record<string, any>;
    onReset: () => void;
}

const FormSuccess: React.FC<FormSuccessProps> = ({ data, onReset }) => {
    // Helper function to format date objects
    const formatDate = (date: Date): string => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    // Get relevant fields from form data
    const fullName = data.fullName || "";
    const email = data.email || "";
    const department = data.department || "";
    const position = data.position || "";

    return (
        <div className="container max-w-3xl mx-auto my-10">
            <Card className="border-green-100 bg-green-50/30">
                <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-center text-2xl text-green-700">Đăng ký thành công!</CardTitle>
                    <CardDescription className="text-center text-green-600">
                        Cảm ơn bạn đã hoàn thành quá trình đăng ký
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-green-100">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">Thông tin của bạn</h3>

                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <User className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Họ và tên</p>
                                        <p className="font-medium">{fullName}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <Mail className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <Briefcase className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-500">Phòng ban & Vị trí</p>
                                        <p className="font-medium">{department} - {position}</p>
                                    </div>
                                </div>

                                {data.appointmentDate && (
                                    <div className="flex items-start">
                                        <CalendarClock className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Lịch hẹn</p>
                                            <p className="font-medium">{formatDate(data.appointmentDate)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 border">
                            <h3 className="text-base font-medium flex items-center mb-2">
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Bước tiếp theo
                            </h3>
                            <p className="text-gray-600">
                                Chúng tôi đã gửi email xác nhận đến <span className="font-medium">{email}</span>.
                                Vui lòng kiểm tra hộp thư và xác nhận email của bạn để hoàn tất quá trình đăng ký.
                            </p>
                            <p className="text-gray-600 mt-2">
                                Email xác nhận có thể mất đến 5 phút để đến. Nếu bạn không nhận được email, vui lòng kiểm tra thư mục spam.
                            </p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-center pt-2">
                    <Button
                        onClick={onReset}
                        variant="outline"
                        className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                    >
                        Đăng ký tài khoản khác
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default FormSuccess;