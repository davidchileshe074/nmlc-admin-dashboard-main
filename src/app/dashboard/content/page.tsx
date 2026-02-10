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
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Content } from '@/types';
import { storage, ID, APPWRITE_CONFIG } from '@/lib/appwrite';
import { useSearchParams } from 'next/navigation';


const COURSES_DATA = {
    RN: {
        YEAR_1: [
            "Anatomy and Physiology", "Fundamentals of Nursing", "Health Communication in Nursing", "Microbiology",
            "Medical–Surgical Nursing", "Nutrition", "Professional Practice", "Public Health Nursing",
            "Pharmacology I", "Psychology in Nursing", "Sociology in Nursing", "Surgery and Surgical Nursing"
        ],
        YEAR_2: [
            "Psychiatry and Mental Health Nursing", "Pharmacology II", "Paediatric and Paediatric Nursing",
            "Medical–Surgical Nursing II", "Leadership, Management and Governance", "Integrated Reproductive Health", "Introduction to Research"
        ],
        YEAR_3: [
            "Paediatric and Paediatric Nursing", "Medical–Surgical Nursing", "Integrated Reproductive Health",
            "Mental Health and Psychiatry Nursing", "Leadership, Management and Governance"
        ]
    },
    MENTAL_HEALTH: {
        YEAR_1: [
            "Anatomy and physiology", "Fundamentals of Nursing", "Health Communication", "Microbiology",
            "Medical surgical Nursing", "Neuroscience", "Nutrition", "Professional practice",
            "Public health nursing", "Sociology", "Pharmacology"
        ],
        YEAR_2: [
            "Integrated reproductive health", "Introduction to research", "Leadership, management and Governance",
            "Medical surgical Nursing", "Paediatrics and child health nursing", "Paediatrics and Paediatric Nursing",
            "Pharmacology 2", "Psychiatric and Mental health Nursing"
        ],
        YEAR_3: [
            "Mental Health and Psychiatry", "Community Mental Health", "Leadership and Management"
        ]
    },
    ONCOLOGY: {
        YEAR_1: [
            "Anatomy and Physiology", "Fundamentals of Nursing", "Health Communication in Nursing",
            "Medical–Surgical Nursing", "Nutrition", "Professional Practice", "Public Health Nursing", "Pharmacology"
        ],
        YEAR_2: [
            "Introduction to Research", "Integrated Reproductive Health", "Leadership, Management and Governance",
            "Medical–Surgical Nursing", "Oncology Nursing", "Palliative Care"
        ],
        YEAR_3: [
            "Leadership, Management and Governance", "Medical–Surgical Nursing", "Oncology II",
            "Palliative Care Nursing I", "Palliative Nursing II", "Paediatric Nursing"
        ]
    },
    MIDWIFERY: {
        YEAR_1: [
            "Sociology in Nursing", "Psychology in Nursing", "Pharmacology I", "Public Health Nursing II",
            "Professional Practice", "Nutrition", "Medical–Surgical Nursing", "Microbiology",
            "Health Communication in Nursing", "Fundamentals of Nursing", "Anatomy and Physiology"
        ],
        YEAR_2: [
            "Psychiatry and Mental Health Nursing II", "Pharmacology II", "Paediatric and Paediatric Nursing",
            "Paediatric and Child Health Nursing", "Obstetric and Midwifery Care", "Medical–Surgical Nursing",
            "Leadership and Management", "Introduction to Research", "Gynaecology and Gynaecological Care", "Foundations of Midwifery"
        ],
        YEAR_3: [
            "Integrated Sexual and Reproductive Health Rights", "Leadership, Management and Governance",
            "Neonatology and Neonatal Care", "Obstetric and Midwifery Care"
        ]
    },
    PUBLIC_HEALTH: {
        YEAR_1: [
            "Psychology", "Nutrition", "Microbiology", "Fundamentals of Nursing", "Anatomy and Physiology",
            "Sociology", "Public Health", "Health Promotion", "Health Care Ethics and Public Health Law"
        ],
        YEAR_2: [
            "Surgery and surgical Nursing", "Integrated reproductive health", "Pharmacology",
            "Medicine and Medical Nursing", "Psychiatry and Mental health Nursing", "Public health nursing"
        ],
        YEAR_3: [
            "Paediatric and Child Health", "Occupational Health", "Leadership and Management",
            "Research and Epidemiology", "Community Engagement"
        ]
    },
    PAEDIATRIC: {
        YEAR_1: [],
        YEAR_2: [],
        YEAR_3: []
    }
};

const ITEMS_PER_PAGE = 10;

export default function ContentPage() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('search') || '';

    const [content, setContent] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialSearch);
    const [activeTab, setActiveTab] = useState<'ALL' | 'MEDIA' | 'PAST_PAPER' | 'MARKING_KEY'>('ALL');
    const [filterYear, setFilterYear] = useState('ALL');
    const [filterProgram, setFilterProgram] = useState('ALL');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ contentId: string; storageFileId: string; title: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('PDF');
    const [yearOfStudy, setYearOfStudy] = useState('YEAR_1');
    const [program, setProgram] = useState('RN');
    const [subject, setSubject] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const rawSubjects = COURSES_DATA[program as keyof typeof COURSES_DATA]?.[yearOfStudy as keyof (typeof COURSES_DATA)['RN']] || [];
    const availableSubjects = ["Nursing Care Plan", ...rawSubjects];

    useEffect(() => {
        // Reset subject when program/year changes
        if (availableSubjects.length > 0) {
            setSubject("Nursing Care Plan");
        } else {
            setSubject('');
        }
    }, [program, yearOfStudy]);

    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch !== null && urlSearch !== search) {
            setSearch(urlSearch);
        }
    }, [searchParams]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search });
            if (activeTab !== 'ALL') {
                if (activeTab === 'MEDIA') {
                    // This is a bit tricky since our API expects a single type.
                    // For now, let's just handle it or adjust the API if needed.
                    // Or we can just default to 'ALL' if no tab is selected.
                } else {
                    params.append('type', activeTab);
                }
            }
            if (filterYear !== 'ALL') params.append('year', filterYear);
            if (filterProgram !== 'ALL') params.append('program', filterProgram);

            // Pagination params
            params.append('limit', ITEMS_PER_PAGE.toString());
            params.append('offset', ((currentPage - 1) * ITEMS_PER_PAGE).toString());

            const res = await fetch(`/api/admin/content?${params}`);
            let data = await res.json();
            let documents = data.documents || [];

            // Client-side filtering for MEDIA if needed
            if (activeTab === 'MEDIA') {
                documents = documents.filter((doc: any) => doc.type === 'PDF' || doc.type === 'AUDIO');
            }

            setContent(documents);
            setTotalItems(data.total || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchContent();
        }, 300);
        return () => clearTimeout(timeout);

    }, [search, activeTab, filterYear, filterProgram, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, activeTab, filterYear, filterProgram]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            // 1. Upload file directly to Appwrite Storage (Client-side)
            // This bypasses server payload limits and handles large files better
            const fileResponse = await storage.createFile(
                APPWRITE_CONFIG.bucketId,
                ID.unique(),
                file
            );

            const storageFileId = fileResponse.$id;

            // 2. Call our API to create the database record
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('type', type);
            formData.append('yearOfStudy', yearOfStudy);
            formData.append('program', program);
            formData.append('subject', subject);
            formData.append('storageFileId', storageFileId); // Send the ID, not the file

            const res = await fetch('/api/admin/content', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                setShowUploadModal(false);
                fetchContent();
                toast.success('Content uploaded successfully!');
                // Reset form
                setTitle('');
                setDescription('');
                setFile(null);
            } else {
                const error = await res.json();
                toast.error(error.error || 'Upload failed');
            }
        } catch (err: any) {
            console.error('Upload error details:', err);
            const errorMessage = err.message || 'An error occurred during upload';
            toast.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteClick = (contentId: string, storageFileId: string, title: string) => {
        setItemToDelete({ contentId, storageFileId, title });
        setShowDeleteModal(true);
    };

    const [deleting, setDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setDeleting(true);
        try {
            const res = await fetch('/api/admin/deleteContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentId: itemToDelete.contentId, storageFileId: itemToDelete.storageFileId }),
            });

            if (res.ok) {
                toast.success('Content deleted successfully');
                fetchContent();
                setShowDeleteModal(false);
                setItemToDelete(null);
            } else {
                toast.error('Failed to delete content');
            }
        } catch (err) {
            console.error(err);
            toast.error('An error occurred during deletion');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">Library Catalog</h1>
                        <p className="text-slate-500 mt-1 text-xs sm:text-base">Manage educational materials and papers.</p>
                    </div>
                    {/* Desktop/Tablet Button */}
                    <Button
                        onClick={() => setShowUploadModal(true)}
                        className="hidden sm:inline-flex gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Content
                    </Button>
                </div>
            </div>

            {/* Mobile Floating Action Button (FAB) */}
            <button
                onClick={() => setShowUploadModal(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 sm:hidden hover:bg-blue-700 active:scale-95 transition-all outline-none ring-offset-2 focus:ring-2 focus:ring-blue-500"
                aria-label="Add Content"
            >
                <Plus className="w-6 h-6" />
            </button>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-0">
                    <div className="flex flex-col gap-4 p-4">
                        {/* Tabs - Horizontally scrollable on mobile */}
                        <div className="overflow-x-auto -mx-4 px-4">
                            <div className="flex bg-slate-200/50 p-1 rounded-lg w-fit min-w-full sm:min-w-0">
                                {[
                                    { id: 'ALL', label: 'All' },
                                    { id: 'MEDIA', label: 'Media' },
                                    { id: 'PAST_PAPER', label: 'Past Papers' },
                                    { id: 'MARKING_KEY', label: 'Keys' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "px-3 sm:px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                                            activeTab === tab.id
                                                ? "bg-white text-blue-600 shadow-sm"
                                                : "text-slate-600 hover:text-slate-900"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    placeholder="Search by title..."
                                    className="pl-10 bg-white"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <select
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
                                value={filterProgram}
                                onChange={(e) => setFilterProgram(e.target.value)}
                            >
                                <option value="ALL">All Programs</option>
                                <option value="RN">RN</option>
                                <option value="MIDWIFERY">Midwifery</option>
                                <option value="PUBLIC_HEALTH">Public Health</option>
                                <option value="MENTAL_HEALTH">Mental Health</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-slate-50/50">
                                    <TableHead className="w-[100px]">Type</TableHead>
                                    <TableHead>Title & Description</TableHead>
                                    <TableHead>Subject / Course</TableHead>
                                    <TableHead>Year / Program</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                                <p className="text-sm text-slate-500">Loading catalog...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : content.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                                    <Search className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <p className="text-slate-900 font-medium">No files found</p>
                                                <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    content.map((item) => (
                                        <TableRow key={item.$id} className="group hover:bg-slate-50/80 transition-colors">
                                            <TableCell>
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                                                    item.type === 'PDF' && "bg-red-50 text-red-600",
                                                    item.type === 'AUDIO' && "bg-blue-50 text-blue-600",
                                                    item.type === 'PAST_PAPER' && "bg-purple-50 text-purple-600",
                                                    item.type === 'MARKING_KEY' && "bg-green-50 text-green-600"
                                                )}>
                                                    {item.type === 'PDF' && <FileText className="w-5 h-5" />}
                                                    {item.type === 'AUDIO' && <Music className="w-5 h-5" />}
                                                    {item.type === 'PAST_PAPER' && <FileBox className="w-5 h-5" />}
                                                    {item.type === 'MARKING_KEY' && <CheckCircle2 className="w-5 h-5" />}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-md">
                                                    <p className="font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description || 'No description provided'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-700 font-medium bg-slate-100/80 px-2.5 py-1 rounded-md">
                                                    {item.subject || 'General'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-600 uppercase">
                                                        {item.yearOfStudy.replace('_', ' ')}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow-sm italic">
                                                        {item.program}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                    {new Date(item.createdAt || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(item.$id, item.storageFileId, item.title)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {loading ? (
                            <div className="p-8 text-center flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                <p className="text-sm text-slate-500 font-medium">Fetching contents...</p>
                            </div>
                        ) : content.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">No results found</p>
                            </div>
                        ) : (
                            content.map((item) => (
                                <div key={item.$id} className="p-4 flex gap-4 active:bg-slate-50 transition-colors">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                                        item.type === 'PDF' && "bg-gradient-to-br from-red-50 to-red-100 text-red-600 border border-red-200/50",
                                        item.type === 'AUDIO' && "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border border-blue-200/50",
                                        item.type === 'PAST_PAPER' && "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 border border-purple-200/50",
                                        item.type === 'MARKING_KEY' && "bg-gradient-to-br from-green-50 to-green-100 text-green-600 border border-green-200/50"
                                    )}>
                                        {item.type === 'PDF' && <FileText className="w-6 h-6" />}
                                        {item.type === 'AUDIO' && <Music className="w-6 h-6" />}
                                        {item.type === 'PAST_PAPER' && <FileBox className="w-6 h-6" />}
                                        {item.type === 'MARKING_KEY' && <CheckCircle2 className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-slate-900 text-sm line-clamp-1 truncate leading-tight">{item.title}</h3>
                                            <button
                                                onClick={() => handleDeleteClick(item.$id, item.storageFileId, item.title)}
                                                className="p-1.5 -m-1.5 text-slate-400 active:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description || item.subject}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{item.yearOfStudy.replace('_', ' ')}</span>
                                            <span className="bg-blue-600/10 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">{item.program}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    <div className="text-xs text-slate-500">
                        Showing <span className="font-medium text-slate-900">{content.length}</span> of <span className="font-medium text-slate-900">{totalItems}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-xs font-medium text-slate-700 min-w-[3rem] text-center">
                            Page {currentPage} of {Math.ceil(totalItems / ITEMS_PER_PAGE) || 1}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={currentPage >= Math.ceil(totalItems / ITEMS_PER_PAGE) || loading}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Upload Modal Overlay */}
            {
                showUploadModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
                        <Card className="w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                                <CardTitle>Add New Content</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setShowUploadModal(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-4 sm:pt-6">
                                <form onSubmit={handleUpload} className="space-y-4 sm:space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="space-y-1 sm:space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium">Title *</label>
                                            <Input placeholder="e.g. Introduction to Nursing" value={title} onChange={e => setTitle(e.target.value)} required />
                                        </div>
                                        <div className="space-y-1 sm:space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium">Description</label>
                                            <textarea
                                                className="flex min-h-[60px] sm:min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Brief summary..."
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1 sm:space-y-2">
                                            <label className="text-sm font-medium">Type</label>
                                            <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none" value={type} onChange={e => setType(e.target.value)}>
                                                <option value="PDF">PDF</option>
                                                <option value="AUDIO">Audio</option>
                                                <option value="PAST_PAPER">Past Paper</option>
                                                <option value="MARKING_KEY">Marking Key</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1 sm:space-y-2">
                                            <label className="text-sm font-medium">Year</label>
                                            <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none" value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)}>
                                                <option value="YEAR_1">Year 1</option>
                                                <option value="YEAR_2">Year 2</option>
                                                <option value="YEAR_3">Year 3</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1 sm:space-y-2">
                                            <label className="text-sm font-medium">Program</label>
                                            <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none" value={program} onChange={e => setProgram(e.target.value)}>
                                                <option value="RN">RN</option>
                                                <option value="MIDWIFERY">Midwifery</option>
                                                <option value="PUBLIC_HEALTH">Public Health</option>
                                                <option value="MENTAL_HEALTH">Mental Health</option>
                                                <option value="ONCOLOGY">Oncology</option>
                                                <option value="PAEDIATRIC">Paediatric</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1 sm:space-y-2">
                                            <label className="text-sm font-medium">Subject</label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
                                                value={subject}
                                                onChange={e => setSubject(e.target.value)}
                                                disabled={!availableSubjects.length}
                                            >
                                                <option value="">Select...</option>
                                                {availableSubjects.map((sub: string) => (
                                                    <option key={sub} value={sub}>{sub}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1 sm:space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium">File Upload *</label>
                                            <div className={cn(
                                                "mt-1 flex justify-center px-4 py-4 sm:px-6 sm:py-5 border-2 border-dashed rounded-lg transition-colors",
                                                file ? "border-green-300 bg-green-50" : "border-slate-300 hover:border-blue-400"
                                            )}>
                                                <div className="space-y-1 text-center">
                                                    {file ? (
                                                        <div className="flex flex-col items-center">
                                                            <CheckCircle2 className="w-8 h-8 text-green-500 mb-1" />
                                                            <p className="text-xs font-medium text-green-800 truncate max-w-[200px]">{file.name}</p>
                                                            <button type="button" onClick={() => setFile(null)} className="text-[10px] text-red-500 underline mt-1">Remove</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                                                            <div className="flex text-xs text-slate-600 justify-center">
                                                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                                                    <span>Upload</span>
                                                                    <input type="file" className="sr-only" onChange={e => setFile(e.target.files?.[0] || null)} />
                                                                </label>
                                                                <p className="pl-1 hidden sm:block">or drag and drop</p>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500">PDF or Audio (Max 100MB)</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                                        <Button type="submit" size="sm" disabled={uploading || !file} className="min-w-[100px]">
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            {uploading ? 'Processing...' : 'Create Content'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && itemToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <Trash2 className="w-5 h-5" />
                                    Confirm Deletion
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-slate-600">
                                    Are you sure you want to delete <span className="font-semibold text-slate-900">"{itemToDelete.title}"</span>?
                                </p>
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                    ⚠️ This action cannot be undone. The content and associated file will be permanently removed.
                                </p>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setItemToDelete(null);
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
                )
            }
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
