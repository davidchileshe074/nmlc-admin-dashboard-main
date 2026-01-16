import { NextResponse } from 'next/server';
import { getSessionUser, assertAdmin } from '@/server/auth';

export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        try {
            await assertAdmin();
            return NextResponse.json({
                authenticated: true,
                userId: user.$id,
                email: user.email,
                name: user.name,
                isAdmin: true,
            });
        } catch {
            return NextResponse.json({
                authenticated: true,
                userId: user.$id,
                email: user.email,
                name: user.name,
                isAdmin: false,
            });
        }
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
