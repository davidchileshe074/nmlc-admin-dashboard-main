import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { userId } = await request.json();

        const adminClient = createAdminClient();
        const subscriptions = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.subscriptions,
            [Query.equal('userId', userId)]
        );

        if (subscriptions.total === 0) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        await adminClient.databases.updateDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.subscriptions,
            subscriptions.documents[0].$id,
            {
                status: 'EXPIRED',
                endDate: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
