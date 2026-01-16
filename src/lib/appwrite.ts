import { Client, Account, Databases, Storage } from 'appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const APPWRITE_CONFIG = {
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
    collections: {
        admins: process.env.NEXT_PUBLIC_COL_ADMINS || 'admins',
        profiles: process.env.NEXT_PUBLIC_COL_PROFILES || 'profiles',
        subscriptions: process.env.NEXT_PUBLIC_COL_SUBSCRIPTIONS || 'subscriptions',
        content: process.env.NEXT_PUBLIC_COL_CONTENT || 'content',
        accessCodes: process.env.NEXT_PUBLIC_COL_ACCESS_CODES || 'accessCodes',
    }
};
