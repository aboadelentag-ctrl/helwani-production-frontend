'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { SidebarContent } from './sidebar';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center rounded-md hover:bg-muted md:hidden h-10 w-10 shrink-0 cursor-pointer">
        <Menu className="h-6 w-6" />
        <span className="sr-only">فتح القائمة</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0 md:hidden bg-slate-900 border-slate-800">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
