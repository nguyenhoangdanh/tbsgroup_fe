"use client";

import React from "react";
import DigitalFormApp from "./DigitalFormApp";
import { DigitalFormProvider } from "@/hooks/digital-form/DigitalFormContext";
import { GroupProvider } from "@/hooks/group/GroupProcessContext";

/**
 * Container component to provide DigitalFormContext to the entire application
 * This enables shared state management across all digital form components
 */
const DigitalFormAppContainer: React.FC = () => {
    return (
        <GroupProvider>
            <DigitalFormProvider>
                <DigitalFormApp />
            </DigitalFormProvider>
        </GroupProvider>
    );
};

export default DigitalFormAppContainer;