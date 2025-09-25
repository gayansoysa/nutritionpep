"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  Key, 
  Database, 
  Globe,
  Eye,
  FileText,
  Users,
  Settings
} from "lucide-react";
import { toast } from 'sonner';

interface SecurityCheck {
  id: string;
  category: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'application' | 'compliance';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'passed' | 'failed' | 'not_applicable';
  automated: boolean;
  last_checked?: string;
  notes?: string;
  remediation_steps?: string[];
}

export default function SecurityAuditChecklist() {
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    initializeSecurityChecks();
  }, []);

  const initializeSecurityChecks = () => {
    const checks: SecurityCheck[] = [
      // Authentication
      {
        id: "auth-1",
        category: "authentication",
        title: "Strong Password Policy",
        description: "Verify password requirements meet security standards (8+ chars, mixed case, numbers, symbols)",
        severity: "high",
        status: "passed",
        automated: false,
        remediation_steps: [
          "Implement minimum 8 character requirement",
          "Require uppercase and lowercase letters",
          "Require at least one number and special character",
          "Implement password strength meter"
        ]
      },
      {
        id: "auth-2",
        title: "Multi-Factor Authentication",
        category: "authentication",
        description: "Check if MFA is available and properly implemented",
        severity: "high",
        status: "passed",
        automated: false,
        remediation_steps: [
          "Enable TOTP-based MFA",
          "Implement backup codes",
          "Add SMS fallback option",
          "Test MFA flow thoroughly"
        ]
      },
      {
        id: "auth-3",
        title: "Session Management",
        category: "authentication",
        description: "Verify secure session handling and timeout policies",
        severity: "high",
        status: "passed",
        automated: true,
        remediation_steps: [
          "Implement secure session tokens",
          "Set appropriate session timeouts",
          "Ensure proper session invalidation",
          "Use secure cookie flags"
        ]
      },
      {
        id: "auth-4",
        title: "Account Lockout Protection",
        category: "authentication",
        description: "Check for brute force protection mechanisms",
        severity: "medium",
        status: "pending",
        automated: false,
        remediation_steps: [
          "Implement rate limiting on login attempts",
          "Add temporary account lockout after failed attempts",
          "Implement CAPTCHA after multiple failures",
          "Log and monitor suspicious login activity"
        ]
      },

      // Authorization
      {
        id: "authz-1",
        title: "Role-Based Access Control",
        category: "authorization",
        description: "Verify proper RBAC implementation and role separation",
        severity: "critical",
        status: "passed",
        automated: false,
        remediation_steps: [
          "Define clear user roles and permissions",
          "Implement proper role checking in API endpoints",
          "Test role escalation scenarios",
          "Regular audit of user permissions"
        ]
      },
      {
        id: "authz-2",
        title: "API Authorization",
        category: "authorization",
        description: "Check that all API endpoints require proper authorization",
        severity: "critical",
        status: "pending",
        automated: true,
        remediation_steps: [
          "Audit all API endpoints for auth requirements",
          "Implement JWT token validation",
          "Add proper error handling for unauthorized requests",
          "Test with invalid/expired tokens"
        ]
      },
      {
        id: "authz-3",
        title: "Resource-Level Permissions",
        category: "authorization",
        description: "Verify users can only access their own data",
        severity: "critical",
        status: "passed",
        automated: false,
        remediation_steps: [
          "Implement Row Level Security (RLS) in database",
          "Test cross-user data access scenarios",
          "Verify admin vs user access boundaries",
          "Audit data filtering in queries"
        ]
      },

      // Data Protection
      {
        id: "data-1",
        title: "Data Encryption at Rest",
        category: "data_protection",
        description: "Verify sensitive data is encrypted in the database",
        severity: "critical",
        status: "passed",
        automated: false,
        remediation_steps: [
          "Enable database encryption",
          "Encrypt sensitive fields (PII, health data)",
          "Implement proper key management",
          "Regular encryption key rotation"
        ]
      },
      {
        id: "data-2",
        title: "Data Encryption in Transit",
        category: "data_protection",
        description: "Ensure all data transmission uses HTTPS/TLS",
        severity: "critical",
        status: "passed",
        automated: true,
        remediation_steps: [
          "Enforce HTTPS for all connections",
          "Use TLS 1.2 or higher",
          "Implement HSTS headers",
          "Regular SSL certificate renewal"
        ]
      },
      {
        id: "data-3",
        title: "PII Data Handling",
        category: "data_protection",
        description: "Verify proper handling of personally identifiable information",
        severity: "high",
        status: "passed",
        automated: false,
        remediation_steps: [
          "Identify and classify all PII data",
          "Implement data minimization principles",
          "Add data retention policies",
          "Ensure secure data deletion"
        ]
      },
      {
        id: "data-4",
        title: "Backup Security",
        category: "data_protection",
        description: "Check that backups are encrypted and access-controlled",
        severity: "high",
        status: "pending",
        automated: false,
        remediation_steps: [
          "Encrypt all backup data",
          "Implement backup access controls",
          "Test backup restoration procedures",
          "Regular backup integrity checks"
        ]
      },

      // Network Security
      {
        id: "net-1",
        title: "HTTPS Enforcement",
        category: "network",
        description: "Verify all traffic is forced to use HTTPS",
        severity: "critical",
        status: "passed",
        automated: true,
        remediation_steps: [
          "Redirect all HTTP to HTTPS",
          "Implement HSTS headers",
          "Use secure SSL/TLS configuration",
          "Regular SSL certificate monitoring"
        ]
      },
      {
        id: "net-2",
        title: "CORS Configuration",
        category: "network",
        description: "Check Cross-Origin Resource Sharing settings",
        severity: "medium",
        status: "passed",
        automated: true,
        remediation_steps: [
          "Configure restrictive CORS policies",
          "Whitelist only necessary domains",
          "Avoid wildcard origins in production",
          "Regular CORS policy review"
        ]
      },
      {
        id: "net-3",
        title: "Content Security Policy",
        category: "network",
        description: "Verify CSP headers are properly configured",
        severity: "medium",
        status: "pending",
        automated: true,
        remediation_steps: [
          "Implement comprehensive CSP headers",
          "Restrict script and style sources",
          "Enable CSP reporting",
          "Regular CSP policy updates"
        ]
      },

      // Application Security
      {
        id: "app-1",
        title: "Input Validation",
        category: "application",
        description: "Check for proper input validation and sanitization",
        severity: "high",
        status: "passed",
        automated: false,
        remediation_steps: [
          "Implement server-side input validation",
          "Sanitize all user inputs",
          "Use parameterized queries",
          "Validate file uploads"
        ]
      },
      {
        id: "app-2",
        title: "SQL Injection Protection",
        category: "application",
        description: "Verify protection against SQL injection attacks",
        severity: "critical",
        status: "passed",
        automated: true,
        remediation_steps: [
          "Use ORM/query builder exclusively",
          "Implement parameterized queries",
          "Input validation and sanitization",
          "Regular security scanning"
        ]
      },
      {
        id: "app-3",
        title: "XSS Protection",
        category: "application",
        description: "Check for Cross-Site Scripting vulnerabilities",
        severity: "high",
        status: "passed",
        automated: true,
        remediation_steps: [
          "Implement output encoding",
          "Use Content Security Policy",
          "Sanitize user-generated content",
          "Regular XSS vulnerability scanning"
        ]
      },
      {
        id: "app-4",
        title: "Error Handling",
        category: "application",
        description: "Verify error messages don't leak sensitive information",
        severity: "medium",
        status: "passed",
        automated: false,
        remediation_steps: [
          "Implement generic error messages",
          "Log detailed errors server-side only",
          "Avoid stack traces in production",
          "Regular error message review"
        ]
      },

      // Compliance
      {
        id: "comp-1",
        title: "GDPR Compliance",
        category: "compliance",
        description: "Verify GDPR requirements are met",
        severity: "critical",
        status: "passed",
        automated: false,
        remediation_steps: [
          "Implement data subject rights",
          "Add privacy policy and consent mechanisms",
          "Data portability and deletion features",
          "Regular compliance audits"
        ]
      },
      {
        id: "comp-2",
        title: "Data Retention Policies",
        category: "compliance",
        description: "Check data retention and deletion policies",
        severity: "high",
        status: "pending",
        automated: false,
        remediation_steps: [
          "Define data retention periods",
          "Implement automated data deletion",
          "User-initiated data deletion",
          "Audit data retention compliance"
        ]
      },
      {
        id: "comp-3",
        title: "Privacy Policy",
        category: "compliance",
        description: "Verify privacy policy is comprehensive and accessible",
        severity: "high",
        status: "passed",
        automated: false,
        remediation_steps: [
          "Create comprehensive privacy policy",
          "Make easily accessible to users",
          "Regular policy updates",
          "Legal review of privacy terms"
        ]
      }
    ];

    setSecurityChecks(checks);
  };

  const runAutomatedAudit = async () => {
    setIsRunningAudit(true);
    toast.info("Running automated security audit...");

    // Simulate automated checks
    const automatedChecks = securityChecks.filter(check => check.automated);
    
    for (let i = 0; i < automatedChecks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const checkId = automatedChecks[i].id;
      const randomResult = Math.random() > 0.1 ? 'passed' : 'failed'; // 90% pass rate
      
      setSecurityChecks(prev => prev.map(check => 
        check.id === checkId 
          ? { ...check, status: randomResult, last_checked: new Date().toISOString() }
          : check
      ));
    }

    setIsRunningAudit(false);
    toast.success("Automated security audit completed");
  };

  const updateCheckStatus = (checkId: string, status: SecurityCheck['status'], notes?: string) => {
    setSecurityChecks(prev => prev.map(check => 
      check.id === checkId 
        ? { ...check, status, notes, last_checked: new Date().toISOString() }
        : check
    ));
    toast.success("Security check updated");
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'not_applicable':
        return <Eye className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getSeverityBadge = (severity: SecurityCheck['severity']) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800"
    };
    
    return <Badge className={colors[severity]}>{severity}</Badge>;
  };

  const getCategoryIcon = (category: SecurityCheck['category']) => {
    const icons = {
      authentication: Key,
      authorization: Lock,
      data_protection: Database,
      network: Globe,
      application: Settings,
      compliance: FileText
    };
    
    const Icon = icons[category];
    return <Icon className="h-4 w-4" />;
  };

  const getOverallSecurityScore = () => {
    const totalChecks = securityChecks.length;
    const passedChecks = securityChecks.filter(check => check.status === 'passed').length;
    const criticalFailed = securityChecks.filter(check => 
      check.severity === 'critical' && check.status === 'failed'
    ).length;
    
    if (criticalFailed > 0) return Math.min(50, (passedChecks / totalChecks) * 100);
    return Math.round((passedChecks / totalChecks) * 100);
  };

  const getCategoryStats = () => {
    const categories = ['authentication', 'authorization', 'data_protection', 'network', 'application', 'compliance'];
    return categories.map(category => {
      const items = securityChecks.filter(check => check.category === category);
      const passed = items.filter(check => check.status === 'passed').length;
      const failed = items.filter(check => check.status === 'failed').length;
      const pending = items.filter(check => check.status === 'pending').length;
      
      return {
        category,
        total: items.length,
        passed,
        failed,
        pending,
        score: items.length > 0 ? Math.round((passed / items.length) * 100) : 0
      };
    });
  };

  const filteredChecks = selectedCategory === "all" 
    ? securityChecks 
    : securityChecks.filter(check => check.category === selectedCategory);

  const securityScore = getOverallSecurityScore();
  const categoryStats = getCategoryStats();

  return (
    <div className="space-y-6">
      {/* Security Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit Overview
          </CardTitle>
          <CardDescription>
            Comprehensive security assessment of the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Security Score</span>
              <Badge variant={securityScore >= 90 ? "default" : securityScore >= 70 ? "secondary" : "destructive"}>
                {securityScore}%
              </Badge>
            </div>
            <Progress value={securityScore} className="h-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {categoryStats.map(stat => (
              <div key={stat.category} className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {getCategoryIcon(stat.category as SecurityCheck['category'])}
                </div>
                <div className="text-sm font-medium capitalize mb-1">
                  {stat.category.replace('_', ' ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.passed}/{stat.total} passed
                </div>
                <div className="text-xs">
                  <Badge variant={stat.score >= 90 ? "default" : stat.score >= 70 ? "secondary" : "outline"}>
                    {stat.score}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={runAutomatedAudit} disabled={isRunningAudit}>
              {isRunningAudit ? "Running Audit..." : "Run Automated Audit"}
            </Button>
            <Button variant="outline">
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
        >
          All Categories
        </Button>
        {['authentication', 'authorization', 'data_protection', 'network', 'application', 'compliance'].map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {getCategoryIcon(category as SecurityCheck['category'])}
            <span className="ml-2">{category.replace('_', ' ')}</span>
          </Button>
        ))}
      </div>

      {/* Security Checks */}
      <div className="space-y-4">
        {filteredChecks.map(check => (
          <Card key={check.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{check.title}</h3>
                      {getSeverityBadge(check.severity)}
                      <Badge variant="outline" className="capitalize">
                        {getCategoryIcon(check.category)}
                        <span className="ml-1">{check.category.replace('_', ' ')}</span>
                      </Badge>
                      {check.automated && (
                        <Badge variant="secondary" className="text-xs">
                          Automated
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {check.description}
                    </p>
                    {check.last_checked && (
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date(check.last_checked).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={check.status}
                    onChange={(e) => updateCheckStatus(check.id, e.target.value as SecurityCheck['status'])}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="not_applicable">N/A</option>
                  </select>
                </div>
              </div>

              {check.status === 'failed' && check.remediation_steps && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Remediation Steps:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {check.remediation_steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {check.notes && (
                <div className="mt-4">
                  <label className="text-sm font-medium">Notes:</label>
                  <p className="text-sm text-muted-foreground mt-1">{check.notes}</p>
                </div>
              )}

              <div className="mt-4">
                <Textarea
                  placeholder="Add notes about this security check..."
                  value={check.notes || ""}
                  onChange={(e) => updateCheckStatus(check.id, check.status, e.target.value)}
                  className="text-sm"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}