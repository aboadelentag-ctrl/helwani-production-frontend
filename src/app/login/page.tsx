'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Factory, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('Admin@2026');
    toast.info('تم ملء البيانات التجريبية');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('تم تسجيل الدخول بنجاح');
    } catch (error) {
      toast.error('فشل تسجيل الدخول', { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Factory className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">حلواني أبو عادل</CardTitle>
          <CardDescription>نظام إدارة الإنتاج — تسجيل الدخول</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                disabled={loading}
                autoComplete="username"
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="text-left pl-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                * تأكد أن الحرف الأول <span className="font-bold text-primary">A</span> كبير (Capital) وأن لغة الإدخال إنجليزية.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>

            <div
              onClick={fillDemoCredentials}
              className="rounded-md border border-dashed border-primary/40 bg-muted/60 p-3 text-xs text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
              title="انقر لملء البيانات التجريبية تلقائياً"
            >
              <div className="flex items-center justify-between font-medium text-foreground mb-1.5">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  بيانات تجريبية (اضغط للتعبئة التلقائية):
                </span>
                <span className="text-[10px] text-primary underline">تعبئة سريعة</span>
              </div>
              <div className="space-y-0.5 text-right font-mono" dir="ltr">
                <p>User: <span className="text-foreground font-semibold">admin</span></p>
                <p>Pass: <span className="text-foreground font-semibold">Admin@2026</span></p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
