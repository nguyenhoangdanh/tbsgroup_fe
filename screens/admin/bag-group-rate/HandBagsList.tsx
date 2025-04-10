"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/common/table/data-table";
import { Button } from "@/components/ui/button";
import { Eye, BarChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";
import { useBagGroupRateContext } from "@/hooks/group/bag-group-rate/BagGroupRateContext";
import { HandBagWithStats } from "@/apis/group/bagGroupRate/bag-group-rate.api";
import { ColumnDef } from "@tanstack/react-table";

interface HandBagsListProps {
    handBags?: HandBagWithStats[];
    isLoading?: boolean;
}

const HandBagsList: React.FC<HandBagsListProps> = ({ handBags: propHandBags, isLoading: propIsLoading }) => {
    return (
        <BagGroupRateContextBridge>
            <HandBagsListContent handBags={propHandBags} isLoading={propIsLoading} />
        </BagGroupRateContextBridge>
    );
};

const HandBagsListContent: React.FC<HandBagsListProps> = ({ handBags: propHandBags, isLoading: propIsLoading }) => {
    const router = useRouter();
    const { getAllHandBagsWithStats } = useBagGroupRateContext();
    const [loading, setLoading] = useState(propIsLoading ?? true);
    const [handBags, setHandBags] = useState<HandBagWithStats[]>(propHandBags ?? []);

    useEffect(() => {
        if (propHandBags) {
            setHandBags(propHandBags);
            setLoading(propIsLoading ?? false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await getAllHandBagsWithStats();
                if (result && result.handBags) {
                    setHandBags(result.handBags);
                }
            } catch (error) {
                console.error("Error fetching hand bags:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getAllHandBagsWithStats, propHandBags, propIsLoading]);

    const handleViewDetails = (handBagId: string) => {
        router.push(`/admin/handbags/bag-group-rates/hand-bags/${handBagId}`);
    };

    const handleShowAnalysis = (handBagId: string) => {
        router.push(`/admin/handbags/bag-group-rates/analysis/${handBagId}`);
    };

    const columns: ColumnDef<HandBagWithStats>[] = [
        {
            accessorKey: "code",
            header: "Mã túi",
            cell: ({ row }) => {
                return (
                    <div className="font-medium">
                        {row.getValue("code")}
                    </div>
                );
            },
        },
        {
            accessorKey: "name",
            header: "Tên túi",
            cell: ({ row }) => {
                return (
                    <div>
                        {row.getValue("name")}
                    </div>
                );
            },
        },
        {
            accessorKey: "totalGroups",
            header: "Số nhóm",
            cell: ({ row }) => {
                return (
                    <div className="text-center">
                        {row.getValue("totalGroups")}
                    </div>
                );
            },
        },
        {
            accessorKey: "averageOutputRate",
            header: "Năng suất TB (SP/giờ)",
            cell: ({ row }) => {
                return (
                    <div className="text-center font-medium">
                        {Number(row.getValue("averageOutputRate")).toFixed(1)}
                    </div>
                );
            },
        },
        {
            accessorKey: "highestOutputRate",
            header: "Cao nhất (SP/giờ)",
            cell: ({ row }) => {
                return (
                    <div className="text-center text-green-600 font-medium">
                        {Number(row.getValue("highestOutputRate")).toFixed(1)}
                    </div>
                );
            },
        },
        {
            accessorKey: "lowestOutputRate",
            header: "Thấp nhất (SP/giờ)",
            cell: ({ row }) => {
                return (
                    <div className="text-center text-red-500 font-medium">
                        {Number(row.getValue("lowestOutputRate")).toFixed(1)}
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const handBag = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(handBag.id)}
                        >
                            <Eye className="h-4 w-4 mr-1" /> Chi tiết
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShowAnalysis(handBag.id)}
                            title="Phân tích năng suất"
                        >
                            <BarChart className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];


    return (
        <DataTable
            columns={columns}
            data={handBags}
            isLoading={loading}
            title="Danh sách túi xách và năng suất nhóm"
            description="Tổng hợp năng suất theo túi"
            searchColumn="code"
            searchPlaceholder="Tìm kiếm theo mã túi..."
            exportData={true}
        />
    );
};

export default HandBagsList;