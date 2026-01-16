import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

export async function POST(request: Request) {
    try {
        const { user: currentAdmin } = await assertAdmin();
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        if (userId === currentAdmin.$id) {
            return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Check how many admins are left
        const allAdmins = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.admins
        );

        if (allAdmins.total <= 1) {
            return NextResponse.json({ error: 'At least one admin must remain' }, { status: 400 });
        }

        const toRemove = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.admins,
            [Query.equal('userId', userId)]
        );

        if (toRemove.total === 0) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }

        await adminClient.databases.deleteDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.admins,
            toRemove.documents[0].$id
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
