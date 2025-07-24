'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard,
  Users,
  Handshake,
  BarChart3,
  Mail,
  Settings,
  Building,
  Calendar,
  FileText,
  Target,
  Phone,
  MessageSquare
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Deals',
    href: '/deals',
    icon: Handshake,
  },
  {
    name: 'Email',
    href: '/email',
    icon: Mail,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: Target,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Calls',
    href: '/calls',
    icon: Phone,
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: MessageSquare,
  },
];

const secondaryNavigation = [
  {
    name: 'Company',
    href: '/company',
    icon: Building,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">CRM</span>
          </div>
          <span className="font-semibold text-lg">AWCRM</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
                           (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 h-10',
                    isActive && 'bg-secondary text-secondary-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="mt-8 pt-4 border-t">
          <nav className="space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href || 
                             (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 h-10',
                      isActive && 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>
    </div>
  );
}