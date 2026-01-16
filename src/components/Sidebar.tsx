"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    Key,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Stethoscope
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/components/ui/base';
import { Button } from '@/components/ui/base';
import { account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';

const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: Users, label: 'Students', href: '/dashboard/students' },
    { icon: FileText, label: 'Library', href: '/dashboard/content' },
    { icon: Key, label: 'Access Codes', href: '/dashboard/access-codes' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = async () => {
        try {
            await account.deleteSession('current');
            // Also clear cookie via a logout API if necessary, but Appwrite SDK might handle it if using setSession/getSession
            // Better to have a server-side logout route to clear the cookie
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col h-screen border-r border-slate-200 bg-white transition-all duration-300",
                collapsed ? "w-20" : "w-64"
            )}
        >
            <div className="flex items-center justify-between p-4 h-16 border-b border-slate-100">
                {!collapsed && (
                    <div className="flex items-center gap-2 font-bold text-blue-600 truncate">
                        <Stethoscope className="w-6 h-6 shrink-0" />
                        <span>NLC Admin</span>
                    </div>
                )}
                {collapsed && <Stethoscope className="w-6 h-6 mx-auto text-blue-600" />}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 hover:bg-slate-100 rounded-md lg:flex hidden"
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                                active
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                            {!collapsed && <span className="font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <Button
                    variant="ghost"
                    className={cn("w-full justify-start gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50", collapsed && "px-0 justify-center")}
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span>Logout</span>}
                </Button>
            </div>
        </div>
    );
}
