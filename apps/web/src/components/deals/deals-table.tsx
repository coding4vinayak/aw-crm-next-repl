'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Edit, Trash, ExternalLink, Calendar, DollarSign, User } from 'lucide-react';
import { Deal } from '@awcrm/database';
import { formatDate, formatCurrency } from '@awcrm/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useDeleteDeal } from '@/hooks/use-deals';

interface DealsTableProps {
  deals: Deal[];
  isLoading: boolean;
  error: Error | null;
  onRefresh: () => void;
}

export function DealsTable({ deals, isLoading, error, onRefresh }: DealsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  
  const deleteDeal = useDeleteDeal();

  const handleViewDeal = (id: string) => {
    router.push(`/deals/${id}`);
  };

  const handleEditDeal = (id: string) => {
    router.push(`/deals/${id}/edit`);
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;
    
    try {
      await deleteDeal.mutateAsync(dealToDelete.id);
      toast({
        title: 'Deal deleted',
        description: `${dealToDelete.title} has been deleted.`,
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete deal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDealToDelete(null);
    }
  };

  const getStageBadgeColor = (stage: string) => {
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
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-muted-foreground mb-4">No deals found</p>
        <Button onClick={onRefresh}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Deal</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Value</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Stage</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assigned To</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Close Date</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Probability</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="border-b hover:bg-muted/50">
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium">{deal.title}</div>
                  {deal.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {deal.description}
                    </div>
                  )}
                </div>
              </td>
              
              <td className="py-3 px-4">
                {deal.customer ? (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {deal.customer.firstName?.[0]}{deal.customer.lastName?.[0]}
                      </AvatarFallback>
                      {deal.customer.avatar && (
                        <AvatarImage src={deal.customer.avatar} />
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {deal.customer.firstName} {deal.customer.lastName}
                      </div>
                      {deal.customer.company && (
                        <div className="text-xs text-muted-foreground">
                          {deal.customer.company.name}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </td>
              
              <td className="py-3 px-4">
                <div className="font-medium">{formatCurrency(deal.value)}</div>
              </td>
              
              <td className="py-3 px-4">
                <Badge className={getStageBadgeColor(deal.stage)}>
                  {deal.stage}
                </Badge>
              </td>
              
              <td className="py-3 px-4">
                {deal.priority ? (
                  <Badge className={getPriorityColor(deal.priority)}>
                    {deal.priority}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </td>
              
              <td className="py-3 px-4">
                {deal.assignedTo ? (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {deal.assignedTo.firstName?.[0]}{deal.assignedTo.lastName?.[0]}
                      </AvatarFallback>
                      {deal.assignedTo.avatar && (
                        <AvatarImage src={deal.assignedTo.avatar} />
                      )}
                    </Avatar>
                    <span className="text-sm">
                      {deal.assignedTo.firstName} {deal.assignedTo.lastName}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Unassigned</span>
                )}
              </td>
              
              <td className="py-3 px-4">
                {deal.expectedCloseDate ? (
                  <div className="text-sm">
                    {formatDate(deal.expectedCloseDate)}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </td>
              
              <td className="py-3 px-4">
                {deal.probability ? (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{deal.probability}%</div>
                    <Progress value={deal.probability} className="h-1.5 w-16" />
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </td>
              
              <td className="py-3 px-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleViewDeal(deal.id)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditDeal(deal.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDealToDelete(deal)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AlertDialog open={!!dealToDelete} onOpenChange={() => setDealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the deal "{dealToDelete?.title}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDeal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}