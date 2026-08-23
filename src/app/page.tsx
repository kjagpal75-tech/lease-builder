'use client';

import dynamic from 'next/dynamic';

const LeaseBuilder = dynamic(() => import('@/components/LeaseBuilder'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Lease Builder...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <LeaseBuilder />;
}