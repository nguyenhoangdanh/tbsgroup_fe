import { cn } from '@/lib/utils'
import React from 'react'

const BuilderCanvas = () => {
    return (
        <div
            className="relative w-full h-[calc(100vh_-_65px)] px-5 md:px-0 pt-4 pb-[120px] overflow-auto
            transition-all duration-300 scrollbar"
        >
            {/* Droppable Canvas */}
            <div className="w-full h-full max-w-[650px] mx-auto">
                <div className={cn(`
            w-full relative bg-transparent px-2 rounded-md flex flex-col min-h-svh items-center justify-start
            pt-1 pb-14 ring-4 ring-primary/20 ring-inset
                `)}>
                    <div className='w-full mb-3 bg-white bg-[url(/images/form-bg.jpg)]
                bg-center bg-cover bg-no-repeat border shadow-sm h-[135px] max-w-[768px] rounded-md px-1' />
                    <div className="flex flex-col w-full gap-4">
                        Layout Block
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BuilderCanvas