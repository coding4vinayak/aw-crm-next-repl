'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Database, 
  Zap, 
  Memory, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Server
} from 'lucide-react';

interface PerformanceStats {
  timestamp: string;
  performance: {
    api: {
      avgResponseTime: number;
      errorRate: number;
      requestCount: number;
    };
    database: {
      avgQueryTime: number;
      slowQueryCount: number;
      queryCount: number;
    };
    cache: {
      hitRate: number;
      totalHits: number;
      totalMisses: number;
    };
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
  };
  database: {
    health: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      connectionCount: number;
      avgQueryTime: number;
      slowQueries: number;
      errors: number;
    };
    connections: {
      activeConnections: number;
      maxConnections: number;
      activeQueries: number;
      utilizationRate: number;
    };
  };
  cache: {
    health: {
      status: string;
      type: string;
      memory?: number;
    };
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  };
  memory: {
    usage: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
      external: number;
    };
    warning: boolean;
    critical: boolean;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: number;
  }>;
  suggestions: Array<{
    type: 'index' | 'query' | 'cache';
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  system: {
    uptime: number;
    nodeVersion: string;
    platform: string;
    arch: string;
  };
}

export function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadPerformanceStats();
    
    if (autoRefresh) {
      const interval = setInterval(loadPerformanceStats, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadPerformanceStats = async () => {
    try {
      setError(null);
      const response = await fetch('/api/performance/stats');
      
      if (!response.ok) {
        throw new Error('Failed to load performance statistics');
      }
      
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load performance stats:', error);
      setError('Failed to load performance statistics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load performance data</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system performance, database health, and optimization opportunities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
          <Button onClick={loadPerformanceStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.performance.api.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {stats.performance.api.requestCount} requests processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Health</CardTitle>
            {getStatusIcon(stats.database.health.status)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(stats.database.health.status)}`}>
              {stats.database.health.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.database.health.avgQueryTime}ms avg query time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cache.hitRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.cache.totalHits} hits, {stats.cache.totalMisses} misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Memory className={`h-4 w-4 ${
              stats.memory.critical ? 'text-red-600' : 
              stats.memory.warning ? 'text-yellow-600' : 'text-muted-foreground'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memory.usage.heapUsed}MB</div>
            <p className="text-xs text-muted-foreground">
              of {stats.memory.usage.heapTotal}MB allocated
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center py-8">
        <p className="text-muted-foreground">Performance dashboard implementation in progress...</p>
      </div>
    </div>
  );
}