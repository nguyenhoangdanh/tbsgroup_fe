"use client";
import SubmitButton from "@/components/SubmitButton";
import { DialogClose } from "@/components/ui/dialog";
import React from "react";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  Resolver,
  FieldValues,
} from "react-hook-form";

interface IProps<TForm extends FieldValues> {
  children: React.ReactNode;
  methods: ReturnType<typeof useForm<TForm>>;
  onSubmit: SubmitHandler<TForm>;
}

const FormController = <TForm extends FieldValues>({
  methods,
  onSubmit,
  children,
}: IProps<TForm>) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          {children}
          <SubmitButton name="Lưu" />
        </div>
      </form>
    </FormProvider>
  );
};

export default FormController;
