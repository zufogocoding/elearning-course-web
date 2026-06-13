"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
        <AlertTriangle size={32} />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-text">Đã có lỗi xảy ra</h2>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          Hệ thống gặp sự cố trong quá trình xử lý yêu cầu của bạn. Vui lòng thử
          lại sau.
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-bg"
      >
        Thử lại
      </button>
    </div>
  );
}
