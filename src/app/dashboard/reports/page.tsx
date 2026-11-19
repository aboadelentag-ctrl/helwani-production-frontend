'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, BarChart3 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { DepartmentComparison, WasteAnalysis, MonthlyReport } from '@/types/api';

const WASTE_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const [deptComparison, setDeptComparison] = useState<DepartmentComparison[]>([]);
  const [wasteAnalysis, setWasteAnalysis] = useState<WasteAnalysis | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [deptRes, wasteRes] = await Promise.all([
        api.get<DepartmentComparison[]>('/reports/department-comparison', {
          params: { startDate, endDate },
        }),
        api.get<WasteAnalysis>('/reports/waste-analysis', {
          params: { startDate, endDate },
        }),
      ]);
      setDeptComparison(deptRes.data);
      setWasteAnalysis(wasteRes.data);

      // Monthly report for current month
      const monthRes = await api.get<MonthlyReport>('/reports/monthly', {
        params: { year: today.getFullYear(), month: today.getMonth() + 1 },
      });
      setMonthlyReport(monthRes.data);
    } catch (error) {
      toast.error('فشل تحميل التقارير', { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deptData = deptComparison
    .filter((d) => d.totalProduced > 0)
    .map((d) => ({
      name: d.department.name.length > 15 ? d.department.name.substring(0, 15) + '...' : d.department.name,
      إنتاج: d.totalProduced,
      هدر: d.totalWaste,
    }));

  const wasteByReasonData = wasteAnalysis?.byReason.slice(0, 8).map((r) => ({
    name: r.reason.length > 20 ? r.reason.substring(0, 20) + '...' : r.reason,
    value: r.totalWaste,
  })) || [];

  const dailyData = monthlyReport?.dailyBreakdown.map((d) => ({
    date: d.date.split('-').slice(1).join('/'),
    إنتاج: d.totalProduced,
    هدر: d.totalWaste,
    'متوسط التقييم': d.avgGrade,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">التقارير</h1>
        <p className="text-sm text-muted-foreground mt-1">تقارير شاملة عن الإنتاج والأداء</p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader><CardTitle>نطاق التاريخ</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">من</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">إلى</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={loadReports} disabled={loading}>
              {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {wasteAnalysis && (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardHeader><CardDescription>إجمالي المنتج</CardDescription></CardHeader>
                <CardContent><p className="text-2xl font-bold">{formatNumber(wasteAnalysis.summary.totalProduced)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardDescription>إجمالي الهدر</CardDescription></CardHeader>
                <CardContent><p className="text-2xl font-bold text-red-600">{formatNumber(wasteAnalysis.summary.totalWaste)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardDescription>نسبة الهدر</CardDescription></CardHeader>
                <CardContent><p className="text-2xl font-bold text-orange-600">{wasteAnalysis.summary.wastePercentage}%</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardDescription>حوادث الهدر</CardDescription></CardHeader>
                <CardContent><p className="text-2xl font-bold">{wasteAnalysis.summary.wasteIncidentsCount}</p></CardContent>
              </Card>
            </div>
          )}

          {/* Department Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                مقارنة الإنتاج بين الأقسام
              </CardTitle>
              <CardDescription>إنتاج وهدر كل قسم في الفترة المحددة</CardDescription>
            </CardHeader>
            <CardContent>
              {deptData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <div className="h-[300px] sm:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="إنتاج" fill="#3b82f6" />
                      <Bar dataKey="هدر" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waste by Reason Pie */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع الهدر حسب السبب</CardTitle>
              <CardDescription>أبرز أسباب الهدر في الفترة المحددة</CardDescription>
            </CardHeader>
            <CardContent>
              {wasteByReasonData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات هدر</p>
              ) : (
                <div className="h-[300px] sm:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wasteByReasonData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${formatNumber(entry.value)}`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {wasteByReasonData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={WASTE_COLORS[index % WASTE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>تريند الإنتاج اليومي (الشهر الحالي)</CardTitle>
              <CardDescription>إنتاج وهدر كل يوم في {monthlyReport?.period}</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات لهذا الشهر</p>
              ) : (
                <div className="h-[300px] sm:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="إنتاج" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="هدر" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
