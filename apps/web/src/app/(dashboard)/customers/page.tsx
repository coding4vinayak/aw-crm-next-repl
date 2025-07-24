import { Metadata } from 'next';
import { CustomersPageClient } from '@/components/customers/customers-page-client';

export const metadata: Metadata = {
  title: 'Customers',
  description: 'Manage your customers and their information',
};

export default function CustomersPage() {
  return <CustomersPageClient />;
}