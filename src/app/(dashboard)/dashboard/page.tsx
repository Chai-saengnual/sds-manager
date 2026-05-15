'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Flame,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  FileX,
  Sparkles,
  ArrowRight,
  Plus,
  Download,
  Upload,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/header';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  totalProducts: number;
  flammableProducts: number;
  nonFlammableProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  overdueReviews: number;
  expiringThisMonth: number;
  missingPdfs: number;
  aiAnalyzedCount: number;
}

interface RecentActivity {
  id: string;
  action: string;
  description: string | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
  sdsRecord: { productNameEn: string } | null;
}

interface CategoryDistribution {
  name: string;
  color: string;
  count: number;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity);
          setCategoryDistribution(data.categoryDistribution);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: t('dashboard.totalProducts'),
      value: stats?.totalProducts ?? 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: t('dashboard.flammableProducts'),
      value: stats?.flammableProducts ?? 0,
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      title: t('dashboard.activeProducts'),
      value: stats?.activeProducts ?? 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: t('dashboard.inactiveProducts'),
      value: stats?.inactiveProducts ?? 0,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    },
    {
      title: t('dashboard.overdueReviews'),
      value: stats?.overdueReviews ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      urgent: (stats?.overdueReviews ?? 0) > 0,
    },
    {
      title: t('dashboard.expiringSoon'),
      value: stats?.expiringThisMonth ?? 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      warning: (stats?.expiringThisMonth ?? 0) > 0,
    },
    {
      title: t('dashboard.missingPdfs'),
      value: stats?.missingPdfs ?? 0,
      icon: FileX,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'AI Analyzed',
      value: stats?.aiAnalyzedCount ?? 0,
      icon: Sparkles,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    },
  ];

  const quickActions = [
    { href: '/sds/new', icon: Plus, label: t('sds.addNew'), color: 'bg-primary' },
    { href: '/sds?filter=overdue', icon: AlertTriangle, label: t('dashboard.overdueReviews'), color: 'bg-red-500' },
    { href: '/sds?filter=expiring', icon: Clock, label: t('dashboard.expiringSoon'), color: 'bg-yellow-500' },
    { href: '/export', icon: Download, label: t('export.title'), color: 'bg-blue-500' },
    { href: '/ai-agent', icon: Sparkles, label: 'AI Update Agent', color: 'bg-indigo-500' },
    { href: '/admin/audit-logs', icon: BarChart3, label: t('admin.auditLogs'), color: 'bg-gray-500' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.welcome')}! Here&apos;s your SDS overview.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/sds/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('sds.addNew')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/export">
                <Download className="mr-2 h-4 w-4" />
                {t('export.title')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className={stat.urgent ? 'border-red-200 dark:border-red-800' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.urgent && (
                  <Badge variant="destructive" className="mt-2">
                    Needs attention
                  </Badge>
                )}
                {stat.warning && stat.value > 0 && (
                  <Badge variant="warning" className="mt-2">
                    Review soon
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{t('dashboard.quickActions')}</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {quickActions.map((action, i) => (
                <Link key={i} href={action.href}>
                  <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Products by Category</CardTitle>
              <CardDescription>Distribution of SDS records across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryDistribution.length > 0 ? (
                  categoryDistribution.map((cat, i) => {
                    const percentage = stats?.totalProducts 
                      ? Math.round((cat.count / stats.totalProducts) * 100) 
                      : 0;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: cat.color }} 
                            />
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <span className="text-muted-foreground">{cat.count} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8">No categories yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            <CardDescription>Latest actions on SDS records</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="p-2 rounded-lg bg-muted">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {activity.description || `${activity.action} on ${activity.sdsRecord?.productNameEn || 'record'}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user?.name || activity.user?.email} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline">{activity.action}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/admin/audit-logs">
                  View all activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalProducts 
                  ? Math.round(((stats.totalProducts - (stats.overdueReviews + stats.missingPdfs)) / stats.totalProducts) * 100)
                  : 100}%
              </div>
              <Progress 
                value={stats?.totalProducts 
                  ? ((stats.totalProducts - (stats.overdueReviews + stats.missingPdfs)) / stats.totalProducts) * 100
                  : 100} 
                className="h-2 mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">Based on up-to-date records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Flammable Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalProducts && stats.totalProducts > 0
                  ? Math.round((stats.flammableProducts / stats.totalProducts) * 100)
                  : 0}%
              </div>
              <Progress 
                value={stats?.totalProducts && stats.totalProducts > 0
                  ? (stats.flammableProducts / stats.totalProducts) * 100
                  : 0} 
                className="h-2 mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.flammableProducts || 0} of {stats?.totalProducts || 0} products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">AI Adoption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalProducts && stats.totalProducts > 0
                  ? Math.round((stats.aiAnalyzedCount / stats.totalProducts) * 100)
                  : 0}%
              </div>
              <Progress 
                value={stats?.totalProducts && stats.totalProducts > 0
                  ? (stats.aiAnalyzedCount / stats.totalProducts) * 100
                  : 0} 
                className="h-2 mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.aiAnalyzedCount || 0} records analyzed
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}