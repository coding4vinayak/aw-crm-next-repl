'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Download, FileText, FileSpreadsheet, Image, CheckCircle } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function ExportDialog({ open, onOpenChange, dateRange }: ExportDialogProps) {
  const { toast } = useToast();
  const [exportOptions, setExportOptions] = useState({
    format: 'xlsx',
    includeCharts: true,
    includeRawData: true,
    includeSummary: true,
    dataSource: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  const formatOptions = [
    { value: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet, description: 'Spreadsheet format with multiple sheets' },
    { value: 'csv', label: 'CSV (.csv)', icon: FileText, description: 'Comma-separated values for data analysis' },
    { value: 'pdf', label: 'PDF (.pdf)', icon: FileText, description: 'Formatted report with charts and tables' },
    { value: 'png', label: 'PNG (.png)', icon: Image, description: 'High-resolution image of charts' },
  ];

  const dataSourceOptions = [
    { value: 'all', label: 'All Data' },
    { value: 'customers', label: 'Customers Only' },
    { value: 'deals', label: 'Deals Only' },
    { value: 'activities', label: 'Activities Only' },
    { value: 'analytics', label: 'Analytics Summary' },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 200);

      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2500));

      setExportComplete(true);
      
      // Simulate file download
      const fileName = `crm-export-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.${exportOptions.format}`;
      
      toast({
        title: 'Export completed',
        description: `Your report has been exported as ${fileName}`,
      });

      // In a real implementation, you would trigger the actual file download here
      console.log('Exporting with options:', exportOptions);
      
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setExportComplete(false);
        setExportProgress(0);
        onOpenChange(false);
      }, 2000);
    }
  };

  const selectedFormat = formatOptions.find(f => f.value === exportOptions.format);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export your CRM data and analytics in various formats for external analysis or reporting.
          </DialogDescription>
        </DialogHeader>

        {!isExporting && !exportComplete && (
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-4">
              <Label>Export Format</Label>
              <div className="grid gap-3">
                {formatOptions.map((format) => {
                  const Icon = format.icon;
                  return (
                    <div
                      key={format.value}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        exportOptions.format === format.value 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: format.value }))}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{format.label}</div>
                        <div className="text-sm text-muted-foreground">{format.description}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        exportOptions.format === format.value 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`}>
                        {exportOptions.format === format.value && (
                          <div className="w-full h-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data Source Selection */}
            <div className="space-y-2">
              <Label>Data to Export</Label>
              <Select 
                value={exportOptions.dataSource} 
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, dataSource: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dataSourceOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export Options */}
            <div className="space-y-4">
              <Label>Include in Export</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={exportOptions.includeCharts}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeCharts: !!checked }))}
                    disabled={exportOptions.format === 'csv'}
                  />
                  <Label htmlFor="charts" className="text-sm">
                    Charts and visualizations
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rawdata"
                    checked={exportOptions.includeRawData}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeRawData: !!checked }))}
                  />
                  <Label htmlFor="rawdata" className="text-sm">
                    Raw data tables
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="summary"
                    checked={exportOptions.includeSummary}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeSummary: !!checked }))}
                    disabled={exportOptions.format === 'png'}
                  />
                  <Label htmlFor="summary" className="text-sm">
                    Executive summary
                  </Label>
                </div>
              </div>
            </div>

            {/* Date Range Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium mb-1">Date Range</div>
              <div className="text-sm text-muted-foreground">
                {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-4 py-6">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Exporting Data...</div>
              <div className="text-sm text-muted-foreground mb-4">
                Preparing your {selectedFormat?.label} export
              </div>
            </div>
            
            <Progress value={exportProgress} className="h-2" />
            
            <div className="text-center text-sm text-muted-foreground">
              {exportProgress}% complete
            </div>
          </div>
        )}

        {/* Export Complete */}
        {exportComplete && (
          <div className="space-y-4 py-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <div className="text-lg font-medium mb-2">Export Complete!</div>
              <div className="text-sm text-muted-foreground">
                Your file has been downloaded successfully.
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!isExporting && !exportComplete && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </>
          )}
          
          {isExporting && (
            <Button disabled>
              <Download className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}