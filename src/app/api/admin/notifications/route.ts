import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query, ID } from 'node-appwrite';

export async function GET(request: Request) {
    try {
        await assertAdmin();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'all', 'info', 'warning', 'success'
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        const adminClient = createAdminClient();
        const queries = [
            Query.orderDesc('$createdAt'),
            Query.limit(50)
        ];

        if (type && type !== 'all') {
            queries.push(Query.equal('type', type));
        }

        if (unreadOnly) {
            queries.push(Query.equal('read', false));
        }

        const notifications = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.notifications,
            queries
        );

        return NextResponse.json(notifications);
    } catch (error: any) {
        console.error('Fetch notifications error:', error);
        const status = error.message?.includes('Unauthorized') || error.message?.includes('JWT') || error.message?.includes('Expired') ? 401 : (error.status || 500);
        return NextResponse.json({ error: error.message }, { status });
    }
}

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { type, title, message, targetUrl } = await request.json();

        if (!type || !title || !message) {
            return NextResponse.json({ error: 'type, title, and message are required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        const notification = await adminClient.databases.createDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.notifications,
            ID.unique(),
            {
                type,
                title,
                message,
                targetUrl: targetUrl || null,
                read: false,
                createdAt: new Date().toISOString()
            }
        );

        return NextResponse.json(notification);
    } catch (error: any) {
        console.error('Create notification error:', error);
        const status = error.message?.includes('Unauthorized') || error.message?.includes('JWT') || error.message?.includes('Expired') ? 401 : (error.status || 500);
        return NextResponse.json({ error: error.message }, { status });
    }
}

export async function PATCH(request: Request) {
    try {
        await assertAdmin();
        const { notificationId, read } = await request.json();

        if (!notificationId) {
            return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        const updated = await adminClient.databases.updateDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.notifications,
            notificationId,
            {
                read: read !== undefined ? read : true,
                readAt: new Date().toISOString()
            }
        );

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Update notification error:', error);
        const status = error.message?.includes('Unauthorized') || error.message?.includes('JWT') || error.message?.includes('Expired') ? 401 : (error.status || 500);
        return NextResponse.json({ error: error.message }, { status });
    }
}
