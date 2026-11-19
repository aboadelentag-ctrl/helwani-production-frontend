'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Package, AlertCircle, Users, TrendingUp, Award } from 'lucide-react';
import type { DashboardKpis } from '@/types/api';
import { formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKpis() {
      try {
        const { data } = await api.get<DashboardKpis>('/reports/dashboard');
        setKpis(data);
      } catch (error) {
        toast.error('فشل تحميل البيانات', { description: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    }
    loadKpis();
  }, []);

  if (loading) {
    return <div className="text-center text-muted-foreground p-8">جاري التحميل...</div>;
  }

  if (!kpis) {
    return <div className="text-center text-muted-foreground p-8">لا توجد بيانات</div>;
  }

  const kpiCards = [
    {
      title: 'إنتاج اليوم',
      value: formatNumber(kpis.production.totalProducedToday),
      subtitle: `${kpis.production.totalLogsToday} سجل إنتاجي`,
      icon: Package,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'نسبة الهدر',
      value: `${kpis.production.wastePercentageToday}%`,
      subtitle: `${formatNumber(kpis.production.totalWasteToday)} وحدة هدر`,
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      title: 'متوسط التقييم',
      value: `${kpis.production.avgGradeToday}`,
      subtitle: 'من 40',
      icon: Award,
      color: 'text-green-600 bg-green-50',
    },
    {
      title: 'العمال النشطين',
      value: formatNumber(kpis.operations.activeWorkersToday),
      subtitle: `من ${formatNumber(kpis.operations.totalWorkers)}`,
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'أعطال مفتوحة',
      value: formatNumber(kpis.maintenance.openIssues),
      subtitle: 'تحتاج متابعة',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground mt-1">
          نظرة عامة على إنتاج يوم {new Date(kpis.date).toLocaleDateString('ar-EG')}
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  {card.title}
                </CardTitle>
                <div className={`rounded-md p-1.5 shrink-0 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{card.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ملخص الإنتاج</CardTitle>
            <CardDescription>تفاصيل إنتاج اليوم</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">إجمالي المنتج</span>
              <span className="font-semibold">{formatNumber(kpis.production.totalProducedToday)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">إجمالي الهدر</span>
              <span className="font-semibold">{formatNumber(kpis.production.totalWasteToday)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">نسبة الهدر</span>
              <span className="font-semibold">{kpis.production.wastePercentageToday}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">عدد السجلات</span>
              <span className="font-semibold">{kpis.production.totalLogsToday}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>العمليات</CardTitle>
            <CardDescription>حالة العمليات اليوم</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">العمال الحاضرون</span>
              <span className="font-semibold">
                {formatNumber(kpis.operations.activeWorkersToday)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">إجمالي العمال</span>
              <span className="font-semibold">{formatNumber(kpis.operations.totalWorkers)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">نسبة الحضور</span>
              <span className="font-semibold">{kpis.operations.attendanceRateToday}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">أعطال مفتوحة</span>
              <span className="font-semibold text-red-600">
                {kpis.maintenance.openIssues}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
