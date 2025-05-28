import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface MetricsPayload {
  metrics: PerformanceMetric[];
  sessionId?: string;
  userAgent?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MetricsPayload = await request.json();

    // Validate the payload
    if (!body.metrics || !Array.isArray(body.metrics)) {
      return NextResponse.json({ error: 'Invalid metrics payload' }, { status: 400 });
    }

    // Process metrics (in production, you'd send to monitoring service)
    const processedMetrics = body.metrics.map(metric => ({
      ...metric,
      processed: true,
      receivedAt: Date.now(),
      userAgent: body.userAgent,
      sessionId: body.sessionId,
    }));

    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Metrics]', processedMetrics);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      await sendToMonitoringService(processedMetrics);
    }

    return NextResponse.json({
      success: true,
      processed: processedMetrics.length,
    });
  } catch (error) {
    console.error('Error processing metrics:', error);
    return NextResponse.json({ error: 'Failed to process metrics' }, { status: 500 });
  }
}

async function sendToMonitoringService(metrics: any[]): Promise<void> {
  // Implement your monitoring service integration here
  // Examples: DataDog, New Relic, Custom analytics endpoint
  try {
    // Example implementation
    if (process.env.MONITORING_ENDPOINT) {
      await fetch(process.env.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MONITORING_API_KEY}`,
        },
        body: JSON.stringify({ metrics }),
      });
    }
  } catch (error) {
    console.error('Failed to send metrics to monitoring service:', error);
  }
}
