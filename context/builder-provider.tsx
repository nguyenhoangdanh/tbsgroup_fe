"use client"
import { FormBlockInstance } from "@/@types/form-block.type";
import { FormWithSettings } from "@/@types/form.type";
import { useParams } from "next/navigation";
import React, { createContext, useEffect, useState } from "react";
import { add } from 'date-fns';
import { generateUniqueId } from "@/lib/helper";

type TBuilderContext = {
    loading: boolean;
    formData: FormWithSettings | null;
    setFormData: React.Dispatch<React.SetStateAction<FormWithSettings | null>>;

    blockLayouts: FormBlockInstance[];
    setBlockLayouts: React.Dispatch<React.SetStateAction<FormBlockInstance[]>>;

    addBlockLayout: (block: FormBlockInstance) => void;
    removeBlockLayout: (blockId: string) => void;
    duplicateBlockLayout: (blockId: string) => void;

    selectedBlockLayout: FormBlockInstance | null;
    handleSeletedLayout: (blockLayout: FormBlockInstance | null) => void;

    updateBlockLayout: (id: string, childrenBlocks: FormBlockInstance[]) => void;

    repositionBlockLayout: (
        activeId: string,
        overId: string,
        position: "above" | "below"
    ) => void;

    insertBlockLayoutAtIndex: (
        overId: string,
        newBlockLayout: FormBlockInstance,
        position: "above" | "below"
    ) => void

    updateChildBlock: (
        parentId: string,
        childblockId: string,
        updatedBlock: FormBlockInstance
    ) => void;
}

export const BuilderContext = createContext<TBuilderContext | null>(null);

export default function BuilderContextProvider({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const formId = params.formId as string;
    const [loading, setLoading] = React.useState<boolean>(false);
    const [formData, setFormData] = React.useState<FormWithSettings | null>(null);
    const [blockLayouts, setBlockLayouts] = React.useState<FormBlockInstance[]>([]);
    const [selectedBlockLayout, setSeletedBlockLayout] =
        useState<FormBlockInstance | null>(null);

    const addBlockLayout = (block: FormBlockInstance) => {
        setBlockLayouts((prev) => {
            const updatedBlocks = [...prev];
            updatedBlocks.push(block);
            return updatedBlocks;
        })
    }

    const removeBlockLayout = (blockId: string) => {
        setBlockLayouts((prev) => {
            const updatedBlocks = prev.filter((block) => block.id !== blockId);
            return updatedBlocks;
        })

        if (selectedBlockLayout?.id === blockId) {
            setSeletedBlockLayout(null);
        }
    }

    // B.S -> DUPLICATE BLOCK LAYOUT
    const duplicateBlockLayout = (id: string) => {
        setBlockLayouts((prevBlocks) => {
            const blockToDuplicate = prevBlocks.find((block) => block.id === id);
            if (!blockToDuplicate) return prevBlocks;
            // Deep clone the block and generate a new id

            const duplicatedLayoutBlock = {
                ...blockToDuplicate,
                id: `layout-${generateUniqueId()}`,
                childblocks: blockToDuplicate.childblocks?.map((childblock) => ({
                    ...childblock,
                    id: generateUniqueId(),
                })),
            };

            // Add the duplicated block after the original block
            const updatedBlockLayouts = [...prevBlocks];
            const insertIndex = prevBlocks.findIndex((block) => block.id === id) + 1;
            updatedBlockLayouts.splice(insertIndex, 0, duplicatedLayoutBlock);

            return updatedBlockLayouts;
        });
    };

    const handleSeletedLayout = (blockLayout: FormBlockInstance | null) => {
        setSeletedBlockLayout(blockLayout);

    }

    // B.S -> REPOSTION BLOCK LAYOUT
    const repositionBlockLayout = (
        activeId: string,
        overId: string,
        position: "above" | "below"
    ) => {
        setBlockLayouts((prev) => {
            // Find the indices of the active and over blocks
            const activeIndex = prev.findIndex((block) => block.id === activeId);
            const overIndex = prev.findIndex((block) => block.id === overId);

            if (activeIndex === -1 || overIndex === -1) {
                console.warn("Active or Over block not found.");
                return prev;
            }

            // Remove the active block from its current position
            const updatedBlocks = [...prev];
            const [movedBlock] = updatedBlocks.splice(activeIndex, 1);
            // Calculate the new position for insertion
            const insertIndex = position === "above" ? overIndex : overIndex + 1;
            // Insert the moved block at the calculated position
            updatedBlocks.splice(insertIndex, 0, movedBlock);

            return updatedBlocks;
        });
    };

    // B.S -> INSERT NEW LAYOUT IN A PARTICULAR INDEX ON CANVAS
    const insertBlockLayoutAtIndex = (
        overId: string,
        newBlockLayout: FormBlockInstance,
        position: "above" | "below"
    ) => {
        setBlockLayouts((prev) => {
            const overIndex = prev.findIndex((block) => block.id === overId);
            if (overIndex == -1) {
                return prev;
            }

            const insertIndex = position === "above" ? overIndex : overIndex + 1;
            const updatedBlocks = [...prev];
            updatedBlocks.splice(insertIndex, 0, newBlockLayout);
            return updatedBlocks;
        });
    };

    const updateBlockLayout = (
        id: string,
        childrenBlocks: FormBlockInstance[]
    ) => {
        setBlockLayouts((prev) =>
            prev.map((block) =>
                block.id === id
                    ? {
                        ...block,
                        childblocks: childrenBlocks,
                    }
                    : block
            )
        );
    };

    const updateChildBlock = (
        parentId: string,
        childblockId: string,
        updatedBlock: FormBlockInstance
    ) => {
        setBlockLayouts((prevBlocks) => {
            const updatedBlocks = prevBlocks.map((parentBlock) => {
                if (parentBlock.id === parentId) {
                    const updatedChildblocks = parentBlock.childblocks?.map(
                        (childblock) =>
                            childblock.id === childblockId
                                ? { ...childblock, ...updatedBlock }
                                : childblock
                    );
                    return { ...parentBlock, childblocks: updatedChildblocks };
                }

                return parentBlock;
            });

            return updatedBlocks;
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const rs = await fetch(`/api/fetchFormById?formId=${formId}`, {
                    method: "GET",
                });

                if (!rs.ok) {
                    throw new Error("Failed to fetch form data");
                }

                const { data } = await rs.json();
                const { form } = data;
                if (form) {
                    setFormData(form);
                    if (form.jsonBlocks) {
                        const parsedBlocks = JSON.parse(form.jsonBlocks);
                        setBlockLayouts(parsedBlocks);
                    }
                }
            } catch (error) {
                console.log("Failed to fetch form data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [formId]);

    return (
        <BuilderContext.Provider value={{
            loading,
            formData,
            setFormData,
            blockLayouts,
            setBlockLayouts,
            addBlockLayout,
            removeBlockLayout,
            duplicateBlockLayout,
            selectedBlockLayout,
            handleSeletedLayout,
            updateBlockLayout,
            insertBlockLayoutAtIndex,
            updateChildBlock,
            repositionBlockLayout,
        }}>
            {children}
        </BuilderContext.Provider>
    )
}
export const useBuilder = () => {
    const context = React.useContext(BuilderContext);
    if (!context) {
        throw new Error("useBuilder must be used within a BuilderContextProvider");
    }

    return context;
}