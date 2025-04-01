import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MoreHorizontal,
    Factory,
    Activity,
    Settings,
    Workflow,
    Building
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Line } from '@/common/interface/line';
import { useFactoryQueries } from '@/hooks/factory/useFactoryQueries';

interface LinesListProps {
    lines: Line[];
    factoryId: string;
    onLineSelect: (lineId: string) => void;
}

const LinesList: React.FC<LinesListProps> = ({ lines, onLineSelect, factoryId }) => {
    // Fetch factory details
    const { getFactoryWithDetails } = useFactoryQueries();
    const { data: factory } = getFactoryWithDetails(factoryId, {
        includeManagers: false
    });
    // Function to render line status badge
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="secondary">Hoạt động</Badge>;
            case 'INACTIVE':
                return <Badge variant="outline">Tạm dừng</Badge>;
            case 'MAINTENANCE':
                return <Badge variant="destructive">Bảo trì</Badge>;
            default:
                return <Badge>Không xác định</Badge>;
        }
    };

    // Memoized lines processing for better performance
    const processedLines = useMemo(() => {
        return lines.map(line => ({
            ...line,
            capacityPercentage: line.capacity
                ? Math.min(100, Math.round((line.capacity / 1000) * 100))
                : 0
        }));
    }, [lines]);

    if (!lines || lines.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách dây chuyền</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Factory className="h-12 w-12 mb-4" />
                        <p>Chưa có dây chuyền nào trong nhà máy này</p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    return (
        <div className="space-y-4">
            {processedLines.map((line) => (
                <Card
                    key={line.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => onLineSelect(line.id)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    <Activity className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-lg font-medium">{line.name}</h3>
                                        <Badge variant="outline">{line.code}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {line.description || 'Không có mô tả'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {renderStatusBadge(line.status || 'ACTIVE')}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Implement edit functionality
                                            }}
                                        >
                                            <Settings className="mr-2 h-4 w-4" /> Chỉnh sửa
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Công suất:</span>
                                <p>{line.capacity ? `${line.capacity} sản phẩm/ngày` : 'Chưa cập nhật'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Ngày tạo:</span>
                                <p>{line.createdAt ? new Date(line.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Factory and Line Details Section */}
                        <div className="mt-4 flex items-center justify-between border-t pt-3">
                            <div className="flex items-center space-x-2">
                                <Building className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm">
                                    {factory?.name || 'Nhà máy chưa xác định'}
                                </span>
                            </div>

                            {/* Capacity Visualization */}
                            <div className="flex items-center space-x-2">
                                <Workflow className="h-5 w-5 text-muted-foreground" />
                                <div className="w-24 bg-muted rounded-full h-2.5">
                                    <div
                                        className="bg-primary rounded-full h-2.5"
                                        style={{
                                            width: `${line.capacityPercentage}%`,
                                            transition: 'width 0.5s ease-in-out'
                                        }}
                                    ></div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {line.capacityPercentage}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default LinesList;

// Loading spinner component
export const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
);

// Error alert component
export const ErrorAlert: React.FC<{ message?: string }> = ({ message }) => (
    <Card>
        <CardHeader>
            <CardTitle>Lỗi</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-destructive">
                {message || 'Đã xảy ra lỗi không xác định'}
            </div>
        </CardContent>
    </Card>
);

// Page header component
export const PageHeader: React.FC<{
    title: string;
    description?: string;
    actionButton?: React.ReactNode;
}> = ({ title, description, actionButton }) => (
    <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && (
                <p className="text-muted-foreground mt-2">{description}</p>
            )}
        </div>
        {actionButton && <div>{actionButton}</div>}
    </div>
);