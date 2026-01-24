import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { codeId } = await request.json();

        if (!codeId) {
            return NextResponse.json({ error: 'Code ID is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Delete the access code document
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
