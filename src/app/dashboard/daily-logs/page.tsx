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
import { Plus, Search, Loader2, ClipboardList, FileSpreadsheet, Upload } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import type { DailyLogWithRelations, Department, Worker, Task, Equipment, Shift } from '@/types/api';
import { exportToExcel } from '@/lib/excel';
import { ExcelImportDialog } from '@/components/common/ExcelImportDialog';

export default function DailyLogsPage() {
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workersList, setWorkersList] = useState<Worker[]>([]);
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [shiftsList, setShiftsList] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    workerSearch: '',
  });

  const loadLogs = async () => {
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
  };

  useEffect(() => {
    api.get<Department[]>('/departments').then(({ data }) => setDepartments(data)).catch(() => {});
    api.get<Worker[]>('/workers').then(({ data }) => setWorkersList(data)).catch(() => {});
    api.get<Task[]>('/tasks?includeInactive=true').then(({ data }) => setTasksList(data)).catch(() => {});
    api.get<Equipment[]>('/equipment').then(({ data }) => setEquipmentList(data)).catch(() => {});
    api.get<Shift[]>('/shifts').then(({ data }) => setShiftsList(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadLogs, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleExportDailyLogs = () => {
    try {
      exportToExcel({
        data: logs,
        fileName: 'السجل_اليومي_للإنتاج',
        sheetName: 'السجل اليومي',
        columns: [
          {
            key: 'logDate',
            header: 'التاريخ',
            format: (val) => formatDate(val),
          },
          { key: 'department.name', header: 'القسم' },
          { key: 'shift.name', header: 'الوردية' },
          { key: 'worker.code', header: 'كود العامل' },
          { key: 'worker.name', header: 'اسم العامل' },
          { key: 'task.name', header: 'المهمة' },
          { key: 'equipment.name', header: 'المعدة' },
          { key: 'producedQuantity', header: 'كمية الإنتاج' },
          { key: 'wasteQuantity', header: 'كمية الهدر' },
          {
            key: 'wastePercentage',
            header: 'نسبة الهدر %',
            format: (val) => `${Number(val || 0).toFixed(2)}%`,
          },
          { key: 'grades.qualityScore', header: 'تقييم الجودة (10)' },
          { key: 'grades.speedScore', header: 'تقييم السرعة (10)' },
          { key: 'grades.cleanlinessScore', header: 'تقييم النظافة (10)' },
          { key: 'grades.recipeScore', header: 'تقييم الوصفة (10)' },
          { key: 'grades.totalScore', header: 'التقييم الكلي (40)' },
          {
            key: 'status',
            header: 'الحالة',
            format: (val) => (val === 'completed' ? 'مكتمل' : val === 'approved' ? 'معتمد' : 'مسودة'),
          },
          { key: 'notes', header: 'ملاحظات' },
        ],
      });
      toast.success('تم تصدير سجلات الإنتاج بنجاح');
    } catch (err: any) {
      toast.error(err?.message || 'فشل تصدير السجلات');
    }
  };

  const handleImportDailyLogs = async (rows: Record<string, any>[]) => {
    const payload = rows.map((row) => {
      const rawWorker = String(row['كود العامل'] || row['العامل'] || '').trim();
      const matchedWorker = workersList.find((w) => w.code.trim() === rawWorker || w.name.trim() === rawWorker);

      const rawTask = String(row['كود المهمة'] || row['المهمة'] || '').trim();
      const matchedTask = tasksList.find((t) => t.code.trim() === rawTask || t.name.trim() === rawTask);

      const rawEquip = String(row['كود المعدة'] || row['المعدة'] || '').trim();
      const matchedEquip = equipmentList.find((e) => e.code.trim() === rawEquip || e.name.trim() === rawEquip);

      const rawShift = String(row['الوردية'] || row['كود الوردية'] || '').trim();
      const matchedShift = shiftsList.find((s) => s.code.trim() === rawShift || s.name.trim() === rawShift);

      const producedQuantity = Number(row['كمية الإنتاج'] || row['الإنتاج'] || 0);
      const wasteQuantity = Number(row['كمية الهدر'] || row['الهدر'] || 0);
      const totalProduced = producedQuantity + wasteQuantity;
      const wastePercentage = totalProduced > 0 ? (wasteQuantity / totalProduced) * 100 : 0;

      const qScore = Number(row['تقييم الجودة (10)'] || row['تقييم الجودة'] || row['الجودة'] || 10);
      const sScore = Number(row['تقييم السرعة (10)'] || row['تقييم السرعة'] || row['السرعة'] || 10);
      const cScore = Number(row['تقييم النظافة (10)'] || row['تقييم النظافة'] || row['النظافة'] || 10);
      const rScore = Number(row['تقييم الوصفة (10)'] || row['تقييم الوصفة'] || row['الوصفة'] || 10);

      const statusMap: Record<string, string> = {
        'مكتمل': 'completed',
        'completed': 'completed',
        'معتمد': 'approved',
        'approved': 'approved',
        'مسودة': 'draft',
        'draft': 'draft',
      };
      const rawStatus = String(row['الحالة'] || 'completed').trim();

      const logDateStr = row['التاريخ'] ? new Date(row['التاريخ']).toISOString() : new Date().toISOString();

      return {
        logDate: logDateStr,
        departmentId: matchedWorker?.departmentId || matchedTask?.departmentId || Number(departments[0]?.id || 1),
        shiftId: matchedShift?.id || Number(shiftsList[0]?.id || 1),
        workerId: matchedWorker ? matchedWorker.id : Number(workersList[0]?.id || 1),
        taskId: matchedTask ? matchedTask.id : Number(tasksList[0]?.id || 1),
        equipmentId: matchedEquip?.id,
        producedQuantity,
        wasteQuantity,
        wastePercentage,
        status: statusMap[rawStatus] || 'completed',
        notes: String(row['ملاحظات'] || '').trim() || undefined,
        grades: {
          qualityScore: Math.min(Math.max(qScore, 0), 10),
          speedScore: Math.min(Math.max(sScore, 0), 10),
          cleanlinessScore: Math.min(Math.max(cScore, 0), 10),
          recipeScore: Math.min(Math.max(rScore, 0), 10),
        },
      };
    });

    const { data } = await api.post('/daily-logs/bulk', payload);
    return {
      success: data.successCount,
      failed: data.failedCount,
      errors: data.errors,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">السجل اليومي</h1>
          <p className="text-sm text-muted-foreground mt-1">سجلات إنتاج العمال اليومية</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-sm shrink-0">
            {logs.length} سجل
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDailyLogs}
            className="gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            تصدير Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="gap-2 border-blue-600/30 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            استيراد Excel
          </Button>
          <Link href="/dashboard/daily-logs/new">
            <Button size="sm">
              <Plus className="ml-1 h-4 w-4" />
              إضافة سجل
            </Button>
          </Link>
        </div>
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

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="استيراد السجل اليومي من ملف Excel"
        description="قم برفع ملف Excel لإضافة سجلات الإنتاج دفعة واحدة مع درجات الجودة"
        templateFileName="نموذج_استيراد_السجل_اليومي"
        templateColumns={[
          { header: 'التاريخ', sample: '2026-11-22' },
          { header: 'كود العامل', sample: workersList[0]?.code || 'W-001' },
          { header: 'كود المهمة', sample: tasksList[0]?.code || 'TSK-001' },
          { header: 'كود المعدة', sample: equipmentList[0]?.code || 'EQ-001' },
          { header: 'الوردية', sample: shiftsList[0]?.name || 'صباحية' },
          { header: 'كمية الإنتاج', sample: 150 },
          { header: 'كمية الهدر', sample: 5 },
          { header: 'تقييم الجودة (10)', sample: 9 },
          { header: 'تقييم السرعة (10)', sample: 8 },
          { header: 'تقييم النظافة (10)', sample: 10 },
          { header: 'تقييم الوصفة (10)', sample: 9 },
          { header: 'الحالة', sample: 'مكتمل' },
          { header: 'ملاحظات', sample: 'إنتاج مطابق للمواصفات' },
        ]}
        onImport={handleImportDailyLogs}
        onSuccess={loadLogs}
      />
    </div>
  );
}
