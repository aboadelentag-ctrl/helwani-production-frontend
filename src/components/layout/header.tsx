'use client';

import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon } from 'lucide-react';
import { MobileSidebar } from './mobile-sidebar';

export function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((s) => s.charAt(0))
    .join('');

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 gap-3">
      {/* Mobile menu button and Title */}
      <div className="flex items-center gap-3 min-w-0">
        <MobileSidebar />
        <div className="min-w-0">
          <h2 className="text-base md:text-lg font-semibold truncate">لوحة التحكم</h2>
          <p className="text-xs text-muted-foreground hidden md:block">
            {new Date().toLocaleDateString('ar-EG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer outline-none">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium truncate max-w-[120px]">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {user.role === 'admin' ? 'مدير النظام' : user.role === 'manager' ? 'مدير' : 'مشرف'}
            </p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>حسابي</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-[44px]">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>الملف الشخصي</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600 min-h-[44px]">
            <LogOut className="mr-2 h-4 w-4" />
            <span>تسجيل الخروج</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
