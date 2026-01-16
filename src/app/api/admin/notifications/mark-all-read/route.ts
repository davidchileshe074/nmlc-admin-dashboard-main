import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

export async function POST(request: Request) {
    try {
        await assertAdmin();

        const adminClient = createAdminClient();

        // Mark all notifications as read
        const notifications = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.notifications,
            [Query.equal('read', false)]
        );

        const updates = notifications.documents.map(notification =>
            adminClient.databases.updateDocument(
                SERVER_CONFIG.databaseId,
                SERVER_CONFIG.collections.notifications,
                notification.$id,
                {
                    read: true,
                    readAt: new Date().toISOString()
                }
            )
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true, count: updates.length });
    } catch (error: any) {
        console.error('Mark all as read error:', error);
        const status = error.message?.includes('Unauthorized') || error.message?.includes('JWT') || error.message?.includes('Expired') ? 401 : (error.status || 500);
        return NextResponse.json({ error: error.message }, { status });
    }
}
