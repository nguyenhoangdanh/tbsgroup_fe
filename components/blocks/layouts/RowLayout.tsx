import { FormBlockType, FormCategoryType, ObjectBlockType } from "@/@types/form-block.type";
import { Rows2 } from "lucide-react";

const blockCategory: FormCategoryType = "Layout";
const blockType: FormBlockType = "RowLayout";

export const RowLayoutBlock: ObjectBlockType = {
    blockType,
    blockCategory
    ,
    createInstance: (id: string) => ({
        id: `row-layout-${id}`,
        blockType,
        isLocked: false,
        attributes: {},
        childrenblocks: [],
    }),

    blockBtnElement: {
        icon: Rows2,
        label: "Row Layout"
    },
    canvasComponent: RowLayoutCanvasComponent,
    formComponent: RowLayoutFormComponent,
    propertiesComponent: RowLayoutPropertiesComponent,
};

function RowLayoutCanvasComponent() {
    return (
        <div>
            Row Layout Canvas
        </div>
    );
}

function RowLayoutFormComponent() {
    return (
        <div>
            Row Layout Form
        </div>
    );
}

function RowLayoutPropertiesComponent() {
    return (
        <div>
            Row Layout Properties
        </div>
    );
}