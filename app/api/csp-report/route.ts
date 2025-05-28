import { NextRequest, NextResponse } from 'next/server';

interface CSPReport {
  'csp-report': {
    'document-uri': string;
    'blocked-uri': string;
    'violated-directive': string;
    'original-policy': string;
    referrer?: string;
    'script-sample'?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const report: CSPReport = await request.json();

    // Log CSP violations
    console.warn('CSP Violation:', {
      documentUri: report['csp-report']['document-uri'],
      blockedUri: report['csp-report']['blocked-uri'],
      violatedDirective: report['csp-report']['violated-directive'],
      timestamp: new Date().toISOString(),
    });

    // In production, you might want to send this to a monitoring service
    if (process.env.NODE_ENV === 'production' && process.env.CSP_REPORT_ENDPOINT) {
      await fetch(process.env.CSP_REPORT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return NextResponse.json({ error: 'Failed to process CSP report' }, { status: 500 });
  }
}
