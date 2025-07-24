'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@awcrm/ui';
import { useSalesForecasting } from '@/hooks/use-analytics';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Brain,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useState } from 'react';

interface SalesForecastingProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function SalesForecasting({ dateRange }: SalesForecastingProps) {
  const [forecastPeriod, setForecastPeriod] = useState('6');
  const { data: forecastData, isLoading } = useSalesForecasting(dateRange);

  if (isLoading) {
    return <div>Loading forecasting data...</div>;
  }

  const {
    forecast,
    historicalAccuracy,
    trendAnalysis,
    keyFactors,
    scenarios,
  } = forecastData || {};

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'upward':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'downward':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'upward':
        return 'text-green-600 bg-green-100';
      case 'downward':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (trend: string) => {
    switch (trend) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Combine historical and forecast data for visualization
  const combinedData = [
    // Mock historical data
    { month: 'Jan', actual: 85000, predicted: null, confidence: null },
    { month: 'Feb', actual: 92000, predicted: null, confidence: null },
    { month: 'Mar', actual: 78000, predicted: null, confidence: null },
    { month: 'Apr', actual: 105000, predicted: null, confidence: null },
    { month: 'May', actual: 118000, predicted: null, confidence: null },
    { month: 'Jun', actual: 125000, predicted: null, confidence: null },
    // Forecast data
    ...(forecast || []),
  ];

  return (
    <div className="space-y-6">
      {/* Forecast Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Sales Forecasting
              </CardTitle>
              <CardDescription>AI-powered sales predictions and trend analysis</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Target className="mr-2 h-4 w-4" />
                Adjust Model
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Forecast Accuracy & Trend */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historicalAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Based on last 12 months
            </p>
            <Progress value={historicalAccuracy} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend Direction</CardTitle>
            {getTrendIcon(trendAnalysis?.direction)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{trendAnalysis?.direction}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getTrendColor(trendAnalysis?.direction)}>
                {trendAnalysis?.strength} trend
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seasonality</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{trendAnalysis?.seasonality}</div>
            <p className="text-xs text-muted-foreground">
              Seasonal impact detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast</CardTitle>
          <CardDescription>Historical performance vs. predicted revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value, name) => [
                  value ? formatCurrency(Number(value)) : 'N/A', 
                  name === 'actual' ? 'Actual' : 'Predicted'
                ]}
              />
              <Legend />
              
              {/* Historical data */}
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#8884d8" 
                strokeWidth={3}
                name="Actual Revenue"
                connectNulls={false}
              />
              
              {/* Forecast data */}
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#82ca9d" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted Revenue"
                connectNulls={false}
              />
              
              {/* Confidence area */}
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="none"
                fill="#82ca9d"
                fillOpacity={0.1}
              />
              
              {/* Reference line for current month */}
              <ReferenceLine x="Jun" stroke="#ff7300" strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Forecast Details */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Predictions</CardTitle>
            <CardDescription>Detailed forecast with confidence levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecast?.map((month) => (
                <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(month.predicted)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getConfidenceColor(month.confidence)}`}>
                      {month.confidence}% confidence
                    </div>
                    <Progress value={month.confidence} className="w-16 h-1 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Factors */}
        <Card>
          <CardHeader>
            <CardTitle>Key Influencing Factors</CardTitle>
            <CardDescription>Factors affecting the forecast accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {keyFactors?.map((factor, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{factor.factor}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${getImpactColor(factor.trend)}`}>
                        {factor.trend}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {(factor.impact * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={factor.impact * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Scenario Analysis
          </CardTitle>
          <CardDescription>Best case, worst case, and most likely scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Best Case</span>
              </div>
              <div className="text-2xl font-bold text-green-800">
                {formatCurrency(850000)}
              </div>
              <div className="text-sm text-green-600 mt-1">
                +25% above forecast
              </div>
              <div className="text-xs text-green-600 mt-2">
                All deals close, new opportunities emerge
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Most Likely</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">
                {formatCurrency(680000)}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Base forecast
              </div>
              <div className="text-xs text-blue-600 mt-2">
                Current trends continue as expected
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Worst Case</span>
              </div>
              <div className="text-2xl font-bold text-red-800">
                {formatCurrency(510000)}
              </div>
              <div className="text-sm text-red-600 mt-1">
                -25% below forecast
              </div>
              <div className="text-xs text-red-600 mt-2">
                Market downturn, deals delayed or lost
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Actionable insights to improve forecast accuracy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
              <div>
                <div className="font-medium">Focus on Q3 Pipeline</div>
                <div className="text-sm text-muted-foreground">
                  Your Q3 pipeline is 15% below target. Consider increasing prospecting activities or accelerating existing deals.
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <div className="font-medium">Improve Deal Velocity</div>
                <div className="text-sm text-muted-foreground">
                  Average deal cycle is 15% longer than last quarter. Review bottlenecks in your sales process.
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <div className="font-medium">Leverage High-Performing Segments</div>
                <div className="text-sm text-muted-foreground">
                  Enterprise customers show 40% higher close rates. Consider allocating more resources to this segment.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}