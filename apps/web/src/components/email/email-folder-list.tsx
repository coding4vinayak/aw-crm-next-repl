'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Inbox, 
  Send, 
  Archive, 
  Trash2, 
  Star, 
  File, 
  AlertCircle,
  Clock,
  Tag
} from 'lucide-react';

interface EmailFolderListProps {
  activeFolder: string;
  onFolderChange: (folder: string) => void;
}

interface FolderItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
  variant?: 'default' | 'destructive' | 'outline';
}

export function EmailFolderList({ activeFolder, onFolderChange }: EmailFolderListProps) {
  const folders: FolderItem[] = [
    { id: 'inbox', name: 'Inbox', icon: <Inbox className="h-4 w-4" />, count: 12 },
    { id: 'sent', name: 'Sent', icon: <Send className="h-4 w-4" /> },
    { id: 'drafts', name: 'Drafts', icon: <File className="h-4 w-4" />, count: 3 },
    { id: 'starred', name: 'Starred', icon: <Star className="h-4 w-4" /> },
    { id: 'archive', name: 'Archive', icon: <Archive className="h-4 w-4" /> },
    { id: 'spam', name: 'Spam', icon: <AlertCircle className="h-4 w-4" />, count: 2, variant: 'destructive' },
    { id: 'trash', name: 'Trash', icon: <Trash2 className="h-4 w-4" />, variant: 'destructive' },
  ];

  const labels = [
    { id: 'important', name: 'Important', color: '#ef4444' },
    { id: 'work', name: 'Work', color: '#3b82f6' },
    { id: 'personal', name: 'Personal', color: '#10b981' },
    { id: 'follow-up', name: 'Follow Up', color: '#f59e0b' },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-1">
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant={activeFolder === folder.id ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onFolderChange(folder.id)}
            >
              {folder.icon}
              <span className="ml-2 flex-1 text-left">{folder.name}</span>
              {folder.count && (
                <Badge 
                  variant={folder.variant || 'secondary'} 
                  className="ml-auto"
                >
                  {folder.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="mt-6">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
            LABELS
          </div>
          <div className="space-y-1">
            {labels.map((label) => (
              <Button
                key={label.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onFolderChange(`label:${label.id}`)}
              >
                <Tag className="h-4 w-4" style={{ color: label.color }} />
                <span className="ml-2 flex-1 text-left">{label.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}    { id
: 'archive', name: 'Archive', icon: <Archive className="h-4 w-4" /> },
    { id: 'spam', name: 'Spam', icon: <AlertCircle className="h-4 w-4" />, count: 2, variant: 'destructive' },
    { id: 'trash', name: 'Trash', icon: <Trash2 className="h-4 w-4" /> },
    { id: 'scheduled', name: 'Scheduled', icon: <Clock className="h-4 w-4" />, count: 1 },
  ];

  const customLabels = [
    { id: 'important', name: 'Important', color: '#ef4444' },
    { id: 'follow-up', name: 'Follow Up', color: '#f59e0b' },
    { id: 'customer', name: 'Customer', color: '#10b981' },
    { id: 'prospect', name: 'Prospect', color: '#3b82f6' },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-1">
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant={activeFolder === folder.id ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onFolderChange(folder.id)}
            >
              {folder.icon}
              <span className="ml-2 flex-1 text-left">{folder.name}</span>
              {folder.count && (
                <Badge 
                  variant={folder.variant || 'secondary'} 
                  className="ml-auto"
                >
                  {folder.count}
                </Badge>
              )}
            </Button>
          ))}
          
          <div className="pt-4 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Labels
            </div>
            {customLabels.map((label) => (
              <Button
                key={label.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onFolderChange(`label:${label.id}`)}
              >
                <Tag className="h-4 w-4" style={{ color: label.color }} />
                <span className="ml-2">{label.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}