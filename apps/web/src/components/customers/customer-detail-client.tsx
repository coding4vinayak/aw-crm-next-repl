'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useCustomer, useDeleteCustomer } from '@/hooks/use-customers';
import { CustomerOverview } from './customer-overview';
import { CustomerDeals } from './customer-deals';
import { CustomerActivities } from './customer-activities';
import { CustomerNotes } from './customer-notes';
import { CustomerTasks } from './customer-tasks';
import { EditCustomerDialog } from './edit-customer-dialog';
import { ArrowLeft, Edit, Trash, UserCheck, Mail, Phone, Globe, Building, Calendar } from 'lucide-react';
import { formatDate } from '@awcrm/ui';

interface CustomerDetailClientProps {
  customerId: string;
}

export function CustomerDetailClient({ customerId }: CustomerDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { data: customer, isLoading, error, refetch } = useCustomer(customerId);
  const deleteCustomer = useDeleteCustomer();

  const handleBack = () => {
    router.back();
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer.mutateAsync(customerId);
      toast({
        title: 'Customer deleted',
        description: 'The customer has been deleted successfully.',
      });
      router.push('/customers');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleCustomerUpdated = () => {
    refetch();
    setShowEditDialog(false);
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

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-destructive mb-4">Failed to load customer details</p>
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
              {customer.firstName} {customer.lastName}
            </h1>
            <StatusBadge status={customer.status} />
          </div>
          <p className="text-muted-foreground">
            Customer details and related information
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

      {/* Customer Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {customer.firstName?.[0]}{customer.lastName?.[0]}
                </AvatarFallback>
                {customer.avatar && (
                  <AvatarImage src={customer.avatar} alt={`${customer.firstName} ${customer.lastName}`} />
                )}
              </Avatar>
              <div className="text-center md:text-left">
                <h2 className="text-xl font-semibold">
                  {customer.firstName} {customer.lastName}
                </h2>
                {customer.company && (
                  <p className="text-muted-foreground">{customer.company.name}</p>
                )}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customer.email && (
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground break-all">{customer.email}</p>
                  </div>
                </div>
              )}
              
              {customer.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>
              )}
              
              {customer.website && (
                <div className="flex items-start gap-2">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Website</p>
                    <p className="text-sm text-muted-foreground">
                      <a 
                        href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline text-primary"
                      >
                        {customer.website}
                      </a>
                    </p>
                  </div>
                </div>
              )}
              
              {customer.industry && (
                <div className="flex items-start gap-2">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Industry</p>
                    <p className="text-sm text-muted-foreground">{customer.industry}</p>
                  </div>
                </div>
              )}
              
              {customer.assignedTo && (
                <div className="flex items-start gap-2">
                  <UserCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Assigned To</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.assignedTo.firstName} {customer.assignedTo.lastName}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Customer Since</p>
                  <p className="text-sm text-muted-foreground">{formatDate(customer.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <CustomerOverview customer={customer} />
        </TabsContent>
        
        <TabsContent value="deals" className="space-y-4">
          <CustomerDeals customerId={customerId} />
        </TabsContent>
        
        <TabsContent value="activities" className="space-y-4">
          <CustomerActivities customerId={customerId} />
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-4">
          <CustomerNotes customerId={customerId} />
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <CustomerTasks customerId={customerId} />
        </TabsContent>
      </Tabs>

      {/* Edit Customer Dialog */}
      <EditCustomerDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        customer={customer}
        onCustomerUpdated={handleCustomerUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer "{customer.firstName} {customer.lastName}" and all associated data.
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inactive</Badge>;
    case 'prospect':
      return <Badge variant="outline" className="border-blue-500 text-blue-700">Prospect</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}