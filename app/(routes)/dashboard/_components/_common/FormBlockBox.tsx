"use client"
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import React from 'react'

const FormBlockBox = () => {
    const [search, setSearch] = React.useState<string>('');
    return (
        <div className='w-full'>
            <div className="flex gap-2 py-4 text-sm">
                <Input
                    placeholder='Search blocks'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='placeholder:text-gray-400 shadow-sm'
                />
            </div>
            <div className="flex flex-col space-y-3 w-full">
                <div className="mb-2">
                    <h5 className="text-[13px] text-gray-500 font-medium">
                        Layout
                    </h5>
                </div>
                <Separator className='!bg-gray-200' />
                <div className="">
                    <h5 className="text-[13px] text-gray-500 font-medium">
                        Form
                    </h5>
                </div>
            </div>
        </div>
    )
}

export default FormBlockBox