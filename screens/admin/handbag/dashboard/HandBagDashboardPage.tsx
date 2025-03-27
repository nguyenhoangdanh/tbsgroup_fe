"use client";

import React, { useCallback, useState } from "react";
import { useHandBagDashboard } from "@/hooks/handbag/useHandBagDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { HandBag } from "@/common/interface/handbag";
import { useRouter } from "next/navigation";
import { Package, PackageOpen, PlusIcon, RefreshCw, Tag } from "lucide-react";

const statusColors = {
    active: "#10b981", // Green
    inactive: "#6b7280", // Gray
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const HandBagDashboardPage: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");

    const {
        dashboardStats,
        isLoadingStats,
        refreshDashboardData,
        getActiveHandBagPercentage,
        getActiveColorPercentage,
        handBagList,
        isLoadingHandBags,
    } = useHandBagDashboard();

    const handleViewHandBag = useCallback((handBag: HandBag) => {
        router.push(`/admin/handbag/${handBag.id}`);
    }, [router]);

    const handleCreateHandBag = useCallback(() => {
        router.push("/admin/handbag/new");
    }, [router]);

    const handleRefresh = useCallback(() => {
        refreshDashboardData();
    }, [refreshDashboardData]);

    const renderStatusPieChart = useCallback(() => {
        if (isLoadingStats) {
            return <Skeleton className="h-64 w-full" />;
        }

        const activePercentage = getActiveHandBagPercentage();
        const data = [
            { name: "Active", value: dashboardStats.activeHandBags },
            { name: "Inactive", value: dashboardStats.totalHandBags - dashboardStats.activeHandBags },
        ];

        return (
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? statusColors.active : statusColors.inactive} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} handbags`, 'Count']} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    }, [isLoadingStats, getActiveHandBagPercentage, dashboardStats]);

    const renderTopHandBags = useCallback(() => {
        if (isLoadingStats) {
            return (
                <>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full mb-2" />
                    ))}
                </>
            );
        }

        return (
            <div className="space-y-4">
                {dashboardStats.topHandBags.map(({ handBag, colorCount }) => (
                    <div
                        key={handBag.id}
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewHandBag(handBag)}
                    >
                        <div>
                            <h3 className="font-medium">{handBag.name}</h3>
                            <p className="text-sm text-gray-500">{handBag.category || "No category"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{colorCount} colors</Badge>
                            <Badge variant={handBag.active ? "default" : "secondary"}>
                                {handBag.active ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>
        );
    }, [dashboardStats.topHandBags, isLoadingStats, handleViewHandBag]);

    const renderRecentHandBags = useCallback(() => {
        if (isLoadingStats) {
            return (
                <>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full mb-2" />
                    ))}
                </>
            );
        }

        return (
            <div className="space-y-4">
                {dashboardStats.recentlyUpdatedHandBags.map((handBag) => (
                    <div
                        key={handBag.id}
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewHandBag(handBag)}
                    >
                        <div>
                            <h3 className="font-medium">{handBag.name}</h3>
                            <p className="text-sm text-gray-500">
                                {new Date(handBag.updatedAt).toLocaleDateString()}
                            </p>
                        </div>
                        <Badge variant={handBag.active ? "default" : "secondary"}>
                            {handBag.active ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                ))}
            </div>
        );
    }, [dashboardStats.recentlyUpdatedHandBags, isLoadingStats, handleViewHandBag]);

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">HandBag Dashboard</h1>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleRefresh} disabled={isLoadingStats}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={handleCreateHandBag}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        New HandBag
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total HandBags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <Package className="h-6 w-6 text-blue-500 mr-2" />
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <span className="text-2xl font-bold">{dashboardStats.totalHandBags}</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active HandBags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <PackageOpen className="h-6 w-6 text-green-500 mr-2" />
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold">{dashboardStats.activeHandBags}</span>
                                    <span className="text-sm text-gray-500">
                                        {getActiveHandBagPercentage()}% of total
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Colors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <Tag className="h-6 w-6 text-purple-500 mr-2" />
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <span className="text-2xl font-bold">{dashboardStats.totalColors}</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Colors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center">
                            <Tag className="h-6 w-6 text-green-500 mr-2" />
                            {isLoadingStats ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold">{dashboardStats.activeColors}</span>
                                    <span className="text-sm text-gray-500">
                                        {getActiveColorPercentage()}% of total
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="topHandBags">Top HandBags</TabsTrigger>
                    <TabsTrigger value="recentUpdates">Recent Updates</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>HandBag Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>{renderStatusPieChart()}</CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recently Updated HandBags</CardTitle>
                            </CardHeader>
                            <CardContent>{renderRecentHandBags()}</CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="topHandBags">
                    <Card>
                        <CardHeader>
                            <CardTitle>HandBags with Most Colors</CardTitle>
                        </CardHeader>
                        <CardContent>{renderTopHandBags()}</CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="recentUpdates">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recently Updated HandBags</CardTitle>
                        </CardHeader>
                        <CardContent>{renderRecentHandBags()}</CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default HandBagDashboardPage;