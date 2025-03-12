"use client";

import PageLoader from "@/components/common/PageLoader";
import { RoleProvider } from "@/hooks/roles/roleContext";
import RoleManagementScreen from "@/screens/admin/role/Container";
import React from "react";

const RolePage = () => {
    return (
        <RoleProvider>
            <PageLoader>
                <RoleManagementScreen />
            </PageLoader>
        </RoleProvider>
    );
};

export default RolePage;