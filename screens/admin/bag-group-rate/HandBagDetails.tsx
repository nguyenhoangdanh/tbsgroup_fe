"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart, Users, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";
import { useBagGroupRateContext } from "@/hooks/group/bag-group-rate/BagGroupRateContext";
import { HandBagDetailsResponse } from "@/apis/group/bagGroupRate/bag-group-rate.api";
import { useQuery } from "@tanstack/react-query";

interface HandBagDetailsProps {
    handBagId?: string;
}

const HandBagDetails: React.FC<HandBagDetailsProps> = ({ handBagId: propHandBagId }) => {
    return (
        <BagGroupRateContextBridge>
            <HandBagDetailsContent handBagId={propHandBagId} />
        </BagGroupRateContextBridge>
    );
};

const HandBagDetailsContent: React.FC<HandBagDetailsProps> = ({ handBagId: propHandBagId }) => {
    const params = useParams();
    const router = useRouter();
    const { getHandBagGroupRatesDetails } = useBagGroupRateContext();

    // Use handBagId from props or from route params
    const handBagId = propHandBagId || (params?.handBagId as string);

    const [loading, setLoading] = useState(true);

    // Sử dụng React Query trực tiếp để tận dụng caching
    const { data: details, isLoading, error } = useQuery({
        queryKey: ['handBag-details', handBagId],
        queryFn: () => getHandBagGroupRatesDetails(handBagId),
        enabled: !!handBagId,
        staleTime: 5 * 60 * 1000, // 5 phút
    });

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !details) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>
                    {error instanceof Error ? error.message : error || "Không thể tải thông tin chi tiết"}
                </AlertDescription>
            </Alert>
        );
    }

    const { handBag, groups, statistics } = details;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/bag-group-rates/analysis/${handBagId}`)}
                >
                    <BarChart className="h-4 w-4 mr-2" /> Xem phân tích
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {handBag.code} - {handBag.name}
                    </CardTitle>
                    <CardDescription>
                        {handBag.description || "Chi tiết năng suất theo từng nhóm"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <Users className="h-5 w-5 mr-2 text-blue-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tổng số nhóm</p>
                                        <p className="text-2xl font-bold">{statistics.totalGroups}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <Clock className="h-5 w-5 mr-2 text-green-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Năng suất trung bình</p>
                                        <p className="text-2xl font-bold">
                                            {statistics.averageOutputRate.toFixed(1)}
                                            <span className="text-sm font-normal ml-1">SP/giờ</span>
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <BarChart className="h-5 w-5 mr-2 text-purple-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phạm vi năng suất</p>
                                        <p className="text-lg font-semibold">
                                            <span className="text-red-500">{statistics.lowestOutputRate.toFixed(1)}</span>
                                            {" - "}
                                            <span className="text-green-500">{statistics.highestOutputRate.toFixed(1)}</span>
                                            <span className="text-sm font-normal ml-1">SP/giờ</span>
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="groups" className="w-full">
                        <TabsList>
                            <TabsTrigger value="groups">Danh sách nhóm</TabsTrigger>
                            <TabsTrigger value="details">Thông tin túi</TabsTrigger>
                        </TabsList>

                        <TabsContent value="groups">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Năng suất theo nhóm</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2">Mã nhóm</th>
                                                    <th className="text-left p-2">Tên nhóm</th>
                                                    <th className="text-left p-2">Tổ</th>
                                                    <th className="text-center p-2">Số thành viên</th>
                                                    <th className="text-center p-2">Năng suất (SP/giờ)</th>
                                                    <th className="text-center p-2">% so với TB</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groups.map((groupData) => {
                                                    const percentOfAvg = (groupData.outputRate / statistics.averageOutputRate) * 100;

                                                    return (
                                                        <tr key={groupData.groupId} className="border-b hover:bg-gray-50">
                                                            <td className="p-2">{groupData.group.code}</td>
                                                            <td className="p-2 font-medium">{groupData.group.name}</td>
                                                            <td className="p-2">{groupData.group.team?.name || "-"}</td>
                                                            <td className="p-2 text-center">{groupData.memberCount}</td>
                                                            <td className="p-2 text-center font-medium">{groupData.outputRate.toFixed(1)}</td>
                                                            <td className={`p-2 text-center font-medium ${percentOfAvg >= 110
                                                                ? 'text-green-600'
                                                                : percentOfAvg < 90
                                                                    ? 'text-red-500'
                                                                    : 'text-blue-500'
                                                                }`}>
                                                                {percentOfAvg.toFixed(0)}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="details">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin chi tiết túi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium mb-1">Mã túi</p>
                                            <p className="mb-4">{handBag.code}</p>

                                            <p className="text-sm font-medium mb-1">Tên túi</p>
                                            <p className="mb-4">{handBag.name}</p>

                                            <p className="text-sm font-medium mb-1">Mô tả</p>
                                            <p className="mb-4">{handBag.description || "-"}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium mb-1">Kích thước</p>
                                            <p className="mb-4">{handBag.dimensions || "-"}</p>

                                            <p className="text-sm font-medium mb-1">Chất liệu</p>
                                            <p className="mb-4">{handBag.material || "-"}</p>

                                            {handBag.imageUrl && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium mb-1">Hình ảnh</p>
                                                    <img
                                                        src={handBag.imageUrl}
                                                        alt={handBag.name}
                                                        className="max-w-full h-auto max-h-40 object-contain rounded-md border"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default HandBagDetails;