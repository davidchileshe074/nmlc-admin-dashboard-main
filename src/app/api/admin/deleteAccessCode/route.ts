import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { codeId } = await request.json();

        if (!codeId) {
            return NextResponse.json({ error: 'Code ID is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // 1. Fetch the code to check usage
        const accessCode = await adminClient.databases.getDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.accessCodes,
            codeId
        );

        // 2. If used, expire the user's subscription immediately
        if (accessCode.usedByUserId) {
            const subs = await adminClient.databases.listDocuments(
                SERVER_CONFIG.databaseId,
                SERVER_CONFIG.collections.subscriptions,
                [Query.equal('userId', accessCode.usedByUserId)]
            );

            if (subs.total > 0) {
                await adminClient.databases.updateDocument(
                    SERVER_CONFIG.databaseId,
                    SERVER_CONFIG.collections.subscriptions,
                    subs.documents[0].$id,
                    {
                        status: 'EXPIRED',
                        endDate: new Date().toISOString(),
                        autoRenew: false
                    }
                );
            }
        }

        // 3. Delete the access code
        await adminClient.databases.deleteDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.accessCodes,
            codeId
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Access code deletion failed:', error);
        const status = error.message?.includes('Unauthorized') || error.message?.includes('JWT') || error.message?.includes('Expired') ? 401 : (error.status || 500);
        return NextResponse.json({ error: error.message || 'Failed to delete access code' }, { status });
    }
}
