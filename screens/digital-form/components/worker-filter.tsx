// components/worker-filter.tsx
"use client"

import { useState, useCallback, memo, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter as FilterIcon, X, Check, SortAsc, SortDesc, UserPlus } from "lucide-react"
import { AttendanceStatus } from "@/common/types/digital-form"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import { useDebouncedCallback } from "@/utils/debounce"

interface WorkerFilterProps {
    onFilterChange: (filters: {
        search: string
        status: AttendanceStatus | "ALL"
        sortBy: "name" | "employeeId" | "totalOutput"
    }) => void
}

/**
 * Enhanced component for filtering workers with performance optimizations
 * Uses debouncing for search input and memoization to prevent unnecessary renders
 */
function WorkerFilterComponent({ onFilterChange }: WorkerFilterProps) {
    // Local state for UI
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState<AttendanceStatus | "ALL">("ALL")
    const [sortBy, setSortBy] = useState<"name" | "employeeId" | "totalOutput">("name")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0
        if (search) count++
        if (status !== "ALL") count++
        if (sortBy !== "name" || sortDirection !== "asc") count++
        return count
    }, [search, status, sortBy, sortDirection])

    // Create debounced filter change handler for better performance
    const debouncedFilterChange = useDebouncedCallback(
        (
            newSearch: string,
            newStatus: AttendanceStatus | "ALL",
            newSortBy: "name" | "employeeId" | "totalOutput"
        ) => {
            onFilterChange({
                search: newSearch,
                status: newStatus,
                sortBy: newSortBy
            })
        },
        300
    )

    // Handle search input change with debounce
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newSearch = e.target.value
        setSearch(newSearch)
        debouncedFilterChange(newSearch, status, sortBy)
    }, [debouncedFilterChange, status, sortBy])

    // Handle status change
    const handleStatusChange = useCallback((value: AttendanceStatus | "ALL") => {
        setStatus(value)
        debouncedFilterChange(search, value, sortBy)
    }, [debouncedFilterChange, search, sortBy])

    // Handle sort change
    const handleSortChange = useCallback((value: "name" | "employeeId" | "totalOutput") => {
        setSortBy(value)
        debouncedFilterChange(search, status, value)
    }, [debouncedFilterChange, search, status])

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearch("")
        setStatus("ALL")
        setSortBy("name")
        setSortDirection("asc")
        onFilterChange({ search: "", status: "ALL", sortBy: "name" })
    }, [onFilterChange])

    // Get status display text
    const getStatusDisplayText = (status: AttendanceStatus | "ALL"): string => {
        switch (status) {
            case "ALL": return "Tất cả"
            case AttendanceStatus.PRESENT: return "Có mặt"
            case AttendanceStatus.ABSENT: return "Vắng mặt"
            case AttendanceStatus.LATE: return "Đi muộn"
            case AttendanceStatus.EARLY_LEAVE: return "Về sớm"
            case AttendanceStatus.LEAVE_APPROVED: return "Nghỉ phép"
            default: return "Tất cả"
        }
    }

    // Get sort by display text
    const getSortByDisplayText = (sortBy: "name" | "employeeId" | "totalOutput"): string => {
        switch (sortBy) {
            case "name": return "Tên"
            case "employeeId": return "Mã nhân viên"
            case "totalOutput": return "Sản lượng"
            default: return "Tên"
        }
    }

    return (
        <div className="space-y-2">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm công nhân..."
                    value={search}
                    onChange={handleSearchChange}
                    className="pl-8 pr-8"
                />
                {search && (
                    <button
                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setSearch("")
                            debouncedFilterChange("", status, sortBy)
                        }}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between">
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                        >
                            <FilterIcon className="h-3 w-3 mr-1.5" />
                            Bộ lọc
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none text-sm">Trạng thái</h4>
                                <Select
                                    value={status}
                                    onValueChange={(value) => handleStatusChange(value as AttendanceStatus | "ALL")}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Tất cả" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tất cả</SelectItem>
                                        <SelectItem value={AttendanceStatus.PRESENT}>Có mặt</SelectItem>
                                        <SelectItem value={AttendanceStatus.ABSENT}>Vắng mặt</SelectItem>
                                        <SelectItem value={AttendanceStatus.LATE}>Đi muộn</SelectItem>
                                        <SelectItem value={AttendanceStatus.EARLY_LEAVE}>Về sớm</SelectItem>
                                        <SelectItem value={AttendanceStatus.LEAVE_APPROVED}>Nghỉ phép</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none text-sm">Sắp xếp theo</h4>
                                <Select
                                    value={sortBy}
                                    onValueChange={(value) => handleSortChange(value as "name" | "employeeId" | "totalOutput")}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Tên" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name">Tên</SelectItem>
                                        <SelectItem value="employeeId">Mã nhân viên</SelectItem>
                                        <SelectItem value="totalOutput">Sản lượng</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium leading-none text-sm">Thứ tự sắp xếp</h4>
                                <ToggleGroup
                                    type="single"
                                    className="flex justify-start"
                                    value={sortDirection}
                                    onValueChange={(value) => {
                                        if (value) {
                                            setSortDirection(value as "asc" | "desc");
                                        }
                                    }}
                                >
                                    <ToggleGroupItem value="asc" size="sm" className="text-xs px-3">
                                        <SortAsc className="h-3.5 w-3.5 mr-1" />
                                        Tăng dần
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="desc" size="sm" className="text-xs px-3">
                                        <SortDesc className="h-3.5 w-3.5 mr-1" />
                                        Giảm dần
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>

                            <Separator />

                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-xs"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Xóa bộ lọc
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setIsFilterOpen(false)}
                                    className="text-xs"
                                >
                                    <Check className="h-3 w-3 mr-1" />
                                    Áp dụng
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {activeFilterCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Xóa bộ lọc
                    </Button>
                )}
            </div>

            {/* Active filter indicators */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {status !== "ALL" && (
                        <Badge variant="secondary" className="text-xs h-6">
                            Trạng thái: {getStatusDisplayText(status)}
                            <button
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                onClick={() => handleStatusChange("ALL")}
                            >
                                <X className="h-3 w-3 inline-block" />
                            </button>
                        </Badge>
                    )}

                    {(sortBy !== "name" || sortDirection !== "asc") && (
                        <Badge variant="secondary" className="text-xs h-6">
                            Sắp xếp: {getSortByDisplayText(sortBy)} {sortDirection === "asc" ? "↑" : "↓"}
                            <button
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    setSortBy("name");
                                    setSortDirection("asc");
                                    debouncedFilterChange(search, status, "name");
                                }}
                            >
                                <X className="h-3 w-3 inline-block" />
                            </button>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    )
}

// Export memoized component to prevent unnecessary rerenders
export const WorkerFilter = memo(WorkerFilterComponent);