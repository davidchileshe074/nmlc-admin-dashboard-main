import { NextResponse } from 'next/server';
import { assertAdmin } from '@/server/auth';
import { createAdminClient, SERVER_CONFIG } from '@/server/appwrite';
import { Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

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
    try {
        await assertAdmin();
        const formData = await request.formData() as unknown as globalThis.FormData;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const type = formData.get('type') as string;
        const yearOfStudy = formData.get('yearOfStudy') as string;
        const program = formData.get('program') as string;
        const subject = formData.get('subject') as string;
        const file = formData.get('file') as File;

        if (!title || !type || !yearOfStudy || !program || !file) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // 1. Upload file to storage
        // Appwrite Node SDK requires a buffer or a stream for file upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // We need to use InputFile.fromBuffer if available or just the buffer with metadata
        const inputFile = InputFile.fromBuffer(buffer, file.name);

        const storageFile = await adminClient.storage.createFile(
            SERVER_CONFIG.bucketId,
            'unique()',
            inputFile
        );

        // 2. Create document in database
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
                storageFileId: storageFile.$id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        );

        return NextResponse.json(document);
    } catch (error: any) {
        console.error('Content creation failed:', error);
        const status = error.message?.includes('Unauthorized') || error.message?.includes('JWT') || error.message?.includes('Expired') ? 401 : (error.status || 500);
        return NextResponse.json({ error: error.message }, { status });
    }
}
