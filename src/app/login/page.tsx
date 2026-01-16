"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui/base';
import { Stethoscope, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // First create session in Appwrite (sets cookie in browser)
            try {
                await account.createEmailPasswordSession(email, password);
            } catch (authError: any) {
                // If a session is already active (code 401 or specific message), proceed to JWT creation
                // Otherwise if it's a genuine invalid credentials error, rethrow it
                if (authError?.code === 401 || authError?.message?.includes('session is active')) {
                    console.log('Session already active, proceeding to sync...');
                } else {
                    throw authError;
                }
            }

            // Create a JWT to allow the Next.js server to act on behalf of the user
            const { jwt } = await account.createJWT();

            // Now we need to set the session cookie for Next.js server actions / routes
            const res = await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ session: jwt }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to sync session');
            }

            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login Error:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md border-none shadow-xl">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Stethoscope className="w-7 h-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Admin Dashboard</CardTitle>
                    <p className="text-slate-500 text-sm">Welcome back! Please enter your details.</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    type="email"
                                    placeholder="admin@nurselearning.com"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium border border-red-100 italic">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">
                            Only authorized administrators can access this area.<br />
                            © 2026 Nurse Learning Corner
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
