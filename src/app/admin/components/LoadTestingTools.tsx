"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Zap, 
  Play, 
  Square, 
  BarChart3, 
  Clock, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Database,
  Globe,
  Monitor
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { toast } from 'sonner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LoadTestConfig {
  name: string;
  target_url: string;
  concurrent_users: number;
  duration_minutes: number;
  ramp_up_time: number;
  test_scenarios: string[];
}

interface LoadTestResult {
  id: string;
  config: LoadTestConfig;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  start_time: string;
  end_time?: string;
  metrics: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_response_time: number;
    min_response_time: number;
    max_response_time: number;
    requests_per_second: number;
    error_rate: number;
    throughput: number;
  };
  timeline_data: {
    timestamp: string;
    response_time: number;
    requests_per_second: number;
    active_users: number;
    error_rate: number;
  }[];
  errors: {
    type: string;
    count: number;
    percentage: number;
  }[];
}

export default function LoadTestingTools() {
  const [testConfig, setTestConfig] = useState<LoadTestConfig>({
    name: "Production Load Test",
    target_url: "https://nutritionpep.com",
    concurrent_users: 100,
    duration_minutes: 10,
    ramp_up_time: 2,
    test_scenarios: ["login", "food_search", "diary_entry", "analytics_view"]
  });

  const [currentTest, setCurrentTest] = useState<LoadTestResult | null>(null);
  const [testHistory, setTestHistory] = useState<LoadTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Load test history
    loadTestHistory();
  }, []);

  const loadTestHistory = () => {
    // In a real implementation, this would load from a database
    const sampleHistory: LoadTestResult[] = [
      {
        id: "test-1",
        config: {
          name: "Baseline Performance Test",
          target_url: "https://nutritionpep.com",
          concurrent_users: 50,
          duration_minutes: 5,
          ramp_up_time: 1,
          test_scenarios: ["login", "food_search"]
        },
        status: "completed",
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        metrics: {
          total_requests: 2500,
          successful_requests: 2475,
          failed_requests: 25,
          avg_response_time: 245,
          min_response_time: 89,
          max_response_time: 1250,
          requests_per_second: 8.3,
          error_rate: 1.0,
          throughput: 2.1
        },
        timeline_data: generateTimelineData(5),
        errors: [
          { type: "Timeout", count: 15, percentage: 60 },
          { type: "500 Internal Server Error", count: 8, percentage: 32 },
          { type: "Connection Refused", count: 2, percentage: 8 }
        ]
      }
    ];

    setTestHistory(sampleHistory);
  };

  const generateTimelineData = (durationMinutes: number) => {
    const data = [];
    const points = durationMinutes * 6; // Every 10 seconds
    
    for (let i = 0; i < points; i++) {
      const timestamp = new Date(Date.now() - (points - i) * 10000).toISOString();
      data.push({
        timestamp,
        response_time: 200 + Math.random() * 300 + (i > points * 0.7 ? Math.random() * 500 : 0),
        requests_per_second: 5 + Math.random() * 10,
        active_users: Math.min(50, Math.floor((i / points) * 50)),
        error_rate: Math.random() * 5
      });
    }
    
    return data;
  };

  const startLoadTest = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const testId = `test-${Date.now()}`;
    const newTest: LoadTestResult = {
      id: testId,
      config: testConfig,
      status: "running",
      start_time: new Date().toISOString(),
      metrics: {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        avg_response_time: 0,
        min_response_time: 0,
        max_response_time: 0,
        requests_per_second: 0,
        error_rate: 0,
        throughput: 0
      },
      timeline_data: [],
      errors: []
    };

    setCurrentTest(newTest);
    toast.info(`Starting load test: ${testConfig.name}`);

    // Simulate test execution
    const totalDuration = testConfig.duration_minutes * 60 * 1000; // Convert to milliseconds
    const updateInterval = 1000; // Update every second
    const totalUpdates = totalDuration / updateInterval;

    for (let i = 0; i <= totalUpdates; i++) {
      await new Promise(resolve => setTimeout(resolve, updateInterval));
      
      const currentProgress = (i / totalUpdates) * 100;
      setProgress(currentProgress);

      // Update metrics
      const updatedTest: LoadTestResult = {
        ...newTest,
        metrics: {
          total_requests: Math.floor((i / totalUpdates) * testConfig.concurrent_users * testConfig.duration_minutes * 10),
          successful_requests: Math.floor((i / totalUpdates) * testConfig.concurrent_users * testConfig.duration_minutes * 9.5),
          failed_requests: Math.floor((i / totalUpdates) * testConfig.concurrent_users * testConfig.duration_minutes * 0.5),
          avg_response_time: 200 + Math.random() * 200,
          min_response_time: 89,
          max_response_time: 1500 + Math.random() * 500,
          requests_per_second: 5 + Math.random() * 10,
          error_rate: Math.random() * 3,
          throughput: 1.5 + Math.random() * 2
        },
        timeline_data: [
          ...newTest.timeline_data,
          {
            timestamp: new Date().toISOString(),
            response_time: 200 + Math.random() * 300,
            requests_per_second: 5 + Math.random() * 10,
            active_users: Math.min(testConfig.concurrent_users, Math.floor((i / totalUpdates) * testConfig.concurrent_users)),
            error_rate: Math.random() * 5
          }
        ]
      };

      setCurrentTest(updatedTest);

      if (!isRunning) break; // Allow stopping the test
    }

    // Complete the test
    const completedTest: LoadTestResult = {
      ...newTest,
      status: "completed",
      end_time: new Date().toISOString(),
      timeline_data: generateTimelineData(testConfig.duration_minutes),
      errors: [
        { type: "Timeout", count: Math.floor(Math.random() * 20), percentage: 45 },
        { type: "500 Internal Server Error", count: Math.floor(Math.random() * 15), percentage: 35 },
        { type: "Rate Limited", count: Math.floor(Math.random() * 10), percentage: 20 }
      ]
    };

    setCurrentTest(completedTest);
    setTestHistory(prev => [completedTest, ...prev]);
    setIsRunning(false);
    setProgress(100);
    
    toast.success("Load test completed successfully");
  };

  const stopLoadTest = () => {
    setIsRunning(false);
    if (currentTest) {
      setCurrentTest({
        ...currentTest,
        status: "stopped",
        end_time: new Date().toISOString()
      });
    }
    toast.info("Load test stopped");
  };

  const getStatusBadge = (status: LoadTestResult['status']) => {
    const variants = {
      running: "default",
      completed: "secondary",
      failed: "destructive",
      stopped: "outline"
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes}m ${seconds}s`;
  };

  const getPerformanceGrade = (metrics: LoadTestResult['metrics']) => {
    const avgResponseTime = metrics.avg_response_time;
    const errorRate = metrics.error_rate;
    
    if (avgResponseTime < 200 && errorRate < 1) return { grade: 'A', color: 'text-green-600' };
    if (avgResponseTime < 500 && errorRate < 2) return { grade: 'B', color: 'text-blue-600' };
    if (avgResponseTime < 1000 && errorRate < 5) return { grade: 'C', color: 'text-yellow-600' };
    return { grade: 'D', color: 'text-red-600' };
  };

  const responseTimeChartData = currentTest ? {
    labels: currentTest.timeline_data.map((_, i) => `${i * 10}s`),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: currentTest.timeline_data.map(d => d.response_time),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  } : null;

  const throughputChartData = currentTest ? {
    labels: currentTest.timeline_data.map((_, i) => `${i * 10}s`),
    datasets: [
      {
        label: 'Requests/sec',
        data: currentTest.timeline_data.map(d => d.requests_per_second),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Load Test Configuration
          </CardTitle>
          <CardDescription>
            Configure and run performance load tests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-name">Test Name</Label>
              <Input
                id="test-name"
                value={testConfig.name}
                onChange={(e) => setTestConfig({...testConfig, name: e.target.value})}
                placeholder="Enter test name"
              />
            </div>
            <div>
              <Label htmlFor="target-url">Target URL</Label>
              <Input
                id="target-url"
                value={testConfig.target_url}
                onChange={(e) => setTestConfig({...testConfig, target_url: e.target.value})}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="concurrent-users">Concurrent Users</Label>
              <Input
                id="concurrent-users"
                type="number"
                value={testConfig.concurrent_users}
                onChange={(e) => setTestConfig({...testConfig, concurrent_users: parseInt(e.target.value)})}
                min="1"
                max="1000"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={testConfig.duration_minutes}
                onChange={(e) => setTestConfig({...testConfig, duration_minutes: parseInt(e.target.value)})}
                min="1"
                max="60"
              />
            </div>
            <div>
              <Label htmlFor="ramp-up">Ramp-up Time (minutes)</Label>
              <Input
                id="ramp-up"
                type="number"
                value={testConfig.ramp_up_time}
                onChange={(e) => setTestConfig({...testConfig, ramp_up_time: parseInt(e.target.value)})}
                min="0"
                max="10"
              />
            </div>
            <div>
              <Label htmlFor="scenarios">Test Scenarios</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select scenarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Navigation</SelectItem>
                  <SelectItem value="auth">Authentication Flow</SelectItem>
                  <SelectItem value="crud">CRUD Operations</SelectItem>
                  <SelectItem value="search">Search & Filter</SelectItem>
                  <SelectItem value="upload">File Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={startLoadTest} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? "Running..." : "Start Load Test"}
            </Button>
            {isRunning && (
              <Button 
                variant="outline" 
                onClick={stopLoadTest}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Test
              </Button>
            )}
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Test Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Test Results */}
      {currentTest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Current Test Results
              </span>
              {getStatusBadge(currentTest.status)}
            </CardTitle>
            <CardDescription>
              {currentTest.config.name} - {formatDuration(currentTest.start_time, currentTest.end_time)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{currentTest.metrics.total_requests.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{Math.round(currentTest.metrics.avg_response_time)}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{currentTest.metrics.requests_per_second.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Requests/sec</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{currentTest.metrics.error_rate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Error Rate</div>
              </div>
            </div>

            {/* Performance Grade */}
            {currentTest.status === 'completed' && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Performance Grade</span>
                  <div className={`text-3xl font-bold ${getPerformanceGrade(currentTest.metrics).color}`}>
                    {getPerformanceGrade(currentTest.metrics).grade}
                  </div>
                </div>
              </div>
            )}

            {/* Charts */}
            {responseTimeChartData && throughputChartData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Response Time Over Time</h4>
                  <div className="h-64">
                    <Line data={responseTimeChartData} options={chartOptions} />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Throughput Over Time</h4>
                  <div className="h-64">
                    <Line data={throughputChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            )}

            {/* Error Analysis */}
            {currentTest.errors.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Error Analysis</h4>
                <div className="space-y-2">
                  {currentTest.errors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">{error.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{error.count}</span>
                        <Badge variant="outline">{error.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Test History
          </CardTitle>
          <CardDescription>
            Previous load test results and performance trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testHistory.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No load tests have been run yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testHistory.map(test => {
                const grade = getPerformanceGrade(test.metrics);
                return (
                  <div key={test.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{test.config.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(test.start_time).toLocaleString()} - {formatDuration(test.start_time, test.end_time)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${grade.color}`}>
                          {grade.grade}
                        </div>
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{test.metrics.total_requests.toLocaleString()}</div>
                        <div className="text-muted-foreground">Requests</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(test.metrics.avg_response_time)}ms</div>
                        <div className="text-muted-foreground">Avg Response</div>
                      </div>
                      <div>
                        <div className="font-medium">{test.metrics.requests_per_second.toFixed(1)}</div>
                        <div className="text-muted-foreground">RPS</div>
                      </div>
                      <div>
                        <div className="font-medium text-red-600">{test.metrics.error_rate.toFixed(1)}%</div>
                        <div className="text-muted-foreground">Errors</div>
                      </div>
                      <div>
                        <div className="font-medium">{test.config.concurrent_users}</div>
                        <div className="text-muted-foreground">Users</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Database Optimization</h4>
                <p className="text-sm text-muted-foreground">
                  Add indexes for frequently queried columns and optimize slow queries
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Caching Strategy</h4>
                <p className="text-sm text-muted-foreground">
                  Implement Redis caching for API responses and database queries
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium">CDN Implementation</h4>
                <p className="text-sm text-muted-foreground">
                  Use a CDN for static assets to reduce server load and improve response times
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}