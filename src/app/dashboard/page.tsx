"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/base';
import {
    Users,
    CreditCard,
    BookOpen,
    ShieldCheck,
    Activity,
    ArrowUpRight,
    TrendingUp,
    Clock
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { DashboardStats } from '@/types';

export default function DashboardOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/overview')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Activity className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    const COLORS = ['#3b82f6', '#ef4444'];

    const kpis = [
        { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Subs', value: stats?.activeSubscriptions || 0, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Expired Subs', value: stats?.expiredSubscriptions || 0, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Content Items', value: stats?.totalContentItems || 0, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Used Codes', value: stats?.usedAccessCodes || 0, icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                <p className="text-slate-500 mt-1 text-sm lg:text-base">Platform performance and latest metrics.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {kpis.map((kpi, idx) => (
                    <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow transition-transform hover:-translate-y-1">
                        <CardContent className="p-4 lg:p-6">
                            <div className="flex items-center justify-between">
                                <div className={cn("p-2 rounded-lg", kpi.bg)}>
                                    <kpi.icon className={cn("w-5 h-5 lg:w-6 lg:h-6", kpi.color)} />
                                </div>
                                {/* <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  12%
                </span> */}
                            </div>
                            <div className="mt-3 lg:mt-4">
                                <p className="text-xs lg:text-sm font-medium text-slate-500">{kpi.label}</p>
                                <h3 className="text-xl lg:text-2xl font-bold text-slate-900 mt-1">{kpi.value.toLocaleString()}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                                <span className="hidden sm:inline">New Student Registrations</span>
                                <span className="sm:hidden">New Students</span>
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[250px] lg:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.newUsersTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base lg:text-lg">Subscription Health</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] lg:h-[300px] flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={stats?.subscriptionStatusBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.subscriptionStatusBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-xs text-slate-500 font-medium">Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-xs text-slate-500 font-medium">Expired</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base lg:text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 lg:space-y-6">
                        {stats?.recentActivity.map((activity) => (
                            <div key={activity.id} className="flex gap-3 lg:gap-4 group">
                                <div className={cn(
                                    "w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                    activity.type === 'PROFILE' ? 'bg-blue-100 text-blue-600' :
                                        activity.type === 'CONTENT' ? 'bg-purple-100 text-purple-600' :
                                            'bg-green-100 text-green-600'
                                )}>
                                    <Activity className="w-4 h-4 lg:w-5 lg:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs lg:text-sm font-semibold text-slate-900">{activity.description}</p>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span className="truncate">{new Date(activity.timestamp).toLocaleString()}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper function that was imported from UI base but not in this scope
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
