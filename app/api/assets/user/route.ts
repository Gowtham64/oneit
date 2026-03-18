import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import { getUserAssets } from '@/services/snipeit';

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (authResult.error) return authResult.response;

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Non-admins may only query their own assets
    const sessionEmail = authResult.session.user?.email;
    const role = authResult.session.user?.role;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (!isAdmin && sessionEmail !== email) {
        return NextResponse.json({ error: 'Forbidden', message: 'You can only view your own assets' }, { status: 403 });
    }

    try {
        const assetData = await getUserAssets(email);
        return NextResponse.json(assetData);
    } catch (error: any) {
        console.error('Error fetching user assets:', error);
        return NextResponse.json({ error: 'Failed to fetch user assets' }, { status: 500 });
    }
}
