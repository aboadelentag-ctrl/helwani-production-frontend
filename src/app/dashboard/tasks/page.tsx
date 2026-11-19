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
import { Search, ListTodo, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Task, Department } from '@/types/api';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    departmentId: '',
    expectedTimeMinutes: '',
    standardQuantity: '',
    unit: 'قطعة',
    isActive: true,
  });

  const loadTasks = async () => {
    try {
      const params: any = { includeInactive: true };
      if (selectedDeptFilter) params.departmentId = selectedDeptFilter;
      const { data } = await api.get<Task[]>('/tasks', { params });
      setTasks(data);
    } catch (error) {
      toast.error('فشل تحميل المهام', { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get<Department[]>('/departments').then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedDeptFilter]);

  const filteredTasks = tasks.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(s) ||
      t.code.toLowerCase().includes(s)
    );
  });

  const openAddDialog = () => {
    setEditingTask(null);
    setFormData({
      code: '',
      name: '',
      departmentId: departments[0]?.id?.toString() || '',
      expectedTimeMinutes: '',
      standardQuantity: '',
      unit: 'قطعة',
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      code: task.code,
      name: task.name,
      departmentId: task.departmentId?.toString() || '',
      expectedTimeMinutes: task.expectedTimeMinutes?.toString() || '',
      standardQuantity: task.standardQuantity?.toString() || '',
      unit: task.unit || 'قطعة',
      isActive: task.isActive ?? true,
    });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (task: Task) => {
    setDeletingTask(task);
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
        expectedTimeMinutes: formData.expectedTimeMinutes ? Number(formData.expectedTimeMinutes) : undefined,
        standardQuantity: formData.standardQuantity ? Number(formData.standardQuantity) : undefined,
        unit: formData.unit.trim() || undefined,
        isActive: formData.isActive,
      };

      if (editingTask) {
        await api.patch(`/tasks/${editingTask.id}`, payload);
        toast.success('تم تعديل بيانات المهمة بنجاح');
      } else {
        await api.post('/tasks', payload);
        toast.success('تمت إضافة المهمة بنجاح');
      }

      setIsFormOpen(false);
      loadTasks();
    } catch (error) {
      toast.error(editingTask ? 'فشل تعديل المهمة' : 'فشل إضافة المهمة', {
        description: getErrorMessage(error),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    setActionLoading(true);
    try {
      await api.delete(`/tasks/${deletingTask.id}`);
      toast.success('تم حذف / تعطيل المهمة بنجاح');
      setIsDeleteOpen(false);
      loadTasks();
    } catch (error) {
      toast.error('فشل حذف المهمة', { description: getErrorMessage(error) });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المهام</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة وتحديد مهام الإنتاج المعيارية لكل قسم</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm shrink-0">
            {filteredTasks.length} مهمة
          </Badge>
          <Button onClick={openAddDialog}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة مهمة جديدة
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم أو كود المهمة..."
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
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListTodo className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>لا توجد مهام مطابقة</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>اسم المهمة</TableHead>
                    <TableHead>القسم</TableHead>
                    <TableHead>الوقت المعياري</TableHead>
                    <TableHead>الكمية المعيارية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono text-xs font-semibold">{task.code}</TableCell>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>{task.department?.name || '-'}</TableCell>
                      <TableCell>{task.expectedTimeMinutes ? `${task.expectedTimeMinutes} دقيقة` : '-'}</TableCell>
                      <TableCell>
                        {task.standardQuantity ? `${task.standardQuantity} ${task.unit || ''}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={task.isActive ? 'default' : 'secondary'}>
                          {task.isActive ? 'نشطة' : 'معطلة'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(task)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(task)}
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

      {/* Add / Edit Task Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'تعديل بيانات المهمة' : 'إضافة مهمة جديدة'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-code">كود المهمة *</Label>
                <Input
                  id="task-code"
                  placeholder="مثال: TSK-081"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-dept">القسم *</Label>
                <select
                  id="task-dept"
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
              <Label htmlFor="task-name">اسم المهمة *</Label>
              <Input
                id="task-name"
                placeholder="أدخل اسم المهمة..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-time">الوقت المتوقع (بالدقائق)</Label>
                <Input
                  id="task-time"
                  type="number"
                  min="0"
                  placeholder="مثال: 45"
                  value={formData.expectedTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, expectedTimeMinutes: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-qty">الكمية المعيارية</Label>
                <Input
                  id="task-qty"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="مثال: 50"
                  value={formData.standardQuantity}
                  onChange={(e) => setFormData({ ...formData, standardQuantity: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-unit">وحدة القياس</Label>
                <Input
                  id="task-unit"
                  placeholder="مثال: قطعة، كجم، صينية..."
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-status">الحالة</Label>
                <select
                  id="task-status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                >
                  <option value="true">نشطة</option>
                  <option value="false">معطلة</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {editingTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد حذف المهمة</DialogTitle>
          </DialogHeader>
          <div className="py-3 text-sm text-muted-foreground">
            هل أنت متأكد من رغبتك في حذف / تعطيل المهمة{' '}
            <span className="font-bold text-foreground">{deletingTask?.name}</span> ({deletingTask?.code})؟
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
    </div>
  );
}
