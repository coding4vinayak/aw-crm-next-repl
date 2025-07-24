'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@awcrm/ui';
import { Plus, Edit, Trash, Pin, MessageSquare, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface CustomerNotesProps {
  customerId: string;
}

// Mock notes data - in real app this would come from API
const mockNotes = [
  {
    id: '1',
    content: 'Customer expressed strong interest in our enterprise package during the demo. They particularly liked the advanced reporting features and API integrations. Budget has been approved for Q1 implementation.',
    priority: 'high',
    isPinned: true,
    createdAt: new Date('2024-01-20T15:30:00'),
    updatedAt: new Date('2024-01-20T15:30:00'),
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    },
    tags: ['budget-approved', 'enterprise', 'q1-implementation']
  },
  {
    id: '2',
    content: 'Follow-up needed on the technical requirements document. Customer\'s IT team has some specific security requirements that need to be addressed before moving forward.',
    priority: 'medium',
    isPinned: false,
    createdAt: new Date('2024-01-18T11:15:00'),
    updatedAt: new Date('2024-01-19T09:20:00'),
    createdBy: {
      id: '2',
      firstName: 'Mike',
      lastName: 'Chen',
      avatar: null
    },
    tags: ['technical', 'security', 'follow-up']
  },
  {
    id: '3',
    content: 'Customer mentioned they are also evaluating two other solutions. Our main competitive advantage is the ease of integration and superior customer support. Price is competitive.',
    priority: 'medium',
    isPinned: false,
    createdAt: new Date('2024-01-15T14:45:00'),
    updatedAt: new Date('2024-01-15T14:45:00'),
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    },
    tags: ['competitive-analysis', 'integration', 'support']
  },
  {
    id: '4',
    content: 'Great meeting today! Customer team is very engaged and asking detailed questions about implementation timeline. They want to start pilot program with 50 users.',
    priority: 'low',
    isPinned: false,
    createdAt: new Date('2024-01-12T16:20:00'),
    updatedAt: new Date('2024-01-12T16:20:00'),
    createdBy: {
      id: '3',
      firstName: 'Lisa',
      lastName: 'Wang',
      avatar: null
    },
    tags: ['pilot-program', 'implementation', 'positive']
  },
  {
    id: '5',
    content: 'Initial contact made through website inquiry. Customer is a mid-size company looking to replace their current CRM system. Scheduled discovery call for next week.',
    priority: 'low',
    isPinned: false,
    createdAt: new Date('2024-01-05T10:00:00'),
    updatedAt: new Date('2024-01-05T10:00:00'),
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: null
    },
    tags: ['initial-contact', 'discovery', 'crm-replacement']
  }
];

export function CustomerNotes({ customerId }: CustomerNotesProps) {
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNotePriority, setNewNotePriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const filteredNotes = mockNotes.filter(note => {
    if (showPinnedOnly && !note.isPinned) return false;
    if (selectedPriority !== 'all' && note.priority !== selectedPriority) return false;
    return true;
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    // In real app, this would make an API call
    console.log('Adding note:', {
      content: newNote,
      priority: newNotePriority,
      customerId
    });
    
    setNewNote('');
    setNewNotePriority('medium');
    setIsAddingNote(false);
  };

  const handlePinNote = (noteId: string) => {
    // In real app, this would make an API call
    console.log('Toggling pin for note:', noteId);
  };

  const handleDeleteNote = (noteId: string) => {
    // In real app, this would make an API call
    console.log('Deleting note:', noteId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Notes</CardTitle>
              <CardDescription>Important notes and observations about this customer</CardDescription>
            </div>
            <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Note</DialogTitle>
                  <DialogDescription>
                    Add a note about this customer. Notes help track important information and observations.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="note-content">Note Content</Label>
                    <Textarea
                      id="note-content"
                      placeholder="Enter your note here..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="note-priority">Priority</Label>
                    <Select value={newNotePriority} onValueChange={(value: 'high' | 'medium' | 'low') => setNewNotePriority(value)}>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    Add Note
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedPriority === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPriority('all')}
            >
              All Notes ({mockNotes.length})
            </Button>
            <Button
              variant={selectedPriority === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPriority('high')}
            >
              <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
              High ({mockNotes.filter(n => n.priority === 'high').length})
            </Button>
            <Button
              variant={selectedPriority === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPriority('medium')}
            >
              <Info className="mr-1 h-3 w-3 text-yellow-500" />
              Medium ({mockNotes.filter(n => n.priority === 'medium').length})
            </Button>
            <Button
              variant={selectedPriority === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPriority('low')}
            >
              <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
              Low ({mockNotes.filter(n => n.priority === 'low').length})
            </Button>
            <Button
              variant={showPinnedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            >
              <Pin className="mr-1 h-3 w-3" />
              Pinned Only ({mockNotes.filter(n => n.isPinned).length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notes found for the selected filters.</p>
              <Button variant="outline" className="mt-2" onClick={() => setIsAddingNote(true)}>
                Add First Note
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(note.priority)}
                      <Badge className={getPriorityColor(note.priority)}>
                        {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)} Priority
                      </Badge>
                      {note.isPinned && (
                        <Badge variant="outline" className="border-blue-500 text-blue-700">
                          <Pin className="mr-1 h-3 w-3" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePinNote(note.id)}
                      >
                        <Pin className={`h-4 w-4 ${note.isPinned ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3 leading-relaxed">{note.content}</p>
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {note.createdBy.firstName[0]}{note.createdBy.lastName[0]}
                        </AvatarFallback>
                        {note.createdBy.avatar && (
                          <AvatarImage src={note.createdBy.avatar} />
                        )}
                      </Avatar>
                      <span>{note.createdBy.firstName} {note.createdBy.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Created {formatDate(note.createdAt)}</span>
                      {note.updatedAt.getTime() !== note.createdAt.getTime() && (
                        <>
                          <span>•</span>
                          <span>Updated {formatDate(note.updatedAt)}</span>
                        </>
                      )}
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