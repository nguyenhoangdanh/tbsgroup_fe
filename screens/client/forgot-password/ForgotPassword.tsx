// Form.tsx
'use client';
import TextInput from "@/components/common/FormInput/TextInput";
import { ForgotPasswordValidatorType, defaultForgotPasswordValues, forgotPasswordScheme } from "@/validators/client/auth.validator";
import React from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, } from "@mui/material";
import { Grid } from "@/components";

const ForgotPasswordForm = () => {
    const methods = useForm<ForgotPasswordValidatorType>({
        defaultValues: defaultForgotPasswordValues,
        resolver: zodResolver(forgotPasswordScheme),
    });
    const { control, handleSubmit } = methods;

    const onSubmit: SubmitHandler<ForgotPasswordValidatorType> = (data) => {
        console.log(data);
    };

    return (
        <FormProvider {...methods}>
            <Grid container display={'flex'} flexDirection={'column'} gap={10}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextInput
                        name="email"
                        control={control}
                        label="Email"
                        type="email"
                        placeholder="Please enter your email"
                        helperText=""
                    />
                    <Grid size={12} padding={`10px 0`}>
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                        >
                            Confirm
                        </Button>
                    </Grid>

                </form>
            </Grid>
        </FormProvider>
    );
};

export default ForgotPasswordForm;
