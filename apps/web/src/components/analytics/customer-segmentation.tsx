'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@awcrm/ui';
import { useCustomerSegmentation } from '@/hooks/use-analytics';
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Zap,
  AlertTriangle,
  Crown,
  Star,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  PieChart,
  Pie,
} from 'recharts';

interface CustomerSegmentationProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function CustomerSegmentation({ dateRange }: CustomerSegmentationProps) {
  const [selectedSegmentation, setSelectedSegmentation] = useState('rfm');
  const { data: segmentationData, isLoading } = useCustomerSegmentation(dateRange, selectedSegmentation);

  if (isLoading) {
    return <div>Loading segmentation data...</div>;
  }

  const {
    segments,
    rfmAnalysis,
    cohortAnalysis,
    behaviorSegments,
    valueSegments,
    churnRisk,
  } = segmentationData || {};

  const getSegmentIcon = (type: string) => {
    switch (type) {
      case 'champions':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'loyal':
        return <Star className="h-4 w-4 text-blue-500" />;
      case 'potential':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'at_risk':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'lost':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSegmentColor = (type: string) => {
    switch (type) {
      case 'champions':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'loyal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'potential':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'at_risk':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* Segmentation Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Segmentation
          </CardTitle>
          <CardDescription>Analyze customer segments using different methodologies</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSegmentation} onValueChange={setSelectedSegmentation}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rfm">RFM Analysis</SelectItem>
              <SelectItem value="behavior">Behavioral Segmentation</SelectItem>
              <SelectItem value="value">Value-Based Segmentation</SelectItem>
              <SelectItem value="cohort">Cohort Analysis</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs value={selectedSegmentation} onValueChange={setSelectedSegmentation}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rfm">RFM Analysis</TabsTrigger>
          <TabsTrigger value="behavior">Behavioral</TabsTrigger>
          <TabsTrigger value="value">Value-Based</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
        </TabsList>

        {/* RFM Analysis */}
        <TabsContent value="rfm" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rfmAnalysis?.segments.map((segment) => (
              <Card key={segment.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getSegmentIcon(segment.type)}
                    {segment.name}
                  </CardTitle>
                  <Badge className={getSegmentColor(segment.type)}>
                    {segment.customerCount} customers
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Revenue</span>
                      <span className="font-medium">{formatCurrency(segment.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg. Order Value</span>
                      <span className="font-medium">{formatCurrency(segment.avgOrderValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Frequency</span>
                      <span className="font-medium">{segment.avgFrequency.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Recency Score</span>
                      <span>{segment.recencyScore}/5</span>
                    </div>
                    <Progress value={(segment.recencyScore / 5) * 100} className="h-1" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Frequency Score</span>
                      <span>{segment.frequencyScore}/5</span>
                    </div>
                    <Progress value={(segment.frequencyScore / 5) * 100} className="h-1" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Monetary Score</span>
                      <span>{segment.monetaryScore}/5</span>
                    </div>
                    <Progress value={(segment.monetaryScore / 5) * 100} className="h-1" />
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">{segment.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* RFM Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>RFM Distribution</CardTitle>
              <CardDescription>Customer distribution by recency and frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={rfmAnalysis?.scatterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="recency" 
                    name="Recency" 
                    label={{ value: 'Recency (days)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    dataKey="frequency" 
                    name="Frequency" 
                    label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => `Customer: ${label}`}
                  />
                  <Scatter dataKey="monetary" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavioral Segmentation */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Behavior Segments</CardTitle>
                <CardDescription>Customers grouped by behavior patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={behaviorSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {behaviorSegments?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Levels</CardTitle>
                <CardDescription>Customer engagement distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {behaviorSegments?.map((segment, index) => (
                    <div key={segment.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{segment.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{segment.count}</div>
                          <div className="text-xs text-muted-foreground">
                            {((segment.count / behaviorSegments.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={(segment.count / behaviorSegments.reduce((sum, s) => sum + s.count, 0)) * 100} 
                        className="h-2" 
                      />
                      <p className="text-xs text-muted-foreground">{segment.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Value-Based Segmentation */}
        <TabsContent value="value" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Value Distribution</CardTitle>
                <CardDescription>Customer segments by lifetime value</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={valueSegments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="avgValue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>High-Value Customers</CardTitle>
                <CardDescription>Top customers by lifetime value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {valueSegments?.filter(s => s.segment === 'High Value')[0]?.customers?.slice(0, 5).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(customer.lifetimeValue)}</p>
                        <p className="text-sm text-muted-foreground">{customer.dealCount} deals</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cohort Analysis */}
        <TabsContent value="cohort" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
              <CardDescription>Customer retention rates by acquisition cohort</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cohort</th>
                      <th className="text-center p-2">Size</th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} className="text-center p-2 min-w-16">
                          Month {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohortAnalysis?.cohorts.map((cohort) => (
                      <tr key={cohort.period} className="border-b">
                        <td className="p-2 font-medium">{cohort.period}</td>
                        <td className="text-center p-2">{cohort.size}</td>
                        {cohort.retentionRates.map((rate, index) => (
                          <td key={index} className="text-center p-2">
                            <div 
                              className="inline-block px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `rgba(34, 197, 94, ${rate / 100})`,
                                color: rate > 50 ? 'white' : 'black',
                              }}
                            >
                              {rate ? `${rate}%` : '-'}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Churn Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Churn Risk Analysis
          </CardTitle>
          <CardDescription>Customers at risk of churning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">High Risk</span>
                <Badge variant="destructive">{churnRisk?.highRisk || 0}</Badge>
              </div>
              <Progress value={((churnRisk?.highRisk || 0) / (churnRisk?.total || 1)) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Medium Risk</span>
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  {churnRisk?.mediumRisk || 0}
                </Badge>
              </div>
              <Progress value={((churnRisk?.mediumRisk || 0) / (churnRisk?.total || 1)) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Low Risk</span>
                <Badge variant="outline" className="border-green-500 text-green-700">
                  {churnRisk?.lowRisk || 0}
                </Badge>
              </div>
              <Progress value={((churnRisk?.lowRisk || 0) / (churnRisk?.total || 1)) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}