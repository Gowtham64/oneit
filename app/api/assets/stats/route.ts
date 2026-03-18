import { NextResponse } from 'next/server';

const SNIPEIT_API_URL = process.env.SNIPEIT_API_URL;
const SNIPEIT_API_KEY = process.env.SNIPEIT_API_KEY;

const headers = {
    "Authorization": `Bearer ${SNIPEIT_API_KEY}`,
    "Content-Type": "application/json",
    "Accept": "application/json"
};

export async function GET() {
    try {
        // Fetch all hardware assets
        const response = await fetch(`${SNIPEIT_API_URL}/api/v1/hardware?limit=1000`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch assets: ${response.status}`);
        }

        const data = await response.json();
        const assets = data.rows || [];

        // Calculate statistics
        const total = assets.length;
        const allocated = assets.filter((asset: any) => asset.assigned_to).length;
        const available = total - allocated;

        // Group by status
        const statusCounts = assets.reduce((acc: any, asset: any) => {
            const status = asset.status_label?.name || 'Unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        return NextResponse.json({
            total,
            available,
            allocated,
            statusBreakdown: statusCounts,
        });
    } catch (error) {
        console.error('Error fetching asset stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch asset statistics' },
            { status: 500 }
        );
    }
}
