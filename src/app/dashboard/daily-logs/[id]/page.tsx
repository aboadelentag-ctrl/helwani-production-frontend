'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api, getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Clock, Package, Award, Image as ImageIcon } from 'lucide-react';
import { formatDate, formatTime, formatNumber } from '@/lib/utils';
import type { DailyLogWithRelations } from '@/types/api';

export default function DailyLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [log, setLog] = useState<DailyLogWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLog() {
      try {
        const { data } = await api.get<DailyLogWithRelations>(`/daily-logs/${params.id}`);
        setLog(data);
      } catch (error) {
        toast.error('فشل تحميل السجل', { description: getErrorMessage(error) });
        router.push('/dashboard/daily-logs');
      } finally {
        setLoading(false);
      }
    }
    loadLog();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!log) return null;

  const grades = log.grades;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/daily-logs')}>
          <ArrowRight className="ml-2 h-4 w-4" />
          رجوع للقائمة
        </Button>
        <div>
          <h1 className="text-2xl font-bold">تفاصيل السجل #{log.id}</h1>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(log.logDate)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>معلومات أساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">العامل</span>
              <span className="font-medium">{log.worker?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">القسم</span>
              <span className="font-medium">{log.worker?.department?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المهمة</span>
              <span className="font-medium">{log.task?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المعدة</span>
              <span className="font-medium">{log.equipment?.name || 'بدون'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الوردية</span>
              <span className="font-medium">{log.shift?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الحالة</span>
              <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>
                {log.status === 'completed' ? 'مكتمل' : log.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              الوقت والإنتاج
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">وقت البداية</span>
              <span className="font-medium">{log.startTime ? formatTime(log.startTime) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">وقت النهاية</span>
              <span className="font-medium">{log.endTime ? formatTime(log.endTime) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المدة (دقيقة)</span>
              <span className="font-medium">{log.durationMinutes || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">الكمية المنتجة</span>
              <span className="font-medium flex items-center gap-1">
                <Package className="h-4 w-4" />
                {log.quantityProduced ? formatNumber(Number(log.quantityProduced)) : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الكمية المهدرجة</span>
              <Badge variant={log.wasteQuantity && Number(log.wasteQuantity) > 0 ? 'destructive' : 'secondary'}>
                {log.wasteQuantity ? formatNumber(Number(log.wasteQuantity)) : '0'}
              </Badge>
            </div>
            {log.wasteReason && (
              <div>
                <span className="text-muted-foreground text-sm">سبب الهدر: </span>
                <span className="text-sm">{log.wasteReason}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {grades && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              التقييم ({grades.totalScore}/40)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: 'الجودة', score: grades.qualityScore },
                { label: 'السرعة', score: grades.speedScore },
                { label: 'النظافة', score: grades.cleanlinessScore },
                { label: 'الالتزام بالوصفة', score: grades.recipeScore },
              ].map((g) => (
                <div key={g.label} className="text-center rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">{g.label}</p>
                  <p className="text-2xl font-bold mt-1">{g.score}</p>
                  <p className="text-xs text-muted-foreground">/10</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {log.notes && (
        <Card>
          <CardHeader><CardTitle>ملاحظات</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{log.notes}</p></CardContent>
        </Card>
      )}

      {log.images && log.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              الصور ({log.images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
              {log.images.map((img) => (
                <div key={img.id} className="space-y-2">
                  <img
                    src={img.imageUrl}
                    alt={img.description || 'صورة'}
                    className="w-full h-48 object-cover rounded-md border"
                  />
                  {img.description && (
                    <p className="text-xs text-muted-foreground">{img.description}</p>
                  )}
                  <Badge variant="outline" className="text-xs">{img.imageType}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
