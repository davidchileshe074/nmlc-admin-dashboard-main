import { cookies } from 'next/headers';
import { createSessionClient, createAdminClient, SERVER_CONFIG } from './appwrite';
import { Query } from 'node-appwrite';

export const assertAdmin = async () => {
    try {
        const sessionCookie = (await cookies()).get('appwrite-session');

        if (!sessionCookie || !sessionCookie.value) {
            throw new Error('Unauthorized: No session found');
        }

        const sessionClient = createSessionClient(sessionCookie.value);
        const user = await sessionClient.account.get();

        // Now check if user is in admins collection using admin client
        const adminClient = createAdminClient();
        const admins = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.admins,
            [Query.equal('userId', user.$id)]
        );

        if (admins.total === 0) {
            throw new Error('Forbidden: Not an admin');
        }

        return { user, isAdmin: true };
    } catch (error: any) {
        console.error('Auth check failed:', error.message);
        throw error;
    }
};

export const getSessionUser = async () => {
    try {
        const sessionCookie = (await cookies()).get('appwrite-session');
        if (!sessionCookie) return null;

        const sessionClient = createSessionClient(sessionCookie.value);
        return await sessionClient.account.get();
    } catch {
        return null;
    }
}
