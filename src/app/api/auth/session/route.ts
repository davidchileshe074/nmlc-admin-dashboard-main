import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSessionClient, createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

export async function POST(request: Request) {
    try {
        const { session } = await request.json();

        if (!session) {
            return NextResponse.json({ error: 'Session is required' }, { status: 400 });
        }

        // Set cookie
        (await cookies()).set('appwrite-session', session, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 14 * 60, // 14 mins (JWT expires in 15)
        });

        // Optional: Pre-check if this user is an admin
        const sessionClient = createSessionClient(session);
        const user = await sessionClient.account.get();

        const adminClient = createAdminClient();
        const admins = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.admins,
            [Query.equal('userId', user.$id)]
        );

        if (admins.total === 0) {
            // Still set the cookie so they are "logged in", but the layout will redirect them
            // Alternatively, we could clear the cookie and error out here
            // But let's allow them to be "logged in" but "unauthorized"
            return NextResponse.json({ success: true, isAdmin: false });
        }

        return NextResponse.json({ success: true, isAdmin: true });
    } catch (error: any) {
        console.error('Session sync error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
