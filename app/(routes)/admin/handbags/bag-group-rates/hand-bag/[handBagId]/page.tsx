// pages/bag-group-rates/hand-bag/[handBagId].tsx
import { NextPage } from 'next';
import dynamic from 'next/dynamic';

const HandBagDetails = dynamic(() => import('@/screens/admin/bag-group-rate/HandBagDetails'), {
    ssr: false,
    loading: () => <div className="p-8 text-center">Đang tải thông tin chi tiết...</div>
});

const HandBagDetailsPage: NextPage = () => {
    return (
        <div className="container mx-auto px-4 py-6">
            <HandBagDetails />
        </div>
    );
};

export default HandBagDetailsPage;