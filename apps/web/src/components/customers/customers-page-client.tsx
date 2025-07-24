'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { Button } from '@awcrm/ui';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@awcrm/ui';
import { CustomersTable } from './customers-table';
import { CustomerFilters } from './customer-filters';
import { CreateCustomerDialog } from './create-customer-dialog';
import { ImportCustomersDialog } from './import-customers-dialog';
import { useCustomers } from '@/hooks/use-customers';
import { useDebounce } from '@awcrm/shared';

export function CustomersPageClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    assignedToId: '',
    source: '',
    tags: [] as string[],
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  const {
    data: customersData,
    isLoading,
    error,
    refetch,
  } = useCustomers({
    search: debouncedSearch,
    ...filters,
    page: 1,
    limit: 20,
  });

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export customers');
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleCustomerCreated = () => {
    refetch();
    setShowCreateDialog(false);
  };

  const handleCustomersImported = () => {
    refetch();
    setShowImportDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and track their journey
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customersData?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customersData?.customers.filter(c => c.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${customersData?.customers.reduce((sum, c) => sum + Number(c.lifetimeValue || 0), 0).toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${customersData?.customers.length ? 
                Math.round(customersData.customers.reduce((sum, c) => sum + Number(c.lifetimeValue || 0), 0) / customersData.customers.length).toLocaleString() 
                : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-muted' : ''}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
          {showFilters && (
            <CustomerFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
            />
          )}
        </CardHeader>
        <CardContent>
          <CustomersTable
            customers={customersData?.customers || []}
            isLoading={isLoading}
            error={error}
            onRefresh={refetch}
          />
          
          {/* Pagination */}
          {customersData && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((customersData.page - 1) * customersData.limit) + 1} to{' '}
                {Math.min(customersData.page * customersData.limit, customersData.total)} of{' '}
                {customersData.total} customers
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={customersData.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={customersData.page * customersData.limit >= customersData.total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateCustomerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCustomerCreated={handleCustomerCreated}
      />
      
      <ImportCustomersDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onCustomersImported={handleCustomersImported}
      />
    </div>
  );
}