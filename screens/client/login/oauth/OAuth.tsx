"use client"
import React from 'react'

export default function OAuth() {
    return (
        // <Grid container sx={{
        //     ...AppStyles.flexRow,
        //     gap: '10px',
        // }}>
        //     <Grid className='google-oauth' size={6}>
        //         <Button >Google</Button>
        //     </Grid>
        //     <Grid className="facebook-oauth" size={6}>
        //         <Button>Facebook</Button>
        //     </Grid>
        // </Grid>
        <div className='flex flex-row gap-10'>
            <div className='flex-1'>
                <button>Google</button>
            </div>
        </div>
    )
}
