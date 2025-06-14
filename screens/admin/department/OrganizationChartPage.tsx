"use client"

import { DepartmentProvider } from "@/hooks/department"

import OrganizationChart from "./OrganizationChart"

export default function OrganizationChartPage() {
    return (
        <DepartmentProvider
            config={{
                enableAutoRefresh: true,
                prefetchRelatedData: true,
                cacheStrategy: 'conservative',
            }}
        >
            <OrganizationChart />
        </DepartmentProvider>
    )
  }