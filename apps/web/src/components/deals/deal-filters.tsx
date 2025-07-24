'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@awcrm/ui';
import { useUsers } from '@/hooks/use-users';
import { format } from 'date-fns';

interface DealFiltersProps {
  filters: {
    stage: string;
    assignedToId: string;
    priority: string;
    source: string;
    valueRange: { min: number; max: number };
    dateRange: { from: Date | undefined; to: Date | undefined };
  };
  onFiltersChange: (filters: DealFiltersProps['filters']) => void;
}

const STAGE_OPTIONS = [
  { label: 'All Stages', value: '' },
  { label: 'Prospecting', value: 'prospecting' },
  { label: 'Qualification', value: 'qualification' },
  { label: 'Proposal', value: 'proposal' },
  { label: 'Negotiation', value: 'negotiation' },
  { label: 'Closed Won', value: 'closed-won' },
  { label: 'Closed Lost', value: 'closed-lost' },
];

const PRIORITY_OPTIONS = [
  { label: 'All Priorities', value: '' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const SOURCE_OPTIONS = [
  { label: 'All Sources', value: '' },
  { label: 'Website', value: 'website' },
  { label: 'Referral', value: 'referral' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Social Media', value: 'social_media' },
  { label: 'Event', value: 'event' },
  { label: 'Cold Call', value: 'cold_call' },
  { label: 'Other', value: 'other' },
];

export function DealFilters({ filters, onFiltersChange }: DealFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const { data: users = [] } = useUsers();

  // Update parent component when filters change
  useEffect(() => {
    onFiltersChange(localFilters);
  }, [localFilters, onFiltersChange]);

  const handleStageChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, stage: value }));
  };

  const handleAssignedToChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, assignedToId: value }));
  };

  const handlePriorityChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, priority: value }));
  };

  const handleSourceChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, source: value }));
  };

  const handleValueRangeChange = (field: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalFilters(prev => ({
      ...prev,
      valueRange: { ...prev.valueRange, [field]: numValue }
    }));
  };

  const handleDateRangeChange = (field: 'from' | 'to', date: Date | undefined) => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [field]: date }
    }));
  };

  const handleClearFilters = () => {
    setLocalFilters({
      stage: '',
      assignedToId: '',
      priority: '',
      source: '',
      valueRange: { min: 0, max: 1000000 },
      dateRange: { from: undefined, to: undefined },
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.stage) count++;
    if (localFilters.assignedToId) count++;
    if (localFilters.priority) count++;
    if (localFilters.source) count++;
    if (localFilters.valueRange.min > 0 || localFilters.valueRange.max < 1000000) count++;
    if (localFilters.dateRange.from || localFilters.dateRange.to) count++;
    return count;
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Stage Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Stage</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {STAGE_OPTIONS.find(option => option.value === localFilters.stage)?.label || 'All Stages'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search stage..." />
                <CommandEmpty>No stage found.</CommandEmpty>
                <CommandGroup>
                  {STAGE_OPTIONS.map(option => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleStageChange(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          localFilters.stage === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Assigned To Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Assigned To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {users.find(user => user.id === localFilters.assignedToId)
                  ? `${users.find(user => user.id === localFilters.assignedToId)?.firstName} ${users.find(user => user.id === localFilters.assignedToId)?.lastName}`
                  : 'All Users'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => handleAssignedToChange('')}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        localFilters.assignedToId === "" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Users
                  </CommandItem>
                  {users.map(user => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => handleAssignedToChange(user.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          localFilters.assignedToId === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {user.firstName} {user.lastName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Priority</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {PRIORITY_OPTIONS.find(option => option.value === localFilters.priority)?.label || 'All Priorities'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search priority..." />
                <CommandEmpty>No priority found.</CommandEmpty>
                <CommandGroup>
                  {PRIORITY_OPTIONS.map(option => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handlePriorityChange(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          localFilters.priority === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Source Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Source</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {SOURCE_OPTIONS.find(option => option.value === localFilters.source)?.label || 'All Sources'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search source..." />
                <CommandEmpty>No source found.</CommandEmpty>
                <CommandGroup>
                  {SOURCE_OPTIONS.map(option => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSourceChange(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          localFilters.source === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Value Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Value Range</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={localFilters.valueRange.min || ''}
              onChange={(e) => handleValueRangeChange('min', e.target.value)}
              className="text-xs"
            />
            <Input
              type="number"
              placeholder="Max"
              value={localFilters.valueRange.max === 1000000 ? '' : localFilters.valueRange.max || ''}
              onChange={(e) => handleValueRangeChange('max', e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Close Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateRange.from ? format(localFilters.dateRange.from, 'MMM dd') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localFilters.dateRange.from}
                  onSelect={(date) => handleDateRangeChange('from', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateRange.to ? format(localFilters.dateRange.to, 'MMM dd') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localFilters.dateRange.to}
                  onSelect={(date) => handleDateRangeChange('to', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {localFilters.stage && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Stage: {STAGE_OPTIONS.find(option => option.value === localFilters.stage)?.label}
            </Badge>
          )}
          {localFilters.assignedToId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Assigned: {users.find(user => user.id === localFilters.assignedToId)?.firstName} {users.find(user => user.id === localFilters.assignedToId)?.lastName}
            </Badge>
          )}
          {localFilters.priority && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Priority: {PRIORITY_OPTIONS.find(option => option.value === localFilters.priority)?.label}
            </Badge>
          )}
          {localFilters.source && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Source: {SOURCE_OPTIONS.find(option => option.value === localFilters.source)?.label}
            </Badge>
          )}
          {(localFilters.valueRange.min > 0 || localFilters.valueRange.max < 1000000) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Value: ${localFilters.valueRange.min.toLocaleString()} - ${localFilters.valueRange.max.toLocaleString()}
            </Badge>
          )}
          {(localFilters.dateRange.from || localFilters.dateRange.to) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Date: {localFilters.dateRange.from ? format(localFilters.dateRange.from, 'MMM dd') : '...'} - {localFilters.dateRange.to ? format(localFilters.dateRange.to, 'MMM dd') : '...'}
            </Badge>
          )}
        </div>
        {getActiveFiltersCount() > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}