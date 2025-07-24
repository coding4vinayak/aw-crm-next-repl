import { Metadata } from 'next';
import { AnalyticsPageClient } from '@/components/analytics/analytics-page-client';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Advanced analytics and reporting dashboard',
};

export default function AnalyticsPage() {
  return <AnalyticsPageClient />;
}