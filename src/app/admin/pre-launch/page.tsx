"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Rocket,
  Shield,
  Zap,
  Users,
  Globe,
  Settings,
  FileText,
  Monitor,
  Database,
  Lock
} from "lucide-react";
import { toast } from "@/lib/utils/toast";
import SecurityAuditChecklist from "@/app/admin/components/SecurityAuditChecklist";
import LoadTestingTools from "@/app/admin/components/LoadTestingTools";
import ProductionReadinessCheck from "@/app/admin/components/ProductionReadinessCheck";
import BetaTestingFramework from "@/app/admin/components/BetaTestingFramework";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'security' | 'performance' | 'content' | 'infrastructure' | 'legal' | 'testing';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_hours: number;
  assigned_to?: string;
  due_date?: string;
  notes?: string;
}

export default function PreLaunchPage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    initializeChecklist();
  }, []);

  const initializeChecklist = () => {
    const defaultChecklist: ChecklistItem[] = [
      // Security Items
      {
        id: "sec-1",
        title: "SSL Certificate Configuration",
        description: "Ensure HTTPS is properly configured with valid SSL certificates",
        category: "security",
        status: "completed",
        priority: "critical",
        estimated_hours: 2
      },
      {
        id: "sec-2",
        title: "Environment Variables Security",
        description: "Verify all sensitive data is stored in environment variables",
        category: "security",
        status: "completed",
        priority: "critical",
        estimated_hours: 1
      },
      {
        id: "sec-3",
        title: "Database Security Audit",
        description: "Review RLS policies, user permissions, and data encryption",
        category: "security",
        status: "in_progress",
        priority: "critical",
        estimated_hours: 4
      },
      {
        id: "sec-4",
        title: "API Security Testing",
        description: "Test all API endpoints for security vulnerabilities",
        category: "security",
        status: "pending",
        priority: "high",
        estimated_hours: 6
      },
      {
        id: "sec-5",
        title: "GDPR Compliance Review",
        description: "Ensure all GDPR requirements are met for data handling",
        category: "security",
        status: "completed",
        priority: "critical",
        estimated_hours: 3
      },

      // Performance Items
      {
        id: "perf-1",
        title: "Load Testing",
        description: "Conduct comprehensive load testing for expected user volumes",
        category: "performance",
        status: "pending",
        priority: "high",
        estimated_hours: 8
      },
      {
        id: "perf-2",
        title: "Database Performance Optimization",
        description: "Optimize database queries and add necessary indexes",
        category: "performance",
        status: "completed",
        priority: "high",
        estimated_hours: 4
      },
      {
        id: "perf-3",
        title: "CDN Configuration",
        description: "Set up CDN for static assets and image optimization",
        category: "performance",
        status: "in_progress",
        priority: "medium",
        estimated_hours: 3
      },
      {
        id: "perf-4",
        title: "Caching Strategy Implementation",
        description: "Implement comprehensive caching for API responses and static content",
        category: "performance",
        status: "completed",
        priority: "high",
        estimated_hours: 5
      },

      // Content Items
      {
        id: "content-1",
        title: "App Icons and Branding",
        description: "Create and implement proper app icons, favicons, and branding assets",
        category: "content",
        status: "pending",
        priority: "medium",
        estimated_hours: 4
      },
      {
        id: "content-2",
        title: "User Documentation",
        description: "Create comprehensive user guides and help documentation",
        category: "content",
        status: "pending",
        priority: "medium",
        estimated_hours: 12
      },
      {
        id: "content-3",
        title: "Privacy Policy and Terms",
        description: "Finalize legal documents and ensure they're accessible",
        category: "legal",
        status: "in_progress",
        priority: "critical",
        estimated_hours: 6
      },
      {
        id: "content-4",
        title: "Error Messages and UX Copy",
        description: "Review and polish all user-facing text and error messages",
        category: "content",
        status: "completed",
        priority: "medium",
        estimated_hours: 3
      },

      // Infrastructure Items
      {
        id: "infra-1",
        title: "Production Environment Setup",
        description: "Configure production Supabase environment and deployment pipeline",
        category: "infrastructure",
        status: "pending",
        priority: "critical",
        estimated_hours: 6
      },
      {
        id: "infra-2",
        title: "Domain and DNS Configuration",
        description: "Set up production domain with proper DNS configuration",
        category: "infrastructure",
        status: "pending",
        priority: "critical",
        estimated_hours: 2
      },
      {
        id: "infra-3",
        title: "Monitoring and Analytics",
        description: "Implement comprehensive monitoring, logging, and analytics",
        category: "infrastructure",
        status: "pending",
        priority: "high",
        estimated_hours: 8
      },
      {
        id: "infra-4",
        title: "Backup and Recovery Strategy",
        description: "Implement automated backups and disaster recovery procedures",
        category: "infrastructure",
        status: "pending",
        priority: "high",
        estimated_hours: 4
      },

      // Testing Items
      {
        id: "test-1",
        title: "Beta User Testing",
        description: "Recruit and manage beta users for comprehensive testing",
        category: "testing",
        status: "pending",
        priority: "high",
        estimated_hours: 20
      },
      {
        id: "test-2",
        title: "Cross-Browser Testing",
        description: "Test application across all major browsers and devices",
        category: "testing",
        status: "in_progress",
        priority: "medium",
        estimated_hours: 6
      },
      {
        id: "test-3",
        title: "Mobile App Testing",
        description: "Comprehensive testing on iOS and Android devices",
        category: "testing",
        status: "pending",
        priority: "high",
        estimated_hours: 8
      },
      {
        id: "test-4",
        title: "Accessibility Testing",
        description: "Ensure application meets WCAG accessibility standards",
        category: "testing",
        status: "pending",
        priority: "medium",
        estimated_hours: 4
      }
    ];

    setChecklist(defaultChecklist);
    setIsLoading(false);
  };

  const updateItemStatus = (itemId: string, newStatus: ChecklistItem['status']) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, status: newStatus } : item
    ));
    toast.success(`Item status updated to ${newStatus}`);
  };

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ChecklistItem['status']) => {
    const variants = {
      pending: "outline",
      in_progress: "default",
      completed: "secondary",
      failed: "destructive"
    } as const;
    
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: ChecklistItem['priority']) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800"
    };
    
    return <Badge className={colors[priority]}>{priority}</Badge>;
  };

  const getCategoryIcon = (category: ChecklistItem['category']) => {
    const icons = {
      security: Shield,
      performance: Zap,
      content: FileText,
      infrastructure: Globe,
      legal: Lock,
      testing: Users
    };
    
    const Icon = icons[category];
    return <Icon className="h-4 w-4" />;
  };

  const getOverallProgress = () => {
    const completed = checklist.filter(item => item.status === 'completed').length;
    return Math.round((completed / checklist.length) * 100);
  };

  const getCategoryStats = () => {
    const categories = ['security', 'performance', 'content', 'infrastructure', 'legal', 'testing'];
    return categories.map(category => {
      const items = checklist.filter(item => item.category === category);
      const completed = items.filter(item => item.status === 'completed').length;
      return {
        category,
        total: items.length,
        completed,
        percentage: items.length > 0 ? Math.round((completed / items.length) * 100) : 0
      };
    });
  };

  const filteredChecklist = selectedCategory === "all" 
    ? checklist 
    : checklist.filter(item => item.category === selectedCategory);

  const overallProgress = getOverallProgress();
  const categoryStats = getCategoryStats();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Rocket className="h-8 w-8" />
          Pre-Launch Checklist
        </h1>
        <p className="text-muted-foreground">
          Comprehensive checklist to ensure production readiness
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Launch Readiness</span>
            <Badge variant={overallProgress >= 90 ? "default" : overallProgress >= 70 ? "secondary" : "outline"}>
              {overallProgress}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {categoryStats.map(stat => (
              <div key={stat.category} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getCategoryIcon(stat.category as ChecklistItem['category'])}
                </div>
                <div className="text-sm font-medium capitalize">{stat.category}</div>
                <div className="text-xs text-muted-foreground">
                  {stat.completed}/{stat.total} ({stat.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="readiness">Readiness Check</TabsTrigger>
          <TabsTrigger value="security">Security Audit</TabsTrigger>
          <TabsTrigger value="performance">Load Testing</TabsTrigger>
          <TabsTrigger value="beta">Beta Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </Button>
            {['security', 'performance', 'content', 'infrastructure', 'legal', 'testing'].map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {getCategoryIcon(category as ChecklistItem['category'])}
                <span className="ml-2">{category}</span>
              </Button>
            ))}
          </div>

          {/* Checklist Items */}
          <div className="space-y-4">
            {filteredChecklist.map(item => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(item.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{item.title}</h3>
                          {getPriorityBadge(item.priority)}
                          <Badge variant="outline" className="capitalize">
                            {getCategoryIcon(item.category)}
                            <span className="ml-1">{item.category}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Est. {item.estimated_hours}h</span>
                          {item.assigned_to && <span>Assigned to: {item.assigned_to}</span>}
                          {item.due_date && <span>Due: {item.due_date}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      <select
                        value={item.status}
                        onChange={(e) => updateItemStatus(item.id, e.target.value as ChecklistItem['status'])}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="readiness">
          <ProductionReadinessCheck />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAuditChecklist />
        </TabsContent>

        <TabsContent value="performance">
          <LoadTestingTools />
        </TabsContent>

        <TabsContent value="beta">
          <BetaTestingFramework />
        </TabsContent>
      </Tabs>
    </div>
  );
}