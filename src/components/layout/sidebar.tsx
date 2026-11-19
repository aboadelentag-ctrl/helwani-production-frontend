'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Factory, LayoutDashboard, Users, Wrench, ListTodo, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/dashboard/daily-logs', label: 'السجل اليومي', icon: ClipboardList },
  { href: '/dashboard/workers', label: 'العمال', icon: Users },
  { href: '/dashboard/equipment', label: 'المعدات', icon: Wrench },
  { href: '/dashboard/tasks', label: 'المهام', icon: ListTodo },
  { href: '/dashboard/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
];

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      <div className="flex items-center gap-3 p-6 border-b border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shrink-0">
          <Factory className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold truncate">حلواني أبو عادل</h1>
          <p className="text-xs text-slate-400">نظام الإنتاج</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors min-h-[44px]',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <p className="text-xs text-slate-400 text-center">v1.0.0</p>
      </div>
    </div>
  );
}

// Desktop Sidebar (fixed, hidden on mobile)
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0">
      <SidebarContent />
    </aside>
  );
}
