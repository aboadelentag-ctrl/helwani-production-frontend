'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { api, getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Save, Loader2, X, Upload, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import type { Department, Worker, Task, Equipment, Shift, CreateDailyLogPayload } from '@/types/api';

export default function NewDailyLogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    departmentId: '',
    shiftId: '',
    workerId: '',
    taskId: '',
    equipmentId: '',
    logDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    quantityProduced: '',
    wasteQuantity: '',
    wasteReason: '',
    notes: '',
    qualityScore: '',
    speedScore: '',
    cleanlinessScore: '',
    recipeScore: '',
  });

  useEffect(() => {
    Promise.all([
      api.get<Department[]>('/departments'),
      api.get<Shift[]>('/shifts'),
    ]).then(([deptRes, shiftRes]) => {
      setDepartments(deptRes.data);
      setShifts(shiftRes.data);
    }).catch((error) => {
      toast.error('فشل تحميل البيانات الأولية', { description: getErrorMessage(error) });
    });
  }, []);

  // When department changes, fetch workers, tasks, equipment for that department
  const fetchDepartmentData = useCallback(async (departmentId: number) => {
    try {
      const [workersRes, tasksRes, equipRes] = await Promise.all([
        api.get<Worker[]>(`/workers/department/${departmentId}`),
        api.get<Task[]>(`/tasks/department/${departmentId}`),
        api.get<Equipment[]>(`/equipment/department/${departmentId}`),
      ]);
      setWorkers(workersRes.data);
      setTasks(tasksRes.data);
      setEquipment(equipRes.data);
    } catch (error) {
      toast.error('فشل تحميل بيانات القسم', { description: getErrorMessage(error) });
    }
  }, []);

  const handleDepartmentChange = (departmentId: string) => {
    setForm((prev) => ({ ...prev, departmentId, workerId: '', taskId: '', equipmentId: '' }));
    setWorkers([]);
    setTasks([]);
    setEquipment([]);
    if (departmentId) {
      fetchDepartmentData(Number(departmentId));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.departmentId || !form.shiftId || !form.workerId || !form.taskId) {
      toast.error('يرجى ملء الحقول الإلزامية');
      return;
    }

    setLoading(true);
    try {
      // Build the payload
      const payload: CreateDailyLogPayload = {
        logDate: form.logDate,
        shiftId: Number(form.shiftId),
        workerId: Number(form.workerId),
        taskId: Number(form.taskId),
        equipmentId: form.equipmentId ? Number(form.equipmentId) : null,
        startTime: form.startTime ? `${form.logDate}T${form.startTime}:00` : undefined,
        endTime: form.endTime ? `${form.logDate}T${form.endTime}:00` : undefined,
        quantityProduced: form.quantityProduced ? Number(form.quantityProduced) : undefined,
        wasteQuantity: form.wasteQuantity ? Number(form.wasteQuantity) : 0,
        wasteReason: form.wasteReason || undefined,
        notes: form.notes || undefined,
        supervisorId: user?.id,
        status: 'completed',
      };

      // Add grades if any score is filled
      if (form.qualityScore || form.speedScore || form.cleanlinessScore || form.recipeScore) {
        payload.grades = {
          qualityScore: Number(form.qualityScore) || 0,
          speedScore: Number(form.speedScore) || 0,
          cleanlinessScore: Number(form.cleanlinessScore) || 0,
          recipeScore: Number(form.recipeScore) || 0,
        };
      }

      // Step 1: Create the daily log
      const { data: createdLog } = await api.post('/daily-logs', payload);
      const dailyLogId = createdLog.id;

      // Step 2: Upload images if any
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('dailyLogId', String(dailyLogId));
          formData.append('imageType', 'result');
          await api.post('/image-attachments/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        toast.success(`تم إنشاء السجل ورفع ${imageFiles.length} صورة`);
      } else {
        toast.success('تم إنشاء السجل بنجاح');
      }

      router.push('/dashboard/daily-logs');
    } catch (error) {
      toast.error('فشل إنشاء السجل', { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/daily-logs')}>
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع
        </Button>
        <div>
          <h1 className="text-2xl font-bold">إضافة سجل إنتاجي جديد</h1>
          <p className="text-sm text-muted-foreground mt-1">سجّل مهمة إنتاجية لعامل في وردية معينة</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
            <CardDescription>البيانات الأساسية للسجل</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>القسم *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                required
              >
                <option value="">اختر القسم</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Input
                type="date"
                value={form.logDate}
                onChange={(e) => setForm({ ...form, logDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>الوردية *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.shiftId}
                onChange={(e) => setForm({ ...form, shiftId: e.target.value })}
                required
              >
                <option value="">اختر الوردية</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Worker, Task, Equipment */}
        <Card>
          <CardHeader>
            <CardTitle>العامل والمهمة</CardTitle>
            <CardDescription>اختر العامل والمهمة والمعدة (تظهر بناءً على القسم المختار)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>العامل *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.workerId}
                onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                required
                disabled={!form.departmentId}
              >
                <option value="">{form.departmentId ? 'اختر العامل' : 'اختر القسم أولاً'}</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>المهمة *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.taskId}
                onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                required
                disabled={!form.departmentId}
              >
                <option value="">{form.departmentId ? 'اختر المهمة' : 'اختر القسم أولاً'}</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>المعدة (اختياري)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.equipmentId}
                onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
                disabled={!form.departmentId}
              >
                <option value="">{form.departmentId ? 'بدون معدة' : 'اختر القسم أولاً'}</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.code} - {eq.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Time and Production */}
        <Card>
          <CardHeader>
            <CardTitle>الوقت والإنتاج</CardTitle>
            <CardDescription>أوقات العمل والكميات</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>وقت البداية</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>وقت النهاية</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>الكمية المنتجة</Label>
              <Input
                type="number"
                step="0.01"
                value={form.quantityProduced}
                onChange={(e) => setForm({ ...form, quantityProduced: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>الكمية المهدرجة</Label>
              <Input
                type="number"
                step="0.01"
                value={form.wasteQuantity}
                onChange={(e) => setForm({ ...form, wasteQuantity: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>سبب الهدر</Label>
              <Input
                value={form.wasteReason}
                onChange={(e) => setForm({ ...form, wasteReason: e.target.value })}
                placeholder="مثال: عجينة زائدة، خطأ في القياس..."
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Grades */}
        <Card>
          <CardHeader>
            <CardTitle>التقييم (من 10 لكل معيار)</CardTitle>
            <CardDescription>تقييم العامل في هذه المهمة على 4 معايير</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {[
              { key: 'qualityScore', label: 'الجودة' },
              { key: 'speedScore', label: 'السرعة' },
              { key: 'cleanlinessScore', label: 'النظافة' },
              { key: 'recipeScore', label: 'الالتزام بالوصفة' },
            ].map((item) => (
              <div key={item.key} className="space-y-2">
                <Label>{item.label}</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={(form as any)[item.key]}
                  onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                  placeholder="0-10"
                />
              </div>
            ))}
            <div className="md:col-span-4 rounded-md bg-muted p-3 text-sm">
              <span className="font-medium">المجموع: </span>
              {Number(form.qualityScore || 0) + Number(form.speedScore || 0) +
               Number(form.cleanlinessScore || 0) + Number(form.recipeScore || 0)} / 40
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle>صور توثيقية</CardTitle>
            <CardDescription>ارفع صور للنتيجة أو العيوب (اختياري)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">اضغط لاختيار الصور</p>
                </div>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {imageFiles.length > 0 && (
              <div className="space-y-2">
                <Separator />
                <p className="text-sm font-medium">الصور المختارة ({imageFiles.length}):</p>
                {imageFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md border p-2">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/daily-logs')}>
            إلغاء
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                حفظ السجل
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
