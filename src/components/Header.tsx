"use client";

import { Bell, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/base';
import { useEffect, useState } from 'react';

export function Header() {
    const [user, setUser] = useState<{ email: string } | null>(null);

    useEffect(() => {
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    setUser({ email: data.email });
                }
            });
    }, []);

    return (
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center w-full max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                    placeholder="Quick search..."
                    className="pl-10 bg-slate-50 border-transparent focus:bg-white focus:border-slate-200"
                />
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-700">{user?.email || 'Admin User'}</p>
                        <p className="text-xs text-slate-400 font-medium">Administrator</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <User className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </header>
    );
}
