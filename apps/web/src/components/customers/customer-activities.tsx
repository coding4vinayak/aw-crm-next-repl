'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@awcrm/ui';
import { Plus, Mail, Phone, Calendar, MessageSquare, FileText, User, ExternalLink } from 'lucide-react';

interface CustomerActivitiesProps {
  customerId: string;
}

// Mock activity data - in real app this would come from API
const mockActivities = [
  {
    id: '1',
    type: 'email',
    title: 'Email sent: Follow-up on proposal',
    description: 'Sent follow-up email regarding the enterprise software proposal. Included updated pricing and timeline.',
    createdAt: new Date('2024-01-20T10:30:00'),
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    },
    metadata: {
      subject: 'Re: Enterprise Software Proposal - Updated Pricing',
      recipient: 'john.doe@example.com'
    }
  },
  {
    id: '2',
    type: 'call',
    title: 'Phone call: Discovery call',
    description: 'Had a 45-minute discovery call to understand their current pain points and requirements. Customer is interested in our enterprise package.',
    createdAt: new Date('2024-01-18T14:15:00'),
    createdBy: {
      id: '2',
      firstName: 'Mike',
      lastName: 'Chen',
      avatar: null
    },
    metadata: {
      duration: '45 minutes',
      outcome: 'Positive - Moving to proposal stage'
    }
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Meeting: Product demo',
    description: 'Conducted comprehensive product demonstration for the customer team. Showed key features and answered technical questions.',
    createdAt: new Date('2024-01-15T16:00:00'),
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    },
    metadata: {
      attendees: ['John Doe', 'Jane Smith', 'Bob Wilson'],
      duration: '60 minutes'
    }
  },
  {
    id: '4',
    type: 'note',
    title: 'Note: Customer feedback',
    description: 'Customer provided positive feedback on our solution. They particularly liked the integration capabilities and user interface. Mentioned budget approval expected by end of month.',
    createdAt: new Date('2024-01-12T11:20:00'),
    createdBy: {
      id: '3',
      firstName: 'Lisa',
      lastName: 'Wang',
      avatar: null
    },
    metadata: {
      priority: 'high',
      tags: ['feedback', 'budget', 'positive']
    }
  },
  {
    id: '5',
    type: 'task',
    title: 'Task completed: Send proposal',
    description: 'Completed task to send detailed proposal with pricing and implementation timeline.',
    createdAt: new Date('2024-01-10T09:45:00'),
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    },
    metadata: {
      status: 'completed',
      dueDate: new Date('2024-01-10')
    }
  },
  {
    id: '6',
    type: 'email',
    title: 'Email received: Initial inquiry',
    description: 'Received initial inquiry about enterprise software solutions. Customer is looking for a comprehensive CRM system for their growing team.',
    createdAt: new Date('2024-01-05T13:30:00'),
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    },
    metadata: {
      subject: 'Inquiry about CRM solutions',
      sender: 'john.doe@example.com'
    }
  }
];

export function CustomerActivities({ customerId }: CustomerActivitiesProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'email' | 'call' | 'meeting' | 'note' | 'task'>('all');

  const filteredActivities = mockActivities.filter(activity => {
    if (selectedType === 'all') return true;
    return activity.type === selectedType;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'note':
        return <MessageSquare className="h-4 w-4" />;
      case 'task':
        return <FileText className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'call':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      case 'note':
        return 'bg-yellow-100 text-yellow-800';
      case 'task':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeCount = (type: string) => {
    if (type === 'all') return mockActivities.length;
    return mockActivities.filter(activity => activity.type === type).length;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>All interactions and activities with this customer</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Activity
            </Button>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              All ({getTypeCount('all')})
            </Button>
            <Button
              variant={selectedType === 'email' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('email')}
            >
              <Mail className="mr-1 h-3 w-3" />
              Email ({getTypeCount('email')})
            </Button>
            <Button
              variant={selectedType === 'call' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('call')}
            >
              <Phone className="mr-1 h-3 w-3" />
              Calls ({getTypeCount('call')})
            </Button>
            <Button
              variant={selectedType === 'meeting' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('meeting')}
            >
              <Calendar className="mr-1 h-3 w-3" />
              Meetings ({getTypeCount('meeting')})
            </Button>
            <Button
              variant={selectedType === 'note' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('note')}
            >
              <MessageSquare className="mr-1 h-3 w-3" />
              Notes ({getTypeCount('note')})
            </Button>
            <Button
              variant={selectedType === 'task' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('task')}
            >
              <FileText className="mr-1 h-3 w-3" />
              Tasks ({getTypeCount('task')})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No activities found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="relative">
                  {/* Timeline line */}
                  {index < filteredActivities.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-px bg-border" />
                  )}
                  
                  <div className="flex gap-4">
                    {/* Activity icon */}
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getActivityColor(activity.type)} flex-shrink-0`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    {/* Activity content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{activity.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {activity.description}
                          </p>
                          
                          {/* Metadata */}
                          {activity.metadata && (
                            <div className="text-xs text-muted-foreground space-y-1 mb-2">
                              {activity.type === 'email' && activity.metadata.subject && (
                                <p><span className="font-medium">Subject:</span> {activity.metadata.subject}</p>
                              )}
                              {activity.type === 'call' && activity.metadata.duration && (
                                <p><span className="font-medium">Duration:</span> {activity.metadata.duration}</p>
                              )}
                              {activity.type === 'meeting' && activity.metadata.attendees && (
                                <p><span className="font-medium">Attendees:</span> {activity.metadata.attendees.join(', ')}</p>
                              )}
                              {activity.metadata.tags && (
                                <div className="flex gap-1 mt-1">
                                  {activity.metadata.tags.map((tag: string, tagIndex: number) => (
                                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}\n                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {activity.createdBy.firstName[0]}{activity.createdBy.lastName[0]}
                              </AvatarFallback>
                              {activity.createdBy.avatar && (
                                <AvatarImage src={activity.createdBy.avatar} />
                              )}
                            </Avatar>
                            <span>{activity.createdBy.firstName} {activity.createdBy.lastName}</span>
                            <span>•</span>
                            <span>{formatDate(activity.createdAt)}</span>
                          </div>
                        </div>
                        
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
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