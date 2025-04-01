import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Typescript interface for type safety
interface User {
    id: string;
    fullName?: string;
    email?: string;
    avatar?: string;
}

interface FactoryManager {
    userId: string;
    startDate: string;
    endDate?: string;
    isPrimary: boolean;
    user?: User;
}

interface FactoryManagersTableProps {
    factoryId: string;
    managers: FactoryManager[];
    users: User[];
    onAddManager?: () => void;
    onEditManager?: (manager: FactoryManager) => void;
    onDeleteManager?: (userId: string) => void;
}

export const FactoryManagersTable: React.FC<FactoryManagersTableProps> = ({
    factoryId,
    managers,
    users,
    onAddManager,
    onEditManager,
    onDeleteManager
}) => {
    const [selectedManagers, setSelectedManagers] = useState<string[]>([]);

    const toggleManagerSelection = (userId: string) => {
        setSelectedManagers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const isAllSelected = managers.length > 0 && selectedManagers.length === managers.length;
    const isSomeSelected = selectedManagers.length > 0 && selectedManagers.length < managers.length;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle>Danh sách quản lý</CardTitle>
                    <CardDescription>Những người quản lý nhà máy</CardDescription>
                </div>
                <Button size="sm" onClick={onAddManager}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm quản lý
                </Button>
            </CardHeader>
            <CardContent>
                {managers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 space-y-2">
                        <p className="text-muted-foreground">Chưa có quản lý nào cho nhà máy này</p>
                        <Button variant="outline" size="sm" onClick={onAddManager}>
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm quản lý
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Select all checkbox */}
                        <div className="flex items-center space-x-2 mb-2">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                indeterminate={isSomeSelected}
                                onChange={() => {
                                    setSelectedManagers(
                                        isAllSelected ? [] : managers.map(m => m.userId)
                                    );
                                }}
                            />
                            <span className="text-sm">
                                {selectedManagers.length > 0
                                    ? `Đã chọn ${selectedManagers.length}/${managers.length}`
                                    : 'Chọn tất cả'}
                            </span>
                        </div>

                        {managers.map((manager) => (
                            <div
                                key={manager.userId}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card"
                            >
                                {/* Checkbox for individual selection */}
                                <div className="flex items-center space-x-2 mr-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedManagers.includes(manager.userId)}
                                        onChange={() => toggleManagerSelection(manager.userId)}
                                    />
                                </div>

                                {/* Manager details */}
                                <div className="flex items-center space-x-4 flex-grow">
                                    <Avatar>
                                        {manager.user?.avatar ? (
                                            <AvatarImage
                                                src={manager.user.avatar}
                                                alt={manager.user?.fullName || 'User'}
                                            />
                                        ) : null}
                                        <AvatarFallback>
                                            {manager.user?.fullName
                                                ? manager.user.fullName.charAt(0).toUpperCase()
                                                : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <p className="font-medium">
                                            {manager.user?.fullName || manager.userId}
                                        </p>
                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                            <span>Từ: {new Date(manager.startDate).toLocaleDateString('vi-VN')}</span>
                                            {manager.endDate && (
                                                <span>đến: {new Date(manager.endDate).toLocaleDateString('vi-VN')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Manager badges and actions */}
                                <div className="flex items-center gap-2">
                                    {manager.isPrimary && (
                                        <Badge className="mr-2">Quản lý chính</Badge>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => onEditManager && onEditManager(manager)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDeleteManager && onDeleteManager(manager.userId)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Batch actions */}
                        {selectedManagers.length > 0 && (
                            <div className="mt-4 flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    {selectedManagers.length} quản lý được chọn
                                </span>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        // Implement batch delete if needed
                                        selectedManagers.forEach(userId =>
                                            onDeleteManager && onDeleteManager(userId)
                                        );
                                        setSelectedManagers([]);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa các quản lý đã chọn
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};