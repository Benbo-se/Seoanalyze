// Change Detection API - Manage SEO change alerts
import { NextResponse } from 'next/server';

const { 
  getUnresolvedAlerts, 
  resolveAlert, 
  getChangeHistory 
} = require('../../../core/change-detection.repo');

export const runtime = 'nodejs';

// GET - Fetch unresolved alerts or change history
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const history = searchParams.get('history') === 'true';
    const days = Number(searchParams.get('days') || 30);
    
    if (history && url) {
      // Get change history for a specific URL
      const changes = await getChangeHistory(url, days);
      return NextResponse.json({ 
        ok: true, 
        url, 
        days,
        changes: changes.length,
        data: changes 
      });
    } else {
      // Get unresolved alerts
      const alerts = await getUnresolvedAlerts(url);
      
      // Group by severity for better UX
      const grouped = alerts.reduce((acc, alert) => {
        if (!acc[alert.severity]) acc[alert.severity] = [];
        acc[alert.severity].push(alert);
        return acc;
      }, {});

      return NextResponse.json({ 
        ok: true, 
        total: alerts.length,
        grouped,
        alerts 
      });
    }
    
  } catch (error) {
    console.error('Change Detection GET error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch change detection data',
      message: error.message 
    }, { status: 500 });
  }
}

// PATCH - Resolve an alert
export async function PATCH(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.id) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Alert ID required' 
      }, { status: 400 });
    }

    const resolved = await resolveAlert(body.id);
    console.log(`✅ Resolved change alert ${body.id}`);
    
    return NextResponse.json({ 
      ok: true, 
      resolved: true,
      alert: resolved
    });
    
  } catch (error) {
    console.error('Change Detection PATCH error:', error);
    return NextResponse.json({ 
      error: 'Failed to resolve alert',
      message: error.message 
    }, { status: 500 });
  }
}