"use client";

import { Bell, Search, User, LogOut, Settings, ChevronDown, X, Filter } from 'lucide-react';
import { Input, Button } from '@/components/ui/base';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SearchResult {
    type: 'student' | 'content';
    id: string;
    title: string;
    subtitle: string;
    url: string;
}

interface Notification {
    $id: string;
    type: 'info' | 'warning' | 'success';
    title: string;
    message: string;
    targetUrl?: string;
    $createdAt: string;
    read: boolean;
    readAt?: string;
}

export function Header() {
    const router = useRouter();
    const [user, setUser] = useState<{ email: string; name: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
    const [notificationFilter, setNotificationFilter] = useState<'all' | 'info' | 'warning' | 'success'>('all');
    const [unreadCount, setUnreadCount] = useState(0);
    const [searching, setSearching] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch current user
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    setUser({ email: data.email, name: data.name });
                }
            });

        // Fetch notifications
        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filter notifications when filter changes
    useEffect(() => {
        if (notificationFilter === 'all') {
            setFilteredNotifications(notifications);
        } else {
            setFilteredNotifications(notifications.filter(n => n.type === notificationFilter));
        }
    }, [notificationFilter, notifications]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const results: SearchResult[] = [];

                // Search students
                const studentsRes = await fetch(`/api/admin/students?search=${searchQuery}&limit=5`);
                const studentsData = await studentsRes.json();
                if (studentsData.students) {
                    studentsData.students.forEach((student: any) => {
                        results.push({
                            type: 'student',
                            id: student.$id,
                            title: student.fullName,
                            subtitle: student.email,
                            url: `/dashboard/students`
                        });
                    });
                }

                // Search content
                const contentRes = await fetch(`/api/admin/content?search=${searchQuery}`);
                const contentData = await contentRes.json();
                if (contentData.documents) {
                    contentData.documents.slice(0, 5).forEach((content: any) => {
                        results.push({
                            type: 'content',
                            id: content.$id,
                            title: content.title,
                            subtitle: `${content.program} - ${content.yearOfStudy}`,
                            url: `/dashboard/content`
                        });
                    });
                }

                setSearchResults(results);
                setShowSearchResults(results.length > 0);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const res = await fetch('/api/admin/notifications');
            const data = await res.json();

            if (data.documents) {
                setNotifications(data.documents);
                setUnreadCount(data.documents.filter((n: Notification) => !n.read).length);
            }
        } catch (err) {
            console.error('Fetch notifications error:', err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/admin/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id, read: true })
            });

            setNotifications(prev =>
                prev.map(n => n.$id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Mark as read error:', err);
            toast.error('Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/admin/notifications/mark-all-read', {
                method: 'POST'
            });

            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
                );
                setUnreadCount(0);
                toast.success('All notifications marked as read');
            }
        } catch (err) {
            console.error('Mark all as read error:', err);
            toast.error('Failed to mark all as read');
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (err) {
            toast.error('Failed to logout');
        }
    };

    const handleSearchResultClick = (url: string) => {
        router.push(url);
        setSearchQuery('');
        setShowSearchResults(false);
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.$id);
        }
        if (notification.targetUrl) {
            router.push(notification.targetUrl);
            setShowNotifications(false);
        }
    };

    const getNotificationIcon = (type: string) => {
        const colors = {
            info: 'bg-blue-100 text-blue-600',
            warning: 'bg-amber-100 text-amber-600',
            success: 'bg-green-100 text-green-600'
        };
        return colors[type as keyof typeof colors] || colors.info;
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            {/* Search */}
            <div className="flex items-center w-full max-w-md relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                    placeholder="Search students, content..."
                    className="pl-10 bg-slate-50 border-transparent focus:bg-white focus:border-slate-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                />
                {searchQuery && (
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setShowSearchResults(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {/* Search Results Dropdown */}
                {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                        {searching ? (
                            <div className="p-4 text-center text-slate-500">Searching...</div>
                        ) : searchResults.length > 0 ? (
                            <div className="py-2">
                                {searchResults.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleSearchResultClick(result.url)}
                                        className="w-full px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-none"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result.type === 'student' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                                }`}>
                                                {result.type === 'student' ? <User className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900">{result.title}</p>
                                                <p className="text-xs text-slate-500">{result.subtitle}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-slate-500">No results found</div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-slate-400 hover:text-slate-600 relative"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-slate-200 rounded-lg shadow-lg">
                            <div className="p-4 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex gap-2">
                                    {(['all', 'info', 'warning', 'success'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setNotificationFilter(filter)}
                                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${notificationFilter === filter
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {loadingNotifications ? (
                                    <div className="p-8 text-center text-slate-500">
                                        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                                        <p className="text-sm mt-2">Loading...</p>
                                    </div>
                                ) : filteredNotifications.length > 0 ? (
                                    filteredNotifications.map((notification) => (
                                        <div
                                            key={notification.$id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-4 border-b border-slate-100 last:border-none cursor-pointer hover:bg-slate-50 ${!notification.read ? 'bg-blue-50/50' : ''
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationIcon(notification.type)}`}>
                                                    <Bell className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                                                        {!notification.read && (
                                                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                                                    <p className="text-xs text-slate-400 mt-1">{formatTimestamp(notification.$createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500">
                                        <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                        <p className="text-sm">No {notificationFilter !== 'all' ? notificationFilter : ''} notifications</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Menu */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 pl-4 border-l border-slate-100 hover:bg-slate-50 rounded-lg pr-2 py-1 transition-colors"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-700">{user?.name || user?.email || 'Admin'}</p>
                            <p className="text-xs text-slate-400 font-medium">Administrator</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <User className="w-6 h-6" />
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileMenu && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg">
                            <div className="p-4 border-b border-slate-100">
                                <p className="text-sm font-medium text-slate-900">{user?.name || user?.email || 'Admin'}</p>
                                <p className="text-xs text-slate-500 mt-1">Administrator</p>
                            </div>
                            <div className="py-2">
                                <button
                                    onClick={() => {
                                        router.push('/dashboard/settings');
                                        setShowProfileMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
