import { Sidebar, SidebarHeader } from '@/components/ui/sidebar'
import { Home } from 'lucide-react'
import React from 'react'

const BuilderSidebar = ({
    rest
}: {
    rest?: React.ComponentProps<typeof Sidebar>
}) => {
    return (
        <Sidebar className='border-r left-12 pt-16' {...rest}>
            <SidebarHeader className='bg-white px-0'>
                <header className='border-b  border-gray-200 w-full pt-1 pb-2 flex shrink-0 items-center gap-2'>
                    <div className="flex item-center gap-2 px-4">
                        <Home className='-ml-1 w-4 h-4' />
                    </div>
                </header>
            </SidebarHeader>
        </Sidebar>
    )
}

export default BuilderSidebar