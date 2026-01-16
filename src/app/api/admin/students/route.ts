import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

export async function GET(request: Request) {
    try {
        await assertAdmin();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const year = searchParams.get('year');
        const program = searchParams.get('program');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');

        const adminClient = createAdminClient();
        const queries = [
            Query.limit(limit),
            Query.offset(offset),
            Query.orderDesc('$createdAt'),
        ];

        if (search) queries.push(Query.search('fullName', search));
        if (year) queries.push(Query.equal('yearOfStudy', year));
        if (program) queries.push(Query.equal('program', program));

        const profiles = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.profiles,
            queries
        );

        // Fetch subscription status for each student
        const profileIds = profiles.documents.map(p => p.userId);
        const subscriptions = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.subscriptions,
            [Query.equal('userId', profileIds)]
        );

        const subMap = new Map(subscriptions.documents.map(s => [s.userId, s]));

        const students = profiles.documents.map(p => ({
            ...p,
            subscription: subMap.get(p.userId) || null
        }));

        return NextResponse.json({
            students,
            total: profiles.total
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
