'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { AnalyticsDashboard } from './analytics-dashboard';
import { ReportsBuilder } from './reports-builder';
import { CustomerSegmentation } from './customer-segmentation';
import { SalesForecasting } from './sales-forecasting';
import { PerformanceMetrics } from './performance-metrics';
import { ExportDialog } from './export-dialog';
import { BarChart3, Download, Settings, TrendingUp, Users, Target, Calendar } from 'lucide-react';
import { addDays } from 'date-fns';

export function AnalyticsPageClient() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    
    switch (period) {
      case '7d':
        setDateRange({ from: addDays(now, -7), to: now });
        break;
      case '30d':
        setDateRange({ from: addDays(now, -30), to: now });
        break;
      case '90d':
        setDateRange({ from: addDays(now, -90), to: now });
        break;
      case '1y':
        setDateRange({ from: addDays(now, -365), to: now });
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and reporting for your CRM data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Time Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedPeriod === 'custom' && (
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="segmentation" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Segmentation
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Forecasting
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AnalyticsDashboard dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsBuilder dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-4">
          <CustomerSegmentation dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <SalesForecasting dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMetrics dateRange={dateRange} />
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        dateRange={dateRange}
      />
    </div>
  );
}