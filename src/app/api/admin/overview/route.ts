import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

export async function GET() {
    try {
        await assertAdmin();
        const adminClient = createAdminClient();

        // Fetch counts from different collections
        const [students, activeSubs, expiredSubs, content, usedCodes] = await Promise.all([
            adminClient.databases.listDocuments(SERVER_CONFIG.databaseId, SERVER_CONFIG.collections.profiles, [Query.limit(1)]),
            adminClient.databases.listDocuments(SERVER_CONFIG.databaseId, SERVER_CONFIG.collections.subscriptions, [Query.equal('status', 'ACTIVE'), Query.limit(1)]),
            adminClient.databases.listDocuments(SERVER_CONFIG.databaseId, SERVER_CONFIG.collections.subscriptions, [Query.equal('status', 'EXPIRED'), Query.limit(1)]),
            adminClient.databases.listDocuments(SERVER_CONFIG.databaseId, SERVER_CONFIG.collections.content, [Query.limit(1)]),
            adminClient.databases.listDocuments(SERVER_CONFIG.databaseId, SERVER_CONFIG.collections.accessCodes, [Query.equal('isUsed', true), Query.limit(1)]),
        ]);

        // Fetch recent activity
        const recentProfiles = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.profiles,
            [Query.orderDesc('$createdAt'), Query.limit(5)]
        );

        const recentContent = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.content,
            [Query.orderDesc('$createdAt'), Query.limit(5)]
        );

        const activity = [
            ...recentProfiles.documents.map(p => ({
                id: p.$id,
                type: 'PROFILE',
                description: `New student registered: ${p.fullName}`,
                timestamp: p.$createdAt,
            })),
            ...recentContent.documents.map(c => ({
                id: c.$id,
                type: 'CONTENT',
                description: `New content added: ${c.title}`,
                timestamp: c.$createdAt,
            })),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({
            totalStudents: students.total,
            activeSubscriptions: activeSubs.total,
            expiredSubscriptions: expiredSubs.total,
            totalContentItems: content.total,
            usedAccessCodes: usedCodes.total,
            recentActivity: activity.slice(0, 10),
            subscriptionStatusBreakdown: [
                { name: 'Active', value: activeSubs.total },
                { name: 'Expired', value: expiredSubs.total },
            ],
            // Simulated trend data for now
            newUsersTrend: [
                { name: 'Mon', users: 10 },
                { name: 'Tue', users: 15 },
                { name: 'Wed', users: 12 },
                { name: 'Thu', users: 20 },
                { name: 'Fri', users: 25 },
                { name: 'Sat', users: 18 },
                { name: 'Sun', users: 22 },
            ]
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
