"use client";

import { RoleProvider } from "@/hooks/roles/roleContext";
import RoleManagementScreen from "@/screens/admin/role/Container";
import React from "react";

const RolePage = () => {
    return (
        <RoleProvider>
            <RoleManagementScreen />
        </RoleProvider>
    );
};

export default RolePage;