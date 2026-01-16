import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';
import { DateTime } from 'luxon';

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { userId, days } = await request.json();

        const adminClient = createAdminClient();
        const subscriptions = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.subscriptions,
            [Query.equal('userId', userId)]
        );

        let subscriptionId;
        let newEndDate;

        if (subscriptions.total === 0) {
            // Create new subscription
            newEndDate = DateTime.now().plus({ days }).toISO();
            const res = await adminClient.databases.createDocument(
                SERVER_CONFIG.databaseId,
                SERVER_CONFIG.collections.subscriptions,
                'unique()',
                {
                    userId,
                    status: 'ACTIVE',
                    startDate: DateTime.now().toISO(),
                    endDate: newEndDate,
                    updatedAt: DateTime.now().toISO(),
                }
            );
            subscriptionId = res.$id;
        } else {
            const sub = subscriptions.documents[0];
            subscriptionId = sub.$id;
            const currentEndDate = DateTime.fromISO(sub.endDate);
            const baseDate = currentEndDate > DateTime.now() ? currentEndDate : DateTime.now();
            newEndDate = baseDate.plus({ days }).toISO();

            await adminClient.databases.updateDocument(
                SERVER_CONFIG.databaseId,
                SERVER_CONFIG.collections.subscriptions,
                subscriptionId,
                {
                    status: 'ACTIVE',
                    endDate: newEndDate,
                    updatedAt: DateTime.now().toISO(),
                }
            );
        }

        return NextResponse.json({ success: true, newEndDate });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
