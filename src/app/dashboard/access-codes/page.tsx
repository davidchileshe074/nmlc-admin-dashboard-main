"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
    Plus,
    Download,
    Ticket,
    CheckCircle2,
    XCircle,
    Loader2,
    Filter,
    RefreshCw,
    Search,
    ChevronDown,
    Trash2,
    X
} from 'lucide-react';
import { AccessCode } from '@/types';

export default function AccessCodesPage() {
    const [codes, setCodes] = useState<AccessCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [codeToDelete, setCodeToDelete] = useState<{ id: string; code: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [usedFilter, setUsedFilter] = useState('all');

    // Generator form states
    const [duration, setDuration] = useState(30);
    // const [quantity, setQuantity] = useState(1); // implicit
    const [prefix, setPrefix] = useState('NLC-');

    // Search/Dropdown states
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

    const fetchCodes = async () => {
        // ... existing fetchCodes logic ...
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (usedFilter !== 'all') params.append('used', usedFilter);
            const res = await fetch(`/api/admin/accessCodes?${params}`);
            const data = await res.json();
            setCodes(data.documents || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch codes');
        } finally {
            setLoading(false);
        }
    };

    // Fetch students for dropdown
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch(`/api/admin/students?limit=100`);
                const data = await res.json();
                setAllStudents(data.students || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStudents();
        fetchCodes();
    }, []); // Run once on mount

    // Effect for filter change
    useEffect(() => {
        if (!allStudents.length) return; // Skip initial empty
        // We handle code fetching here separately if we want, but keeping existing structure:
        const fetchCodesOnly = async () => {
            // ... duplicate logic or keep fetchCodes reusable?
            // Actually, fetchCodes depends on usedFilter, so we need it in deps.
            // Converting fetchCodes to useCallback or just defining inside effect is cleaner but let's stick to simple.
            // Re-using the fetchCodes function defined above. 
            // BUT, fetchCodes uses state `usedFilter`. 
            // Let's just call fetchCodes() in the usedFilter effect below 
        };
    }, []);

    // Effect to refetch codes when filter changes
    useEffect(() => {
        fetchCodes();
    }, [usedFilter]);


    const handleGenerate = async (e: React.FormEvent) => {
        // ... (keep existing handleGenerate, it uses selectedStudent)
        e.preventDefault();
        if (!selectedStudent) return;

        // Block if subscription is active
        if (selectedStudent.subscription?.status === 'ACTIVE') {
            toast.error("This student already has an active subscription.");
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch('/api/admin/accessCodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    durationDays: duration,
                    quantity: 1,
                    prefix,
                    userId: selectedStudent.$id
                }),
            });

            if (res.ok) {
                fetchCodes();
                toast.success(`Code generated successfully for ${selectedStudent.fullName}!`);
                setSelectedStudent(null);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to generate codes');
            }
        } catch (err) {
            console.error(err);
            toast.error('An unexpected error occurred');
        } finally {
            setGenerating(false);
        }
    };

    const isSubscriptionActive = selectedStudent?.subscription?.status === 'ACTIVE';

    const handleExport = () => {
        const params = new URLSearchParams();
        if (usedFilter !== 'all') params.append('used', usedFilter);
        window.location.href = `/api/admin/exportAccessCodes?${params}`;
    };

    const handleDeleteClick = (codeId: string, code: string) => {
        setCodeToDelete({ id: codeId, code });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!codeToDelete) return;

        setDeleting(true);
        try {
            const res = await fetch('/api/admin/deleteAccessCode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codeId: codeToDelete.id }),
            });

            if (res.ok) {
                toast.success('Access code deleted successfully');
                fetchCodes();
                setShowDeleteModal(false);
                setCodeToDelete(null);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete access code');
            }
        } catch (err) {
            console.error(err);
            toast.error('An error occurred during deletion');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* ... Header ... */}
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Access Codes</h1>
                    <p className="text-slate-500 mt-1 text-sm lg:text-base">Generate and manage subscription redemption codes.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExport} className="gap-2 text-sm">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                        <span className="sm:hidden">Export</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                {/* Generator Form */}
                <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-600" />
                            Generate Code
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium">Select Student *</label>
                                {selectedStudent ? (
                                    <div className="space-y-2">
                                        <div className={cn(
                                            "flex items-center justify-between p-2 border rounded-md",
                                            isSubscriptionActive ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
                                        )}>
                                            <div className="mr-2 overflow-hidden flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm truncate">{selectedStudent.fullName}</p>
                                                    {isSubscriptionActive && (
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                                                            ACTIVE SUB
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">{selectedStudent.email}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                onClick={() => setSelectedStudent(null)}
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        {isSubscriptionActive && (
                                            <div className="text-xs text-amber-600 font-medium px-1">
                                                ⚠ Valid subscription exists. Code generation disabled.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div
                                            className="flex items-center justify-between w-full h-10 px-3 border border-slate-200 rounded-md bg-white cursor-pointer hover:border-slate-300"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            <span className="text-sm text-slate-500">Select a student...</span>
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        </div>

                                        {isDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                                    {allStudents.length > 0 ? (
                                                        allStudents.map((s) => (
                                                            <button
                                                                key={s.$id}
                                                                type="button"
                                                                className={cn(
                                                                    "w-full text-left px-3 py-2 text-sm border-b border-slate-50 last:border-none flex items-center justify-between group",
                                                                    s.subscription?.status === 'ACTIVE' ? "bg-slate-50" : "hover:bg-blue-50"
                                                                )}
                                                                onClick={() => {
                                                                    setSelectedStudent(s);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                            >
                                                                <div>
                                                                    <p className="font-medium text-slate-800">{s.fullName}</p>
                                                                    <p className="text-xs text-slate-500">{s.email}</p>
                                                                </div>
                                                                {s.subscription?.status === 'ACTIVE' && (
                                                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                                                                        ACTIVE
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-2 text-sm text-slate-500 text-center">No students found</div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration (Days) *</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                >
                                    <option value={5}>5 Days</option>
                                    <option value={10}>10 Days</option>
                                    <option value={15}>15 Days</option>
                                    <option value={30}>30 Days</option>
                                </select>
                            </div>

                            <Button type="submit" className="w-full" disabled={generating || !selectedStudent || isSubscriptionActive}>
                                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Generate & Assign
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Codes Table */}
                <Card className="lg:col-span-3 border-none shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-3 lg:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 lg:gap-4">
                                <select className="flex h-9 rounded-md border border-slate-200 bg-white px-2 lg:px-3 py-1 text-xs font-medium" value={usedFilter} onChange={e => setUsedFilter(e.target.value)}>
                                    <option value="all">All Codes</option>
                                    <option value="false">Unused Only</option>
                                    <option value="true">Used Only</option>
                                </select>
                                <Button variant="ghost" size="icon" onClick={fetchCodes} className="h-9 w-9">
                                    <RefreshCw className={cn("w-4 h-4 text-slate-400", loading && "animate-spin")} />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap">Code</TableHead>
                                        <TableHead className="whitespace-nowrap">Duration</TableHead>
                                        <TableHead className="whitespace-nowrap">Status</TableHead>
                                        <TableHead className="whitespace-nowrap">Redeemed By</TableHead>
                                        <TableHead className="whitespace-nowrap">Created</TableHead>
                                        <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && !generating ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center">
                                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : codes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                                No codes found. Generate some!
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        codes.map((code) => (
                                            <TableRow key={code.$id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                                                            <Ticket className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-mono font-bold text-slate-900 text-xs lg:text-sm">{code.code}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs lg:text-sm font-medium whitespace-nowrap">
                                                    {code.durationDays} Days
                                                </TableCell>
                                                <TableCell>
                                                    {code.isUsed ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold whitespace-nowrap">
                                                            REDEEMED
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold whitespace-nowrap">
                                                            AVAILABLE
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {code.studentName ? (
                                                        <span className="text-xs text-slate-700 font-medium">{code.studentName}</span>
                                                    ) : code.usedByUserId ? (
                                                        <span className="text-xs text-slate-500 font-mono">{code.usedByUserId}</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-500 font-mono">--</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-400 italic whitespace-nowrap">
                                                    {(() => {
                                                        const dateStr = (code as any).$createdAt || code.createdAt;
                                                        if (!dateStr) return '--';
                                                        const date = new Date(dateStr);
                                                        if (isNaN(date.getTime())) return '--';
                                                        return date.toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        });
                                                    })()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(code.$id, code.code)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && codeToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <Trash2 className="w-5 h-5" />
                                Confirm Deletion
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setCodeToDelete(null);
                                }}
                                disabled={deleting}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-slate-600">
                                Are you sure you want to delete access code{' '}
                                <span className="font-mono font-bold text-slate-900">{codeToDelete.code}</span>?
                            </p>
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                ⚠️ This action cannot be undone. The access code will be permanently removed.
                            </p>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setCodeToDelete(null);
                                    }}
                                    disabled={deleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleConfirmDelete}
                                    disabled={deleting}
                                    className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
