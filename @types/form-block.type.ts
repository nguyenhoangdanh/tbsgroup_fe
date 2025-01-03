import React from "react";


export type FormCategoryType = "Layout" | "Field";

export type FormBlockType =
  "RowLayout"
//   | "RadioSelect"
//   | "TextField"
//   | "TextArea"
//   | "StarRating"
//   | "Heading"
//   | "Paragraph";

export type ObjectBlockType = {
    blockCategory: FormCategoryType;
    blockType: FormBlockType;

    createInstance: (id: string) => FormBlockInstance;

    blockBtnElement: {
        icon: React.ElementType;
        label: string;
    }

    canvasComponent: React.FC;
    formComponent: React.FC;
    propertiesComponent: React.FC;
}

export type FormBlockInstance = {
    id: string;
    blockType: FormBlockType;
    attributes?: Record<string, any>;
    childrenblocks?: FormBlockInstance[];
    isLocked?: boolean;
}
export type FormBlocksType = {
    [key in FormBlockType]: ObjectBlockType;
}