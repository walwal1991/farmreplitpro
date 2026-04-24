import { CheckCircle2, Clock, Package, Truck, Home } from "lucide-react";

const STEPS = [
  { key: "pending",   label: "طلب مستلم",       desc: "تم استلام طلبك وهو قيد المراجعة",   icon: Clock },
  { key: "confirmed", label: "طلب مؤكد",         desc: "تم تأكيد طلبك وهو جاهز للشحن",     icon: Package },
  { key: "shipped",   label: "جاري التوصيل",     desc: "طلبك في الطريق إليك مع السائق",    icon: Truck },
  { key: "delivered", label: "تم التوصيل",       desc: "تم توصيل طلبك بنجاح",              icon: Home },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0, confirmed: 1, shipped: 2, delivered: 3,
};

interface Props {
  status: string;
  assignedDriverName?: string | null;
}

export default function OrderTracker({ status, assignedDriverName }: Props) {
  const currentIdx = STATUS_ORDER[status] ?? 0;

  return (
    <div className="w-full py-4">
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-6 right-6 left-6 h-0.5 bg-border" />
        <div
          className="absolute top-6 right-6 h-0.5 bg-primary transition-all duration-700"
          style={{ width: currentIdx === 0 ? "0%" : `${(currentIdx / (STEPS.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step.key} className="flex flex-col items-center gap-2" style={{ width: `${100 / STEPS.length}%` }}>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    done
                      ? "bg-primary border-primary text-primary-foreground shadow-md"
                      : active
                      ? "bg-primary/10 border-primary text-primary shadow-sm ring-4 ring-primary/20"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-bold leading-tight ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                  {active && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight max-w-[80px] mx-auto">
                      {step.key === "shipped" && assignedDriverName ? `مع ${assignedDriverName}` : step.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
