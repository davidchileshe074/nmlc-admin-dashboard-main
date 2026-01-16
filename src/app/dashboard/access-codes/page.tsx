"use client";

import { useEffect, useState } from 'react';
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
    Search
} from 'lucide-react';
import { AccessCode } from '@/types';

export default function AccessCodesPage() {
    const [codes, setCodes] = useState<AccessCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [usedFilter, setUsedFilter] = useState('all');

    // Generator form states
    const [duration, setDuration] = useState(30);
    // const [quantity, setQuantity] = useState(1); // implicit
    const [prefix, setPrefix] = useState('NLC-');

    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]); // Using any for brevity, or partial Profile
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (usedFilter !== 'all') params.append('used', usedFilter);
            const res = await fetch(`/api/admin/accessCodes?${params}`);
            const data = await res.json();
            setCodes(data.documents || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();
    }, [usedFilter]);

    // Debounced search / initial load
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                // Fetch defaults even if empty to show "dropdown" list
                const res = await fetch(`/api/admin/students?search=${searchQuery}&limit=10`);
                const data = await res.json();
                setSearchResults(data.students || []);
            } catch (err) {
                console.error(err);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;

        // Block if subscription is active
        if (selectedStudent.subscription?.status === 'ACTIVE') {
            alert("This student already has an active subscription.");
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
                alert(`Code generated successfully for ${selectedStudent.fullName}!`);
                setSelectedStudent(null);
                setSearchQuery('');
                // Refresh student search to update their status potentially
            } else {
                alert('Failed to generate codes');
            }
        } catch (err) {
            console.error(err);
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

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Access Codes</h1>
                    <p className="text-slate-500 mt-1">Generate and manage subscription redemption codes.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExport} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Generator Form */}
                <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-600" />
                            Generate Code
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div className="space-y-2 max-h-[300px] relative">
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
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                        <Input
                                            placeholder="Search name..."
                                            className="pl-9"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => {
                                                if (searchResults.length === 0) setSearchQuery(''); // Trigger fetch
                                            }}
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                                                {searchResults.map((s) => (
                                                    <button
                                                        key={s.$id}
                                                        type="button"
                                                        // We allow selecting them to see the warning, but visually indicate it
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 text-sm border-b border-slate-50 last:border-none flex items-center justify-between group",
                                                            s.subscription?.status === 'ACTIVE' ? "bg-slate-50" : "hover:bg-blue-50"
                                                        )}
                                                        onClick={() => {
                                                            setSelectedStudent(s);
                                                            setSearchQuery('');
                                                            setSearchResults([]);
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
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration (Days)</label>
                                <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
                                    <option value={7}>7 Days</option>
                                    <option value={30}>30 Days</option>
                                    <option value={90}>90 Days</option>
                                    <option value={180}>180 Days</option>
                                    <option value={365}>1 Year</option>
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
                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <select className="flex h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium" value={usedFilter} onChange={e => setUsedFilter(e.target.value)}>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Redeemed By</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && !generating ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : codes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-slate-500">
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
                                                    <span className="font-mono font-bold text-slate-900">{code.code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">
                                                {code.durationDays} Days
                                            </TableCell>
                                            <TableCell>
                                                {code.isUsed ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                        REDEEMED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                                                        AVAILABLE
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    {code.usedByUserId || '--'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-400 italic">
                                                {new Date(code.$createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
