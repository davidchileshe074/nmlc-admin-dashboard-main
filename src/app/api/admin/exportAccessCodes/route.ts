import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

export async function GET(request: Request) {
    try {
        await assertAdmin();
        const { searchParams } = new URL(request.url);
        const used = searchParams.get('used');

        const adminClient = createAdminClient();
        const queries = [Query.limit(5000)];

        if (used === 'true') queries.push(Query.equal('isUsed', true));
        if (used === 'false') queries.push(Query.equal('isUsed', false));

        const res = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.accessCodes,
            queries
        );

        // Generate CSV
        let csv = 'Code,Duration (Days),Is Used,Used By (User ID),Used At,Created At\n';
        res.documents.forEach(doc => {
            csv += `${doc.code},${doc.durationDays},${doc.isUsed},${doc.usedByUserId || ''},${doc.usedAt || ''},${doc.$createdAt}\n`;
        });

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="access-codes-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
