import React from 'react'
import BuilderSidebar from './BuilderSidebar'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { defaultBackgroundColor } from '@/constants'
import BuilderCanvas from '../BuilderCanvas'
import BuilderBlockProperties from './BuilderBlockProperties'
import FloatingShareButton from './FloatingShareButton'

const Builder = (props: { isOpen: boolean }) => {
    return (
        <>
            <BuilderSidebar />
            <SidebarInset className='!p-0 flex-1'>
                <div className="w-full h-full" style={{ backgroundColor: defaultBackgroundColor }}>
                    <SidebarTrigger className='absolute top-0 z-50' />
                    {/* Builder Canvas */}
                    <BuilderCanvas />
                    <FloatingShareButton isSidebarOpen={props.isOpen} />
                </div>
            </SidebarInset>
            <BuilderBlockProperties />
        </>
    )
}

export default Builder