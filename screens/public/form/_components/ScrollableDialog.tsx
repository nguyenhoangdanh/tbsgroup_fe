// components/common/ScrollableDialog.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { DialogContent } from "@/components/ui/dialog";

interface ScrollableDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    maxHeight?: string;
    children: React.ReactNode;
}

/**
 * A scrollable dialog content component that properly handles overflow
 * Fixes issues with dialog content not scrolling when accordion is expanded
 */
export const ScrollableDialogContent = React.forwardRef<
    HTMLDivElement,
    ScrollableDialogContentProps
>(({ className, children, maxHeight = "85vh", ...props }, ref) => {
    // Convert maxHeight to CSS variable for safety
    const maxHeightStyle = { "--max-height": maxHeight } as React.CSSProperties;

    return (
        <DialogContent
            ref={ref}
            className={cn(
                "fixed z-50 grid w-full gap-4 border bg-background p-6 shadow-lg sm:rounded-lg overflow-y-auto max-h-[85vh]",
                className
            )}
            {...props}
        >
            <div
                className="overflow-y-auto pr-1"
                // style={maxHeightStyle}
                // Apply the CSS variable using direct style property
                // style={{ maxHeight: `var(--max-height, ${maxHeight})` }}
                style={{ maxHeight: "85vh" }}
            >
                {children}
            </div>
        </DialogContent>
    );
});

ScrollableDialogContent.displayName = "ScrollableDialogContent";