import { cookies } from 'next/headers';
import { createSessionClient, createAdminClient, SERVER_CONFIG } from './appwrite';
import { Query } from 'node-appwrite';

export const assertAdmin = async () => {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('appwrite-session');

        if (!sessionCookie || !sessionCookie.value) {
            console.warn('Auth: No appwrite-session cookie found');
            throw new Error('Unauthorized: No session found');
        }

        console.log('Auth: Session cookie found, length:', sessionCookie.value.length);

        const sessionClient = createSessionClient(sessionCookie.value);
        const user = await sessionClient.account.get();
        console.log('Auth: User retrieved successfully:', user.$id);

        // Now check if user is in admins collection using admin client
        const adminClient = createAdminClient();
        const admins = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.admins,
            [Query.equal('userId', user.$id)]
        );

        if (admins.total === 0) {
            console.warn('Auth: User is not an admin:', user.$id);
            throw new Error('Forbidden: Not an admin');
        }

        console.log('Auth: Admin check passed for:', user.$id);
        return { user, isAdmin: true };
    } catch (error: any) {
        console.error('Auth check failed:', error.message);
        throw error;
    }
};

export const getSessionUser = async () => {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('appwrite-session');
        if (!sessionCookie) {
            console.log('getSessionUser: No appwrite-session cookie');
            return null;
        }

        const sessionClient = createSessionClient(sessionCookie.value);
        const user = await sessionClient.account.get();
        console.log('getSessionUser: Found user:', user.$id);
        return user;
    } catch (error: any) {
        console.error('getSessionUser failed:', error.message);
        return null;
    }
}
