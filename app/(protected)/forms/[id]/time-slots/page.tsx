'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { BagTimeIntervals, FormStatsCard } from '@/components/digital-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ShimmerLoader, { ShimmerCard } from '@/components/ui/shimmer-loader';
import useDigitalFormQueries from '@/hooks/digital-form/useDigitalFormQueries';
import { useDigitalFormStats } from '@/hooks/digital-form/useDigitalFormStats';

/**
 * Page component for displaying and managing time slots for multiple bags
 * Shows the BagTimeIntervals component with real data
 */
export default function FormTimeSlotsPage() {
  const params = useParams();
  const formId = params.id as string;

  // Get form data with entries
  const { useDigitalFormWithEntries } = useDigitalFormQueries();
  const {
    data: formWithEntries,
    isLoading,
    isError,
  } = useDigitalFormWithEntries(formId, {
    enabled: !!formId,
  });

  // Get statistics for this form
  const { stats } = useDigitalFormStats(formId);

  // View mode state (edit or read-only)
  const [readOnly, setReadOnly] = useState(false);

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <ShimmerLoader height="40px" width="50%" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </div>
        <ShimmerLoader height="300px" width="100%" />
      </div>
    );
  }

  if (isError || !formWithEntries?.data) {
    return (
      <div className="container py-8">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700">
          Failed to load form data. Please try again later.
        </div>
      </div>
    );
  }

  const { form, entries } = formWithEntries.data;

  const formattedDate = new Date(form.date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container py-8 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/forms/${formId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Form
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">{form.formName || 'Form Time Slots'}</h1>
          <Badge variant="outline">{formattedDate}</Badge>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm mr-2">View Mode:</span>
          <div className="flex items-center space-x-1">
            <Button
              variant={readOnly ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => setReadOnly(false)}
            >
              Edit
            </Button>
            <Button
              variant={readOnly ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setReadOnly(true)}
            >
              Read Only
            </Button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <FormStatsCard stats={stats} />

      {/* Time intervals */}
      <Card>
        <CardHeader>
          <CardTitle>Bag Time Intervals</CardTitle>
        </CardHeader>
        <CardContent>
          <BagTimeIntervals formId={formId} entries={entries} readOnly={readOnly} />
        </CardContent>
      </Card>
    </div>
  );
}
