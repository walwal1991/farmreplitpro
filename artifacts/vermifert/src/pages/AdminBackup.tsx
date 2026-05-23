import { useState, useRef } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, AlertTriangle, CheckCircle2 } from "lucide-react";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export default function AdminBackup() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const { toast } = useToast();

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!token) {
    setLocation("/admin/login");
    return null;
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`${API}/api/admin/backup/export`, {
        headers: { "x-admin-token": token! },
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "خطأ في التصدير", description: err.error, variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      a.href = url;
      a.download = `backup${timestamp}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "تم التصدير بنجاح", description: "تم تنزيل النسخة الاحتياطية" });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    if (!selectedFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch(`${API}/api/admin/backup/import`, {
        method: "POST",
        headers: { "x-admin-token": token! },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setImportResult({ success: false, message: data.error });
        toast({ title: "فشل الاستيراد", description: data.error, variant: "destructive" });
      } else {
        setImportResult({ success: true, message: data.message });
        toast({ title: "تم الاستيراد بنجاح", description: data.message });
        setSelectedFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch (e: any) {
      setImportResult({ success: false, message: e.message });
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">النسخ الاحتياطي لقاعدة البيانات</h1>
          </div>

          <div className="space-y-6">
            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  تصدير قاعدة البيانات
                </CardTitle>
                <CardDescription>
                  تنزيل نسخة احتياطية كاملة من قاعدة البيانات بصيغة SQL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExport} disabled={exporting} className="gap-2">
                  <Download className="w-4 h-4" />
                  {exporting ? "جاري التصدير..." : "تنزيل النسخة الاحتياطية"}
                </Button>
              </CardContent>
            </Card>

            {/* Import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  استيراد قاعدة البيانات
                </CardTitle>
                <CardDescription>
                  رفع ملف SQL لاستعادة قاعدة البيانات – سيتم تطبيق الملف على قاعدة البيانات الحالية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>سيتم تطبيق محتوى الملف مباشرةً على قاعدة البيانات. تأكد من أن الملف مصدر موثوق قبل المتابعة.</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".sql"
                      className="hidden"
                      onChange={(e) => {
                        setSelectedFile(e.target.files?.[0] ?? null);
                        setImportResult(null);
                      }}
                    />
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      {selectedFile ? (
                        <span className="text-sm font-medium text-primary">{selectedFile.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">اختر ملف SQL</span>
                      )}
                    </div>
                  </label>
                </div>

                {importResult && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${importResult.success ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300" : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"}`}>
                    {importResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{importResult.message}</span>
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || importing}
                  variant="destructive"
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {importing ? "جاري الاستيراد..." : "تطبيق النسخة الاحتياطية"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
