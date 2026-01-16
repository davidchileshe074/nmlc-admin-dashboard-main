import { Client, Account, Databases, Storage, Users } from 'node-appwrite';

export const createAdminClient = () => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT!)
        .setProject(process.env.APPWRITE_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get storage() {
            return new Storage(client);
        },
        get users() {
            return new Users(client);
        }
    };
};

// For session-based client using the user's session cookie
export const createSessionClient = (session: string) => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT!)
        .setProject(process.env.APPWRITE_PROJECT_ID!);

    if (session) {
        client.setJWT(session);
    }

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        }
    };
};

export const SERVER_CONFIG = {
    databaseId: process.env.APPWRITE_DATABASE_ID!,
    bucketId: process.env.APPWRITE_BUCKET_ID!,
    collections: {
        admins: process.env.COL_ADMINS || 'admins',
        profiles: process.env.COL_PROFILES || 'profiles',
        subscriptions: process.env.COL_SUBSCRIPTIONS || 'subscriptions',
        content: process.env.COL_CONTENT || 'content',
        accessCodes: process.env.COL_ACCESS_CODES || 'accessCodes',
        notifications: process.env.COL_NOTIFICATIONS || 'notifications',
    }
};
