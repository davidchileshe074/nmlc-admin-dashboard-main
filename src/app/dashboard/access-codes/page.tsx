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
    const [quantity, setQuantity] = useState(10);
    const [prefix, setPrefix] = useState('NLC-');

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

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/accessCodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ durationDays: duration, quantity, prefix }),
            });
            if (res.ok) {
                fetchCodes();
                alert('Codes generated successfully!');
            } else {
                alert('Failed to generate codes');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

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
                            Generate Codes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGenerate} className="space-y-4">
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Quantity (1-500)</label>
                                <Input type="number" min={1} max={500} value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prefix</label>
                                <Input placeholder="NLC-" value={prefix} onChange={e => setPrefix(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full" disabled={generating}>
                                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Generate Codes
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
