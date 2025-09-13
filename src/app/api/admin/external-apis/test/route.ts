/**
 * API Connection Testing Route
 * Tests connectivity and credentials for external APIs
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { decrypt } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get API name from either request body or query parameter
    let api_name: string | null = null;
    
    // First try to get from query parameter
    const url = new URL(request.url);
    api_name = url.searchParams.get('api');
    
    // If not in query params, try to get from request body
    if (!api_name) {
      try {
        const body = await request.json();
        api_name = body.api_name;
      } catch (error) {
        // If JSON parsing fails and no query param, return error
        return NextResponse.json(
          { error: "API name is required either in query parameter 'api' or request body 'api_name'" },
          { status: 400 }
        );
      }
    }

    if (!api_name) {
      return NextResponse.json(
        { error: "API name is required either in query parameter 'api' or request body 'api_name'" },
        { status: 400 }
      );
    }

    // Get API configuration
    const { data: config, error } = await supabase
      .from('api_configurations')
      .select('*')
      .eq('api_name', api_name)
      .single();

    if (error || !config) {
      return NextResponse.json(
        { error: "API configuration not found" },
        { status: 404 }
      );
    }

    // Test the specific API
    const testResult = await testAPIConnection(api_name, config);

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      response_time: testResult.responseTime,
      error: testResult.error || null
    });

  } catch (error: any) {
    console.error("Failed to test API connection:", error);
    return NextResponse.json(
      { error: "Failed to test API connection" },
      { status: 500 }
    );
  }
}

async function testAPIConnection(apiName: string, config: any) {
  const startTime = Date.now();
  
  try {
    switch (apiName) {
      case 'USDA':
        return await testUSDA(config);
      case 'CalorieNinjas':
        return await testCalorieNinjas(config);
      case 'FatSecret':
        return await testFatSecret(config);
      case 'Edamam':
        return await testEdamam(config);
      case 'OpenFoodFacts':
        return await testOpenFoodFacts();
      default:
        return {
          success: false,
          message: `Unknown API: ${apiName}`,
          responseTime: Date.now() - startTime,
          error: `Unknown API: ${apiName}`
        };
    }
  } catch (error: any) {
    return {
      success: false,
      message: "Connection test failed",
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function testUSDA(config: any) {
  const startTime = Date.now();
  
  if (!config.api_key_encrypted) {
    return {
      success: false,
      message: "API key not configured",
      responseTime: Date.now() - startTime,
      error: "API key not configured"
    };
  }

  const apiKey = decrypt(config.api_key_encrypted);
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=apple&pageSize=1`;
  
  const response = await fetch(url);
  const responseTime = Date.now() - startTime;
  
  if (response.ok) {
    return {
      success: true,
      message: "USDA API connection successful",
      responseTime
    };
  } else {
    return {
      success: false,
      message: `USDA API error: ${response.status} ${response.statusText}`,
      responseTime,
      error: `HTTP ${response.status}: ${response.statusText}`
    };
  }
}

async function testCalorieNinjas(config: any) {
  const startTime = Date.now();
  
  if (!config.api_key_encrypted) {
    return {
      success: false,
      message: "API key not configured",
      responseTime: Date.now() - startTime,
      error: "API key not configured"
    };
  }

  const apiKey = decrypt(config.api_key_encrypted);
  const url = `https://api.calorieninjas.com/v1/nutrition?query=apple`;
  
  const response = await fetch(url, {
    headers: {
      'X-Api-Key': apiKey
    }
  });
  
  const responseTime = Date.now() - startTime;
  
  if (response.ok) {
    return {
      success: true,
      message: "CalorieNinjas API connection successful",
      responseTime
    };
  } else {
    return {
      success: false,
      message: `CalorieNinjas API error: ${response.status} ${response.statusText}`,
      responseTime,
      error: `HTTP ${response.status}: ${response.statusText}`
    };
  }
}

async function testFatSecret(config: any) {
  const startTime = Date.now();
  
  if (!config.additional_config?.client_id || !config.additional_config?.client_secret) {
    return {
      success: false,
      message: "Client ID and Secret not configured",
      responseTime: Date.now() - startTime,
      error: "Client ID and Secret not configured"
    };
  }

  // FatSecret requires OAuth, so this is a simplified test
  return {
    success: true,
    message: "FatSecret credentials configured (OAuth test not implemented)",
    responseTime: Date.now() - startTime
  };
}

async function testEdamam(config: any) {
  const startTime = Date.now();
  
  if (!config.additional_config?.app_id || !config.additional_config?.app_key) {
    return {
      success: false,
      message: "App ID and Key not configured",
      responseTime: Date.now() - startTime,
      error: "App ID and Key not configured"
    };
  }

  const appId = decrypt(config.additional_config.app_id);
  const appKey = decrypt(config.additional_config.app_key);
  const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=apple&nutrition_type=cooking`;
  
  const response = await fetch(url);
  const responseTime = Date.now() - startTime;
  
  if (response.ok) {
    return {
      success: true,
      message: "Edamam API connection successful",
      responseTime
    };
  } else {
    return {
      success: false,
      message: `Edamam API error: ${response.status} ${response.statusText}`,
      responseTime,
      error: `HTTP ${response.status}: ${response.statusText}`
    };
  }
}

async function testOpenFoodFacts() {
  const startTime = Date.now();
  const url = `https://world.openfoodfacts.org/api/v0/cgi/search.pl?search_terms=apple&search_simple=1&action=process&json=1&page_size=1`;
  
  const response = await fetch(url);
  const responseTime = Date.now() - startTime;
  
  if (response.ok) {
    return {
      success: true,
      message: "Open Food Facts API connection successful",
      responseTime
    };
  } else {
    return {
      success: false,
      message: `Open Food Facts API error: ${response.status} ${response.statusText}`,
      responseTime,
      error: `HTTP ${response.status}: ${response.statusText}`
    };
  }
}