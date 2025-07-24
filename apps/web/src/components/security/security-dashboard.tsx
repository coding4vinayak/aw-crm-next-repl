'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Activity,
  Download,
  Trash2,
  Settings,
  RefreshCw
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  ipAddress?: string;
  userAgent?: string;
  resolved: boolean;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  resolvedEvents: number;
  activeThreats: number;
  mfaEnabledUsers: number;
  totalUsers: number;
}

export function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalEvents: 0,
    resolvedEvents: 0,
    activeThreats: 0,
    mfaEnabledUsers: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsRes, auditRes, statsRes] = await Promise.all([
        fetch('/api/security/events'),
        fetch('/api/security/audit-logs'),
        fetch('/api/security/stats'),
      ]);

      if (!eventsRes.ok || !auditRes.ok || !statsRes.ok) {
        throw new Error('Failed to load security data');
      }

      const [eventsData, auditData, statsData] = await Promise.all([
        eventsRes.json(),
        auditRes.json(),
        statsRes.json(),
      ]);

      setSecurityEvents(eventsData.events || []);
      setAuditLogs(auditData.logs || []);
      setStats(statsData.stats || stats);
    } catch (error) {
      console.error('Failed to load security data:', error);
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const resolveSecurityEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/security/events/${eventId}/resolve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to resolve event');
      }

      // Refresh data
      loadSecurityData();
    } catch (error) {
      console.error('Failed to resolve event:', error);
      setError('Failed to resolve security event');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'destructive';
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'default';
      case 'LOW':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className=\"h-4 w-4\" />;
      case 'MEDIUM':
        return <Eye className=\"h-4 w-4\" />;
      case 'LOW':
        return <Activity className=\"h-4 w-4\" />;
      default:
        return <Activity className=\"h-4 w-4\" />;
    }
  };

  if (loading) {
    return (
      <div className=\"flex items-center justify-center p-8\">
        <RefreshCw className=\"h-8 w-8 animate-spin\" />
      </div>
    );
  }

  return (
    <div className=\"space-y-6\">
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-bold tracking-tight\">Security Dashboard</h1>
          <p className=\"text-muted-foreground\">
            Monitor security events, audit logs, and compliance status
          </p>
        </div>
        <Button onClick={loadSecurityData} variant=\"outline\">
          <RefreshCw className=\"h-4 w-4 mr-2\" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant=\"destructive\">
          <AlertTriangle className=\"h-4 w-4\" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Stats */}
      <div className=\"grid gap-4 md:grid-cols-2 lg:grid-cols-4\">
        <Card>
          <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
            <CardTitle className=\"text-sm font-medium\">Total Events</CardTitle>
            <Shield className=\"h-4 w-4 text-muted-foreground\" />
          </CardHeader>
          <CardContent>
            <div className=\"text-2xl font-bold\">{stats.totalEvents}</div>
            <p className=\"text-xs text-muted-foreground\">
              Security events recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
            <CardTitle className=\"text-sm font-medium\">Critical Events</CardTitle>
            <AlertTriangle className=\"h-4 w-4 text-destructive\" />
          </CardHeader>
          <CardContent>
            <div className=\"text-2xl font-bold text-destructive\">{stats.criticalEvents}</div>
            <p className=\"text-xs text-muted-foreground\">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
            <CardTitle className=\"text-sm font-medium\">MFA Adoption</CardTitle>
            <Lock className=\"h-4 w-4 text-muted-foreground\" />
          </CardHeader>
          <CardContent>
            <div className=\"text-2xl font-bold\">
              {stats.totalUsers > 0 ? Math.round((stats.mfaEnabledUsers / stats.totalUsers) * 100) : 0}%
            </div>
            <p className=\"text-xs text-muted-foreground\">
              {stats.mfaEnabledUsers} of {stats.totalUsers} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-2\">
            <CardTitle className=\"text-sm font-medium\">Active Threats</CardTitle>
            <Activity className=\"h-4 w-4 text-destructive\" />
          </CardHeader>
          <CardContent>
            <div className=\"text-2xl font-bold\">{stats.activeThreats}</div>
            <p className=\"text-xs text-muted-foreground\">
              Unresolved security issues
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue=\"events\" className=\"space-y-4\">
        <TabsList>
          <TabsTrigger value=\"events\">Security Events</TabsTrigger>
          <TabsTrigger value=\"audit\">Audit Logs</TabsTrigger>
          <TabsTrigger value=\"compliance\">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value=\"events\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Monitor and respond to security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                {securityEvents.length === 0 ? (
                  <p className=\"text-muted-foreground text-center py-4\">
                    No security events found
                  </p>
                ) : (
                  securityEvents.map((event) => (
                    <div
                      key={event.id}
                      className=\"flex items-center justify-between p-4 border rounded-lg\"
                    >
                      <div className=\"flex items-center space-x-4\">
                        {getSeverityIcon(event.severity)}
                        <div>
                          <div className=\"flex items-center space-x-2\">
                            <span className=\"font-medium\">{event.type}</span>
                            <Badge variant={getSeverityColor(event.severity) as any}>
                              {event.severity}
                            </Badge>
                            {event.resolved && (
                              <Badge variant=\"outline\">Resolved</Badge>
                            )}
                          </div>
                          <p className=\"text-sm text-muted-foreground\">
                            {event.description}
                          </p>
                          <div className=\"text-xs text-muted-foreground mt-1\">
                            {event.ipAddress && `IP: ${event.ipAddress} • `}
                            {new Date(event.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {!event.resolved && (
                        <Button
                          size=\"sm\"
                          variant=\"outline\"
                          onClick={() => resolveSecurityEvent(event.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"audit\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Track all system activities and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                {auditLogs.length === 0 ? (
                  <p className=\"text-muted-foreground text-center py-4\">
                    No audit logs found
                  </p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className=\"flex items-center justify-between p-4 border rounded-lg\"
                    >
                      <div>
                        <div className=\"flex items-center space-x-2\">
                          <Badge variant=\"outline\">{log.action}</Badge>
                          <span className=\"text-sm text-muted-foreground\">
                            {log.entityType}
                          </span>
                        </div>
                        <div className=\"text-sm mt-1\">
                          {log.user && (
                            <span>
                              {log.user.firstName} {log.user.lastName} ({log.user.email})
                            </span>
                          )}
                        </div>
                        <div className=\"text-xs text-muted-foreground mt-1\">
                          {log.ipAddress && `IP: ${log.ipAddress} • `}
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"compliance\" className=\"space-y-4\">
          <div className=\"grid gap-4 md:grid-cols-2\">
            <Card>
              <CardHeader>
                <CardTitle>GDPR Compliance</CardTitle>
                <CardDescription>
                  Data protection and privacy compliance
                </CardDescription>
              </CardHeader>
              <CardContent className=\"space-y-4\">
                <div className=\"flex items-center justify-between\">
                  <span>Data Export Requests</span>
                  <Button size=\"sm\" variant=\"outline\">
                    <Download className=\"h-4 w-4 mr-2\" />
                    Export Data
                  </Button>
                </div>
                <div className=\"flex items-center justify-between\">
                  <span>Data Deletion Requests</span>
                  <Button size=\"sm\" variant=\"outline\">
                    <Trash2 className=\"h-4 w-4 mr-2\" />
                    Delete Data
                  </Button>
                </div>
                <div className=\"flex items-center justify-between\">
                  <span>Consent Management</span>
                  <Button size=\"sm\" variant=\"outline\">
                    <Settings className=\"h-4 w-4 mr-2\" />
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  System security configuration
                </CardDescription>
              </CardHeader>
              <CardContent className=\"space-y-4\">
                <div className=\"flex items-center justify-between\">
                  <span>Multi-Factor Authentication</span>
                  <Badge variant=\"secondary\">
                    {Math.round((stats.mfaEnabledUsers / stats.totalUsers) * 100)}% Enabled
                  </Badge>
                </div>
                <div className=\"flex items-center justify-between\">
                  <span>Password Policy</span>
                  <Badge variant=\"secondary\">Enforced</Badge>
                </div>
                <div className=\"flex items-center justify-between\">
                  <span>Session Management</span>
                  <Badge variant=\"secondary\">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}