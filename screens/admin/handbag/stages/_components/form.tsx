"use client";
import { createProductionProcess } from "@/actions/admin/handbag";
import {
  defautHandbagStageFormValues,
  handbagStageFormSchema,
  THandbagStageForm,
} from "@/schemas/handbag";
import SubmitButton from "@/components/SubmitButton";
import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useDispatchType } from "@/lib/dispatch.utils";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import FormController from "@/components/common/form/FormController";

interface HandbagStageFormProps {
  action: "create" | "update";
}

const HandbagStageForm: React.FC<HandbagStageFormProps> = ({ action }) => {
  const dispatch = useDispatchType();
  const methods = useForm<THandbagStageForm>({
    defaultValues: defautHandbagStageFormValues,
    resolver: zodResolver(handbagStageFormSchema),
  });

  const onSubmit: SubmitHandler<THandbagStageForm> = async (data) => {
    const rs = await createProductionProcess({
      code: data.code,
      name: data.name,
    });

    if (rs.success) {
      dispatch("FETCH_PO_HANDBAG");
      toast({
        title: "Thành công",
        description: "Đã tạo quy trình sản xuất",
        // description: `Đã tạo quy trình sản xuất ${rs?.productionProcess?.name}`,
      });
    } else {
      toast({
        title: "Lỗi",
        description: rs.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };
  return (
    <FormController methods={methods} onSubmit={onSubmit}>
      <FormField
        control={methods.control}
        name="code"
        render={({ field }) => (
          <div className="col-span-4">
            <Label htmlFor="code" className="text-right">
              Mã
            </Label>
            <Input id="code" {...field} />
          </div>
        )}
      />
      <FormField
        control={methods.control}
        name="name"
        render={({ field }) => (
          <div className="col-span-4">
            <Label htmlFor="name" className="text-right">
              Tên
            </Label>
            <Input id="name" {...field} />
          </div>
        )}
      />
    </FormController>
  );
};

export default HandbagStageForm;
