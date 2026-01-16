import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

export async function GET() {
    try {
        await assertAdmin();
        const adminClient = createAdminClient();
        const res = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.admins
        );
        return NextResponse.json(res.documents);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { userId, email } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Check if already exists
        const existing = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.admins,
            [Query.equal('userId', userId)]
        );

        if (existing.total > 0) {
            return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
        }

        const res = await adminClient.databases.createDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.admins,
            'unique()',
            {
                userId,
                email,
                createdAt: new Date().toISOString()
            }
        );

        return NextResponse.json(res);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
