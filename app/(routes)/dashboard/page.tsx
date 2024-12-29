import { fetchFormStats } from '@/actions/form.action'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import React from 'react'
import StatsCards from './_components/StatsCards'

const DashboardPage = () => {
    return (
        <div className='w-full pt-8'>
            <div className="w-full max-w-6xl mx-auto md:px-0 pt-1">
                <section className='stats-section w-full'>
                    <div className="w-full flex items-center justify-between py-5">
                        <h1 className='text-3xl font-semibold tracking-tight'>
                            Dashboard
                        </h1>
                        <Button className='!bg-primary !font-medium gap-1'>
                            <PlusIcon />
                            Create a form
                        </Button>
                    </div>
                    <StatsListWrap />
                </section>
            </div>
        </div>
    )
}

async function StatsListWrap() {
    const stats = await fetchFormStats();
    return <StatsCards loading={false} data={stats} />
}

export default DashboardPage