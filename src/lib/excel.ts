import * as XLSX from 'xlsx';

export interface ExcelColumn<T = any> {
  key: string;
  header: string;
  format?: (value: any, row: T) => any;
  width?: number;
}

export interface ExcelTemplateColumn {
  header: string;
  sample: string | number;
  description?: string;
  width?: number;
}

/**
 * تصدير البيانات إلى ملف Excel بتنسيق عربي ودعم RTL تلقائياً
 */
export function exportToExcel<T = any>({
  data,
  columns,
  fileName,
  sheetName = 'البيانات',
}: {
  data: T[];
  columns: ExcelColumn<T>[];
  fileName: string;
  sheetName?: string;
}) {
  if (!data || data.length === 0) {
    throw new Error('لا توجد بيانات للتصدير');
  }

  // تحويل كل صف إلى كائن بمفاتيح هي أسماء الأعمدة العربية
  const formattedRows = data.map((row) => {
    const item: Record<string, any> = {};
    for (const col of columns) {
      // استخراج القيمة (قد تكون متداخلة مثل worker.name)
      const rawVal = getNestedValue(row, col.key);
      const val = col.format ? col.format(rawVal, row) : rawVal;
      item[col.header] = val ?? '';
    }
    return item;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // تفعيل الاتجاه من اليمين لليسار في Excel (RTL)
  worksheet['!views'] = [{ RTL: true }];

  // حساب العرض المناسب لكل عمود تلقائياً
  const colWidths = columns.map((col) => {
    if (col.width) return { wch: col.width };
    const maxLen = Math.max(
      col.header.length,
      ...formattedRows.map((r) => String(r[col.header] || '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const dateStr = new Date().toISOString().split('T')[0];
  const finalFileName = `${fileName}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, finalFileName);
}

/**
 * تنزيل نموذج Excel فارغ مع صف تجريبي لتسهيل الإدخال
 */
export function downloadExcelTemplate({
  columns,
  fileName,
  sheetName = 'النموذج',
  sampleRows,
}: {
  columns: ExcelTemplateColumn[];
  fileName: string;
  sheetName?: string;
  sampleRows?: Record<string, any>[];
}) {
  let rows: Record<string, any>[] = [];

  if (sampleRows && sampleRows.length > 0) {
    rows = sampleRows;
  } else {
    const sampleRow: Record<string, any> = {};
    for (const col of columns) {
      sampleRow[col.header] = col.sample;
    }
    rows = [sampleRow];
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!views'] = [{ RTL: true }];

  const colWidths = columns.map((col) => {
    if (col.width) return { wch: col.width };
    const maxLen = Math.max(
      col.header.length,
      String(col.sample || '').length
    );
    return { wch: Math.min(Math.max(maxLen + 4, 14), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${fileName}_نموذج.xlsx`);
}

/**
 * قراءة ملف Excel محمل وتحويله إلى مصفوفة كائنات
 */
export function readExcelFile(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('الملف فارغ أو تعذر قراءته'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('الملف لا يحتوي على أي صفحات عمل'));
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
          raw: false,
        });

        if (rawRows.length === 0) {
          reject(new Error('صفحة العمل فارغة ولا تحتوي على بيانات'));
          return;
        }

        // استخراج أسماء الأعمدة من أول صف
        const headers = Object.keys(rawRows[0] || {});

        resolve({ headers, rows: rawRows });
      } catch (err: any) {
        reject(new Error(err?.message || 'فشل في قراءة ملف Excel'));
      }
    };

    reader.onerror = () => {
      reject(new Error('حدث خطأ أثناء فتح الملف'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * دالة مساعدة للحصول على القيمة المتداخلة مثل `worker.name`
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj) return '';
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return '';
    current = current[part];
  }
  return current;
}
