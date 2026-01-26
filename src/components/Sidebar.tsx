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
            {/* Mobile Overlay with Backdrop Blur */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar Container */}
            <div
                className={cn(
                    "flex flex-col h-[100dvh] border-r border-slate-200 bg-white shadow-xl lg:shadow-none transition-all duration-300 ease-in-out z-50",
                    // Desktop
                    "hidden lg:flex",
                    collapsed ? "w-20" : "w-72",
                    // Mobile
                    "fixed lg:relative inset-y-0 left-0",
                    mobileOpen ? "translate-x-0 flex" : "-translate-x-full lg:translate-x-0 hidden lg:flex",
                    "w-72 sm:w-80 lg:w-72" // Wider sidebar for premium feel
                )}
            >
                {/* Brand Header */}
                <div className="flex items-center justify-between px-6 h-20 border-b border-slate-100/50">
                    {!collapsed && (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 ring-2 ring-white">
                                <Stethoscope className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 tracking-tight leading-none text-lg">NLC Admin</span>
                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Control Panel</span>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md mx-auto ring-2 ring-white">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                    )}

                    {/* Mobile Close Button */}
                    <button
                        onClick={onMobileClose}
                        className="p-2 hover:bg-slate-100 rounded-lg lg:hidden text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Desktop Collapse Toggle */}
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            className="hidden lg:flex p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto no-scrollbar">
                    {filteredMenuItems.map((item) => {
                        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={handleLinkClick}
                                className={cn(
                                    "relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden",
                                    active
                                        ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 text-blue-700 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.1)]"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                {/* Active Indicator Bar */}
                                {active && (
                                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-600 rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                                )}

                                <div className={cn(
                                    "flex items-center justify-center transition-all duration-300",
                                    collapsed ? "w-12 h-10" : "w-6 h-6",
                                    active ? "text-blue-600 scale-110" : "text-slate-400 group-hover:text-slate-600 group-hover:scale-110"
                                )}>
                                    <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                                </div>

                                {!collapsed && (
                                    <span className={cn(
                                        "font-bold text-sm tracking-wide transition-all",
                                        active ? "translate-x-0" : "group-hover:translate-x-1"
                                    )}>
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse Toggle for Collapsed State */}
                {collapsed && (
                    <button
                        onClick={() => setCollapsed(false)}
                        className="hidden lg:flex mx-auto mb-6 p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/50 transition-all shadow-sm"
                    >
                        <ChevronRight size={20} />
                    </button>
                )}

                {/* Profile & Utility Section */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                    {!collapsed && user && (
                        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-black text-sm border border-blue-50">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-black text-slate-900 truncate leading-none mb-1">
                                    {user.name || 'Administrator'}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Online</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className={cn(
                            "group w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm",
                            "text-slate-500 hover:text-red-600 hover:bg-red-50 active:scale-95",
                            collapsed && "justify-center p-3"
                        )}
                    >
                        <div className="flex items-center justify-center w-6 h-6 group-hover:rotate-12 transition-transform">
                            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                        </div>
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </div>
        </>
    );
}
