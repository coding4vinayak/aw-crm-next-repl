import { useQuery } from '@tanstack/react-query';

// Mock analytics API functions
const analyticsApi = {
  getAnalytics: async (dateRange: { from: Date; to: Date }) => {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      kpis: {
        totalRevenue: 1250000,
        revenueTrend: 12.5,
        activeCustomers: 342,
        customerTrend: 8.3,
        dealsClosed: 28,
        dealsTrend: 15.7,
        conversionRate: 24.5,
        conversionTrend: -2.1,
      },
      revenueChart: [
        { month: 'Jan', revenue: 85000 },
        { month: 'Feb', revenue: 92000 },
        { month: 'Mar', revenue: 78000 },
        { month: 'Apr', revenue: 105000 },
        { month: 'May', revenue: 118000 },
        { month: 'Jun', revenue: 125000 },
      ],
      dealsPipeline: [
        { name: 'Prospecting', value: 125000, count: 15 },
        { name: 'Qualification', value: 89000, count: 8 },
        { name: 'Proposal', value: 156000, count: 12 },
        { name: 'Negotiation', value: 78000, count: 6 },
        { name: 'Closed Won', value: 234000, count: 18 },
      ],
      customerGrowth: [
        { month: 'Jan', newCustomers: 12, totalCustomers: 298 },
        { month: 'Feb', newCustomers: 18, totalCustomers: 316 },
        { month: 'Mar', newCustomers: 8, totalCustomers: 324 },
        { month: 'Apr', newCustomers: 22, totalCustomers: 346 },
        { month: 'May', newCustomers: 15, totalCustomers: 361 },
        { month: 'Jun', newCustomers: 19, totalCustomers: 380 },
      ],
      activityMetrics: [
        { type: 'Emails', count: 245 },
        { type: 'Calls', count: 89 },
        { type: 'Meetings', count: 34 },
        { type: 'Notes', count: 156 },
        { type: 'Tasks', count: 78 },
      ],
      topPerformers: [
        { id: '1', name: 'Sarah Johnson', role: 'Sales Manager', revenue: 185000, deals: 12 },
        { id: '2', name: 'Mike Chen', role: 'Sales Rep', revenue: 142000, deals: 9 },
        { id: '3', name: 'Lisa Wang', role: 'Sales Rep', revenue: 128000, deals: 8 },
        { id: '4', name: 'David Kim', role: 'Sales Rep', revenue: 95000, deals: 6 },
      ],
      conversionFunnel: [
        { stage: 'Leads', count: 450, percentage: 100, conversionRate: 0 },
        { stage: 'Qualified', count: 180, percentage: 40, conversionRate: 40 },
        { stage: 'Opportunities', count: 90, percentage: 20, conversionRate: 50 },
        { stage: 'Proposals', count: 45, percentage: 10, conversionRate: 50 },
        { stage: 'Customers', count: 18, percentage: 4, conversionRate: 40 },
      ],
    };
  },

  getCustomerSegmentation: async (dateRange: { from: Date; to: Date }, type: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (type === 'rfm') {
      return {
        segments: [
          {
            name: 'Champions',
            type: 'champions',
            customerCount: 45,
            totalRevenue: 450000,
            avgOrderValue: 2500,
            avgFrequency: 4.2,
            recencyScore: 5,
            frequencyScore: 5,
            monetaryScore: 5,
            description: 'Best customers who buy frequently and recently with high value',
          },
          {
            name: 'Loyal Customers',
            type: 'loyal',
            customerCount: 78,
            totalRevenue: 380000,
            avgOrderValue: 1800,
            avgFrequency: 3.1,
            recencyScore: 4,
            frequencyScore: 4,
            monetaryScore: 4,
            description: 'Regular customers with good purchase history',
          },
          {
            name: 'Potential Loyalists',
            type: 'potential',
            customerCount: 92,
            totalRevenue: 285000,
            avgOrderValue: 1200,
            avgFrequency: 2.3,
            recencyScore: 4,
            frequencyScore: 2,
            monetaryScore: 3,
            description: 'Recent customers with potential for growth',
          },
          {
            name: 'At Risk',
            type: 'at_risk',
            customerCount: 34,
            totalRevenue: 125000,
            avgOrderValue: 1500,
            avgFrequency: 1.8,
            recencyScore: 2,
            frequencyScore: 4,
            monetaryScore: 3,
            description: 'Previously good customers who haven\'t purchased recently',
          },
          {
            name: 'Lost Customers',
            type: 'lost',
            customerCount: 28,
            totalRevenue: 45000,
            avgOrderValue: 800,
            avgFrequency: 1.2,
            recencyScore: 1,
            frequencyScore: 1,
            monetaryScore: 1,
            description: 'Customers who haven\'t purchased in a long time',
          },
        ],
        scatterData: Array.from({ length: 100 }, (_, i) => ({
          recency: Math.floor(Math.random() * 365) + 1,
          frequency: Math.floor(Math.random() * 20) + 1,
          monetary: Math.floor(Math.random() * 10000) + 100,
          customer: `Customer ${i + 1}`,
        })),
      };
    }

    if (type === 'behavior') {
      return {
        behaviorSegments: [
          { name: 'Highly Engaged', count: 89, value: 89, description: 'Frequent interactions and high activity' },
          { name: 'Moderately Engaged', count: 156, value: 156, description: 'Regular but not frequent interactions' },
          { name: 'Low Engagement', count: 78, value: 78, description: 'Minimal interactions and activity' },
          { name: 'Dormant', count: 34, value: 34, description: 'No recent activity or interactions' },
        ],
      };
    }

    if (type === 'value') {
      return {
        valueSegments: [
          { 
            segment: 'High Value', 
            avgValue: 15000, 
            count: 45,
            customers: [
              { id: '1', name: 'John Doe', email: 'john@example.com', lifetimeValue: 25000, dealCount: 8 },
              { id: '2', name: 'Jane Smith', email: 'jane@example.com', lifetimeValue: 22000, dealCount: 6 },
              { id: '3', name: 'Bob Wilson', email: 'bob@example.com', lifetimeValue: 18000, dealCount: 5 },
            ]
          },
          { segment: 'Medium Value', avgValue: 7500, count: 128 },
          { segment: 'Low Value', avgValue: 2500, count: 89 },
        ],
      };
    }

    if (type === 'cohort') {
      return {
        cohortAnalysis: {
          cohorts: [
            {
              period: '2024-01',
              size: 45,
              retentionRates: [100, 89, 78, 67, 58, 52, 48, 45, 42, 38, 35, 32],
            },
            {
              period: '2024-02',
              size: 38,
              retentionRates: [100, 92, 84, 76, 68, 61, 55, 50, 46, 42, 38, null],
            },
            {
              period: '2024-03',
              size: 52,
              retentionRates: [100, 87, 75, 65, 58, 52, 47, 43, 39, 36, null, null],
            },
          ],
        },
      };
    }

    return {
      churnRisk: {
        total: 380,
        highRisk: 28,
        mediumRisk: 45,
        lowRisk: 307,
      },
    };
  },

  getSalesForecasting: async (dateRange: { from: Date; to: Date }) => {
    await new Promise(resolve => setTimeout(resolve, 900));
    
    return {
      forecast: [
        { month: 'Jul', actual: null, predicted: 135000, confidence: 85 },
        { month: 'Aug', actual: null, predicted: 142000, confidence: 78 },
        { month: 'Sep', actual: null, predicted: 128000, confidence: 72 },
        { month: 'Oct', actual: null, predicted: 155000, confidence: 68 },
        { month: 'Nov', actual: null, predicted: 168000, confidence: 65 },
        { month: 'Dec', actual: null, predicted: 185000, confidence: 62 },
      ],
      historicalAccuracy: 87.5,
      trendAnalysis: {
        direction: 'upward',
        strength: 'strong',
        seasonality: 'moderate',
      },
      keyFactors: [
        { factor: 'Pipeline Value', impact: 0.35, trend: 'positive' },
        { factor: 'Deal Velocity', impact: 0.28, trend: 'positive' },
        { factor: 'Win Rate', impact: 0.22, trend: 'stable' },
        { factor: 'Market Conditions', impact: 0.15, trend: 'negative' },
      ],
    };
  },

  getPerformanceMetrics: async (dateRange: { from: Date; to: Date }) => {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return {
      teamPerformance: [
        { name: 'Sarah Johnson', quota: 150000, achieved: 185000, percentage: 123 },
        { name: 'Mike Chen', quota: 120000, achieved: 142000, percentage: 118 },
        { name: 'Lisa Wang', quota: 110000, achieved: 128000, percentage: 116 },
        { name: 'David Kim', quota: 100000, achieved: 95000, percentage: 95 },
      ],
      kpiTrends: [
        { metric: 'Revenue', current: 1250000, target: 1200000, trend: 12.5 },
        { metric: 'Deals Closed', current: 28, target: 25, trend: 15.7 },
        { metric: 'Conversion Rate', current: 24.5, target: 25, trend: -2.1 },
        { metric: 'Avg Deal Size', current: 44643, target: 40000, trend: 8.9 },
      ],
      goalTracking: {
        monthly: { achieved: 85, target: 100 },
        quarterly: { achieved: 78, target: 100 },
        yearly: { achieved: 65, target: 100 },
      },
    };
  },
};

// React Query hooks
export function useAnalytics(dateRange: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: () => analyticsApi.getAnalytics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomerSegmentation(dateRange: { from: Date; to: Date }, type: string) {
  return useQuery({
    queryKey: ['customer-segmentation', dateRange, type],
    queryFn: () => analyticsApi.getCustomerSegmentation(dateRange, type),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSalesForecasting(dateRange: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['sales-forecasting', dateRange],
    queryFn: () => analyticsApi.getSalesForecasting(dateRange),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function usePerformanceMetrics(dateRange: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['performance-metrics', dateRange],
    queryFn: () => analyticsApi.getPerformanceMetrics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}