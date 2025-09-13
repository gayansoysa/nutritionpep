"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, method: string = 'GET') => {
    try {
      const response = await fetch(endpoint, { method });
      const data = await response.json();
      return {
        status: response.status,
        ok: response.ok,
        data: data
      };
    } catch (error: any) {
      return {
        status: 'ERROR',
        ok: false,
        error: error.message
      };
    }
  };

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    // Test all API endpoints
    const endpoints = [
      { name: 'Config', url: '/api/admin/external-apis/config', method: 'GET' },
      { name: 'Stats', url: '/api/admin/external-apis/stats', method: 'GET' },
      { name: 'Analytics', url: '/api/admin/external-apis/analytics', method: 'GET' },
      { name: 'Initialize', url: '/api/admin/external-apis/init', method: 'POST' },
    ];

    for (const endpoint of endpoints) {
      results[endpoint.name] = await testEndpoint(endpoint.url, endpoint.method);
    }

    setDebugInfo(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">External APIs Debug Page</h1>
        <p className="text-muted-foreground">
          This page helps debug API endpoint issues
        </p>
      </div>

      <div className="mb-4">
        <Button onClick={runTests} disabled={loading}>
          {loading ? 'Testing...' : 'Run Tests'}
        </Button>
      </div>

      <div className="grid gap-4">
        {Object.entries(debugInfo).map(([name, result]: [string, any]) => (
          <Card key={name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{name} Endpoint</CardTitle>
                <Badge variant={result.ok ? "default" : "destructive"}>
                  {result.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}