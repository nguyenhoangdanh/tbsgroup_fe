import { BagProcessProvider } from '@/hooks/handbag/bag-process/BagProcessContext'
import BagProcessManagementScreen from '@/screens/admin/handbag/bag-process/Container'
import React from 'react'

export default function BagProcessPage() {
    return (
        <BagProcessProvider>
            <BagProcessManagementScreen />
        </BagProcessProvider>
    )
}
