'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { readExcelFile, downloadExcelTemplate, ExcelTemplateColumn } from '@/lib/excel';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  templateFileName: string;
  templateColumns: ExcelTemplateColumn[];
  sampleTemplateRows?: Record<string, any>[];
  onImport: (rows: Record<string, any>[]) => Promise<{
    success: number;
    failed: number;
    errors?: string[];
  }>;
  onSuccess?: () => void;
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  title,
  description,
  templateFileName,
  templateColumns,
  sampleTemplateRows,
  onImport,
  onSuccess,
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: Record<string, any>[] } | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setReadingFile(false);
    setImporting(false);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = (newOpen: boolean) => {
    if (!importing) {
      if (!newOpen) resetState();
      onOpenChange(newOpen);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplate({
        columns: templateColumns,
        fileName: templateFileName,
        sampleRows: sampleTemplateRows,
      });
      toast.success('تم تنزيل نموذج الإكسل بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء تنزيل النموذج');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setReadingFile(true);
    setImportResult(null);

    try {
      const data = await readExcelFile(selectedFile);
      setParsedData(data);
      toast.success(`تمت قراءة الملف بنجاح (${data.rows.length} صف)`);
    } catch (err: any) {
      toast.error(err?.message || 'تعذر قراءة ملف الإكسل');
      setFile(null);
      setParsedData(null);
    } finally {
      setReadingFile(false);
    }
  };

  const handleStartImport = async () => {
    if (!parsedData || parsedData.rows.length === 0) {
      toast.error('لا توجد بيانات للاستيراد');
      return;
    }

    setImporting(true);
    try {
      const result = await onImport(parsedData.rows);
      setImportResult(result);

      if (result.success > 0) {
        toast.success(`تم استيراد ${result.success} سجل بنجاح!`);
        if (onSuccess) onSuccess();
      }

      if (result.failed > 0) {
        toast.warning(`فشل استيراد ${result.failed} سجل`, {
          description: result.errors?.[0] || 'تحقق من صحة البيانات والأكواد المكررة',
        });
      }
    } catch (err: any) {
      toast.error('حدث خطأ أثناء الاستيراد', {
        description: err?.message || 'تعذر إتمام العملية',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1">{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 my-2">
          {/* Step 1: Download Template */}
          <div className="p-4 rounded-xl border border-dashed bg-muted/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">الخطوة الأولى: تنزيل النموذج المعتمد</p>
              <p className="text-xs text-muted-foreground">
                قم بتنزيل ملف Excel الفارغ واملأ بياناتك بنفس ترتيب الأعمدة الموضح.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-2 shrink-0 border-emerald-300 hover:bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
            >
              <Download className="w-4 h-4" />
              تحميل النموذج
            </Button>
          </div>

          {/* Step 2: Upload File */}
          <div className="space-y-2">
            <label className="text-sm font-medium">الخطوة الثانية: رفع الملف المكتمل</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                file
                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                disabled={readingFile || importing}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {readingFile ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                {file ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{file.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">اضغط هنا لاختيار ملف Excel أو اسحبه وأفلته هنا</p>
                    <p className="text-xs text-muted-foreground mt-1">يدعم ملفات (.xlsx, .xls)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Parsed Data */}
          {parsedData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">معاينة البيانات</span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    {parsedData.rows.length} صف تم التعرف عليه
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">عرض أول 5 صفوف</span>
              </div>

              <div className="border rounded-lg overflow-x-auto max-h-48 text-xs">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      {parsedData.headers.map((h) => (
                        <TableHead key={h} className="text-right whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.rows.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        {parsedData.headers.map((h) => (
                          <TableCell key={h} className="whitespace-nowrap">
                            {String(row[h] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Import Result Summary */}
          {importResult && (
            <div
              className={`p-4 rounded-xl border ${
                importResult.failed === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-sm">
                {importResult.failed === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
                <span>
                  تم استيراد {importResult.success} بنجاح
                  {importResult.failed > 0 && ` وتخطي/فشل ${importResult.failed}`}
                </span>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 text-xs space-y-1 max-h-24 overflow-y-auto">
                  {importResult.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-destructive dark:text-red-400">
                      • {err}
                    </p>
                  ))}
                  {importResult.errors.length > 5 && (
                    <p className="text-muted-foreground">
                      ... وغيرها ({importResult.errors.length - 5} أخطاء أخرى)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={importing}
          >
            {importResult ? 'إغلاق' : 'إلغاء'}
          </Button>

          {parsedData && !importResult && (
            <Button
              type="button"
              onClick={handleStartImport}
              disabled={importing}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  بدء الاستيراد ({parsedData.rows.length} صف)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
