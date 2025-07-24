'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@awcrm/ui';
import { Customer } from '@awcrm/database';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Users } from 'lucide-react';

interface CustomerOverviewProps {
  customer: Customer;
}

export function CustomerOverview({ customer }: CustomerOverviewProps) {
  // Mock data for demonstration - in real app this would come from API
  const mockMetrics = {
    totalDeals: 12,
    wonDeals: 8,
    lostDeals: 2,
    activeDeals: 2,
    totalRevenue: 125000,
    averageDealSize: 15625,
    conversionRate: 66.7,
    lastActivity: new Date('2024-01-15'),
    tags: ['VIP', 'Enterprise', 'High Value'],
    customFields: {
      'Account Manager': 'Sarah Johnson',
      'Contract Type': 'Annual',
      'Support Level': 'Premium',
      'Renewal Date': '2024-12-31'
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Key Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(mockMetrics.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5%
            </span>
            {' '}from last quarter
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockMetrics.activeDeals}</div>
          <p className="text-xs text-muted-foreground">
            {mockMetrics.totalDeals} total deals
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockMetrics.conversionRate}%</div>
          <Progress value={mockMetrics.conversionRate} className="mt-2" />
        </CardContent>
      </Card>

      {/* Deal Summary */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Deal Summary</CardTitle>
          <CardDescription>Overview of all deals with this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{mockMetrics.wonDeals}</div>
              <p className="text-sm text-muted-foreground">Won</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{mockMetrics.activeDeals}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{mockMetrics.lostDeals}</div>
              <p className="text-sm text-muted-foreground">Lost</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(mockMetrics.averageDealSize)}</div>
              <p className="text-sm text-muted-foreground">Avg Size</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Lifetime Value</p>
            <p className="text-lg font-semibold">
              {customer.lifetimeValue ? formatCurrency(Number(customer.lifetimeValue)) : '$0.00'}
            </p>
          </div>
          
          {customer.source && (
            <div>
              <p className="text-sm font-medium">Source</p>
              <Badge variant="outline" className="mt-1">
                {customer.source.charAt(0).toUpperCase() + customer.source.slice(1).replace('_', ' ')}
              </Badge>
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium">Last Activity</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(mockMetrics.lastActivity)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      {mockMetrics.tags.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Customer tags and labels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mockMetrics.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Fields */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Custom fields and additional customer data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(mockMetrics.customFields).map(([key, value]) => (
              <div key={key}>
                <p className="text-sm font-medium text-muted-foreground">{key}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            ))}
            
            {customer.companySize && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Size</p>
                <p className="text-sm font-semibold">{customer.companySize}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer Since</p>
              <p className="text-sm font-semibold">{formatDate(customer.createdAt)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm font-semibold">{formatDate(customer.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}