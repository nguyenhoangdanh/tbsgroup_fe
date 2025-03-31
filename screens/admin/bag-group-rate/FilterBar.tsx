"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBagGroupRateContext } from "@/hooks/group/bag-group-rate/BagGroupRateContext";
import { useForm } from "react-hook-form";
import UnifiedFormField from "@/components/common/Form/custom/UnifiedFormField";
import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";

interface FilterFormValues {
    handBagId: string;
    groupId: string;
    active: boolean;
}

/**
 * FilterBar component with Context Bridge
 * Displays filters for BagGroupRate
 */
const FilterBar: React.FC = () => {
    return (
        <BagGroupRateContextBridge>
            <FilterBarContent />
        </BagGroupRateContextBridge>
    );
};

/**
 * Inner content component that uses the context
 */
const FilterBarContent: React.FC = () => {
    const {
        handBags,
        groups,
        activeFilters,
        filterByHandBag,
        filterByGroup,
        filterByActive,
        resetFilters
    } = useBagGroupRateContext();

    const [isFiltering, setIsFiltering] = useState<boolean>(false);

    // Prepare options for comboboxes
    const handBagOptions = handBags?.map(bag => ({
        value: bag.id,
        label: `${bag.code} - ${bag.name}`
    })) || [];

    const groupOptions = groups?.map(group => ({
        value: group.id,
        label: `${group.code} - ${group.name}`
    })) || [];

    // Initialize form with filter values
    const form = useForm<FilterFormValues>({
        defaultValues: {
            handBagId: activeFilters.handBagId || "",
            groupId: activeFilters.groupId || "",
            active: activeFilters.active !== undefined ? activeFilters.active : true,
        },
    });

    // Update form values when activeFilters change
    useEffect(() => {
        form.setValue("handBagId", activeFilters.handBagId || "");
        form.setValue("groupId", activeFilters.groupId || "");
        form.setValue("active", activeFilters.active !== undefined ? activeFilters.active : true);

        // Check if any filter is active
        setIsFiltering(
            !!activeFilters.handBagId ||
            !!activeFilters.groupId ||
            activeFilters.active !== undefined
        );
    }, [activeFilters, form]);

    // Handle filter changes
    const handleFilterChange = (field: keyof FilterFormValues, value: any) => {
        switch (field) {
            case 'handBagId':
                filterByHandBag(value || null);
                break;
            case 'groupId':
                filterByGroup(value || null);
                break;
            case 'active':
                filterByActive(value);
                break;
        }
    };

    // Handle reset filters
    const handleResetFilters = () => {
        resetFilters();
        form.reset({
            handBagId: "",
            groupId: "",
            active: true,
        });
    };

    return (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="text-lg font-medium flex items-center">
                    <Search className="h-5 w-5 mr-2" />
                    Bộ lọc
                </div>

                {isFiltering && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="flex items-center text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Xóa bộ lọc
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UnifiedFormField
                    type="combobox"
                    control={form.control}
                    name="handBagId"
                    label="Túi xách"
                    placeholder="Lọc theo túi xách"
                    options={handBagOptions}
                    allowClear={true}
                    onChange={(value) => handleFilterChange('handBagId', value)}
                />

                <UnifiedFormField
                    type="combobox"
                    control={form.control}
                    name="groupId"
                    label="Nhóm"
                    placeholder="Lọc theo nhóm"
                    options={groupOptions}
                    allowClear={true}
                    onChange={(value) => handleFilterChange('groupId', value)}
                />

                <UnifiedFormField
                    type="switch"
                    control={form.control}
                    name="active"
                    label="Trạng thái"
                    description="Chỉ hiển thị năng suất đang kích hoạt"
                    onChange={(value) => handleFilterChange('active', value)}
                />
            </div>
        </div>
    );
};

export default FilterBar;