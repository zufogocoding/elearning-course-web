import React from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";

export type SaveState = "saved" | "saving" | "error" | "";

interface SaveStatusProps {
  status: SaveState;
}

export default function SaveStatus({ status }: SaveStatusProps) {
  if (!status) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300">
      {status === "saving" && (
        <span className="flex items-center gap-1.5 text-indigo-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Đang tự động lưu...</span>
        </span>
      )}
      {status === "saved" && (
        <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
          <Check className="w-3.5 h-3.5" />
          <span>Đã lưu vào máy chủ</span>
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Lỗi khi lưu! Đang thử lại...</span>
        </span>
      )}
    </div>
  );
}
