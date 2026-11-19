'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { api, getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Search, Loader2, ClipboardList } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import type { DailyLogWithRelations, Department } from '@/types/api';

export default function DailyLogsPage() {
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    workerSearch: '',
  });

  useEffect(() => {
    api.get<Department[]>('/departments').then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const params: any = {};
        if (filters.date) params.date = filters.date;
        if (filters.departmentId) params.departmentId = filters.departmentId;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.workerSearch) params.workerSearch = filters.workerSearch;
        const { data } = await api.get<DailyLogWithRelations[]>('/daily-logs', { params });
        setLogs(data);
      } catch (error) {
        toast.error('فشل تحميل السجلات', { description: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadLogs, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">السجل اليومي</h1>
          <p className="text-sm text-muted-foreground mt-1">سجلات إنتاج العمال اليومية</p>
        </div>
        <Link href="/dashboard/daily-logs/new">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            إضافة سجل جديد
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">فلترة النتائج</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">كود أو اسم العامل</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالعامل..."
                  value={filters.workerSearch}
                  onChange={(e) => setFilters({ ...filters, workerSearch: e.target.value })}
                  className="pr-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">القسم</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.departmentId}
                onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
              >
                <option value="">كل الأقسام</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">تاريخ محدد</label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">من تاريخ</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">إلى تاريخ</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
          {(filters.workerSearch || filters.date || filters.departmentId || filters.startDate || filters.endDate) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setFilters({ date: '', departmentId: '', startDate: '', endDate: '', workerSearch: '' })}
            >
              مسح الفلاتر
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة السجلات ({logs.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>لا توجد سجلات مطابقة</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>العامل</TableHead>
                    <TableHead>المهمة</TableHead>
                    <TableHead>القسم</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>الهدر</TableHead>
                    <TableHead>التقييم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.logDate)}</TableCell>
                      <TableCell className="font-medium">{log.worker?.name || '-'}</TableCell>
                      <TableCell>{log.task?.name || '-'}</TableCell>
                      <TableCell className="text-xs">{log.worker?.department?.name || '-'}</TableCell>
                      <TableCell>{log.quantityProduced ? formatNumber(Number(log.quantityProduced)) : '-'}</TableCell>
                      <TableCell>
                        {log.wasteQuantity ? (
                          <Badge variant="destructive">{formatNumber(Number(log.wasteQuantity))}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {log.grades ? (
                          <Badge variant="secondary">{log.grades.totalScore}/40</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>
                          {log.status === 'completed' ? 'مكتمل' : log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/daily-logs/${log.id}`}>
                          <Button variant="ghost" size="sm">عرض</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
