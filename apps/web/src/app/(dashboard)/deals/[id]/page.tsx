import { Metadata } from 'next';
import { DealDetailClient } from '@/components/deals/deal-detail-client';

interface DealDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Deal Details',
  description: 'View and manage deal details',
};

export default function DealDetailPage({ params }: DealDetailPageProps) {
  return <DealDetailClient dealId={params.id} />;
}