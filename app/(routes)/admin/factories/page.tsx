"use client";

import { FactoryProvider } from "@/hooks/factory/FactoryContext";
import FactoryManagementScreen from "@/screens/admin/factory/Container";
import React from "react";

const FactoryPage = () => {
    return (
        <FactoryProvider>
            <FactoryManagementScreen />
        </FactoryProvider>
    );
};

export default FactoryPage;