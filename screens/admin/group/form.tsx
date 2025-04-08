"use client";

import React, { useState, useCallback, memo, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { FieldInput } from "@/components/common/Form/FieldInput";
import { FieldTextarea } from "@/components/common/Form/FieldTextarea";
import FormActions from "@/components/common/Form/FormAction";
import { useDialog } from "@/context/DialogProvider";
import { FieldCombobox } from "@/components/common/Form/FieldCombobox";
import { useTeamQueries } from "@/hooks/teams/useTeamQueries";
import { useTeam } from "@/hooks/teams/TeamContext";

// Define schema validation for the group
const groupSchema = z.object({
    id: z.string().optional(),
    code: z.string().min(2, { message: "Mã nhóm phải có ít nhất 2 ký tự" }),
    name: z.string().min(2, { message: "Tên nhóm phải có ít nhất 2 ký tự" }),
    description: z.string().optional(),
    teamId: z.string({ required_error: "Vui lòng chọn tổ" }),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

type GroupSchema = z.infer<typeof groupSchema>;

// Default values for the form
const defaultGroupValues: GroupSchema = {
    code: "",
    name: "",
    description: "",
    teamId: "",
};

interface GroupFormProps {
    onSubmit?: (data: GroupSchema) => Promise<void | boolean>;
    refetchData?: () => void;
}

const GroupForm: React.FC<GroupFormProps> = memo(({
    onSubmit,
    refetchData,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog, dialog, isReadOnly } = useDialog();

    // Fetch teams for combobox
    const { getAllTeams } = useTeam();
    const { data: teams } = getAllTeams();

    // Define the type for teams
    type Team = { id: string; name: string };

    const teamOptions = useMemo(() => {
        return teams?.map((team: Team) => ({
            value: team.id,
            label: team.name,
        })) || [];
    }, [teams]);

    // Initialize form with default values or data from dialog
    const form = useForm<GroupSchema>({
        resolver: zodResolver(groupSchema),
        defaultValues: dialog.data ? {
            id: dialog.data.id,
            code: dialog.data.code,
            name: dialog.data.name,
            description: dialog.data.description,
            teamId: dialog.data.teamId,
        } : defaultGroupValues,
    });

    // Handle form submission
    const handleSubmit = useCallback(async (values: GroupSchema) => {
        if (isReadOnly || isSubmitting) return;

        try {
            setIsSubmitting(true);
            console.log("Saving group data:", values);

            if (onSubmit) {
                const result = await onSubmit(values);

                // If result is true, close the dialog
                if (result === true) {
                    hideDialog();
                }
            }

            // If refetch data function is provided
            if (refetchData) {
                refetchData();
            }
        } catch (error) {
            console.error("Error saving group data:", error);
        } finally {
            setIsSubmitting(false);
        }
    }, [isReadOnly, isSubmitting, onSubmit, hideDialog, refetchData]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="code"
                        label="Mã nhóm"
                        placeholder="Nhập mã nhóm"
                        disabled={isSubmitting || isReadOnly}
                        required
                    />

                    <FieldInput
                        control={form.control}
                        name="name"
                        label="Tên nhóm"
                        placeholder="Nhập tên nhóm"
                        disabled={isSubmitting || isReadOnly}
                        required
                    />
                </div>

                <FieldTextarea
                    control={form.control}
                    name="description"
                    label="Mô tả"
                    placeholder="Nhập mô tả về nhóm"
                    disabled={isSubmitting || isReadOnly}
                    rows={4}
                />

                <FieldCombobox
                    control={form.control}
                    name="teamId"
                    label="Thuộc tổ"
                    placeholder="Chọn tổ"
                    options={teamOptions}
                    disabled={isSubmitting || isReadOnly}
                    required
                />

                <FormActions
                    isSubmitting={isSubmitting}
                    isReadOnly={isReadOnly}
                    isEdit={!!dialog.data?.id}
                />
            </form>
        </Form>
    );
});

export default memo(GroupForm);