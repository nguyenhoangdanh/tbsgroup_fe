"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DigitalFormProvider } from "@/hooks/digital-form/DigitalFormContext";
import DigitalFormDashboard from "./DigitalFormDashboard";
import { useRouter, usePathname } from "next/navigation";
import { DigitalFormDetail } from "./DigitalFormDetail";
import DigitalFormList from "./DigitalFormList";
import useAuthManager from "@/hooks/useAuthManager";

/**
 * Main Digital Form application component
 * Provides context and routing for the digital form section
 */
const DigitalFormApp: React.FC = () => {
    const router = useRouter();
    const { user } = useAuthManager();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<string>("dashboard");

    // Extract the ID from the path if it exists
    const getFormIdFromPath = () => {
        if (pathname) {
            const match = pathname.match(/\/digital-forms\/([a-zA-Z0-9-]+)$/);
            return match ? match[1] : undefined;
        }
        return undefined;
    };

    const formId = getFormIdFromPath();

    // Handle tab change
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (value === "dashboard") {
            router.push("/digital-forms/dashboard");
        } else if (value === "forms") {
            router.push("/digital-forms");
        }
    };

    console.log('user', user?.groupId);

    return (
        <DigitalFormProvider>
            <div className="container mx-auto py-4">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Quản lý phiếu công đoạn</h1>
                        <TabsList>
                            <TabsTrigger value="dashboard">Tổng quan</TabsTrigger>
                            <TabsTrigger value="forms">Phiếu công đoạn</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="dashboard">
                        <DigitalFormDashboard />
                    </TabsContent>

                    <TabsContent value="forms">
                        {formId ? (
                            <DigitalFormDetail id={formId} />
                        ) : (
                            user?.groupId && (
                                <DigitalFormList groupId={user?.groupId} />
                            )
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DigitalFormProvider>
    );
};

export default DigitalFormApp;