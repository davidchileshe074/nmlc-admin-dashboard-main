import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { contentId, storageFileId } = await request.json();

        if (!contentId || !storageFileId) {
            return NextResponse.json({ error: 'Missing required IDs' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // 1. Delete document
        await adminClient.databases.deleteDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.content,
            contentId
        );

        // 2. Delete file from storage
        try {
            await adminClient.storage.deleteFile(
                SERVER_CONFIG.bucketId,
                storageFileId
            );
        } catch (err) {
            console.warn('Failed to delete storage file:', err);
            // We continue because the document is already gone
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
