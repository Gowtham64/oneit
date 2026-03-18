import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';

const SNIPEIT_API_URL = process.env.SNIPEIT_API_URL;
const SNIPEIT_API_KEY = process.env.SNIPEIT_API_KEY;

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (authResult.error) return authResult.response;

    if (!SNIPEIT_API_URL || !SNIPEIT_API_KEY) {
        return NextResponse.json({ total: 0, available: 0, allocated: 0, statusBreakdown: {} });
    }

    try {
        const response = await fetch(`${SNIPEIT_API_URL}/api/v1/hardware?limit=1000`, {
            headers: {
                Authorization: `Bearer ${SNIPEIT_API_KEY}`,
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ total: 0, available: 0, allocated: 0, statusBreakdown: {} });
        }

        const data = await response.json();
        const assets = data.rows || [];

        const total = assets.length;
        const allocated = assets.filter((asset: any) => asset.assigned_to).length;
        const available = total - allocated;

        const statusCounts = assets.reduce((acc: any, asset: any) => {
            const status = asset.status_label?.name || 'Unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        return NextResponse.json({ total, available, allocated, statusBreakdown: statusCounts });
    } catch (error) {
        console.error('Error fetching asset stats:', error);
        return NextResponse.json({ error: 'Failed to fetch asset statistics' }, { status: 500 });
    }
}
