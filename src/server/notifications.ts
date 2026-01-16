import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { ID } from 'node-appwrite';

export type NotificationType = 'info' | 'warning' | 'success';

interface CreateNotificationParams {
    type: NotificationType;
    title: string;
    message: string;
    targetUrl?: string;
}

/**
 * Create a notification in the database
 * This can be called from any server-side code (API routes, server actions, etc.)
 */
export async function createNotification(params: CreateNotificationParams) {
    try {
        const adminClient = createAdminClient();

        const notification = await adminClient.databases.createDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.notifications,
            ID.unique(),
            {
                type: params.type,
                title: params.title,
                message: params.message,
                targetUrl: params.targetUrl || null,
                read: false,
                createdAt: new Date().toISOString()
            }
        );

        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        throw error;
    }
}

/**
 * Predefined notification templates for common events
 */
export const NotificationTemplates = {
    newStudentRegistration: (studentName: string, count: number = 1) => ({
        type: 'info' as NotificationType,
        title: 'New Student Registration',
        message: count === 1
            ? `${studentName} has registered`
            : `${count} new students registered today`,
        targetUrl: '/dashboard/students'
    }),

    subscriptionExpiring: (count: number, days: number) => ({
        type: 'warning' as NotificationType,
        title: 'Expiring Subscriptions',
        message: `${count} subscription${count > 1 ? 's' : ''} expiring in ${days} day${days > 1 ? 's' : ''}`,
        targetUrl: '/dashboard/students'
    }),

    subscriptionExpired: (studentName: string) => ({
        type: 'warning' as NotificationType,
        title: 'Subscription Expired',
        message: `${studentName}'s subscription has expired`,
        targetUrl: '/dashboard/students'
    }),

    contentUploaded: (title: string, program: string, year: string) => ({
        type: 'success' as NotificationType,
        title: 'Content Uploaded',
        message: `New content "${title}" added to ${program} ${year}`,
        targetUrl: '/dashboard/content'
    }),

    accessCodeGenerated: (studentName: string) => ({
        type: 'success' as NotificationType,
        title: 'Access Code Generated',
        message: `Access code generated for ${studentName}`,
        targetUrl: '/dashboard/access-codes'
    }),

    accessCodeRedeemed: (studentName: string, code: string) => ({
        type: 'info' as NotificationType,
        title: 'Access Code Redeemed',
        message: `${studentName} redeemed code ${code}`,
        targetUrl: '/dashboard/access-codes'
    }),

    studentApprovalPending: (count: number) => ({
        type: 'warning' as NotificationType,
        title: 'Pending Approvals',
        message: `${count} student${count > 1 ? 's' : ''} waiting for approval`,
        targetUrl: '/dashboard/students'
    }),

    lowStorageSpace: (percentUsed: number) => ({
        type: 'warning' as NotificationType,
        title: 'Low Storage Space',
        message: `Storage is ${percentUsed}% full. Consider upgrading your plan.`,
        targetUrl: '/dashboard/settings'
    })
};
