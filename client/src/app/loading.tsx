import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
      <Spinner size={32} />
      <p className="text-sm text-text-muted">Đang tải dữ liệu...</p>
    </div>
  );
}
