'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@awcrm/ui';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ReportPreviewProps {
  config: {
    name: string;
    description: string;
    dataSource: string;
    chartType: string;
    columns: string[];
    filters: any[];
    groupBy: string[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function ReportPreview({ config, dateRange }: ReportPreviewProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to generate report data
    const generateReportData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock data based on configuration
      const mockData = generateMockData(config);
      setData(mockData);
      setIsLoading(false);
    };

    generateReportData();
  }, [config, dateRange]);

  const generateMockData = (config: any) => {
    switch (config.dataSource) {
      case 'customers':
        return [
          { firstName: 'John', lastName: 'Doe', email: 'john@example.com', status: 'Active', lifetimeValue: 15000, createdAt: '2024-01-15' },
          { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', status: 'Active', lifetimeValue: 22000, createdAt: '2024-01-20' },
          { firstName: 'Bob', lastName: 'Wilson', email: 'bob@example.com', status: 'Prospect', lifetimeValue: 8000, createdAt: '2024-01-25' },
          { firstName: 'Alice', lastName: 'Brown', email: 'alice@example.com', status: 'Active', lifetimeValue: 18000, createdAt: '2024-02-01' },
          { firstName: 'Charlie', lastName: 'Davis', email: 'charlie@example.com', status: 'Inactive', lifetimeValue: 5000, createdAt: '2024-02-05' },
        ];
      case 'deals':
        return [
          { title: 'Enterprise License', value: 50000, stage: 'Proposal', probability: 75, customer: 'Acme Corp' },
          { title: 'Professional Services', value: 25000, stage: 'Negotiation', probability: 90, customer: 'TechStart' },
          { title: 'Cloud Migration', value: 120000, stage: 'Qualification', probability: 60, customer: 'HealthTech' },
          { title: 'Support Contract', value: 15000, stage: 'Closed Won', probability: 100, customer: 'FinanceFlow' },
          { title: 'Hardware Upgrade', value: 75000, stage: 'Prospecting', probability: 25, customer: 'DataCorp' },
        ];
      case 'activities':
        return [
          { type: 'Email', title: 'Follow-up sent', createdAt: '2024-01-20', customer: 'John Doe' },
          { type: 'Call', title: 'Discovery call', createdAt: '2024-01-21', customer: 'Jane Smith' },
          { type: 'Meeting', title: 'Product demo', createdAt: '2024-01-22', customer: 'Bob Wilson' },
          { type: 'Note', title: 'Customer feedback', createdAt: '2024-01-23', customer: 'Alice Brown' },
          { type: 'Task', title: 'Send proposal', createdAt: '2024-01-24', customer: 'Charlie Davis' },
        ];
      case 'leads':
        return [
          { firstName: 'David', lastName: 'Lee', email: 'david@startup.com', status: 'New', score: 75, source: 'Website' },
          { firstName: 'Emma', lastName: 'Wilson', email: 'emma@techco.com', status: 'Qualified', score: 85, source: 'Referral' },
          { firstName: 'Frank', lastName: 'Miller', email: 'frank@biztech.com', status: 'Contacted', score: 65, source: 'Event' },
          { firstName: 'Grace', lastName: 'Taylor', email: 'grace@innovate.com', status: 'Proposal', score: 90, source: 'Marketing' },
          { firstName: 'Henry', lastName: 'Clark', email: 'henry@solutions.com', status: 'Lost', score: 45, source: 'Cold Call' },
        ];
      default:
        return [];
    }
  };

  const formatValue = (value: any, column: string) => {
    if (column.toLowerCase().includes('value') || column.toLowerCase().includes('revenue')) {
      return formatCurrency(Number(value));
    }
    if (column.toLowerCase().includes('date') || column.toLowerCase().includes('at')) {
      return formatDate(new Date(value));
    }
    return value;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No data available for the selected configuration</p>
      </div>
    );
  }

  // Filter data based on selected columns
  const filteredData = data.map(item => {
    const filtered: any = {};
    config.columns.forEach(column => {
      if (item.hasOwnProperty(column)) {
        filtered[column] = item[column];
      }
    });
    return filtered;
  });

  const renderChart = () => {
    switch (config.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.columns[0]} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={config.columns[1]} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.columns[0]} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={config.columns[1]} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        const pieData = filteredData.slice(0, 5).map((item, index) => ({
          name: item[config.columns[0]],
          value: Number(item[config.columns[1]]) || 1,
        }));
        
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default: // table
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {config.columns.map(column => (
                    <th key={column} className="text-left p-2 font-medium">
                      {column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 10).map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    {config.columns.map(column => (
                      <td key={column} className="p-2">
                        {formatValue(item[column], column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length > 10 && (
              <div className="text-center py-2 text-sm text-muted-foreground">
                Showing 10 of {filteredData.length} records
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Report Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{config.dataSource}</Badge>
          <Badge variant="outline">{config.chartType}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredData.length} records • {config.columns.length} columns
        </div>
      </div>

      {/* Chart/Table */}
      <div className="border rounded-lg p-4">
        {renderChart()}
      </div>

      {/* Applied Filters */}
      {config.filters.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Applied Filters:</div>
          <div className="flex flex-wrap gap-2">
            {config.filters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {filter.field} {filter.operator} {filter.value}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}