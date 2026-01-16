import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';
import { DateTime } from 'luxon';

// Simple in-memory cache
let cache: {
    data: any;
    timestamp: number;
} | null = null;

const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET() {
    try {
        await assertAdmin();

        // Return cached data if valid
        if (cache && (Date.now() - cache.timestamp < CACHE_DURATION)) {
            console.log('Overview: Returning cached data');
            return NextResponse.json(cache.data);
        }

        const adminClient = createAdminClient();

        // 1. Fetch counts in parallel - Use optimized select for counts
        const [students, activeSubs, expiredSubs, content, usedCodes] = await Promise.all([
            adminClient.databases.listDocuments(SERVER_CONFIG.databaseId, SERVER_CONFIG.collections.profiles, [Query.limit(1), Query.select([])]),
            adminClient.databases.listDocuments(SERVER_CONFIG.databaseId, SERVER_CONFIG.collections.subscriptions, [Query.equal('status', 'ACTIVE'), Query.limit(1), Query.select([])]),
            adminClient.databases.listDocuments(SERVER_CONFIG.databaseId, SERVER_CONFIG.collections.subscriptions, [Query.equal('status', 'EXPIRED'), Query.limit(1), Query.select([])]),
            adminClient.databases.listDocuments(SERVER_CONFIG.databaseId, SERVER_CONFIG.collections.content, [Query.limit(1), Query.select([])]),
            adminClient.databases.listDocuments(SERVER_CONFIG.databaseId, SERVER_CONFIG.collections.accessCodes, [Query.equal('isUsed', true), Query.limit(1), Query.select([])]),
        ]);

        // 2. Fetch recent activity (Recent 5 items from each)
        const [recentProfiles, recentContent] = await Promise.all([
            adminClient.databases.listDocuments(
                SERVER_CONFIG.databaseId,
                SERVER_CONFIG.collections.profiles,
                [Query.orderDesc('$createdAt'), Query.limit(5)]
            ),
            adminClient.databases.listDocuments(
                SERVER_CONFIG.databaseId,
                SERVER_CONFIG.collections.content,
                [Query.orderDesc('$createdAt'), Query.limit(5)]
            )
        ]);

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

        // 3. Calculate REAL trend for the last 7 days
        const sevenDaysAgo = DateTime.now().minus({ days: 6 }).startOf('day');

        // Fetch all profiles created in the last 7 days
        // We limit to 5000 which is plenty for a 7-day trend in this context
        const trendData = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.profiles,
            [
                Query.greaterThanEqual('$createdAt', sevenDaysAgo.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZZ")),
                Query.limit(100), // Reduced limit for better performance
                Query.select(['$createdAt'])
            ]
        );

        // Group by day name
        interface DayEntry {
            name: string;
            fullDate: string | null;
            users: number;
        }

        const days: DayEntry[] = [];
        for (let i = 0; i < 7; i++) {
            const date = sevenDaysAgo.plus({ days: i });
            days.push({
                name: date.toFormat('ccc'), // Mon, Tue, etc.
                fullDate: date.toISODate(),
                users: 0
            });
        }

        trendData.documents.forEach(doc => {
            const createdDate = DateTime.fromISO(doc.$createdAt).toISODate();
            const dayEntry = days.find(d => d.fullDate === createdDate);
            if (dayEntry) {
                dayEntry.users++;
            }
        });

        // Remove fullDate from final response
        const newUsersTrend = days.map(({ name, users }) => ({ name, users }));

        const responseData = {
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
            newUsersTrend
        };

        // Store in cache
        cache = {
            data: responseData,
            timestamp: Date.now()
        };

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error('Overview API error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
