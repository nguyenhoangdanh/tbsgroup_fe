import React from 'react'
import FormBuilder from '../../../_components/_common/FormBuilder';
import BuilderContextProvider from '@/context/builder-provider';

const BuikderPage = () => {
    return (
        <BuilderContextProvider>
            <FormBuilder />
        </BuilderContextProvider>
    )
}

export default BuikderPage;