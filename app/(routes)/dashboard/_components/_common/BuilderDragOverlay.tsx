"use client"
import { FormBlockType } from '@/@types/form-block.type'
import BlockBtnDragOverlay from '@/components/BlockBtnDragOverlay'
import { useBuilder } from '@/context/builder-provider'
import { FormBlocks } from '@/lib/form-blocks'
import { Active, DragOverlay, useDndMonitor } from '@dnd-kit/core'
import React from 'react'

const BuilderDragOverlay = () => {
    const { blockLayouts } = useBuilder();
    const [draggedItem, setDraggedItem] = React.useState<Active | null>(null)
    useDndMonitor({
        onDragStart: (event) => {
            console.log('drag start', event)
            setDraggedItem(event.active)
        },
        onDragCancel: (event) => {
            setDraggedItem(null);
        },
        onDragEnd: (event) => {
            setDraggedItem(null);
        },
    })
    let fallbackNode = <div>No block drag</div>
    if (!draggedItem) return null;

    const isBlockBtnElement = draggedItem?.data?.current?.isBlockBtnElement;
    const isCanvasLayout = draggedItem?.data?.current?.isCanvasLayout;

    if (isBlockBtnElement) {
        const blockType = draggedItem?.data?.current?.blockType as FormBlockType;
        fallbackNode = <BlockBtnDragOverlay formBlock={FormBlocks[blockType]} />
    }

    if (isCanvasLayout) {
        const blockId = draggedItem.data?.current?.blockId;
        const blockLayout = blockLayouts.find(
            (blockLayout) => blockLayout.id === blockId
        );
        if (!blockLayout) fallbackNode = <div>No block drag</div>;
        else {
            const CanvasBlockComponent =
                FormBlocks[blockLayout.blockType].canvasComponent;
            fallbackNode = (
                <div className="pointer-events-none">
                    <CanvasBlockComponent blockInstance={blockLayout} />
                </div>
            );
        }
    }
    return (
        <DragOverlay>
            <div className="opacity-95">
                {fallbackNode}
            </div>
        </DragOverlay>
    )
}

export default BuilderDragOverlay