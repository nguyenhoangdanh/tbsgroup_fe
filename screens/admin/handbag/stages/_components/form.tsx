"use client";
import { createProductionProcess } from "@/actions/admin/handbag";
import {
  defautHandbagStageFormValues,
  handbagStageFormSchema,
  THandbagStageForm,
} from "@/app/schemas/handbag";
import SubmitButton from "@/components/SubmitButton";
import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useDispatchType } from "@/lib/dispatch.utils";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

const HandbagStageForm = () => {
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
        description: `Đã tạo quy trình sản xuất ${rs?.productionProcess?.name}`,
      });
      methods.reset();
    } else {
      toast({
        title: "Lỗi",
        description: rs.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
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
          <SubmitButton name="Lưu" />
        </div>
      </form>
    </FormProvider>
  );
};

export default HandbagStageForm;
