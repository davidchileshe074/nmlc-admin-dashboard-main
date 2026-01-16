"use client";

import { SetStateAction, useEffect, useState } from 'react';
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
    Search,
    Plus,
    FileText,
    Music,
    FileBox,
    Trash2,
    ExternalLink,
    Loader2,
    X,
    UploadCloud,
    CheckCircle2
} from 'lucide-react';
import { Content } from '@/types';

export default function ContentPage() {
    const [content, setContent] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('PDF');
    const [yearOfStudy, setYearOfStudy] = useState('YEAR_1');
    const [program, setProgram] = useState('RN');
    const [file, setFile] = useState<File | null>(null);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search });
            const res = await fetch(`/api/admin/content?${params}`);
            const data = await res.json();
            setContent(data.documents || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, [search]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('type', type);
            formData.append('yearOfStudy', yearOfStudy);
            formData.append('program', program);
            formData.append('file', file);

            const res = await fetch('/api/admin/content', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                setShowUploadModal(false);
                fetchContent();
                // Reset form
                setTitle('');
                setDescription('');
                setFile(null);
            } else {
                const error = await res.json();
                alert(error.error || 'Upload failed');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred during upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (contentId: string, storageFileId: string) => {
        if (!confirm('Are you sure you want to delete this content? This cannot be undone.')) return;

        try {
            await fetch('/api/admin/deleteContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentId, storageFileId }),
            });
            fetchContent();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Content CMS</h1>
                    <p className="text-slate-500 mt-1">Manage educational materials and past papers.</p>
                </div>
                <Button onClick={() => setShowUploadModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Content
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder="Search content by title..."
                            className="pl-10 bg-white"
                            value={search}
                            onChange={(e: { target: { value: SetStateAction<string>; }; }) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Type</TableHead>
                                <TableHead>Title & Description</TableHead>
                                <TableHead>Year / Program</TableHead>
                                <TableHead>Added On</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : content.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                        No content found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                content.map((item) => (
                                    <TableRow key={item.$id}>
                                        <TableCell>
                                            {item.type === 'PDF' && <FileText className="w-5 h-5 text-red-500" />}
                                            {item.type === 'AUDIO' && <Music className="w-5 h-5 text-blue-500" />}
                                            {item.type === 'PAST_PAPER' && <FileBox className="w-5 h-5 text-purple-500" />}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold text-slate-900">{item.title}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-xs">{item.description}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                                    {item.yearOfStudy.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 italic">
                                                    {item.program}
                                                </span>                                    
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {new Date(item.createdAt || '').toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.$id, item.storageFileId)}>
                                                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
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

            {/* Upload Modal Overlay */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                            <CardTitle>Add New Content</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowUploadModal(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleUpload} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">Title *</label>
                                        <Input placeholder="e.g. Introduction to Nursing" value={title} onChange={e => setTitle(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">Description</label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Brief summary of the content..."
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type</label>
                                        <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={type} onChange={e => setType(e.target.value)}>
                                            <option value="PDF">PDF Document</option>
                                            <option value="AUDIO">Audio Lecture</option>
                                            <option value="PAST_PAPER">Past Paper</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Year of Study</label>
                                        <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}>
                                            <option value="YEAR_1">Year 1</option>
                                            <option value="YEAR_2">Year 2</option>
                                            <option value="YEAR_3">Year 3</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Program</label>
                                        <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={program} onChange={e => setProgram(e.target.value)}>
                                            <option value="RN">RN</option>
                                            <option value="MIDWIFERY">Midwifery</option>
                                            <option value="PUBLIC_HEALTH">Public Health</option>
                                            <option value="MENTAL_HEALTH">Mental Health</option>
                                            <option value="ONCOLOGY">Oncology</option>
                                            <option value="PAEDIATRIC">Paediatric</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">File Upload *</label>
                                        <div className={cn(
                                            "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors",
                                            file ? "border-green-300 bg-green-50" : "border-slate-300 hover:border-blue-400"
                                        )}>
                                            <div className="space-y-1 text-center">
                                                {file ? (
                                                    <div className="flex flex-col items-center">
                                                        <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                                                        <p className="text-sm font-medium text-green-800">{file.name}</p>
                                                        <button type="button" onClick={() => setFile(null)} className="text-xs text-red-500 underline mt-1">Remove</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                                                        <div className="flex text-sm text-slate-600">
                                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                                                <span>Upload a file</span>
                                                                <input type="file" className="sr-only" onChange={e => setFile(e.target.files?.[0] || null)} />
                                                            </label>
                                                            <p className="pl-1">or drag and drop</p>
                                                        </div>
                                                        <p className="text-xs text-slate-500">PDF or Audio up to 100MB</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button type="button" variant="ghost" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                                    <Button type="submit" disabled={uploading || !file} className="min-w-[120px]">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {uploading ? 'Uploading...' : 'Create Content'}
                                    </Button>
                                </div>
                            </form>
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
