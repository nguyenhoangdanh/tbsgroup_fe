app / admin / handbags / bag - group - rates / hand - bags / [handBagId] / page.tsx;
('use client');

import { useParams } from 'next/navigation';

import HandBagDetails from '@/screens/admin/bag-group-rate/HandBagDetails';

export default function HandBagDetailsPage() {
  const params = useParams();
  const handBagId = params?.handBagId as string;

  return (
    <div className="container mx-auto px-4 py-6">
      <HandBagDetails handBagId={handBagId} />
    </div>
  );
}
