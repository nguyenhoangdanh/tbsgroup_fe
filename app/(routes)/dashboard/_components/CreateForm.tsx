"use client"
import React from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Form, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { defautFormValues, formSchema, TForm } from '@/schemas/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createForm } from '@/actions/form.action';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const CreateForm = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState<boolean>(false);

    const methods = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: defautFormValues,
    });

    const onSubmit: SubmitHandler<TForm> = async (data) => {
        const response = await createForm({
            name: data.name,
            description: data.description,
        });

        if (response.success) {
            setIsOpen(false);
            toast({
                title: 'Success',
                description: 'Form created successfully',
            })
            methods.reset();
            router.push(`/dashboard/form/builder/${response?.form?.formId}`)
        } else {
            toast({
                title: 'Error',
                description: response?.message || 'An error occurred',
                variant: "destructive"
            })
        }
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button className='!bg-primary !font-medium gap-1'>
                        <PlusIcon />
                        Create a form
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom">
                    <div className="w-full max-w-5xl !font-medium mx-auto">
                        <SheetHeader>
                            <SheetTitle>Create New Form</SheetTitle>
                            <SheetDescription>
                                This will create a new form. Ensure all details are accurate.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="w-full dialog-content">
                            <FormProvider {...methods}>
                                <form
                                    onSubmit={methods.handleSubmit(onSubmit)}
                                    className='space-y-4'
                                >
                                    <FormField
                                        control={methods.control}
                                        name='name'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        autoComplete='off'
                                                        placeholder='Form name'
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage>{methods.formState.errors.name?.message}</FormMessage>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={methods.control}
                                        name='description'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder='Form description'
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage>{methods.formState.errors.description?.message}</FormMessage>
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type='submit'
                                        disabled={methods.formState.isSubmitting}
                                        className='!bg-primary px-5 flex place-self-end'>
                                        Create Form
                                    </Button>
                                </form>
                            </FormProvider>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}

export default CreateForm