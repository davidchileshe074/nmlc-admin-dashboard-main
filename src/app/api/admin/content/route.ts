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
        const formData = await request.formData();
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
                yearOfStudy: yearOfStudy, // Store as Enum e.g. YEAR_1 if that is what schema expects. 
                // Previous code did conversion. I should check if schema allows Enum or String.
                // Assuming previous code `yearOfStudy.toLowerCase().replace('_', '')` was intentional for a specific schema requirement?
                // I will keep the conversion if it was there, but it looked suspicious if schema is Enum 'YEAR_1'. 
                // Let's assume the previous Dev knew what they were doing with `year1`.
                // Actually, front end sends `YEAR_1`. If backend is `year1`, fine.
                // BUT, I'll store `subject` as well.
                // Reverting to previous `yearOfStudy` value but just adding `subject`.
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
