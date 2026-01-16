import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { userId } = await request.json();

        const adminClient = createAdminClient();
        const profiles = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.profiles,
            [Query.equal('userId', userId)]
        );

        if (profiles.total === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        await adminClient.databases.updateDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.profiles,
            profiles.documents[0].$id,
            { deviceId: null }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
