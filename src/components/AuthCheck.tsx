"use client";

import { useEffect } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter, usePathname } from 'next/navigation';

export function AuthCheck() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only run on dashboard routes
        if (!pathname.startsWith('/dashboard')) return;

        const syncSession = async () => {
            try {
                // Check if we have a valid client-side session
                const session = await account.getSession('current');

                // If we have a session, let's try to ping our "me" endpoint
                // to see if the server-side cookie is still valid
                const res = await fetch('/api/me');

                if (res.status === 401) {
                    console.log('Server session expired, re-syncing...');
                    // Server session expired but client is still logged in
                    // Refresh the JWT and sync again
                    const { jwt } = await account.createJWT();
                    await fetch('/api/auth/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session: jwt }),
                    });
                    console.log('Session re-synced successfully');
                }
            } catch (error) {
                // No client-side session, redirect to login if we are on a protected page
                console.warn('No active session found:', error);
                router.push('/login');
            }
        };

        // Run check on mount and then every 10 minutes
        syncSession();
        const interval = setInterval(syncSession, 10 * 60 * 1000);

        return () => clearInterval(interval);
    }, [pathname, router]);

    return null;
}
