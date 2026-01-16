import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { ID } from 'node-appwrite';

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { durationDays, quantity, prefix = 'NLC-' } = await request.json();

        if (!durationDays || !quantity) {
            return NextResponse.json({ error: 'durationDays and quantity are required' }, { status: 400 });
        }

        const adminClient = createAdminClient();
        const codes = [];

        for (let i = 0; i < quantity; i++) {
            const code = prefix + Math.random().toString(36).substring(2, 8).toUpperCase();
            codes.push(adminClient.databases.createDocument(
                SERVER_CONFIG.databaseId,
                SERVER_CONFIG.collections.accessCodes,
                ID.unique(),
                {
                    code,
                    durationDays,
                    isUsed: false,
                    createdAt: new Date().toISOString()
                }
            ));
        }

        await Promise.all(codes);

        return NextResponse.json({ success: true, count: codes.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

export async function GET(request: Request) {
    try {
        await assertAdmin();
        const { searchParams } = new URL(request.url);
        const used = searchParams.get('used');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const adminClient = createAdminClient();
        const { Query } = require('node-appwrite');
        const queries = [Query.orderDesc('$createdAt'), Query.limit(limit), Query.offset(offset)];

        if (used === 'true') queries.push(Query.equal('isUsed', true));
        if (used === 'false') queries.push(Query.equal('isUsed', false));

        const res = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.accessCodes,
            queries
        );

        return NextResponse.json(res);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
