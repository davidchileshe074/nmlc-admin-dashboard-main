import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';

// Force rebuild

export async function GET(request: Request) {
    try {
        await assertAdmin();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const type = searchParams.get('type');
        const year = searchParams.get('year');
        const program = searchParams.get('program');

        const adminClient = createAdminClient();
        const queries = [
            Query.orderDesc('$createdAt'),
            Query.limit(50)
        ];

        if (search) queries.push(Query.search('title', search));
        if (type) queries.push(Query.equal('type', type));
        if (year) queries.push(Query.equal('yearOfStudy', year));
        if (program) queries.push(Query.equal('program', program));

        const content = await adminClient.databases.listDocuments(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.content,
            queries
        );

        return NextResponse.json(content);
    } catch (error: any) {
        const status = error.message?.includes('Unauthorized') || error.message?.includes('JWT') || error.message?.includes('Expired') ? 401 : (error.status || 500);
        return NextResponse.json({ error: error.message }, { status });
    }
}

export async function POST(request: Request) {
    console.log('--- POST Upload Content ---');
    try {
        await assertAdmin();

        // 0. Check Environment Variables
        if (!SERVER_CONFIG.databaseId || !SERVER_CONFIG.bucketId) {
            console.error('Missing SERVER_CONFIG:', SERVER_CONFIG);
            return NextResponse.json({ error: 'Server configuration error: Missing Database or Bucket ID' }, { status: 500 });
        }

        const contentType = request.headers.get('content-type') || '';
        const contentLength = request.headers.get('content-length');
        console.log(`Request Content-Type: ${contentType}, Content-Length: ${contentLength}`);

        const formData = await request.formData() as unknown as globalThis.FormData;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const type = formData.get('type') as string;
        const yearOfStudy = formData.get('yearOfStudy') as string;
        const program = formData.get('program') as string;
        const subject = formData.get('subject') as string;
        const storageFileId = formData.get('storageFileId') as string; // Get direct ID

        console.log(`Creating record for: ${title} (${type}), Storage ID: ${storageFileId}`);

        if (!title || !type || !yearOfStudy || !program || !storageFileId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // 1. File storage is now handled by the client side to support 
        // large uploads and bypass server-side limits.

        // 2. Create document in database
        console.log('Creating database document...');
        const document = await adminClient.databases.createDocument(
            SERVER_CONFIG.databaseId,
            SERVER_CONFIG.collections.content,
            'unique()',
            {
                title,
                description,
                type,
                yearOfStudy: yearOfStudy.toLowerCase().replace('_', ''),
                program,
                subject: subject || null,
                storageFileId: storageFileId, // Use the ID passed from client
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        );
        console.log('Database document created:', document.$id);

        return NextResponse.json(document);
    } catch (error: any) {
        console.error('--- Content creation failed ---');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        console.error('Error stack:', error.stack);

        const status = error.message?.includes('Unauthorized') || error.message?.includes('JWT') || error.message?.includes('Expired') ? 401 : (error.status || 500);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status });
    }
}
