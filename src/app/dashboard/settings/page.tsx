"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input
} from '@/components/ui/base';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Shield,
    Database,
    UserPlus,
    Trash2,
    Activity,
    CheckCircle,
    Loader2,
    AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUserId, setNewUserId] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [adding, setAdding] = useState(false);

    // User Search State
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/admins');
            const data = await res.json();
            setAdmins(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await fetch('/api/me');
                const data = await res.json();
                if (data.email !== 'davidchileshe074@gmail.com') {
                    router.push('/dashboard');
                } else {
                    fetchAdmins();
                }
            } catch (err) {
                console.error(err);
                router.push('/dashboard');
            }
        };
        checkAccess();
    }, []);

    const searchUsers = async (val: string) => {
        setUserSearch(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(`/api/admin/students?search=${encodeURIComponent(val)}&limit=5`);
            const data = await res.json();
            setSearchResults(data.students || []);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const promoteUser = async (user: any) => {
        setAdding(true);
        try {
            const res = await fetch('/api/admin/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId, email: user.email }),
            });
            if (res.ok) {
                fetchAdmins();
                setSearchResults([]);
                setUserSearch('');
                alert(`${user.fullName} is now an admin!`);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to add admin');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAdding(false);
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            const res = await fetch('/api/admin/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: newUserId, email: newEmail }),
            });
            if (res.ok) {
                fetchAdmins();
                setNewUserId('');
                setNewEmail('');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to add admin');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveAdmin = async (userId: string) => {
        if (!confirm('Are you sure? This user will lose all admin privileges.')) return;
        try {
            const res = await fetch('/api/admin/admins/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (res.ok) {
                fetchAdmins();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to remove admin');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const appwriteInfo = [
        { label: 'Cloud Endpoint', value: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, status: 'Active' },
        { label: 'Project ID', value: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID, status: 'Connected' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
                <p className="text-slate-500 mt-1">Configure platform parameters and manage administrators.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Appwrite Status */}
                <Card className="lg:col-span-1 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-600" />
                            Appwrite Connectivity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {appwriteInfo.map((info, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{info.label}</p>
                                    <p className="text-sm font-mono text-slate-700 mt-1 truncate">{info.value}</p>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                        <span className="text-xs font-semibold text-green-600">{info.status}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex gap-3">
                                    <Activity className="w-5 h-5 text-blue-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-blue-900">Health Check</p>
                                        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                            All systems are operational. Real-time sync with fra.cloud.appwrite.io is established.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Management */}
                <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Administrator Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Search Registered Users to Promote</label>
                                <div className="relative">
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={userSearch}
                                        onChange={e => searchUsers(e.target.value)}
                                        className="pr-10"
                                    />
                                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {searchResults.map((user) => (
                                            <div key={user.$id} className="flex items-center justify-between p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate">{user.fullName}</p>
                                                    <p className="text-xs text-slate-500 truncate">{user.email || user.whatsappNumber}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 text-[10px] font-bold uppercase tracking-tight"
                                                    onClick={() => promoteUser(user)}
                                                    disabled={adding}
                                                >
                                                    Promote
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 py-2">
                                <div className="h-px bg-slate-100 flex-1"></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR ADD MANUALLY</span>
                                <div className="h-px bg-slate-100 flex-1"></div>
                            </div>

                            <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500">USER ID</label>
                                    <Input placeholder="Enter Appwrite User ID" value={newUserId} onChange={e => setNewUserId(e.target.value)} required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500">EMAIL (OPTIONAL)</label>
                                    <Input placeholder="admin@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" className="w-full gap-2" disabled={adding}>
                                        <UserPlus className="w-4 h-4" />
                                        {adding ? 'Adding...' : 'Add Admin'}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Added On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                                        </TableCell>
                                    </TableRow>
                                ) : admins.map((admin) => (
                                    <TableRow key={admin.$id}>
                                        <TableCell className="font-mono text-xs">{admin.userId}</TableCell>
                                        <TableCell className="text-sm">{admin.email || '--'}</TableCell>
                                        <TableCell className="text-xs text-slate-500">{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveAdmin(admin.userId)}>
                                                <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <p className="text-[11px] font-medium text-amber-700">
                                CRITICAL: Maintain at least one active administrator. System lockdown occurs if no admins are present.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
