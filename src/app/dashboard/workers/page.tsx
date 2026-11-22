'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api, getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Search, Users, Loader2, Plus, Pencil, Trash2, FileSpreadsheet, Upload } from 'lucide-react';
import type { Worker, Department } from '@/types/api';
import { exportToExcel } from '@/lib/excel';
import { ExcelImportDialog } from '@/components/common/ExcelImportDialog';

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    departmentId: '',
    jobTitle: '',
    phone: '',
    hireDate: '',
    status: 'active',
  });

  const loadWorkers = async () => {
    try {
      const { data } = await api.get<Worker[]>('/workers', {
        params: search ? { search } : undefined,
      });
      setWorkers(data);
    } catch (error) {
      toast.error('فشل تحميل العمال', { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get<Department[]>('/departments').then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadWorkers, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const openAddDialog = () => {
    setEditingWorker(null);
    setFormData({
      code: '',
      name: '',
      departmentId: departments[0]?.id?.toString() || '',
      jobTitle: '',
      phone: '',
      hireDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    setIsFormOpen(true);
  };

  const openEditDialog = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      code: worker.code,
      name: worker.name,
      departmentId: worker.departmentId?.toString() || '',
      jobTitle: worker.jobTitle || '',
      phone: worker.phone || '',
      hireDate: worker.hireDate ? new Date(worker.hireDate).toISOString().split('T')[0] : '',
      status: worker.status || 'active',
    });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (worker: Worker) => {
    setDeletingWorker(worker);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.departmentId) {
      toast.error('يرجى ملء الحقول الإلزامية (الكود، الاسم، القسم)');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        departmentId: Number(formData.departmentId),
        jobTitle: formData.jobTitle.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        hireDate: formData.hireDate ? `${formData.hireDate}T00:00:00.000Z` : undefined,
        status: formData.status,
      };

      if (editingWorker) {
        await api.patch(`/workers/${editingWorker.id}`, payload);
        toast.success('تم تعديل بيانات العامل بنجاح');
      } else {
        await api.post('/workers', payload);
        toast.success('تمت إضافة العامل بنجاح');
      }

      setIsFormOpen(false);
      loadWorkers();
    } catch (error) {
      toast.error(editingWorker ? 'فشل تعديل العامل' : 'فشل إضافة العامل', {
        description: getErrorMessage(error),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingWorker) return;
    setActionLoading(true);
    try {
      await api.delete(`/workers/${deletingWorker.id}`);
      toast.success('تم حذف / تعطيل العامل بنجاح');
      setIsDeleteOpen(false);
      loadWorkers();
    } catch (error) {
      toast.error('فشل حذف العامل', { description: getErrorMessage(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportWorkers = () => {
    try {
      exportToExcel({
        data: workers,
        fileName: 'قائمة_العمال_حلواني',
        sheetName: 'العمال',
        columns: [
          { key: 'code', header: 'كود العامل' },
          { key: 'name', header: 'اسم العامل' },
          { key: 'department.name', header: 'القسم' },
          { key: 'jobTitle', header: 'المسمى الوظيفي' },
          { key: 'phone', header: 'رقم الهاتف' },
          {
            key: 'hireDate',
            header: 'تاريخ التعيين',
            format: (val) => (val ? new Date(val).toISOString().split('T')[0] : ''),
          },
          {
            key: 'status',
            header: 'الحالة',
            format: (val) =>
              val === 'active' ? 'نشط' : val === 'vacation' ? 'إجازة' : 'غير نشط',
          },
        ],
      });
      toast.success('تم تصدير ملف الإكسل بنجاح');
    } catch (err: any) {
      toast.error(err?.message || 'فشل التصدير');
    }
  };

  const handleImportWorkers = async (rows: Record<string, any>[]) => {
    const payload = rows.map((row) => {
      const deptNameOrCode = String(row['القسم'] || row['اسم القسم'] || row['كود القسم'] || '').trim();
      const matchedDept = departments.find(
        (d) =>
          d.name.trim() === deptNameOrCode ||
          d.code.trim() === deptNameOrCode ||
          d.name.includes(deptNameOrCode)
      );

      const statusMap: Record<string, string> = {
        'نشط': 'active',
        'active': 'active',
        'غير نشط': 'inactive',
        'inactive': 'inactive',
        'إجازة': 'vacation',
        'اجازة': 'vacation',
        'vacation': 'vacation',
      };
      const rawStatus = String(row['الحالة'] || 'active').trim();
      const status = statusMap[rawStatus] || 'active';

      return {
        code: String(row['كود العامل'] || row['الكود'] || '').trim(),
        name: String(row['اسم العامل'] || row['الاسم'] || '').trim(),
        departmentId: matchedDept ? matchedDept.id : Number(departments[0]?.id || 1),
        jobTitle: String(row['المسمى الوظيفي'] || row['الوظيفة'] || '').trim() || undefined,
        phone: String(row['رقم الهاتف'] || row['الهاتف'] || '').trim() || undefined,
        hireDate: row['تاريخ التعيين'] ? new Date(row['تاريخ التعيين']).toISOString() : undefined,
        status,
      };
    });

    const { data } = await api.post('/workers/bulk', payload);
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
          <h1 className="text-2xl font-bold">العمال</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة وتتبع عمال الإنتاج</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-sm shrink-0">
            {workers.length} عامل
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportWorkers}
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
          <Button onClick={openAddDialog} size="sm">
            <Plus className="ml-1 h-4 w-4" />
            إضافة عامل
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو الكود..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : workers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>لا يوجد عمال مطابقين للبحث</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>القسم</TableHead>
                    <TableHead>الوظيفة</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell className="font-mono text-xs font-semibold">{worker.code}</TableCell>
                      <TableCell className="font-medium">{worker.name}</TableCell>
                      <TableCell>{worker.department?.name || '-'}</TableCell>
                      <TableCell>{worker.jobTitle || '-'}</TableCell>
                      <TableCell dir="ltr" className="text-right text-xs text-muted-foreground">{worker.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={worker.status === 'active' ? 'default' : worker.status === 'vacation' ? 'secondary' : 'destructive'}
                        >
                          {worker.status === 'active' ? 'نشط' : worker.status === 'vacation' ? 'إجازة' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(worker)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(worker)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Worker Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWorker ? 'تعديل بيانات العامل' : 'إضافة عامل جديد'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="worker-code">كود العامل *</Label>
                <Input
                  id="worker-code"
                  placeholder="مثال: WRK-126"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="worker-dept">القسم *</Label>
                <select
                  id="worker-dept"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  required
                >
                  <option value="">اختر القسم</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="worker-name">اسم العامل بالكامل *</Label>
              <Input
                id="worker-name"
                placeholder="أدخل اسم العامل..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="worker-job">المسمى الوظيفي</Label>
                <Input
                  id="worker-job"
                  placeholder="مثال: خباز، عامل تعبئة..."
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="worker-phone">رقم الهاتف</Label>
                <Input
                  id="worker-phone"
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="worker-hireDate">تاريخ التعيين</Label>
                <Input
                  id="worker-hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="worker-status">الحالة</Label>
                <select
                  id="worker-status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">نشط</option>
                  <option value="vacation">إجازة</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {editingWorker ? 'حفظ التعديلات' : 'إضافة العامل'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد حذف العامل</DialogTitle>
          </DialogHeader>
          <div className="py-3 text-sm text-muted-foreground">
            هل أنت متأكد من رغبتك في حذف / تعطيل العامل{' '}
            <span className="font-bold text-foreground">{deletingWorker?.name}</span> ({deletingWorker?.code})؟
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تأكيد الحذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="استيراد العمال من ملف Excel"
        description="قم برفع ملف Excel لإضافة مجموعة من العمال الجدد لقاعدة البيانات دفعة واحدة"
        templateFileName="نموذج_استيراد_العمال"
        templateColumns={[
          { header: 'كود العامل', sample: 'W-901' },
          { header: 'اسم العامل', sample: 'محمود عبد الرحيم' },
          { header: 'القسم', sample: departments[0]?.name || 'عربي - قلي' },
          { header: 'المسمى الوظيفي', sample: 'شيف قلي' },
          { header: 'رقم الهاتف', sample: '01012345678' },
          { header: 'تاريخ التعيين', sample: '2026-01-15' },
          { header: 'الحالة', sample: 'نشط' },
        ]}
        onImport={handleImportWorkers}
        onSuccess={loadWorkers}
      />
    </div>
  );
}
