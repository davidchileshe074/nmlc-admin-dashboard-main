"use client";

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input
} from '@/components/ui/base';
import {
    Search,
    Filter,
    MoreVertical,
    ShieldCheck,
    ShieldAlert,
    Smartphone,
    Calendar,
    ExternalLink,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';
import { Profile, Subscription } from '@/types';
import { DateTime } from 'luxon';

interface StudentWithSub extends Profile {
    subscription: Subscription | null;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<StudentWithSub[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [year, setYear] = useState('');
    const [program, setProgram] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search,
                year,
                program,
                limit: '20',
                offset: '0'
            });
            const res = await fetch(`/api/admin/students?${params}`);
            const data = await res.json();
            setStudents(data.students);
            setTotal(data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [search, year, program]);

    const handleApproveToggle = async (userId: string, currentStatus: boolean) => {
        setActionLoading(userId + '-approve');
        try {
            await fetch('/api/admin/approveUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, adminApproved: !currentStatus }),
            });
            fetchStudents();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetDevice = async (userId: string) => {
        if (!confirm('Are you sure you want to reset device binding for this user?')) return;
        setActionLoading(userId + '-reset');
        try {
            await fetch('/api/admin/resetDevice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            fetchStudents();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleExtendSubscription = async (userId: string, days: number) => {
        setActionLoading(userId + '-extend');
        try {
            await fetch('/api/admin/extendSubscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, days }),
            });
            fetchStudents();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Students Management</h1>
                    <p className="text-slate-500 mt-1">Manage profiles, subscriptions, and device bindings.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {total} Students Total
                    </span>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Search by name..."
                                className="pl-10 bg-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            <option value="">All Years</option>
                            <option value="YEAR_1">Year 1</option>
                            <option value="YEAR_2">Year 2</option>
                            <option value="YEAR_3">Year 3</option>
                        </select>
                        <select
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={program}
                            onChange={(e) => setProgram(e.target.value)}
                        >
                            <option value="">All Programs</option>
                            <option value="RN">RN</option>
                            <option value="MIDWIFERY">Midwifery</option>
                            <option value="PUBLIC_HEALTH">Public Health</option>
                            <option value="MENTAL_HEALTH">Mental Health</option>
                            <option value="ONCOLOGY">Oncology</option>
                            <option value="PAEDIATRIC">Paediatric</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Student</TableHead>
                                <TableHead>Contact & Info</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Subscription</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                            <p className="text-slate-500">Loading students...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                        No students found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student) => (
                                    <TableRow key={student.$id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                                    {student.fullName[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 truncate">{student.fullName}</p>
                                                    <p className="text-xs text-slate-400 truncate">{student.email || 'No email'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium flex items-center gap-1.5">
                                                    <span className="text-green-600">WP:</span> {student.whatsappNumber}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {student.program} • {String(student.yearOfStudy || '').replace('_', ' ')}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    {student.verified ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                                                    <span className="text-xs font-medium">OTP Verified</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {student.adminApproved ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                                    <span className="text-xs font-medium">Admin Approved</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {student.deviceId ? (
                                                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded w-fit text-[10px] font-mono text-slate-600">
                                                    <Smartphone className="w-3 h-3 text-slate-400" />
                                                    {student.deviceId.substring(0, 12)}...
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">No device bound</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {student.subscription ? (
                                                <div className="space-y-1">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                                        student.subscription.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                    )}>
                                                        {student.subscription.status}
                                                    </span>
                                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {DateTime.fromISO(student.subscription.endDate).toLocaleString(DateTime.DATE_MED)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">No subscription</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title={student.adminApproved ? "Block Student" : "Approve Student"}
                                                    onClick={() => handleApproveToggle(student.userId, student.adminApproved)}
                                                    disabled={actionLoading === student.userId + '-approve'}
                                                >
                                                    {student.adminApproved ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-green-500" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Reset Device Binding"
                                                    onClick={() => handleResetDevice(student.userId)}
                                                    disabled={!student.deviceId || actionLoading === student.userId + '-reset'}
                                                >
                                                    <Smartphone className="w-4 h-4 text-slate-500" />
                                                </Button>
                                                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs h-8"
                                                    onClick={() => handleExtendSubscription(student.userId, 30)}
                                                    disabled={actionLoading === student.userId + '-extend'}
                                                >
                                                    +30d
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
