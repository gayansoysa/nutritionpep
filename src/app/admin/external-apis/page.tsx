/**
 * External APIs Management Dashboard
 * 
 * Admin interface for managing external API integrations, viewing usage statistics,
 * and configuring API settings.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Activity, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Database,
  Search,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ApiKeyManager from "../components/ApiKeyManager";
import { DeleteConfirmationDialog, useDeleteConfirmation } from "@/components/ui/delete-confirmation-dialog";

interface APIConfig {
  id: string;
  api_name: string;
  is_enabled: boolean;
  is_default?: boolean;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  rate_limit_per_month?: number;
  last_rate_limit_reset?: string;
  has_credentials: boolean;
}

interface APIStats {
  api_name: string;
  date: string;
  requests_count: number;
  successful_requests: number;
  failed_requests: number;
  success_rate_percent: number;
  average_response_time_ms: number;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  rate_limit_per_month?: number;
}

interface SearchAnalytics {
  date: string;
  api_used: string;
  total_searches: number;
  successful_searches: number;
  failed_searches: number;
  avg_results_per_search: number;
  avg_response_time_ms: number;
  unique_users: number;
  unique_queries: number;
}

const API_COLORS = {
  USDA: '#2563eb',
  FatSecret: '#059669',
  OpenFoodFacts: '#ea580c'
};

export default function ExternalAPIsPage() {
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);
  const [apiStats, setApiStats] = useState<APIStats[]>([]);
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics[]>([]);
  const [defaultAPI, setDefaultAPIState] = useState<string>('USDA');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const deleteConfirmation = useDeleteConfirmation();

  useEffect(() => {
    loadData();
  }, []);

  const initializeConfigs = async () => {
    try {
      const response = await fetch('/api/admin/external-apis/init', {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "API configurations initialized successfully",
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize configs:', error);
    }
    return false;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load API configurations
      const configResponse = await fetch('/api/admin/external-apis/config');
      if (configResponse.ok) {
        const configs = await configResponse.json();
        setApiConfigs(Array.isArray(configs) ? configs : []);
      } else if (configResponse.status === 404) {
        // Try to initialize configurations if they don't exist
        const initialized = await initializeConfigs();
        if (initialized) {
          // Retry loading after initialization
          const retryResponse = await fetch('/api/admin/external-apis/config');
          if (retryResponse.ok) {
            const configs = await retryResponse.json();
            setApiConfigs(Array.isArray(configs) ? configs : []);
          } else {
            setApiConfigs([]);
          }
        } else {
          setApiConfigs([]);
        }
      } else {
        setApiConfigs([]);
      }

      // Load API statistics
      const statsResponse = await fetch('/api/admin/external-apis/stats');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setApiStats(Array.isArray(stats) ? stats : []);
      } else {
        setApiStats([]);
      }

      // Load search analytics
      const analyticsResponse = await fetch('/api/admin/external-apis/analytics');
      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json();
        setSearchAnalytics(Array.isArray(analytics) ? analytics : []);
      } else {
        setSearchAnalytics([]);
      }

      // Load default API
      const defaultResponse = await fetch('/api/admin/external-apis/default');
      if (defaultResponse.ok) {
        const defaultData = await defaultResponse.json();
        setDefaultAPIState(defaultData.default_api || 'USDA');
      }

    } catch (error) {
      console.error('Failed to load API data:', error);
      // Ensure all states are arrays even on error
      setApiConfigs([]);
      setApiStats([]);
      setSearchAnalytics([]);
      
      toast({
        title: "Error",
        description: "Failed to load API data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAPIConfig = async (apiName: string, updates: Partial<APIConfig>) => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/external-apis/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_name: apiName, ...updates })
      });

      if (!response.ok) throw new Error('Failed to update API configuration');

      await loadData();
      toast({
        title: "Success",
        description: `${apiName} configuration updated`
      });

    } catch (error) {
      console.error('Failed to update API config:', error);
      toast({
        title: "Error",
        description: "Failed to update API configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testAPIConnection = async (apiName: string) => {
    try {
      const response = await fetch(`/api/admin/external-apis/test?api=${apiName}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `${apiName} connection test passed`
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || `${apiName} connection test failed`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test API connection",
        variant: "destructive"
      });
    }
  };

  const clearAPICache = async () => {
    try {
      const response = await fetch('/api/admin/external-apis/cache', {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to clear cache');

      toast({
        title: "Success",
        description: "API cache cleared successfully"
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear API cache",
        variant: "destructive"
      });
    }
  };

  const setDefaultAPI = async (apiName: string) => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/external-apis/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_name: apiName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default API');
      }

      setDefaultAPIState(apiName);
      await loadData(); // Reload to get updated configurations
      
      toast({
        title: "Success",
        description: `${apiName} set as default API`
      });

    } catch (error: any) {
      console.error('Failed to set default API:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set default API",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate summary statistics
  const totalRequests = Array.isArray(apiStats) ? apiStats.reduce((sum, stat) => sum + stat.requests_count, 0) : 0;
  const totalSuccessful = Array.isArray(apiStats) ? apiStats.reduce((sum, stat) => sum + stat.successful_requests, 0) : 0;
  const overallSuccessRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0;
  const avgResponseTime = Array.isArray(apiStats) && apiStats.length > 0 
    ? apiStats.reduce((sum, stat) => sum + (stat.average_response_time_ms || 0), 0) / apiStats.length 
    : 0;

  // Prepare chart data
  const dailyUsageData = Array.isArray(searchAnalytics) ? searchAnalytics.reduce((acc, item) => {
    const existing = acc.find(d => d.date === item.date);
    if (existing) {
      existing.total += item.total_searches;
      existing.successful += item.successful_searches;
      existing.failed += item.failed_searches;
    } else {
      acc.push({
        date: item.date,
        total: item.total_searches,
        successful: item.successful_searches,
        failed: item.failed_searches
      });
    }
    return acc;
  }, [] as any[]).slice(-7) : []; // Last 7 days

  const apiUsageData = Array.isArray(apiStats) ? Object.entries(
    apiStats.reduce((acc, stat) => {
      acc[stat.api_name] = (acc[stat.api_name] || 0) + stat.requests_count;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value, color: API_COLORS[name as keyof typeof API_COLORS] })) : [];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">External APIs</h1>
          <p className="text-muted-foreground">
            Manage external nutrition API integrations and monitor usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => deleteConfirmation.confirm(clearAPICache)}>
            <Database className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button onClick={loadData}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallSuccessRate.toFixed(1)}%</div>
            <Progress value={overallSuccessRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">Across all APIs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active APIs</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(apiConfigs) ? apiConfigs.filter(api => api.is_enabled).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {Array.isArray(apiConfigs) ? apiConfigs.length : 0} configured
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="cache">Cache Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily API Usage</CardTitle>
                <CardDescription>Requests over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      name="Total Requests"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="successful" 
                      stroke="#059669" 
                      strokeWidth={2}
                      name="Successful"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="failed" 
                      stroke="#dc2626" 
                      strokeWidth={2}
                      name="Failed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* API Usage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>API Usage Distribution</CardTitle>
                <CardDescription>Requests by API provider</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={apiUsageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    >
                      {apiUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* API Status Table */}
          <Card>
            <CardHeader>
              <CardTitle>API Status Overview</CardTitle>
              <CardDescription>Current status and performance of all APIs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>API</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Avg Response</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(apiConfigs) ? apiConfigs.map((config) => {
                    const stats = Array.isArray(apiStats) ? apiStats.find(s => s.api_name === config.api_name) : undefined;
                    return (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.api_name}</TableCell>
                        <TableCell>
                          {config.is_enabled ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Disabled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{stats?.requests_count?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          {stats?.success_rate_percent ? `${stats.success_rate_percent.toFixed(1)}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {stats?.average_response_time_ms ? `${stats.average_response_time_ms.toFixed(0)}ms` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {config.rate_limit_per_hour ? `${config.rate_limit_per_hour}/hr` : 'Unlimited'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testAPIConnection(config.api_name)}
                            disabled={!config.is_enabled}
                          >
                            Test
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading API configurations...</p>
              </div>
            </div>
          ) : apiConfigs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No API Configurations Found</h3>
                <p className="text-muted-foreground mb-4">
                  It looks like the API configurations haven't been initialized yet.
                </p>
                <Button onClick={async () => {
                  const success = await initializeConfigs();
                  if (success) {
                    loadData();
                  }
                }}>
                  Initialize API Configurations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {/* Default API Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Default API Configuration
                  </CardTitle>
                  <CardDescription>
                    Set the primary API that will be used first for all food searches. 
                    The system will fallback to other enabled APIs if the default fails.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="default-api-select">Default API</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1">
                          <select
                            id="default-api-select"
                            value={defaultAPI}
                            onChange={(e) => setDefaultAPIState(e.target.value)}
                            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                            disabled={saving}
                          >
                            {apiConfigs
                              .filter(config => config.is_enabled)
                              .map(config => (
                                <option key={config.api_name} value={config.api_name}>
                                  {config.api_name}
                                  {config.is_default ? ' (Current Default)' : ''}
                                </option>
                              ))}
                          </select>
                        </div>
                        <Button
                          onClick={() => setDefaultAPI(defaultAPI)}
                          disabled={saving || !defaultAPI}
                          size="sm"
                        >
                          {saving ? 'Setting...' : 'Set Default'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">Current Default: {defaultAPI}</p>
                          <p>
                            This API will be tried first for all food searches. If it fails or returns no results, 
                            the system will automatically try other enabled APIs in order of reliability.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual API Configurations */}
              {apiConfigs.map((config) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{config.api_name}</CardTitle>
                      <CardDescription>
                        Configure {config.api_name} API settings and credentials
                      </CardDescription>
                    </div>
                    <Switch
                      checked={config.is_enabled}
                      onCheckedChange={(enabled) => 
                        updateAPIConfig(config.api_name, { is_enabled: enabled })
                      }
                      disabled={saving}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">API Credentials</p>
                      <p className="text-xs text-muted-foreground">
                        {config.has_credentials ? 
                          "Credentials are configured and encrypted" : 
                          "No credentials configured"
                        }
                      </p>
                    </div>
                    <ApiKeyManager 
                      config={config} 
                      onUpdate={loadData}
                    />
                  </div>

                  {!config.has_credentials && config.api_name !== 'OpenFoodFacts' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This API requires credentials to function. Use the "Add Credentials" button above to configure them.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`${config.api_name}-hour-limit`}>
                        Hourly Rate Limit
                      </Label>
                      <Input
                        id={`${config.api_name}-hour-limit`}
                        type="number"
                        value={config.rate_limit_per_hour || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          updateAPIConfig(config.api_name, { rate_limit_per_hour: value });
                        }}
                        placeholder="No limit"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${config.api_name}-day-limit`}>
                        Daily Rate Limit
                      </Label>
                      <Input
                        id={`${config.api_name}-day-limit`}
                        type="number"
                        value={config.rate_limit_per_day || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          updateAPIConfig(config.api_name, { rate_limit_per_day: value });
                        }}
                        placeholder="No limit"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${config.api_name}-month-limit`}>
                        Monthly Rate Limit
                      </Label>
                      <Input
                        id={`${config.api_name}-month-limit`}
                        type="number"
                        value={config.rate_limit_per_month || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          updateAPIConfig(config.api_name, { rate_limit_per_month: value });
                        }}
                        placeholder="No limit"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => testAPIConnection(config.api_name)}
                      disabled={!config.is_enabled || saving}
                    >
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Detailed Analytics Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>Average response time by API</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Array.isArray(apiStats) ? apiStats : []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="api_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="average_response_time_ms" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Success Rates</CardTitle>
                <CardDescription>Success rate by API provider</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Array.isArray(apiStats) ? apiStats : []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="api_name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="success_rate_percent" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Search Analytics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Search Analytics</CardTitle>
              <CardDescription>Detailed search statistics by API and date</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>API</TableHead>
                    <TableHead>Total Searches</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Avg Results</TableHead>
                    <TableHead>Unique Users</TableHead>
                    <TableHead>Unique Queries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(searchAnalytics) ? searchAnalytics.slice(0, 20).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.api_used}</Badge>
                      </TableCell>
                      <TableCell>{item.total_searches}</TableCell>
                      <TableCell>
                        {((item.successful_searches / item.total_searches) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>{item.avg_results_per_search.toFixed(1)}</TableCell>
                      <TableCell>{item.unique_users}</TableCell>
                      <TableCell>{item.unique_queries}</TableCell>
                    </TableRow>
                  )) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Management</CardTitle>
              <CardDescription>
                Manage API response caching to improve performance and reduce API calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  API responses are cached for 24 hours to improve performance and reduce costs.
                  Clear the cache if you need fresh data from external APIs.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={() => deleteConfirmation.confirm(clearAPICache)} variant="destructive">
                  <Database className="h-4 w-4 mr-2" />
                  Clear All Cache
                </Button>
                <Button variant="outline" onClick={loadData}>
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={deleteConfirmation.setIsOpen}
        onConfirm={deleteConfirmation.handleConfirm}
        isLoading={deleteConfirmation.isLoading}
        title="Clear API Cache"
        description="Are you sure you want to clear all API cache? This will remove all cached responses and may temporarily slow down food searches until the cache is rebuilt."
      />
    </div>
  );
}