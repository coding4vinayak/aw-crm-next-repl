'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@awcrm/ui';
import { Deal } from '@awcrm/database';
import { TrendingUp, TrendingDown, DollarSign, Target, Clock, Award } from 'lucide-react';

interface DealMetricsProps {
  deals: Deal[];
}

export function DealMetrics({ deals }: DealMetricsProps) {
  // Calculate metrics
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const activeDeals = deals.filter(deal => !['won', 'lost'].includes(deal.stage.toLowerCase()));
  const wonDeals = deals.filter(deal => deal.stage.toLowerCase() === 'won');
  const lostDeals = deals.filter(deal => deal.stage.toLowerCase() === 'lost');
  
  const winRate = deals.length > 0 ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100 : 0;
  const averageDealSize = deals.length > 0 ? totalValue / deals.length : 0;
  const activeValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);

  // Mock data for trends (in real app, this would come from historical data)
  const trends = {
    totalValue: 12.5,
    activeDeals: 8.3,
    winRate: -2.1,
    averageDealSize: 15.7,
    activeValue: 22.4,
    wonValue: 18.9,
  };

  const formatTrend = (trend: number) => {
    const isPositive = trend > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`inline-flex items-center text-xs ${color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {Math.abs(trend)}%
      </span>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            {formatTrend(trends.totalValue)} from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeDeals.length}</div>
          <p className="text-xs text-muted-foreground">
            {formatTrend(trends.activeDeals)} from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {formatTrend(trends.winRate)} from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(averageDealSize)}</div>
          <p className="text-xs text-muted-foreground">
            {formatTrend(trends.averageDealSize)} from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Value</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(activeValue)}</div>
          <p className="text-xs text-muted-foreground">
            {formatTrend(trends.activeValue)} from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Won Revenue</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(wonValue)}</div>
          <p className="text-xs text-muted-foreground">
            {formatTrend(trends.wonValue)} from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}