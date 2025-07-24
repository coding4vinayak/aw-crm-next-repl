'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@awcrm/ui';
import { Plus, ExternalLink, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface CustomerDealsProps {
  customerId: string;
}

// Mock deal data - in real app this would come from API
const mockDeals = [
  {
    id: '1',
    title: 'Enterprise Software License',
    value: 50000,
    stage: 'Proposal',
    probability: 75,
    expectedCloseDate: new Date('2024-02-15'),
    createdAt: new Date('2024-01-01'),
    status: 'active',
    description: 'Annual enterprise software license renewal with additional modules'
  },
  {
    id: '2',
    title: 'Professional Services Package',
    value: 25000,
    stage: 'Negotiation',
    probability: 90,
    expectedCloseDate: new Date('2024-01-30'),
    createdAt: new Date('2023-12-15'),
    status: 'active',
    description: 'Implementation and training services for new software deployment'
  },
  {
    id: '3',
    title: 'Hardware Upgrade',
    value: 75000,
    stage: 'Closed Won',
    probability: 100,
    expectedCloseDate: new Date('2023-12-01'),
    createdAt: new Date('2023-10-01'),
    status: 'won',
    description: 'Complete hardware infrastructure upgrade including servers and networking equipment'
  },
  {
    id: '4',
    title: 'Support Contract Extension',
    value: 15000,
    stage: 'Closed Won',
    probability: 100,
    expectedCloseDate: new Date('2023-11-15'),
    createdAt: new Date('2023-09-01'),
    status: 'won',
    description: 'Extended support contract for existing systems'
  }
];

export function CustomerDeals({ customerId }: CustomerDealsProps) {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'won' | 'lost'>('all');

  const filteredDeals = mockDeals.filter(deal => {
    if (selectedStatus === 'all') return true;
    return deal.status === selectedStatus;
  });

  const totalValue = mockDeals.reduce((sum, deal) => sum + deal.value, 0);
  const wonValue = mockDeals.filter(deal => deal.status === 'won').reduce((sum, deal) => sum + deal.value, 0);
  const activeValue = mockDeals.filter(deal => deal.status === 'active').reduce((sum, deal) => sum + deal.value, 0);

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'prospecting':
        return 'bg-gray-100 text-gray-800';
      case 'qualification':
        return 'bg-blue-100 text-blue-800';
      case 'proposal':
        return 'bg-yellow-100 text-yellow-800';
      case 'negotiation':
        return 'bg-orange-100 text-orange-800';
      case 'closed won':
        return 'bg-green-100 text-green-800';
      case 'closed lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {mockDeals.length} deals total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(wonValue)}</div>
            <p className="text-xs text-muted-foreground">
              {mockDeals.filter(deal => deal.status === 'won').length} deals won
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pipeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(activeValue)}</div>
            <p className="text-xs text-muted-foreground">
              {mockDeals.filter(deal => deal.status === 'active').length} active deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deals List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Deals</CardTitle>
              <CardDescription>All deals associated with this customer</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
            >
              All ({mockDeals.length})
            </Button>
            <Button
              variant={selectedStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('active')}
            >
              Active ({mockDeals.filter(deal => deal.status === 'active').length})
            </Button>
            <Button
              variant={selectedStatus === 'won' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('won')}
            >
              Won ({mockDeals.filter(deal => deal.status === 'won').length})
            </Button>
            <Button
              variant={selectedStatus === 'lost' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('lost')}
            >
              Lost ({mockDeals.filter(deal => deal.status === 'lost').length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No deals found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDeals.map((deal) => (
                <div key={deal.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{deal.title}</h3>
                        <Badge className={getStageColor(deal.stage)}>
                          {deal.stage}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {deal.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Value</p>
                          <p className="text-muted-foreground">{formatCurrency(deal.value)}</p>
                        </div>
                        
                        <div>
                          <p className="font-medium">Expected Close</p>
                          <p className="text-muted-foreground">{formatDate(deal.expectedCloseDate)}</p>
                        </div>
                        
                        <div>
                          <p className="font-medium">Created</p>
                          <p className="text-muted-foreground">{formatDate(deal.createdAt)}</p>
                        </div>
                      </div>
                      
                      {deal.status === 'active' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Probability</span>
                            <span>{deal.probability}%</span>
                          </div>
                          <Progress value={deal.probability} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}