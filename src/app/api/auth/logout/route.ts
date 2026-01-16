import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    (await cookies()).delete('appwrite-session');
    return NextResponse.json({ success: true });
}
