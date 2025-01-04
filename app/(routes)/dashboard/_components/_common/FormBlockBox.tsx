"use client"
import BlockBtnElement from '@/components/BlockBtnElement';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useBuilder } from '@/context/builder-provider';
import { FormBlocks } from '@/lib/form-blocks';
import React from 'react'

const FormBlockBox = () => {
    const { formData } = useBuilder();
    const isPublished = formData?.published;
    const [search, setSearch] = React.useState<string>('');
    const filteredBlocks = Object.values(FormBlocks).filter((block) => {
        return block.blockBtnElement.label.toLowerCase().includes(search.toLowerCase());
    });

    const layoutBlocks = filteredBlocks.filter((block) => block.blockCategory === 'Layout');
    const fieldBlocks = filteredBlocks.filter((block) => block.blockCategory === 'Field');
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
                {layoutBlocks?.length > 0 && (
                    <div className="mb-2">
                        <h5 className="text-[13px] text-gray-500 font-medium">
                            Layout
                        </h5>
                        <div className="pt-1 grid grid-cols-3 gap-3">
                            {layoutBlocks.map((block) => (
                                <BlockBtnElement
                                    key={block.blockType}
                                    formBlock={block}
                                    disabled={isPublished}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <Separator className='!bg-gray-200' />
                <div className="">
                    <h5 className="text-[13px] text-gray-500 font-medium">
                        Field
                    </h5>
                    <div className="pt-1 grid grid-cols-3 gap-3">
                        {fieldBlocks.map((block) => (
                            <BlockBtnElement
                                key={block.blockType}
                                formBlock={block}
                                disabled={isPublished}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FormBlockBox