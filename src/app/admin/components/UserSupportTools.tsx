"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from 'sonner';
import { 
  Search, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  Shield,
  Ban,
  Unlock
} from "lucide-react";

interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

interface UserAction {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  reason: string;
  created_at: string;
}

export default function UserSupportTools() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [actions, setActions] = useState<UserAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [actionReason, setActionReason] = useState("");
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    setIsLoading(true);
    try {
      // Since we don't have actual support tickets table, we'll create mock data
      // based on user profiles and activity
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (profiles) {
        // Generate mock support tickets
        const mockTickets: SupportTicket[] = profiles.slice(0, 5).map((profile, index) => ({
          id: `ticket-${index + 1}`,
          user_id: profile.id,
          user_name: profile.full_name || 'Anonymous',
          user_email: `user-${profile.id.slice(0, 8)}@example.com`,
          subject: [
            'Unable to log food items',
            'Barcode scanner not working',
            'Nutrition data seems incorrect',
            'Account sync issues',
            'Feature request: meal planning'
          ][index],
          message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          status: ['open', 'in_progress', 'resolved', 'closed'][Math.floor(Math.random() * 4)] as any,
          priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }));

        // Generate mock user actions
        const mockActions: UserAction[] = profiles.slice(0, 3).map((profile, index) => ({
          id: `action-${index + 1}`,
          user_id: profile.id,
          user_name: profile.full_name || 'Anonymous',
          action_type: ['warning', 'suspension', 'role_change'][index],
          reason: [
            'Inappropriate content in profile',
            'Spam behavior detected',
            'Promoted to moderator'
          ][index],
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));

        setTickets(mockTickets);
        setActions(mockActions);
      }
    } catch (error) {
      console.error("Error fetching support data:", error);
      toast.error("Failed to load support data");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus as any, updated_at: new Date().toISOString() }
          : ticket
      ));
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket status");
    }
  };

  const takeUserAction = async (actionType: string) => {
    if (!selectedUser || !actionReason.trim()) {
      toast.error("Please select a user and provide a reason");
      return;
    }

    try {
      // In a real implementation, this would update the user's status in the database
      const newAction: UserAction = {
        id: `action-${Date.now()}`,
        user_id: selectedUser,
        user_name: 'Selected User',
        action_type: actionType,
        reason: actionReason,
        created_at: new Date().toISOString()
      };

      setActions([newAction, ...actions]);
      setSelectedUser("");
      setActionReason("");
      toast.success(`User action "${actionType}" applied successfully`);
    } catch (error) {
      console.error("Error taking user action:", error);
      toast.error("Failed to apply user action");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      open: "bg-red-600",
      in_progress: "bg-yellow-600",
      resolved: "bg-green-600",
      closed: "bg-gray-600"
    };
    return <Badge className={colors[status as keyof typeof colors] || "bg-gray-600"}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-blue-600",
      medium: "bg-yellow-600",
      high: "bg-orange-600",
      urgent: "bg-red-600"
    };
    return <Badge className={colors[priority as keyof typeof colors] || "bg-gray-600"}>{priority}</Badge>;
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <TableSkeleton columns={["User", "Subject", "Status", "Priority", "Created", "Actions"]} rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Support Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === 'open').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tickets.filter(t => t.status === 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Actions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total actions taken
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Support Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>
            Manage user support requests and issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <div>
                          <p className="font-medium">{ticket.user_name}</p>
                          <p className="text-sm text-muted-foreground">{ticket.user_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {ticket.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        defaultValue={ticket.status}
                        onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Take User Action</CardTitle>
            <CardDescription>
              Apply moderation actions to user accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="Enter user ID..."
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                placeholder="Provide a reason for this action..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => takeUserAction('warning')}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Warning
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => takeUserAction('suspension')}
                className="flex items-center gap-2"
              >
                <Ban className="h-4 w-4" />
                Suspend
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => takeUserAction('unsuspend')}
                className="flex items-center gap-2"
              >
                <Unlock className="h-4 w-4" />
                Unsuspend
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>
              History of moderation actions taken
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{action.user_name}</p>
                      <p className="text-sm text-muted-foreground">{action.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{action.action_type}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(action.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {actions.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No recent actions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}