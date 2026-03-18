import { NextRequest, NextResponse } from 'next/server';
import { getUserAssets } from '@/services/snipeit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const assetData = await getUserAssets(email);
    return NextResponse.json(assetData);
  } catch (error: any) {
    console.error('Error fetching user assets:', error);
    return NextResponse.json({ error: 'Failed to fetch user assets', message: error.message }, { status: 500 });
  }
}
