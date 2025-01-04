import { ObjectBlockType } from '@/@types/form-block.type'
import React from 'react'
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';

const BlockBtnDragOverlay = ({
    formBlock
}: {
    formBlock: ObjectBlockType;
}) => {
    const { icon: Icon, label } = formBlock.blockBtnElement;
    return (
        <Button
            className={cn(`
            flex flex-col gap-2 h-[75px] w-20 cursor-grab !bg-white border text-gray-600
            ring-2 ring-primary/80`,
            )}
        >
            <Icon className="!w-8 !h-8 !stroke-[0.9] !cursor-grab" />
            <h5
                style={{ fontWeight: 500 }}
                className='text-[11.4px] -mt-1 text-gray-600'>
                {label}
            </h5>
        </Button>
    )
}

export default BlockBtnDragOverlay