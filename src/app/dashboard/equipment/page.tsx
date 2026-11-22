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
import { Search, Wrench, Loader2, Plus, Pencil, Trash2, ArrowLeftRight, FileSpreadsheet, Upload } from 'lucide-react';
import type { Equipment, Department } from '@/types/api';
import { exportToExcel } from '@/lib/excel';
import { ExcelImportDialog } from '@/components/common/ExcelImportDialog';

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [transferringEquipment, setTransferringEquipment] = useState<Equipment | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    departmentId: '',
    model: '',
    serialNumber: '',
    status: 'active',
  });

  const loadEquipment = async () => {
    try {
      const params: any = {};
      if (selectedDeptFilter) params.departmentId = selectedDeptFilter;
      const { data } = await api.get<Equipment[]>('/equipment', { params });
      setEquipment(data);
    } catch (error) {
      toast.error('فشل تحميل المعدات', { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get<Department[]>('/departments').then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [selectedDeptFilter]);

  const filteredEquipment = equipment.filter((eq) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      eq.name.toLowerCase().includes(s) ||
      eq.code.toLowerCase().includes(s) ||
      (eq.model && eq.model.toLowerCase().includes(s))
    );
  });

  const openAddDialog = () => {
    setEditingEquipment(null);
    setFormData({
      code: '',
      name: '',
      departmentId: departments[0]?.id?.toString() || '',
      model: '',
      serialNumber: '',
      status: 'active',
    });
    setIsFormOpen(true);
  };

  const openEditDialog = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormData({
      code: eq.code,
      name: eq.name,
      departmentId: eq.departmentId?.toString() || '',
      model: eq.model || '',
      serialNumber: eq.serialNumber || '',
      status: eq.status || 'active',
    });
    setIsFormOpen(true);
  };

  const openTransferDialog = (eq: Equipment) => {
    setTransferringEquipment(eq);
    setTargetDepartmentId('');
    setIsTransferOpen(true);
  };

  const openDeleteDialog = (eq: Equipment) => {
    setDeletingEquipment(eq);
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
        model: formData.model.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        status: formData.status,
      };

      if (editingEquipment) {
        await api.patch(`/equipment/${editingEquipment.id}`, payload);
        toast.success('تم تعديل بيانات المعدة بنجاح');
      } else {
        await api.post('/equipment', payload);
        toast.success('تمت إضافة المعدة بنجاح');
      }

      setIsFormOpen(false);
      loadEquipment();
    } catch (error) {
      toast.error(editingEquipment ? 'فشل تعديل المعدة' : 'فشل إضافة المعدة', {
        description: getErrorMessage(error),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringEquipment || !targetDepartmentId) {
      toast.error('يرجى اختيار القسم الجديد المراد النقل إليه');
      return;
    }

    if (Number(targetDepartmentId) === transferringEquipment.departmentId) {
      toast.error('المعدة موجودة بالفعل في هذا القسم');
      return;
    }

    setActionLoading(true);
    try {
      await api.patch(`/equipment/${transferringEquipment.id}`, {
        departmentId: Number(targetDepartmentId),
      });
      const targetDeptName = departments.find((d) => d.id === Number(targetDepartmentId))?.name || '';
      toast.success(`تم نقل المعدة بنجاح إلى قسم: ${targetDeptName}`);
      setIsTransferOpen(false);
      loadEquipment();
    } catch (error) {
      toast.error('فشل نقل المعدة', { description: getErrorMessage(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEquipment) return;
    setActionLoading(true);
    try {
      await api.delete(`/equipment/${deletingEquipment.id}`);
      toast.success('تم حذف / إحالة المعدة للتقاعد بنجاح');
      setIsDeleteOpen(false);
      loadEquipment();
    } catch (error) {
      toast.error('فشل حذف المعدة', { description: getErrorMessage(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportEquipment = () => {
    try {
      exportToExcel({
        data: filteredEquipment,
        fileName: 'قائمة_المعدات_حلواني',
        sheetName: 'المعدات',
        columns: [
          { key: 'code', header: 'كود المعدة' },
          { key: 'name', header: 'اسم المعدة' },
          { key: 'department.name', header: 'القسم' },
          { key: 'model', header: 'الموديل' },
          { key: 'serialNumber', header: 'الرقم التسلسلي' },
          {
            key: 'status',
            header: 'الحالة',
            format: (val) =>
              val === 'active' ? 'نشطة' : val === 'maintenance' ? 'تحت الصيانة' : 'خارج الخدمة',
          },
        ],
      });
      toast.success('تم تصدير ملف الإكسل بنجاح');
    } catch (err: any) {
      toast.error(err?.message || 'فشل التصدير');
    }
  };

  const handleImportEquipment = async (rows: Record<string, any>[]) => {
    const payload = rows.map((row) => {
      const deptNameOrCode = String(row['القسم'] || row['اسم القسم'] || row['كود القسم'] || '').trim();
      const matchedDept = departments.find(
        (d) =>
          d.name.trim() === deptNameOrCode ||
          d.code.trim() === deptNameOrCode ||
          d.name.includes(deptNameOrCode)
      );

      const statusMap: Record<string, string> = {
        'نشطة': 'active',
        'نشط': 'active',
        'active': 'active',
        'تحت الصيانة': 'maintenance',
        'صيانة': 'maintenance',
        'maintenance': 'maintenance',
        'خارج الخدمة': 'retired',
        'retired': 'retired',
      };
      const rawStatus = String(row['الحالة'] || 'active').trim();
      const status = statusMap[rawStatus] || 'active';

      return {
        code: String(row['كود المعدة'] || row['الكود'] || '').trim(),
        name: String(row['اسم المعدة'] || row['الاسم'] || '').trim(),
        departmentId: matchedDept ? matchedDept.id : Number(departments[0]?.id || 1),
        model: String(row['الموديل'] || '').trim() || undefined,
        serialNumber: String(row['الرقم التسلسلي'] || row['السيريال'] || '').trim() || undefined,
        status,
      };
    });

    const { data } = await api.post('/equipment/bulk', payload);
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
          <h1 className="text-2xl font-bold">المعدات</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة ومتابعة معدات الإنتاج</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-sm shrink-0">
            {filteredEquipment.length} معدة
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportEquipment}
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
            إضافة معدة
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو الكود أو الموديل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
              >
                <option value="">كل الأقسام</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>لا توجد معدات مطابقة</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>القسم الحالي</TableHead>
                    <TableHead>الموديل</TableHead>
                    <TableHead>الرقم التسلسلي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((eq) => (
                    <TableRow key={eq.id}>
                      <TableCell className="font-mono text-xs font-semibold">{eq.code}</TableCell>
                      <TableCell className="font-medium">{eq.name}</TableCell>
                      <TableCell>{eq.department?.name || '-'}</TableCell>
                      <TableCell>{eq.model || '-'}</TableCell>
                      <TableCell dir="ltr" className="text-right font-mono text-xs text-muted-foreground">{eq.serialNumber || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={eq.status === 'active' ? 'default' : eq.status === 'under_maintenance' ? 'destructive' : 'secondary'}>
                          {eq.status === 'active' ? 'تعمل' : eq.status === 'under_maintenance' ? 'صيانة' : 'متقاعد'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTransferDialog(eq)}
                            className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="نقل إلى قسم آخر"
                          >
                            <ArrowLeftRight className="ml-1 h-3.5 w-3.5" />
                            نقل
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(eq)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(eq)}
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

      {/* Add / Edit Equipment Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEquipment ? 'تعديل بيانات المعدة' : 'إضافة معدة جديدة'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="eq-code">كود المعدة *</Label>
                <Input
                  id="eq-code"
                  placeholder="مثال: EQ-040"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eq-dept">القسم *</Label>
                <select
                  id="eq-dept"
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
              <Label htmlFor="eq-name">اسم المعدة *</Label>
              <Input
                id="eq-name"
                placeholder="أدخل اسم المعدة..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="eq-model">الموديل</Label>
                <Input
                  id="eq-model"
                  placeholder="مثال: Rotary 2024"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eq-serial">الرقم التسلسلي</Label>
                <Input
                  id="eq-serial"
                  placeholder="SN-xxxxx"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="eq-status">الحالة</Label>
              <select
                id="eq-status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">تعمل (نشطة)</option>
                <option value="under_maintenance">تحت الصيانة</option>
                <option value="retired">متقاعدة / خارج الخدمة</option>
              </select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {editingEquipment ? 'حفظ التعديلات' : 'إضافة المعدة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Equipment Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>نقل المعدة إلى قسم آخر</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleTransfer} className="space-y-4 py-2">
            <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">المعدة:</span> <span className="font-semibold">{transferringEquipment?.name}</span> ({transferringEquipment?.code})</p>
              <p><span className="text-muted-foreground">القسم الحالي:</span> <span className="font-semibold">{transferringEquipment?.department?.name || 'غير محدد'}</span></p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transfer-dept">اختر القسم الجديد المنقولة إليه *</Label>
              <select
                id="transfer-dept"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={targetDepartmentId}
                onChange={(e) => setTargetDepartmentId(e.target.value)}
                required
              >
                <option value="">اختر القسم الجديد</option>
                {departments
                  .filter((d) => d.id !== transferringEquipment?.departmentId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
              </select>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={actionLoading || !targetDepartmentId} className="bg-emerald-600 hover:bg-emerald-700">
                {actionLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تأكيد النقل
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد حذف المعدة</DialogTitle>
          </DialogHeader>
          <div className="py-3 text-sm text-muted-foreground">
            هل أنت متأكد من رغبتك في حذف / إحالة المعدة{' '}
            <span className="font-bold text-foreground">{deletingEquipment?.name}</span> ({deletingEquipment?.code}) للتقاعد؟
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
        title="استيراد المعدات من ملف Excel"
        description="قم برفع ملف Excel لإضافة مجموعة من معدات الإنتاج دفعة واحدة"
        templateFileName="نموذج_استيراد_المعدات"
        templateColumns={[
          { header: 'كود المعدة', sample: 'EQ-801' },
          { header: 'اسم المعدة', sample: 'خلاط شوكولاتة سريع' },
          { header: 'القسم', sample: departments[0]?.name || 'عربي - قلي' },
          { header: 'الموديل', sample: 'ChocoMix-2026' },
          { header: 'الرقم التسلسلي', sample: 'SN-998822' },
          { header: 'الحالة', sample: 'نشطة' },
        ]}
        onImport={handleImportEquipment}
        onSuccess={loadEquipment}
      />
    </div>
  );
}
