// app/bag-group-rates/analysis/[handBagId]/page.tsx
"use client";

import { NextPage } from 'next';
import dynamic from 'next/dynamic';

const ProductivityAnalysis = dynamic(() => import('@/screens/admin/bag-group-rate/ProductivityAnalysis'), {
    ssr: false,
    loading: () => <div className="p-8 text-center">Đang tải phân tích năng suất...</div>
});

const ProductivityAnalysisPage: NextPage = () => {
    return (
        <div className="container mx-auto px-4 py-6">
            <ProductivityAnalysis />
        </div>
    );
};

export default ProductivityAnalysisPage;