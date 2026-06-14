import { Loader2 } from "lucide-react";
import React from "react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  className?: string;
}

export function Spinner({ size = 24, className = "", ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center ${className}`}
      {...props}
    >
      <Loader2 size={size} className="animate-spin text-brand" />
      <span className="sr-only">Đang tải dữ liệu...</span>
    </div>
  );
}
