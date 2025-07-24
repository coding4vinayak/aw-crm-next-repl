'use client';

import { useState } from 'react';
import { Plus, BarChart3, Filter, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealsPipeline } from './deals-pipeline';
import { DealsTable } from './deals-table';
import { DealFilters } from './deal-filters';
import { CreateDealDialog } from './create-deal-dialog';
import { DealMetrics } from './deal-metrics';
import { useDeals } from '@/hooks/use-deals';
import { useDebounce } from '@awcrm/shared';

export function DealsPageClient() {
  const [activeView, setActiveView] = useState<'pipeline' | 'table'>('pipeline');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState({
    stage: '',
    assignedToId: '',
    priority: '',
    source: '',
    valueRange: { min: 0, max: 1000000 },
    dateRange: { from: undefined as Date | undefined, to: undefined as Date | undefined },
  });

  const {
    data: dealsData,
    isLoading,
    error,
    refetch,
  } = useDeals({
    ...filters,
    page: 1,
    limit: 50,
  });

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export deals');
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleDealCreated = () => {
    refetch();
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Track and manage your deals through the sales process
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Pipeline Settings
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <DealMetrics deals={dealsData?.deals || []} />

      {/* View Toggle and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'pipeline' | 'table')}>
                <TabsList>
                  <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
                  <TabsTrigger value="table">Table View</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-muted' : ''}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>{dealsData?.total || 0} deals</span>
              <span>•</span>
              <span>${dealsData?.deals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString() || '0'} total value</span>
            </div>
          </div>
          
          {showFilters && (
            <DealFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
            />
          )}
        </CardHeader>
        
        <CardContent>
          {activeView === 'pipeline' ? (
            <DealsPipeline
              deals={dealsData?.deals || []}
              isLoading={isLoading}
              error={error}
              onRefresh={refetch}
            />
          ) : (
            <DealsTable
              deals={dealsData?.deals || []}
              isLoading={isLoading}
              error={error}
              onRefresh={refetch}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Deal Dialog */}
      <CreateDealDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onDealCreated={handleDealCreated}
      />
    </div>
  );
}