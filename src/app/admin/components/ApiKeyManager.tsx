"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Key, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Info
} from "lucide-react";

interface APIConfig {
  id: string;
  api_name: string;
  is_enabled: boolean;
  has_credentials: boolean;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  rate_limit_per_month?: number;
}

interface ApiKeyManagerProps {
  config: APIConfig;
  onUpdate: () => void;
}

const API_INFO = {
  USDA: {
    name: "USDA FoodData Central",
    description: "Official US government nutrition database with comprehensive food data",
    signupUrl: "https://fdc.nal.usda.gov/api-guide.html",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true }
    ],
    instructions: "1. Visit the USDA FoodData Central API page\n2. Sign up for a free API key\n3. Copy your API key and paste it below"
  },
  CalorieNinjas: {
    name: "CalorieNinjas",
    description: "Quick nutrition lookup for common foods and ingredients",
    signupUrl: "https://calorieninjas.com/api",
    fields: [
      { key: "api_key", label: "API Key", type: "password", required: true }
    ],
    instructions: "1. Visit CalorieNinjas API page\n2. Sign up for an account\n3. Get your API key from the dashboard\n4. Paste it below"
  },
  FatSecret: {
    name: "FatSecret Platform",
    description: "Comprehensive food and nutrition database with detailed information",
    signupUrl: "https://platform.fatsecret.com/api/",
    fields: [
      { key: "client_id", label: "Client ID", type: "text", required: true },
      { key: "client_secret", label: "Client Secret", type: "password", required: true }
    ],
    instructions: "1. Visit FatSecret Platform API page\n2. Create a developer account\n3. Create a new application\n4. Copy Client ID and Client Secret"
  },
  Edamam: {
    name: "Edamam Food Database",
    description: "Recipe and nutrition analysis with detailed food information",
    signupUrl: "https://developer.edamam.com/food-database-api",
    fields: [
      { key: "app_id", label: "Application ID", type: "text", required: true },
      { key: "app_key", label: "Application Key", type: "password", required: true }
    ],
    instructions: "1. Visit Edamam Developer Portal\n2. Sign up for an account\n3. Create a new Food Database application\n4. Copy Application ID and Key"
  },
  OpenFoodFacts: {
    name: "Open Food Facts",
    description: "Open-source global food database (no API key required)",
    signupUrl: "https://world.openfoodfacts.org/",
    fields: [],
    instructions: "Open Food Facts is free and doesn't require an API key. It's enabled by default."
  }
};

export default function ApiKeyManager({ config, onUpdate }: ApiKeyManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  const apiInfo = API_INFO[config.api_name as keyof typeof API_INFO];

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleShowCredential = (field: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveCredentials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/external-apis/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_name: config.api_name,
          credentials
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save credentials');
      }

      toast({
        title: "Success",
        description: "API credentials saved successfully"
      });

      setIsOpen(false);
      setCredentials({});
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCredentials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/external-apis/credentials?api_name=${config.api_name}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove credentials');
      }

      toast({
        title: "Success",
        description: "API credentials removed successfully"
      });

      setIsOpen(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove API credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/admin/external-apis/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_name: config.api_name
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `${config.api_name} API is working correctly`
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to API",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to test API connection",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (!apiInfo) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="h-4 w-4 mr-2" />
          {config.has_credentials ? "Manage" : "Add"} Credentials
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {apiInfo.name} - API Credentials
          </DialogTitle>
          <DialogDescription>
            {apiInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status:</span>
                <Badge variant={config.is_enabled ? "default" : "secondary"}>
                  {config.is_enabled ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Disabled
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Credentials:</span>
                <Badge variant={config.has_credentials ? "default" : "destructive"}>
                  {config.has_credentials ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Configured
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Missing
                    </>
                  )}
                </Badge>
              </div>
              {config.has_credentials && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveCredentials}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          {!config.has_credentials && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Setup Instructions:</p>
                  <pre className="text-xs whitespace-pre-wrap">{apiInfo.instructions}</pre>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => window.open(apiInfo.signupUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Get API Key
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Credential Fields */}
          {apiInfo.fields.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">API Credentials</CardTitle>
                <CardDescription>
                  Enter your API credentials below. They will be encrypted and stored securely.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiInfo.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id={field.key}
                        type={showCredentials[field.key] ? "text" : field.type}
                        value={credentials[field.key] || ""}
                        onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                      />
                      {field.type === "password" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleShowCredential(field.key)}
                        >
                          {showCredentials[field.key] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {apiInfo.fields.length > 0 && (
              <Button onClick={handleSaveCredentials} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Credentials"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}