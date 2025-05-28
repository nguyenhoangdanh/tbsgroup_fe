import { NextRequest, NextResponse } from 'next/server';

interface LogContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  data?: any;
  stack?: string;
}

interface LogsPayload {
  logs: LogContext[];
}

export async function POST(request: NextRequest) {
  try {
    const body: LogsPayload = await request.json();

    // Validate the payload
    if (!body.logs || !Array.isArray(body.logs)) {
      return NextResponse.json({ error: 'Invalid logs payload' }, { status: 400 });
    }

    // Process logs
    const processedLogs = body.logs.map(log => ({
      ...log,
      processed: true,
      receivedAt: new Date().toISOString(),
      serverTimestamp: Date.now(),
    }));

    // Filter out sensitive information
    const sanitizedLogs = processedLogs.map(log => {
      if (log.data && typeof log.data === 'object') {
        const sanitized = { ...log.data };
        // Remove sensitive fields
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.authorization;
        return { ...log, data: sanitized };
      }
      return log;
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      sanitizedLogs.forEach(log => {
        const logMethod = console[log.level.toLowerCase() as keyof Console] || console.log;
        (logMethod as Function)(`[${log.level}] ${log.message}`, log.data);
      });
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      await sendToLoggingService(sanitizedLogs);
    }

    return NextResponse.json({
      success: true,
      processed: sanitizedLogs.length,
    });
  } catch (error) {
    console.error('Error processing logs:', error);
    return NextResponse.json({ error: 'Failed to process logs' }, { status: 500 });
  }
}

async function sendToLoggingService(logs: any[]): Promise<void> {
  // Implement your logging service integration here
  try {
    // Example: Send to external logging service
    if (process.env.LOGGING_ENDPOINT) {
      await fetch(process.env.LOGGING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LOGGING_API_KEY}`,
        },
        body: JSON.stringify({ logs }),
      });
    }
  } catch (error) {
    console.error('Failed to send logs to logging service:', error);
  }
}
