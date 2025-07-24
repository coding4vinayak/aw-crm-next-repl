'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@awcrm/ui';
import { usePerformanceMetrics } from '@/hooks/use-analytics';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Award,
  Users,
  BarChart3,
  Calendar,
  Trophy,
  Activity,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

interface PerformanceMetricsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function PerformanceMetrics({ dateRange }: PerformanceMetricsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const { data: metricsData, isLoading } = usePerformanceMetrics(dateRange);

  if (isLoading) {
    return <div>Loading performance metrics...</div>;
  }

  const {
    teamPerformance,
    kpiTrends,
    goalTracking,
    leaderboard,
    achievements,
  } = metricsData || {};

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

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGoalColor = (achieved: number, target: number) => {
    const percentage = (achieved / target) * 100;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Track team performance and goal achievement</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="goals">Goal Tracking</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiTrends?.map((kpi, index) => (
              <Card key={kpi.metric}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.metric}</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kpi.metric.includes('Revenue') || kpi.metric.includes('Size') 
                      ? formatCurrency(kpi.current) 
                      : kpi.current.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Target: {kpi.metric.includes('Revenue') || kpi.metric.includes('Size') 
                        ? formatCurrency(kpi.target) 
                        : kpi.target.toLocaleString()}
                    </p>
                    {formatTrend(kpi.trend)}
                  </div>
                  <Progress 
                    value={(kpi.current / kpi.target) * 100} 
                    className="mt-2 h-2" 
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Key metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={kpiTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="current" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Current"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="team" className="space-y-6">
          {/* Team Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Team Performance vs Quota</CardTitle>
              <CardDescription>Individual performance against targets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={teamPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}%`,
                      name === 'percentage' ? 'Achievement' : name
                    ]}
                  />
                  <Bar dataKey="percentage" fill="#8884d8">
                    {teamPerformance?.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.percentage >= 100 ? '#22c55e' : entry.percentage >= 80 ? '#3b82f6' : '#ef4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Individual Performance Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {teamPerformance?.map((member) => (
              <Card key={member.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <Badge className={getPerformanceColor(member.percentage)}>
                      {member.percentage}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quota</span>
                      <span className="font-medium">{formatCurrency(member.quota)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Achieved</span>
                      <span className="font-medium">{formatCurrency(member.achieved)}</span>
                    </div>
                    <Progress value={member.percentage} className="h-2" />
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Gap to Target</span>
                      <span className={member.percentage >= 100 ? 'text-green-600' : 'text-red-600'}>
                        {member.percentage >= 100 
                          ? `+${formatCurrency(member.achieved - member.quota)}`
                          : `-${formatCurrency(member.quota - member.achieved)}`
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Goal Tracking Tab */}
        <TabsContent value="goals" className="space-y-6">
          {/* Goal Progress */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Goals</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{goalTracking?.monthly.achieved}%</div>
                <p className="text-xs text-muted-foreground mb-2">
                  of {goalTracking?.monthly.target}% target
                </p>
                <Progress value={goalTracking?.monthly.achieved} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quarterly Goals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{goalTracking?.quarterly.achieved}%</div>
                <p className="text-xs text-muted-foreground mb-2">
                  of {goalTracking?.quarterly.target}% target
                </p>
                <Progress value={goalTracking?.quarterly.achieved} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yearly Goals</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{goalTracking?.yearly.achieved}%</div>
                <p className="text-xs text-muted-foreground mb-2">
                  of {goalTracking?.yearly.target}% target
                </p>
                <Progress value={goalTracking?.yearly.achieved} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Goal Progress Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Goal Achievement Overview</CardTitle>
              <CardDescription>Progress across different time periods</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="20%" 
                  outerRadius="80%" 
                  data={[
                    { name: 'Monthly', value: goalTracking?.monthly.achieved, fill: '#8884d8' },
                    { name: 'Quarterly', value: goalTracking?.quarterly.achieved, fill: '#82ca9d' },
                    { name: 'Yearly', value: goalTracking?.yearly.achieved, fill: '#ffc658' },
                  ]}
                >
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Achievement']} />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          {/* Achievement Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-yellow-800">Top Performer</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-yellow-800">Sarah Johnson</div>
                <div className="text-sm text-yellow-600">123% of quota achieved</div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">Quota Crusher</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-green-800">Mike Chen</div>
                <div className="text-sm text-green-600">Exceeded quota 3 months in a row</div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-blue-800">Rising Star</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-blue-800">Lisa Wang</div>
                <div className="text-sm text-blue-600">Highest improvement this quarter</div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Performance Leaderboard
              </CardTitle>
              <CardDescription>Top performers this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformance?.sort((a, b) => b.percentage - a.percentage).map((member, index) => (
                  <div key={member.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(member.achieved)} achieved
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getPerformanceColor(member.percentage)}>
                        {member.percentage}%
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        of {formatCurrency(member.quota)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}