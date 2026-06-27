import { useEffect, useState } from "react";
import { subscribeToast } from "../utils/toastBus";

const STYLES = {
  success: "bg-emerald-500",
  info: "bg-blue-500",
  error: "bg-rose-500",
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeToast((toast) => {
      setToasts((t) => [...t, toast]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== toast.id));
      }, 3500);
    });
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${STYLES[t.type] || STYLES.info} text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-soft animate-slide-up max-w-xs pointer-events-auto`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
