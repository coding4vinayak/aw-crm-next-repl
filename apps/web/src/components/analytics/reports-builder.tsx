'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReportPreview } from './report-preview';
import { SaveReportDialog } from './save-report-dialog';
import { 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  Download,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  Filter,
  Columns,
  SortAsc
} from 'lucide-react';

interface ReportsBuilderProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

interface ReportConfig {
  name: string;
  description: string;
  dataSource: string;
  chartType: string;
  columns: string[];
  filters: ReportFilter[];
  groupBy: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ReportFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const DATA_SOURCES = [
  { value: 'customers', label: 'Customers', fields: ['firstName', 'lastName', 'email', 'status', 'lifetimeValue', 'createdAt', 'assignedTo'] },
  { value: 'deals', label: 'Deals', fields: ['title', 'value', 'stage', 'probability', 'expectedCloseDate', 'customer', 'assignedTo'] },
  { value: 'activities', label: 'Activities', fields: ['type', 'title', 'createdAt', 'customer', 'deal', 'createdBy'] },
  { value: 'leads', label: 'Leads', fields: ['firstName', 'lastName', 'email', 'status', 'score', 'source', 'createdAt'] },
];

const CHART_TYPES = [
  { value: 'table', label: 'Table', icon: Table },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'between', label: 'Between' },
  { value: 'in', label: 'In' },
  { value: 'not_in', label: 'Not In' },
];

export function ReportsBuilder({ dateRange }: ReportsBuilderProps) {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    dataSource: '',
    chartType: 'table',
    columns: [],
    filters: [],
    groupBy: [],
    sortBy: '',
    sortOrder: 'asc',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const selectedDataSource = DATA_SOURCES.find(ds => ds.value === reportConfig.dataSource);

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: Math.random().toString(36).substr(2, 9),
      field: '',
      operator: 'equals',
      value: '',
    };
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter],
    }));
  };

  const updateFilter = (id: string, updates: Partial<ReportFilter>) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map(filter => 
        filter.id === id ? { ...filter, ...updates } : filter
      ),
    }));
  };

  const removeFilter = (id: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== id),
    }));
  };

  const toggleColumn = (column: string) => {
    setReportConfig(prev => ({
      ...prev,
      columns: prev.columns.includes(column)
        ? prev.columns.filter(col => col !== column)
        : [...prev.columns, column],
    }));
  };

  const toggleGroupBy = (field: string) => {
    setReportConfig(prev => ({
      ...prev,
      groupBy: prev.groupBy.includes(field)
        ? prev.groupBy.filter(g => g !== field)
        : [...prev.groupBy, field],
    }));
  };

  const runReport = () => {
    if (!reportConfig.dataSource || reportConfig.columns.length === 0) {
      return;
    }
    setShowPreview(true);
  };

  const canRunReport = reportConfig.dataSource && reportConfig.columns.length > 0;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Report Builder */}
      <div className="md:col-span-2 space-y-6">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>Configure your custom report settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  placeholder="My Custom Report"
                  value={reportConfig.name}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-source">Data Source</Label>
                <Select 
                  value={reportConfig.dataSource} 
                  onValueChange={(value) => setReportConfig(prev => ({ 
                    ...prev, 
                    dataSource: value,
                    columns: [],
                    filters: [],
                    groupBy: [],
                    sortBy: '',
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCES.map(source => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of the report"
                value={reportConfig.description}
                onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Chart Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {CHART_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant={reportConfig.chartType === type.value ? 'default' : 'outline'}
                      className="flex flex-col items-center gap-2 h-auto py-3"
                      onClick={() => setReportConfig(prev => ({ ...prev, chartType: type.value }))}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Columns Selection */}
        {selectedDataSource && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Columns className="h-5 w-5" />
                Columns
              </CardTitle>
              <CardDescription>Select the columns to include in your report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {selectedDataSource.fields.map(field => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={reportConfig.columns.includes(field)}
                      onCheckedChange={() => toggleColumn(field)}
                    />
                    <Label htmlFor={field} className="text-sm font-normal">
                      {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {selectedDataSource && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>Add filters to refine your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportConfig.filters.map((filter, index) => (
                <div key={filter.id} className="flex items-center gap-2">
                  <Select
                    value={filter.field}
                    onValueChange={(value) => updateFilter(filter.id, { field: value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDataSource.fields.map(field => (
                        <SelectItem key={field} value={field}>
                          {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(filter.id, { operator: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    className="flex-1"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" onClick={addFilter} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Filter
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Grouping and Sorting */}
        {selectedDataSource && reportConfig.chartType !== 'table' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SortAsc className="h-5 w-5" />
                Grouping & Sorting
              </CardTitle>
              <CardDescription>Configure data grouping and sorting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Group By</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedDataSource.fields.map(field => (
                    <Badge
                      key={field}
                      variant={reportConfig.groupBy.includes(field) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleGroupBy(field)}
                    >
                      {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={reportConfig.sortBy}
                    onValueChange={(value) => setReportConfig(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDataSource.fields.map(field => (
                        <SelectItem key={field} value={field}>
                          {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Select
                    value={reportConfig.sortOrder}
                    onValueChange={(value: 'asc' | 'desc') => setReportConfig(prev => ({ ...prev, sortOrder: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={runReport} 
            disabled={!canRunReport}
            className="flex-1"
          >
            <Play className="mr-2 h-4 w-4" />
            Run Report
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowSaveDialog(true)}
            disabled={!canRunReport}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline" disabled={!showPreview}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              {showPreview ? 'Live preview of your report' : 'Run the report to see preview'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showPreview ? (
              <ReportPreview 
                config={reportConfig} 
                dateRange={dateRange} 
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure and run your report to see preview</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Report Dialog */}
      <SaveReportDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        config={reportConfig}
        onConfigChange={setReportConfig}
      />
    </div>
  );
}