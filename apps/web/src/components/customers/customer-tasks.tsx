'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate } from '@awcrm/ui';
import { Plus, Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, User, Edit, Trash } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerTasksProps {
  customerId: string;
}

// Mock tasks data - in real app this would come from API
const mockTasks = [
  {
    id: '1',
    title: 'Send follow-up proposal',
    description: 'Send updated proposal with revised pricing and implementation timeline based on customer feedback.',
    status: 'pending',
    priority: 'high',
    dueDate: new Date('2024-01-25'),
    createdAt: new Date('2024-01-20T10:00:00'),
    assignedTo: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    },
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    }
  },
  {
    id: '2',
    title: 'Schedule technical demo',
    description: 'Coordinate with customer\'s IT team to schedule a technical demonstration of the integration capabilities.',
    status: 'in_progress',
    priority: 'medium',
    dueDate: new Date('2024-01-30'),
    createdAt: new Date('2024-01-18T14:30:00'),
    assignedTo: {
      id: '2',
      firstName: 'Mike',
      lastName: 'Chen',
      avatar: null
    },
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    }
  },
  {
    id: '3',
    title: 'Prepare security documentation',
    description: 'Compile security compliance documentation requested by customer\'s security team.',
    status: 'completed',
    priority: 'high',
    dueDate: new Date('2024-01-20'),
    completedAt: new Date('2024-01-19T16:45:00'),
    createdAt: new Date('2024-01-15T09:00:00'),
    assignedTo: {
      id: '3',
      firstName: 'Lisa',
      lastName: 'Wang',
      avatar: null
    },
    createdBy: {
      id: '2',
      firstName: 'Mike',
      lastName: 'Chen',
      avatar: null
    }
  },
  {
    id: '4',
    title: 'Follow up on budget approval',
    description: 'Check with customer on the status of budget approval for Q1 implementation.',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date('2024-02-01'),
    createdAt: new Date('2024-01-22T11:15:00'),
    assignedTo: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    },
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    }
  },
  {
    id: '5',
    title: 'Send contract for review',
    description: 'Send final contract to customer\'s legal team for review and approval.',
    status: 'overdue',
    priority: 'high',
    dueDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10T13:20:00'),
    assignedTo: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    },
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    }
  }
];

export function CustomerTasks({ customerId }: CustomerTasksProps) {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    dueDate: undefined as Date | undefined,
    assignedToId: ''
  });

  // Mock users for assignment
  const mockUsers = [
    { id: '1', firstName: 'Sarah', lastName: 'Johnson' },
    { id: '2', firstName: 'Mike', lastName: 'Chen' },
    { id: '3', firstName: 'Lisa', lastName: 'Wang' }
  ];

  const filteredTasks = mockTasks.filter(task => {
    if (selectedStatus === 'all') return true;
    return task.status === selectedStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getStatusCount = (status: string) => {
    if (status === 'all') return mockTasks.length;
    return mockTasks.filter(task => task.status === status).length;
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    
    // In real app, this would make an API call
    console.log('Adding task:', {
      ...newTask,
      customerId
    });
    
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: undefined,
      assignedToId: ''
    });
    setIsAddingTask(false);
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    // In real app, this would make an API call
    console.log('Toggling task:', taskId, completed);
  };

  const isOverdue = (dueDate: Date, status: string) => {
    return status !== 'completed' && new Date() > dueDate;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Tasks</CardTitle>
              <CardDescription>Tasks and action items related to this customer</CardDescription>
            </div>
            <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>
                    Create a new task related to this customer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input
                      id="task-title"
                      placeholder="Enter task title..."
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      placeholder="Enter task description..."
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="task-priority">Priority</Label>
                      <Select value={newTask.priority} onValueChange={(value: 'high' | 'medium' | 'low') => setNewTask(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="task-assignee">Assign To</Label>
                      <Select value={newTask.assignedToId} onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedToId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTask.dueDate ? format(newTask.dueDate, 'PPP') : 'Select due date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newTask.dueDate}
                          onSelect={(date) => setNewTask(prev => ({ ...prev, dueDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTask} disabled={!newTask.title.trim()}>
                    Add Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
            >
              All Tasks ({getStatusCount('all')})
            </Button>
            <Button
              variant={selectedStatus === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('pending')}
            >
              <Clock className="mr-1 h-3 w-3" />
              Pending ({getStatusCount('pending')})
            </Button>
            <Button
              variant={selectedStatus === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('in_progress')}
            >
              <Clock className="mr-1 h-3 w-3 text-blue-500" />
              In Progress ({getStatusCount('in_progress')})
            </Button>
            <Button
              variant={selectedStatus === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('completed')}
            >
              <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
              Completed ({getStatusCount('completed')})
            </Button>
            <Button
              variant={selectedStatus === 'overdue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('overdue')}
            >
              <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
              Overdue ({getStatusCount('overdue')})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tasks found for the selected filter.</p>
              <Button variant="outline" className="mt-2" onClick={() => setIsAddingTask(true)}>
                Add First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
                          </Badge>
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </Badge>
                        {isOverdue(task.dueDate, task.status) && (
                          <Badge variant="destructive">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-xs">
                                {task.assignedTo.firstName[0]}{task.assignedTo.lastName[0]}
                              </AvatarFallback>
                              {task.assignedTo.avatar && (
                                <AvatarImage src={task.assignedTo.avatar} />
                              )}
                            </Avatar>
                            <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Due {formatDate(task.dueDate)}</span>
                          </div>
                        </div>
                        <div>
                          {task.status === 'completed' && task.completedAt ? (
                            <span>Completed {formatDate(task.completedAt)}</span>
                          ) : (
                            <span>Created {formatDate(task.createdAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
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