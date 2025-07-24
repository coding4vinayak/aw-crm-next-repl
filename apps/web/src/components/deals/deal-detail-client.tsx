'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useDeal, useDeleteDeal } from '@/hooks/use-deals';
import { DealOverview } from './deal-overview';
import { DealActivities } from './deal-activities';
import { DealNotes } from './deal-notes';
import { DealTasks } from './deal-tasks';
import { EditDealDialog } from './edit-deal-dialog';
import { ArrowLeft, Edit, Trash, DollarSign, Calendar, User, Target, TrendingUp } from 'lucide-react';
import { formatDate, formatCurrency } from '@awcrm/ui';

interface DealDetailClientProps {
  dealId: string;
}

export function DealDetailClient({ dealId }: DealDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { data: deal, isLoading, error, refetch } = useDeal(dealId);
  const deleteDeal = useDeleteDeal();

  const handleBack = () => {
    router.back();
  };

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync(dealId);
      toast({
        title: 'Deal deleted',
        description: 'The deal has been deleted successfully.',
      });
      router.push('/deals');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete deal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleDealUpdated = () => {
    refetch();
    setShowEditDialog(false);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-destructive mb-4">Failed to load deal details</p>
        <div className="flex gap-4">
          <Button onClick={() => refetch()}>Try Again</Button>
          <Button variant="outline" onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {deal.title}
            </h1>
            <Badge className={getStageBadgeColor(deal.stage)}>
              {deal.stage}
            </Badge>
            {deal.priority && (
              <Badge className={getPriorityColor(deal.priority)}>
                {deal.priority} Priority
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Deal details and related information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Deal Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deal Value</p>
                <p className="text-2xl font-bold">{formatCurrency(deal.value)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Probability</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{deal.probability || 0}%</p>
                  <Progress value={deal.probability || 0} className="w-16 h-2" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Close</p>
                <p className="text-lg font-semibold">
                  {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weighted Value</p>
                <p className="text-lg font-semibold">
                  {formatCurrency((deal.value * (deal.probability || 0)) / 100)}
                </p>
              </div>
            </div>
          </div>

          {deal.description && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{deal.description}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
            {deal.customer && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Customer</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {deal.customer.firstName?.[0]}{deal.customer.lastName?.[0]}
                    </AvatarFallback>
                    {deal.customer.avatar && (
                      <AvatarImage src={deal.customer.avatar} />
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {deal.customer.firstName} {deal.customer.lastName}
                    </p>
                    {deal.customer.company && (
                      <p className="text-sm text-muted-foreground">
                        {deal.customer.company.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {deal.assignedTo && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Assigned To</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {deal.assignedTo.firstName?.[0]}{deal.assignedTo.lastName?.[0]}
                    </AvatarFallback>
                    {deal.assignedTo.avatar && (
                      <AvatarImage src={deal.assignedTo.avatar} />
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {deal.assignedTo.firstName} {deal.assignedTo.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {deal.assignedTo.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Created</p>
              <p className="font-medium">{formatDate(deal.createdAt)}</p>
              <p className="text-sm text-muted-foreground">
                Last updated {formatDate(deal.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <DealOverview deal={deal} />
        </TabsContent>
        
        <TabsContent value="activities" className="space-y-4">
          <DealActivities dealId={dealId} />
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-4">
          <DealNotes dealId={dealId} />
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <DealTasks dealId={dealId} />
        </TabsContent>
      </Tabs>

      {/* Edit Deal Dialog */}
      <EditDealDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        deal={deal}
        onDealUpdated={handleDealUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the deal "{deal.title}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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