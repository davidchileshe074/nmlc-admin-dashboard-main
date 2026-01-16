import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { userId, adminApproved } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // In our schema, we should find the document in profiles collection by userId
        // But usually documents are identified by their own $id.
        // If the userId is the same as $id, we can direct update.
        // Let's assume userId is a field and we need to find the document first or use the document ID if provided.
        // For simplicity, let's assume the request sends the $id of the profile document as 'profileId'.
        // If not, we search for it.

        const profiles = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.profiles,
            [require('node-appwrite').Query.equal('userId', userId)]
        );

        if (profiles.total === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const profileId = profiles.documents[0].$id;

        await adminClient.databases.updateDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.profiles,
            profileId,
            { adminApproved }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
