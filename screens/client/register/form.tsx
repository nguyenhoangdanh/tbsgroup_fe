// Form.tsx
'use client';

const RegisterForm = () => {
    // const methods = useForm<RegisterValidatorType>({
    //     defaultValues: defaultRegisterValues,
    //     resolver: zodResolver(registerScheme),
    // });
    // const { control, handleSubmit } = methods;

    // const onSubmit: SubmitHandler<RegisterValidatorType> = (data) => {
    //     console.log(data);
    // };

    return (
        <div className="">
            sdfghjsd
        </div>
        //     <FormProvider {...methods}>

        //         <Grid container display={'flex'} flexDirection={'column'} gap={10}>
        //             <form onSubmit={handleSubmit(onSubmit)}>
        //                 <TextInput
        //                     name="username"
        //                     control={control}
        //                     label="Username"
        //                     required
        //                     placeholder="Please enter your username"
        //                     helperText=""
        //                 />
        //                 <TextInput
        //                     name="email"
        //                     control={control}
        //                     label="Email"
        //                     type="email"
        //                     required
        //                     placeholder="Please enter your email"
        //                     helperText=""
        //                 />
        //                 <TextInput
        //                     name="password"
        //                     control={control}
        //                     label="Password"
        //                     type="password"
        //                     required
        //                     placeholder="Please enter your password"
        //                     helperText=""
        //                 />
        //                 <Grid container>
        //                     <Grid size={12} padding={`10px 0`}>
        //                         <Button
        //                             fullWidth
        //                             type="submit"
        //                             variant="contained"
        //                             color="primary"
        //                         >
        //                             Register
        //                         </Button>
        //                     </Grid>
        //                     <Grid size={12} sx={{
        //                         display: 'flex',
        //                         justifyContent: 'center',
        //                         alignItems: 'center',
        //                     }}>
        //                         <Link fontSize={14} href="/login">
        //                             Already have an account? Login
        //                         </Link>
        //                     </Grid>
        //                 </Grid>
        //             </form>
        //             <Divider sx={{
        //                 display: 'flex',
        //                 flexDirection: 'row',
        //                 gap: 10,
        //             }}>
        //                 <Typography variant={'body2'}>Or with</Typography>
        //             </Divider>
        //             <Grid size={12} padding={`10px 0`}>
        //                 <OAuth />
        //             </Grid>
        //         </Grid>
        //     </FormProvider>
    );
};

export default RegisterForm;