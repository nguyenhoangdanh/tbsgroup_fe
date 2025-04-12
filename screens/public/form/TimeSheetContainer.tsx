"use client";

import React from "react";
import { TimeSheetProvider } from "./TimeSheetContext";
import TimeSheetList from "./TimeSheetList";

/**
 * Container component for the timesheet module
 * Wraps the TimeSheetList with the TimeSheetProvider
 */
const TimeSheetContainer = () => {
    return (
        <TimeSheetProvider>
            <TimeSheetList />
        </TimeSheetProvider>
    );
};

export default TimeSheetContainer;