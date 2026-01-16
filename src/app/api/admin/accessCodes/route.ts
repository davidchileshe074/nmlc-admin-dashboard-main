import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { ID, Query } from 'node-appwrite';
import { createNotification, NotificationTemplates } from '@/server/notifications';

export async function POST(request: Request) {
    try {
        await assertAdmin();
        const { durationDays, quantity, prefix = 'NLC-', userId } = await request.json();

        if (!durationDays || !quantity) {
            return NextResponse.json({ error: 'durationDays and quantity are required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Validate: One code per student rule
        if (userId) {
            // 1. Check for pending (unused) codes for this user
            const pendingCodes = await adminClient.databases.listDocuments(
                SERVER_CONFIG.databaseId,
                SERVER_CONFIG.collections.accessCodes,
                [
                    Query.equal('usedByUserId', userId),
                    Query.equal('isUsed', false)
                ]
            );

            if (pendingCodes.total > 0) {
                return NextResponse.json({ error: 'Student already has a pending (unused) access code.' }, { status: 409 });
            }

            // 2. Check for active subscription
            // Note: Assuming 'status' is the field. Verify schema if possible, but matching frontend logic.
            // Adjusting query to handle potential schema names.
            const activeSubs = await adminClient.databases.listDocuments(
                SERVER_CONFIG.databaseId,
                SERVER_CONFIG.collections.subscriptions,
                [
                    Query.equal('userId', userId),
                    Query.equal('status', 'active') // Case sensitive? 'active' or 'ACTIVE'? Frontend used 'ACTIVE'.
                ]
            );

            // Let's check for 'ACTIVE' as well to be safe or use what frontend uses.
            // Frontend: s.subscription?.status === 'ACTIVE'

            if (activeSubs.total === 0) {
                // Try uppercase check just in case backend stores it as ACTIVE
                const activeSubsUpper = await adminClient.databases.listDocuments(
                    SERVER_CONFIG.databaseId,
                    SERVER_CONFIG.collections.subscriptions,
                    [
                        Query.equal('userId', userId),
                        Query.equal('status', 'ACTIVE')
                    ]
                );
                if (activeSubsUpper.total > 0) {
                    return NextResponse.json({ error: 'Student already has an active subscription.' }, { status: 409 });
                }
            } else {
                return NextResponse.json({ error: 'Student already has an active subscription.' }, { status: 409 });
            }
        }

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
                    usedByUserId: userId || null
                }
            ));
        }

        await Promise.all(codes);

        // Create notification for access code generation
        if (userId) {
            try {
                // Fetch student name for notification
                const student = await adminClient.databases.getDocument(
                    SERVER_CONFIG.databaseId,
                    SERVER_CONFIG.collections.profiles,
                    userId
                );

                await createNotification(
                    NotificationTemplates.accessCodeGenerated(student.fullName || 'Student')
                );
            } catch (notifError) {
                console.error('Failed to create notification:', notifError);
                // Don't fail the request if notification fails
            }
        }

        return NextResponse.json({ success: true, count: codes.length });
    } catch (error: any) {
        console.error('Generate Access Code Error:', error);
        const status = error.message?.includes('Unauthorized') || error.message?.includes('JWT') || error.message?.includes('Expired') ? 401 : (error.status || 500);
        return NextResponse.json({ error: error.message }, { status });
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
        const status = error.message?.includes('Unauthorized') || error.message?.includes('JWT') || error.message?.includes('Expired') ? 401 : (error.status || 500);
        return NextResponse.json({ error: error.message }, { status });
    }
}
