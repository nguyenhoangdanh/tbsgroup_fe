import { FormBlockInstance, FormBlockType, FormCategoryType, ObjectBlockType } from "@/@types/form-block.type";
import { CircleIcon, Radio } from "lucide-react";

const blockCategory: FormCategoryType = "Field";
const blockType: FormBlockType = "RadioSelect";


export const RadioSelectBlock: ObjectBlockType = {
    blockCategory,
    blockType,

    createInstance: (id: string) => ({
        id,
        blockType,
        attributes: {
            label: "Radio Select",
            options: [
                { label: "Option 1", value: "option1" },
                { label: "Option 2", value: "option2" },
                { label: "Option 3", value: "option3" },
            ],
            required: false,
        }
    }),

    blockBtnElement: {
        icon: CircleIcon,
        label: "Radio"
    },

    canvasComponent: RadioSelectCanvasComponent,
    formComponent: RadioSelectFormComponent,
    propertiesComponent: RadioSelectPropertiesComponent,
}


function RadioSelectCanvasComponent({
    blockInstance
}: {
    blockInstance: FormBlockInstance;
}) {
    return (
        <div>
            Radio Select
            {/* {blockInstance.attributes.label} */}
        </div>
    )
}

function RadioSelectFormComponent() {
    return (
        <div>
            Radio Select Form
        </div>
    )
}

function RadioSelectPropertiesComponent() {
    return (
        <div>
            Radio Select Properties
        </div>
    )
}