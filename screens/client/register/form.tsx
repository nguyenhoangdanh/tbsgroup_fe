// Form.tsx
'use client';
import TextInput from "@/components/common/FormInput/TextInput";
import React from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Divider, Link, Typography } from "@mui/material";
import { Grid } from "@/components";
import { defaultRegisterValues, registerScheme, RegisterValidatorType } from "@/validators/client/auth.validator";
import OAuth from "../login/oauth/OAuth";

const RegisterForm = () => {
    const methods = useForm<RegisterValidatorType>({
        defaultValues: defaultRegisterValues,
        resolver: zodResolver(registerScheme),
    });
    const { control, handleSubmit } = methods;

    const onSubmit: SubmitHandler<RegisterValidatorType> = (data) => {
        console.log(data);
    };

    return (
        <FormProvider {...methods}>

            <Grid container display={'flex'} flexDirection={'column'} gap={10}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextInput
                        name="username"
                        control={control}
                        label="Username"
                        required
                        placeholder="Please enter your username"
                        helperText=""
                    />
                    <TextInput
                        name="email"
                        control={control}
                        label="Email"
                        type="email"
                        required
                        placeholder="Please enter your email"
                        helperText=""
                    />
                    <TextInput
                        name="password"
                        control={control}
                        label="Password"
                        type="password"
                        required
                        placeholder="Please enter your password"
                        helperText=""
                    />
                    <Grid container>
                        <Grid size={12} padding={`10px 0`}>
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                color="primary"
                            >
                                Register
                            </Button>
                        </Grid>
                        <Grid size={12} sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Link fontSize={14} href="/login">
                                Already have an account? Login
                            </Link>
                        </Grid>
                    </Grid>
                </form>
                <Divider sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 10,
                }}>
                    <Typography variant={'body2'}>Or with</Typography>
                </Divider>
                <Grid size={12} padding={`10px 0`}>
                    <OAuth />
                </Grid>
            </Grid>
        </FormProvider>
    );
};

export default RegisterForm;