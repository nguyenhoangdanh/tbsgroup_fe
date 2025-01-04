import { FormBlockInstance, FormBlockType } from '@/@types/form-block.type';
import { allBlockLayouts } from '@/contants';
import { useBuilder } from '@/context/builder-provider'
import { FormBlocks } from '@/lib/form-blocks';
import { generateUniqueId } from '@/lib/helper';
import { cn } from '@/lib/utils'
import { Active, useDndMonitor, useDroppable, DragEndEvent } from '@dnd-kit/core'
import React from 'react'

const BuilderCanvas = () => {
    const {
        blockLayouts,
        addBlockLayout,
        insertBlockLayoutAtIndex,
        repositionBlockLayout
    } = useBuilder();
    const [activeBlock, setActiveBlock] = React.useState<Active | null>(null);

    const droppable = useDroppable({
        id: "builder-canvas-droppable",
        data: {
            isBuilderCanvasDropArea: true,
        },
    });

    useDndMonitor({
        onDragStart(event) {
            setActiveBlock(event.active);
        },
        onDragEnd(event: DragEndEvent) {
            const { active, over } = event;
            if (!active || !over) return;
            setActiveBlock(null);

            const isBlockBtnElement = active?.data?.current?.isBlockBtnElement;
            const isBlockLayout = active?.data?.current?.blockType;

            const isDraggingOverCanvas = over?.data?.current?.isBuilderCanvasDropArea;

            if (isBlockBtnElement && isDraggingOverCanvas && allBlockLayouts.includes(isBlockLayout)) {
                const blockType = active?.data?.current?.blockType as FormBlockType;
                const newBlockLayout = FormBlocks[blockType].createInstance(generateUniqueId());
                addBlockLayout(newBlockLayout);
                return;
            }

            console.log('over', over)

            const isDroppingOverCanvasBlockLayoutAbove = over?.data?.current?.isAbove;
            const isDroppingOverCanvasBlockLayoutBelow = over?.data?.current?.isBelow;

            const isDroppingOverCanvasLayout =
                isDroppingOverCanvasBlockLayoutAbove ||
                isDroppingOverCanvasBlockLayoutBelow;

            //-> NEW BLOCK LAYOUT TO A SPECIFIC POSITION
            const droppingLayoutBlockOverCanvas =
                isBlockBtnElement &&
                allBlockLayouts.includes(isBlockLayout) &&
                isDroppingOverCanvasLayout;

            if (droppingLayoutBlockOverCanvas) {
                const blockType = active.data?.current?.blockType;
                const overId = over?.data?.current?.blockId;

                const newBlockLayout = FormBlocks[
                    blockType as FormBlockType
                ].createInstance(generateUniqueId());

                let position: "above" | "below" = "below";
                if (isDroppingOverCanvasBlockLayoutAbove) {
                    position = "above";
                }

                insertBlockLayoutAtIndex(overId, newBlockLayout, position);
                return;

            }

            //-> EXISTING BLOCK LAYOUT TO A SPECIFIC POSITION
            const isDraggingCanvasLayout = active.data?.current?.isCanvasLayout;

            const draggingCanvasLayoutOverAnotherLayout =
                isDroppingOverCanvasLayout && isDraggingCanvasLayout;

            if (draggingCanvasLayoutOverAnotherLayout) {
                const activeId = active?.data?.current?.blockId;
                const overId = over?.data?.current?.blockId;

                let position: "above" | "below" = "below";
                if (isDroppingOverCanvasBlockLayoutAbove) {
                    position = "above";
                }

                repositionBlockLayout(activeId, overId, position);
                return;
            }

        },
    })
    return (
        <div
            className="relative w-full h-[calc(100vh_-_65px)] px-5 md:px-0 pt-4 pb-[120px] overflow-auto
            transition-all duration-300 scrollbar"
        >

            <div className="w-full h-full max-w-[650px] mx-auto">

                {/* Droppable Canvas */}
                <div
                    ref={droppable.setNodeRef}
                    className={cn(`
                     w-full relative bg-transparent px-2 rounded-md flex flex-col min-h-svh items-center justify-start
                     pt-1 pb-14
                `,
                        droppable.isOver &&
                        blockLayouts.length === 0 &&
                        "ring-4 ring-primary/20 ring-inset"
                    )}>
                    <div className='w-full mb-3 bg-white bg-[url(/images/form-bg.jpg)]
                bg-center bg-cover bg-no-repeat border shadow-sm h-[135px] max-w-[768px] rounded-md px-1' />

                    {blockLayouts?.length > 0 && (
                        <div className="flex flex-col w-full gap-4">
                            {blockLayouts.map((blockLayout, index) => (
                                <CanvasBlockLayoutWrapper
                                    key={blockLayout.id}
                                    activeBlock={activeBlock}
                                    blockLayout={blockLayout}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
};

function CanvasBlockLayoutWrapper({
    blockLayout,
    activeBlock
}: {
    blockLayout: FormBlockInstance;
    activeBlock: Active | null;
}) {
    const CanvasBlockLayout = FormBlocks[blockLayout.blockType].canvasComponent;

    const topCorner = useDroppable({
        id: blockLayout.id + "_above",
        data: {
            blockType: blockLayout.blockType,
            blockId: blockLayout.id,
            isAbove: true,
        },
    });

    const bottomCorner = useDroppable({
        id: blockLayout.id + "_below",
        data: {
            blockType: blockLayout.blockType,
            blockId: blockLayout.id,
            isBelow: true,
        },
    });

    return (
        <div className="relative mb-1">
            {allBlockLayouts.includes(activeBlock?.data?.current?.blockType) &&
                !blockLayout.isLocked && (
                    <div
                        ref={topCorner.setNodeRef}
                        className="absolute top-0 w-full h-1/2 pointer-events-none"
                    >
                        {topCorner.isOver && (
                            <div
                                className="absolute w-full -top-[3px] h-[6px] bg-primary rounded-t-md"
                            />
                        )}
                    </div>
                )}

            {/* Bottom Half Drop Zone */}
            {
                allBlockLayouts.includes(activeBlock?.data?.current?.blockType) &&
                !blockLayout.isLocked && (
                    <div
                        ref={bottomCorner.setNodeRef}
                        className="absolute bottom-0 w-full h-1/2 pointer-events-none"
                    >
                        {bottomCorner.isOver && (
                            <div
                                className="absolute w-full -bottom-[3px] h-[6px] bg-primary rounded-b-md"
                            />
                        )}
                    </div>
                )}

            <div className="relative">
                <CanvasBlockLayout blockInstance={blockLayout} />
            </div>
        </div>
    )
}

export default BuilderCanvas