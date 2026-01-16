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
    Stethoscope,
    X
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<{ email: string; name: string } | null>(null);

    useEffect(() => {
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    setUser({ email: data.email, name: data.name });
                }
            });
    }, []);

    const filteredMenuItems = menuItems.filter(item => {
        if (item.label === 'Settings') {
            return user?.email === 'davidchileshe074@gmail.com';
        }
        return true;
    });

    const handleLogout = async () => {
        try {
            await account.deleteSession('current');
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleLinkClick = () => {
        if (onMobileClose) {
            onMobileClose();
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "flex flex-col h-screen border-r border-slate-200 bg-white transition-all duration-300",
                    // Desktop
                    "hidden lg:flex",
                    collapsed ? "w-20" : "w-64",
                    // Mobile
                    "lg:relative fixed inset-y-0 left-0 z-50",
                    mobileOpen ? "flex" : "hidden lg:flex",
                    "w-64" // Always full width on mobile
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

                    {/* Desktop collapse button */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 hover:bg-slate-100 rounded-md hidden lg:flex"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    {/* Mobile close button */}
                    <button
                        onClick={onMobileClose}
                        className="p-1 hover:bg-slate-100 rounded-md lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {filteredMenuItems.map((item) => {
                        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={handleLinkClick}
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

                <div className="p-4 border-t border-slate-100 space-y-4">
                    {!collapsed && user && (
                        <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-xs font-semibold text-slate-900 truncate">{user.name || user.email}</p>
                            <p className="text-[10px] text-slate-500 font-medium">Administrator</p>
                        </div>
                    )}

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
        </>
    );
}
