"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Mail, 
  MessageSquare, 
  Star, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Send,
  Eye,
  Filter,
  Download,
  BarChart3
} from "lucide-react";
import { toast } from "@/lib/utils/toast";

interface BetaTester {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'power_user' | 'developer' | 'designer';
  status: 'invited' | 'active' | 'inactive' | 'completed';
  joined_date: string;
  last_active: string;
  feedback_count: number;
  bugs_reported: number;
  features_tested: string[];
  device_info: {
    platform: string;
    browser: string;
    version: string;
  };
}

interface Feedback {
  id: string;
  tester_id: string;
  tester_name: string;
  type: 'bug' | 'feature_request' | 'improvement' | 'praise';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  feature_area: string;
  rating?: number;
  status: 'new' | 'reviewing' | 'in_progress' | 'resolved' | 'wont_fix';
  created_at: string;
  updated_at: string;
  screenshots?: string[];
  steps_to_reproduce?: string[];
}

interface TestingCampaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
  target_testers: number;
  enrolled_testers: number;
  focus_areas: string[];
  test_scenarios: string[];
  completion_rate: number;
}

export default function BetaTestingFramework() {
  const [betaTesters, setBetaTesters] = useState<BetaTester[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [campaigns, setCampaigns] = useState<TestingCampaign[]>([]);
  const [selectedTab, setSelectedTab] = useState<'testers' | 'feedback' | 'campaigns'>('testers');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const [inviteData, setInviteData] = useState({
    emails: "",
    role: "user" as BetaTester['role'],
    message: ""
  });

  const [campaignData, setCampaignData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    focus_areas: [] as string[],
    target_testers: 10
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Sample beta testers
    const sampleTesters: BetaTester[] = [
      {
        id: "tester-1",
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "power_user",
        status: "active",
        joined_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        feedback_count: 8,
        bugs_reported: 3,
        features_tested: ["food_logging", "barcode_scanning", "analytics"],
        device_info: {
          platform: "iOS",
          browser: "Safari",
          version: "17.2"
        }
      },
      {
        id: "tester-2",
        name: "Bob Smith",
        email: "bob@example.com",
        role: "user",
        status: "active",
        joined_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        last_active: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        feedback_count: 5,
        bugs_reported: 1,
        features_tested: ["food_logging", "goals"],
        device_info: {
          platform: "Android",
          browser: "Chrome",
          version: "120.0"
        }
      },
      {
        id: "tester-3",
        name: "Carol Davis",
        email: "carol@example.com",
        role: "developer",
        status: "active",
        joined_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_active: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        feedback_count: 12,
        bugs_reported: 7,
        features_tested: ["food_logging", "barcode_scanning", "analytics", "recipes", "admin"],
        device_info: {
          platform: "Desktop",
          browser: "Chrome",
          version: "120.0"
        }
      }
    ];

    // Sample feedback
    const sampleFeedback: Feedback[] = [
      {
        id: "feedback-1",
        tester_id: "tester-1",
        tester_name: "Alice Johnson",
        type: "bug",
        severity: "medium",
        title: "Barcode scanner not working on iPhone",
        description: "When I try to scan a barcode, the camera opens but shows a black screen. This happens consistently on my iPhone 14.",
        feature_area: "barcode_scanning",
        status: "in_progress",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        steps_to_reproduce: [
          "Open the app",
          "Navigate to food logging",
          "Tap the barcode scanner button",
          "Camera opens but shows black screen"
        ]
      },
      {
        id: "feedback-2",
        tester_id: "tester-2",
        tester_name: "Bob Smith",
        type: "feature_request",
        severity: "low",
        title: "Add dark mode support",
        description: "It would be great to have a dark mode option for better usability in low light conditions.",
        feature_area: "ui_ux",
        status: "reviewing",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "feedback-3",
        tester_id: "tester-3",
        tester_name: "Carol Davis",
        type: "improvement",
        severity: "medium",
        title: "Food search could be faster",
        description: "The food search takes a bit long to return results. Maybe implement some caching or optimize the search algorithm.",
        feature_area: "food_search",
        rating: 4,
        status: "resolved",
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Sample campaigns
    const sampleCampaigns: TestingCampaign[] = [
      {
        id: "campaign-1",
        name: "Pre-Launch Testing",
        description: "Comprehensive testing of all core features before public launch",
        start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        target_testers: 20,
        enrolled_testers: 15,
        focus_areas: ["food_logging", "barcode_scanning", "analytics", "recipes"],
        test_scenarios: [
          "Complete user onboarding flow",
          "Log meals for 3 consecutive days",
          "Test barcode scanning with 10 different products",
          "Create and share a recipe",
          "View analytics and export data"
        ],
        completion_rate: 65
      }
    ];

    setBetaTesters(sampleTesters);
    setFeedback(sampleFeedback);
    setCampaigns(sampleCampaigns);
  };

  const inviteBetaTesters = async () => {
    if (!inviteData.emails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    const emails = inviteData.emails.split('\n').filter(email => email.trim());
    
    // Simulate sending invites
    toast.info(`Sending invites to ${emails.length} testers...`);
    
    // Add new testers with invited status
    const newTesters: BetaTester[] = emails.map((email, index) => ({
      id: `tester-${Date.now()}-${index}`,
      name: email.split('@')[0],
      email: email.trim(),
      role: inviteData.role,
      status: "invited",
      joined_date: new Date().toISOString(),
      last_active: new Date().toISOString(),
      feedback_count: 0,
      bugs_reported: 0,
      features_tested: [],
      device_info: {
        platform: "Unknown",
        browser: "Unknown",
        version: "Unknown"
      }
    }));

    setBetaTesters(prev => [...prev, ...newTesters]);
    setInviteData({ emails: "", role: "user", message: "" });
    setShowInviteDialog(false);
    
    toast.success(`Invites sent to ${emails.length} beta testers`);
  };

  const createCampaign = async () => {
    if (!campaignData.name.trim() || !campaignData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newCampaign: TestingCampaign = {
      id: `campaign-${Date.now()}`,
      name: campaignData.name,
      description: campaignData.description,
      start_date: campaignData.start_date || new Date().toISOString(),
      end_date: campaignData.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: "draft",
      target_testers: campaignData.target_testers,
      enrolled_testers: 0,
      focus_areas: campaignData.focus_areas,
      test_scenarios: [],
      completion_rate: 0
    };

    setCampaigns(prev => [newCampaign, ...prev]);
    setCampaignData({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      focus_areas: [],
      target_testers: 10
    });
    setShowCampaignDialog(false);
    
    toast.success("Testing campaign created successfully");
  };

  const updateFeedbackStatus = (feedbackId: string, newStatus: Feedback['status']) => {
    setFeedback(prev => prev.map(item => 
      item.id === feedbackId 
        ? { ...item, status: newStatus, updated_at: new Date().toISOString() }
        : item
    ));
    toast.success("Feedback status updated");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      invited: "outline",
      active: "default",
      inactive: "secondary",
      completed: "secondary",
      new: "destructive",
      reviewing: "default",
      in_progress: "default",
      resolved: "secondary",
      wont_fix: "outline",
      draft: "outline",
      bug: "destructive",
      feature_request: "default",
      improvement: "secondary",
      praise: "default"
    };
    
    return <Badge variant={variants[status] || "outline"}>{status.replace('_', ' ')}</Badge>;
  };

  const getSeverityBadge = (severity: Feedback['severity']) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800"
    };
    
    return <Badge className={colors[severity]}>{severity}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOverallStats = () => {
    const totalTesters = betaTesters.length;
    const activeTesters = betaTesters.filter(t => t.status === 'active').length;
    const totalFeedback = feedback.length;
    const criticalBugs = feedback.filter(f => f.type === 'bug' && f.severity === 'critical').length;
    
    return { totalTesters, activeTesters, totalFeedback, criticalBugs };
  };

  const filteredTesters = betaTesters.filter(tester => 
    filterStatus === "all" || tester.status === filterStatus
  );

  const filteredFeedback = feedback.filter(item => 
    (filterStatus === "all" || item.status === filterStatus) &&
    (filterType === "all" || item.type === filterType)
  );

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Testers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTesters}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTesters} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">
              All feedback items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Bugs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalBugs}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2</div>
            <p className="text-xs text-muted-foreground">
              Overall satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={selectedTab === 'testers' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('testers')}
          className="flex-1"
        >
          <Users className="h-4 w-4 mr-2" />
          Beta Testers
        </Button>
        <Button
          variant={selectedTab === 'feedback' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('feedback')}
          className="flex-1"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
        </Button>
        <Button
          variant={selectedTab === 'campaigns' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('campaigns')}
          className="flex-1"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Campaigns
        </Button>
      </div>

      {/* Beta Testers Tab */}
      {selectedTab === 'testers' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Beta Testers</CardTitle>
                <CardDescription>
                  Manage beta testers and their participation
                </CardDescription>
              </div>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Testers
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Beta Testers</DialogTitle>
                    <DialogDescription>
                      Send invitations to new beta testers
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="emails">Email Addresses (one per line)</Label>
                      <Textarea
                        id="emails"
                        value={inviteData.emails}
                        onChange={(e) => setInviteData({...inviteData, emails: e.target.value})}
                        placeholder="user1@example.com&#10;user2@example.com"
                        rows={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Tester Role</Label>
                      <Select value={inviteData.role} onValueChange={(value: any) => setInviteData({...inviteData, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Regular User</SelectItem>
                          <SelectItem value="power_user">Power User</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="message">Custom Message (optional)</Label>
                      <Textarea
                        id="message"
                        value={inviteData.message}
                        onChange={(e) => setInviteData({...inviteData, message: e.target.value})}
                        placeholder="Add a personal message to the invitation..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={inviteBetaTesters}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invites
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tester</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Bugs</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Platform</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTesters.map((tester) => (
                    <TableRow key={tester.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tester.name}</div>
                          <div className="text-sm text-muted-foreground">{tester.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {tester.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(tester.status)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tester.feedback_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tester.bugs_reported > 0 ? "destructive" : "outline"}>
                          {tester.bugs_reported}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(tester.last_active)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tester.device_info.platform}</div>
                          <div className="text-muted-foreground">
                            {tester.device_info.browser} {tester.device_info.version}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Tab */}
      {selectedTab === 'feedback' && (
        <Card>
          <CardHeader>
            <CardTitle>Beta Feedback</CardTitle>
            <CardDescription>
              Review and manage feedback from beta testers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bugs</SelectItem>
                  <SelectItem value="feature_request">Features</SelectItem>
                  <SelectItem value="improvement">Improvements</SelectItem>
                  <SelectItem value="praise">Praise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredFeedback.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{item.title}</h4>
                          {getStatusBadge(item.type)}
                          {getSeverityBadge(item.severity)}
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>By: {item.tester_name}</span>
                          <span>Area: {item.feature_area}</span>
                          <span>Created: {formatDate(item.created_at)}</span>
                          {item.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{item.rating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Select
                        value={item.status}
                        onValueChange={(value: any) => updateFeedbackStatus(item.id, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="wont_fix">Won't Fix</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {item.steps_to_reproduce && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <h5 className="text-sm font-medium mb-2">Steps to Reproduce:</h5>
                        <ol className="text-sm space-y-1">
                          {item.steps_to_reproduce.map((step, index) => (
                            <li key={index} className="flex gap-2">
                              <span className="text-muted-foreground">{index + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns Tab */}
      {selectedTab === 'campaigns' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Testing Campaigns</CardTitle>
                <CardDescription>
                  Organize and track focused testing campaigns
                </CardDescription>
              </div>
              <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Testing Campaign</DialogTitle>
                    <DialogDescription>
                      Set up a new focused testing campaign
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="campaign-name">Campaign Name</Label>
                      <Input
                        id="campaign-name"
                        value={campaignData.name}
                        onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                        placeholder="e.g., Mobile App Testing"
                      />
                    </div>
                    <div>
                      <Label htmlFor="campaign-description">Description</Label>
                      <Textarea
                        id="campaign-description"
                        value={campaignData.description}
                        onChange={(e) => setCampaignData({...campaignData, description: e.target.value})}
                        placeholder="Describe the campaign goals and scope..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={campaignData.start_date}
                          onChange={(e) => setCampaignData({...campaignData, start_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={campaignData.end_date}
                          onChange={(e) => setCampaignData({...campaignData, end_date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="target-testers">Target Testers</Label>
                      <Input
                        id="target-testers"
                        type="number"
                        value={campaignData.target_testers}
                        onChange={(e) => setCampaignData({...campaignData, target_testers: parseInt(e.target.value)})}
                        min="1"
                        max="100"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createCampaign}>
                        Create Campaign
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{campaign.name}</h4>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {campaign.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Start: {formatDate(campaign.start_date)}</span>
                          <span>End: {formatDate(campaign.end_date)}</span>
                          <span>Testers: {campaign.enrolled_testers}/{campaign.target_testers}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completion Rate</span>
                          <span>{campaign.completion_rate}%</span>
                        </div>
                        <Progress value={campaign.completion_rate} className="h-2" />
                      </div>

                      <div>
                        <h5 className="text-sm font-medium mb-2">Focus Areas:</h5>
                        <div className="flex flex-wrap gap-2">
                          {campaign.focus_areas.map((area, index) => (
                            <Badge key={index} variant="outline">
                              {area.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {campaign.test_scenarios.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">Test Scenarios:</h5>
                          <ul className="text-sm space-y-1">
                            {campaign.test_scenarios.map((scenario, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                {scenario}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}