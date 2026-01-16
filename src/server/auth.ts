import { cookies } from 'next/headers';
import { createSessionClient, createAdminClient, SERVER_CONFIG } from './appwrite';
import { Query } from 'node-appwrite';

// Simple in-memory cache for auth status
// Stores: session_token -> { user, isAdmin, timestamp }
const authCache = new Map<string, { user: any; isAdmin: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const assertAdmin = async () => {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('appwrite-session');

        if (!sessionCookie || !sessionCookie.value) {
            throw new Error('Unauthorized: No session found');
        }

        const token = sessionCookie.value;

        // Check Cache first
        const cached = authCache.get(token);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            if (!cached.isAdmin) throw new Error('Forbidden: Not an admin');
            return { user: cached.user, isAdmin: true };
        }

        const sessionClient = createSessionClient(token);
        const user = await sessionClient.account.get();

        const adminClient = createAdminClient();
        const admins = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.admins,
            [Query.equal('userId', user.$id)]
        );

        const isAdmin = admins.total > 0;

        // Update Cache
        authCache.set(token, { user, isAdmin, timestamp: Date.now() });

        if (!isAdmin) {
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
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('appwrite-session');
        if (!sessionCookie) return null;

        const token = sessionCookie.value;

        // Check Cache
        const cached = authCache.get(token);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return cached.user;
        }

        const sessionClient = createSessionClient(token);
        const user = await sessionClient.account.get();

        // Minor optimization: store in cache if not there
        if (!authCache.has(token)) {
            // We don't know isAdmin yet from getSessionUser, so we don't set it or set a partial
            // Better to let assertAdmin set the full cache entry
        }

        return user;
    } catch (error: any) {
        console.error('getSessionUser failed:', error.message);
        return null;
    }
}
