import { Metadata } from 'next';
import { DealsPageClient } from '@/components/deals/deals-page-client';

export const metadata: Metadata = {
  title: 'Deals',
  description: 'Manage your sales pipeline and track deal progress',
};

export default function DealsPage() {
  return <DealsPageClient />;
}