import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Order {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface StickerPrintProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

function trackingCode(id: number) {
  return "VRM-" + String(id).padStart(6, "0");
}

function Barcode({ value }: { value: string }) {
  const bars = value.split("").map((c) => c.charCodeAt(0));
  return (
    <div className="flex items-end gap-[2px] h-10 mt-1">
      {bars.map((b, i) => {
        const w = (b % 2 === 0) ? 1 : 2;
        const h = 28 + (b % 12);
        return (
          <div
            key={i}
            style={{ width: w, height: h, backgroundColor: "#111" }}
          />
        );
      })}
      <div className="text-[8px] text-center w-full absolute bottom-0 left-0 font-mono tracking-widest" style={{letterSpacing: "0.2em"}}>
        {value}
      </div>
    </div>
  );
}

export default function StickerPrint({ order, open, onClose }: StickerPrintProps) {
  if (!order) return null;

  const tracking = trackingCode(order.id);

  const handlePrint = () => {
    const printContent = document.getElementById("sticker-print-area");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=600,height=500");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>ملصق الشحن - ${tracking}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: white; direction: rtl; }
          .sticker {
            width: 10cm;
            min-height: 15cm;
            border: 2px solid #333;
            padding: 0;
            margin: 0 auto;
            font-size: 11pt;
            page-break-inside: avoid;
          }
          .sticker-header {
            background: #166534;
            color: white;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .sticker-header .brand { font-size: 14pt; font-weight: 900; }
          .sticker-header .sub { font-size: 8pt; opacity: 0.8; margin-top: 2px; }
          .sticker-header .logo { width: 38px; height: 38px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
          .section { padding: 10px 14px; border-bottom: 1px dashed #ccc; }
          .section:last-child { border-bottom: none; }
          .label { font-size: 7.5pt; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
          .value { font-size: 11pt; font-weight: 700; color: #111; }
          .value-sm { font-size: 9.5pt; font-weight: 600; color: #222; }
          .tracking-block { background: #f0fdf4; padding: 10px 14px; border-bottom: 1px dashed #ccc; }
          .tracking-number { font-size: 20pt; font-weight: 900; letter-spacing: 0.12em; color: #166534; font-family: monospace; }
          .row { display: flex; gap: 12px; }
          .row .col { flex: 1; }
          .barcode-row { display: flex; flex-direction: column; align-items: center; padding: 8px 14px; border-bottom: 1px dashed #ccc; }
          .bars { display: flex; align-items: flex-end; gap: 1px; height: 36px; }
          .bar { background: #111; }
          .barcode-text { font-size: 7pt; letter-spacing: 0.2em; font-family: monospace; margin-top: 3px; color: #333; }
          .footer { background: #f9fafb; padding: 8px 14px; text-align: center; font-size: 7.5pt; color: #888; }
          .status-badge { display: inline-block; background: #166534; color: white; padding: 2px 10px; border-radius: 20px; font-size: 8pt; font-weight: 700; }
          @media print {
            @page { margin: 0.5cm; size: 10cm 15cm; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>window.onload = function(){ window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const dateStr = format(new Date(order.createdAt), "dd MMM yyyy", { locale: ar });

  // Build simple barcode bars from tracking string
  const bars = tracking.split("").map((c, i) => ({
    w: (c.charCodeAt(0) % 2 === 0) ? 1 : 2,
    h: 20 + (c.charCodeAt(0) % 14),
    key: i,
  }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold">معاينة ملصق الشحن</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="px-5 pb-3 overflow-y-auto max-h-[70vh]">
          <div
            id="sticker-print-area"
            className="sticker border-2 border-gray-800 text-sm font-sans overflow-hidden"
            style={{ width: "100%", direction: "rtl" }}
          >
            {/* Header */}
            <div className="sticker-header bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
              <div>
                <div className="brand font-extrabold text-lg leading-tight">متجر سماد الديدان</div>
                <div className="sub text-xs text-white/70 mt-0.5">نحو تربة أفضل... وبيئة أنظف</div>
              </div>
              <div className="logo w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                🪱
              </div>
            </div>

            {/* Tracking number */}
            <div className="tracking-block bg-green-50 px-4 py-3 border-b border-dashed border-gray-300">
              <div className="label text-[9px] text-gray-500 uppercase tracking-wide mb-1">رقم التتبع</div>
              <div className="tracking-number font-black text-2xl tracking-widest text-primary font-mono">{tracking}</div>
            </div>

            {/* Barcode */}
            <div className="barcode-row px-4 py-2 border-b border-dashed border-gray-300 flex flex-col items-center">
              <div className="bars flex items-end gap-[1.5px]" style={{ height: 36 }}>
                {bars.map((b) => (
                  <div key={b.key} style={{ width: b.w, height: b.h, background: "#111" }} />
                ))}
              </div>
              <div className="barcode-text text-[8px] font-mono tracking-widest mt-1 text-gray-600">{tracking}</div>
            </div>

            {/* Customer info */}
            <div className="section px-4 py-3 border-b border-dashed border-gray-300">
              <div className="label text-[9px] text-gray-500 uppercase tracking-wide mb-2">معلومات العميل</div>
              <div className="value font-bold text-base">{order.customerName}</div>
              <div className="value-sm text-sm mt-1" dir="ltr">{order.phone}</div>
              <div className="value-sm text-sm mt-1">{order.address}، {order.city}</div>
              {order.notes && (
                <div className="text-xs text-gray-500 mt-1 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  ملاحظة: {order.notes}
                </div>
              )}
            </div>

            {/* Order details */}
            <div className="section px-4 py-3 border-b border-dashed border-gray-300">
              <div className="label text-[9px] text-gray-500 uppercase tracking-wide mb-2">تفاصيل الطلب</div>
              <div className="row flex gap-3">
                <div className="col flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">المنتج</div>
                  <div className="font-bold text-sm leading-snug">{order.productName}</div>
                </div>
                <div className="col flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">الكمية</div>
                  <div className="font-bold text-sm">{order.quantity}</div>
                </div>
              </div>
              <div className="row flex gap-3 mt-2">
                <div className="col flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">سعر الوحدة</div>
                  <div className="font-bold text-sm">{order.unitPrice.toLocaleString("ar-DZ")} د.ج</div>
                </div>
                <div className="col flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">الإجمالي</div>
                  <div className="font-black text-base text-primary">{order.totalPrice.toLocaleString("ar-DZ")} د.ج</div>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="section px-4 py-3 border-b border-dashed border-gray-300">
              <div className="row flex gap-3">
                <div className="col flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">رقم الطلب</div>
                  <div className="font-bold text-sm">#{order.id}</div>
                </div>
                <div className="col flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">التاريخ</div>
                  <div className="font-bold text-sm">{dateStr}</div>
                </div>
                <div className="col flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">الدفع</div>
                  <div className="font-bold text-sm">نقداً عند التسليم</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer bg-gray-50 px-4 py-2 text-center text-[9px] text-gray-500">
              شكراً لثقتكم — متجر سماد الديدان
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <Button className="flex-1 gap-2 font-bold" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            طباعة الملصق
          </Button>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
