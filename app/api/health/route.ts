import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: await checkDatabase(),
        api: true,
        env: checkEnvironmentVariables(),
      },
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 },
    );
  }
}

async function checkDatabase(): Promise<boolean> {
  try {
    // Add your database health check here
    // For example, a simple query to check connection
    return true;
  } catch {
    return false;
  }
}

function checkEnvironmentVariables(): boolean {
  const requiredVars = ['NEXT_PUBLIC_API_BASE_URL'];
  return requiredVars.every(varName => process.env[varName]);
}
