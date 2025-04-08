"use client";

import React, { useState, useCallback, Suspense } from "react";
import { BarChart, Briefcase, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BagGroupRateStats from "./BagGroupRateStats";
import ProductivityAnalysis from "./ProductivityAnalysis";
import BagGroupRateList from "./BagGroupRateList";
import HandBagGroups from "./HandBagGroups";
import FilterBar from './FilterBar';
import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";
import HandBagManagementScreen from "../handbag/Container";

const BagGroupRateContainer = () => {
    const [activeTab, setActiveTab] = useState<string>("handBags");
    const [selectedHandBagId, setSelectedHandBagId] = useState<string | null>(null);
    const [cachedData, setCachedData] = useState<Record<string, any>>({});

    // Hàm lưu cache
    const cacheData = useCallback((key: string, data: any) => {
        setCachedData(prev => ({
            ...prev,
            [key]: {
                data,
                timestamp: Date.now()
            }
        }));
    }, []);

    // Kiểm tra cache có hợp lệ không (còn mới trong vòng 5 phút)
    const getCachedData = useCallback((key: string) => {
        const cached = cachedData[key];
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 phút
            return cached.data;
        }
        return null;
    }, [cachedData]);

    const handleShowAnalysis = useCallback((handBagId: string) => {
        setSelectedHandBagId(handBagId);
        setActiveTab("analysis");
    }, [])

    const CachedHandBagGroups = useCallback(() => {
        // Logic cache data
        return <HandBagGroups />;
    }, []);;

    return (
        <BagGroupRateContextBridge>
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col space-y-4">
                    {/* <div className="w-full mb-4">
                        <Suspense fallback={<div>Đang tải thống kê...</div>}>
                            <BagGroupRateStats />
                        </Suspense>
                    </div> */}

                    <Tabs
                        defaultValue="handBags"
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                    >
                        <TabsList className="mb-4">
                            <TabsTrigger value="handBags">
                                <Briefcase className="h-4 w-4 mr-2" />
                                Túi xách
                            </TabsTrigger>
                            <TabsTrigger value="handBagsAndGroups">
                                <Package className="h-4 w-4 mr-2" />
                                Thống kê
                            </TabsTrigger>
                            <TabsTrigger value="list">Danh sách năng suất</TabsTrigger>
                            <TabsTrigger value="analysis" disabled={!selectedHandBagId}>
                                <BarChart className="h-4 w-4 mr-2" />
                                Phân tích năng suất
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="handBags" className="space-y-4">
                            <Suspense fallback={<div>Đang tải danh sách túi...</div>}>
                                <HandBagManagementScreen />
                            </Suspense>
                        </TabsContent>

                        <TabsContent value="handBagsAndGroups" className="space-y-4">
                            <Suspense fallback={<div>Đang tải danh sách túi...</div>}>
                                {/* <HandBagGroups /> */}
                                <CachedHandBagGroups />
                            </Suspense>
                        </TabsContent>

                        <TabsContent value="list" className="space-y-4">
                            {/* FilterBar */}
                            {/* <Suspense fallback={<div>Đang tải bộ lọc...</div>}>
                                <FilterBar />
                            </Suspense> */}

                            {/* List */}
                            <Suspense fallback={<div>Đang tải danh sách...</div>}>
                                <BagGroupRateList onShowAnalysis={handleShowAnalysis} />
                            </Suspense>
                        </TabsContent>

                        <TabsContent value="analysis">
                            {selectedHandBagId && (
                                <Suspense fallback={<div>Đang tải phân tích...</div>}>
                                    <ProductivityAnalysis handBagId={selectedHandBagId} />
                                </Suspense>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </BagGroupRateContextBridge>
    );
};

export default BagGroupRateContainer;