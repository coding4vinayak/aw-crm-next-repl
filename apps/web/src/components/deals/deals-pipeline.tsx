'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@awcrm/ui';
import { Deal } from '@awcrm/database';
import { MoreHorizontal, Calendar, DollarSign, User, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DealsPipelineProps {
  deals: Deal[];
  isLoading: boolean;
  error: Error | null;
  onRefresh: () => void;
}

// Pipeline stages configuration
const PIPELINE_STAGES = [
  { id: 'prospecting', name: 'Prospecting', color: 'bg-gray-100' },
  { id: 'qualification', name: 'Qualification', color: 'bg-blue-100' },
  { id: 'proposal', name: 'Proposal', color: 'bg-yellow-100' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-100' },
  { id: 'closed-won', name: 'Closed Won', color: 'bg-green-100' },
  { id: 'closed-lost', name: 'Closed Lost', color: 'bg-red-100' },
];

export function DealsPipeline({ deals, isLoading, error, onRefresh }: DealsPipelineProps) {
  const [dealsByStage, setDealsByStage] = useState(() => {
    // Group deals by stage
    const grouped = PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage.id] = deals.filter(deal => 
        deal.stage.toLowerCase().replace(' ', '-') === stage.id
      );
      return acc;
    }, {} as Record<string, Deal[]>);
    return grouped;
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;
    const dealId = draggableId;

    // Find the deal being moved
    const deal = dealsByStage[sourceStage].find(d => d.id === dealId);
    if (!deal) return;

    // Create new state
    const newDealsByStage = { ...dealsByStage };
    
    // Remove from source
    newDealsByStage[sourceStage] = newDealsByStage[sourceStage].filter(d => d.id !== dealId);
    
    // Add to destination
    const updatedDeal = { ...deal, stage: PIPELINE_STAGES.find(s => s.id === destStage)?.name || deal.stage };
    newDealsByStage[destStage].splice(destination.index, 0, updatedDeal);

    setDealsByStage(newDealsByStage);

    // TODO: Make API call to update deal stage
    console.log(`Moving deal ${dealId} from ${sourceStage} to ${destStage}`);
  };

  const handleViewDeal = (dealId: string) => {
    // TODO: Navigate to deal detail page
    console.log('View deal:', dealId);
  };

  const handleEditDeal = (dealId: string) => {
    // TODO: Open edit deal dialog
    console.log('Edit deal:', dealId);
  };

  const handleDeleteDeal = (dealId: string) => {
    // TODO: Delete deal
    console.log('Delete deal:', dealId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-destructive mb-4">Failed to load deals</p>
        <Button onClick={onRefresh}>Try Again</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage.id} className="space-y-4">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 min-h-[600px]">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage.id] || [];
          const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

          return (
            <div key={stage.id} className="flex flex-col">
              {/* Stage Header */}
              <div className={`p-3 rounded-t-lg ${stage.color} border-b`}>
                <h3 className="font-semibold text-sm">{stage.name}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>{stageDeals.length} deals</span>
                  <span>{formatCurrency(stageValue)}</span>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 space-y-2 min-h-[500px] rounded-b-lg border-l border-r border-b ${
                      snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    {stageDeals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-grab active:cursor-grabbing ${
                              snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                            }`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm line-clamp-2 flex-1">
                                  {deal.title}
                                </h4>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleViewDeal(deal.id)}>
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditDeal(deal.id)}>
                                      Edit Deal
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteDeal(deal.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      Delete Deal
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    <span className="font-medium">{formatCurrency(deal.value)}</span>
                                  </div>
                                  {deal.priority && (
                                    <Badge className={`text-xs ${getPriorityColor(deal.priority)}`}>
                                      {deal.priority}
                                    </Badge>
                                  )}
                                </div>

                                {deal.customer && (
                                  <div className="text-xs text-muted-foreground">
                                    {deal.customer.firstName} {deal.customer.lastName}
                                  </div>
                                )}

                                {deal.expectedCloseDate && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <span>{formatDate(deal.expectedCloseDate)}</span>
                                  </div>
                                )}

                                {deal.assignedTo && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <User className="h-3 w-3 mr-1" />
                                    <Avatar className="h-4 w-4 mr-1">
                                      <AvatarFallback className="text-xs">
                                        {deal.assignedTo.firstName?.[0]}{deal.assignedTo.lastName?.[0]}
                                      </AvatarFallback>
                                      {deal.assignedTo.avatar && (
                                        <AvatarImage src={deal.assignedTo.avatar} />
                                      )}
                                    </Avatar>
                                    <span>{deal.assignedTo.firstName} {deal.assignedTo.lastName}</span>
                                  </div>
                                )}

                                {deal.probability && (
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-blue-600 h-1.5 rounded-full" 
                                      style={{ width: `${deal.probability}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {stageDeals.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        No deals in this stage
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}