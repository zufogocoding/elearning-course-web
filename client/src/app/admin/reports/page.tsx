'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import { useTheme } from '@/components/ui/ThemeProvider';

interface User {
  id: number;
  username: string;
  email: string;
}

interface Report {
  id: number;
  userId: number;
  targetType: string;
  targetId: number;
  reason: string;
  details: string;
  createdAt: string;
  user: User;
  targetTitle: string;
  courseId: number | null;
}

export default function AdminReportsPage() {
  const { isDark } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Theme colors
  const cardBg = isDark ? "bg-[#1a1d2e]" : "bg-white";
  const borderColor = isDark ? "border-[#252840]" : "border-slate-200";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-[#a0aec0]" : "text-slate-500";
  const headerBg = isDark ? "bg-[#13151f]" : "bg-slate-50";
  const hoverBg = isDark ? "hover:bg-[#22263a]" : "hover:bg-slate-50";

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/api/reports/admin');
      const data = await res.json();
      if (data.status === 'success') {
        setReports(data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải báo cáo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold tracking-tight ${textPrimary}`}>Quản lý Báo cáo Nội dung</h1>
        </div>

        {reports.length === 0 ? (
          <div className={`rounded-xl border ${borderColor} ${cardBg} p-12 text-center`}>
            <p className={`${textSecondary}`}>Không có báo cáo nào.</p>
          </div>
        ) : (
          <div className={`rounded-xl border ${borderColor} ${cardBg} overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={`${headerBg} ${textSecondary} border-b ${borderColor}`}>
                  <tr>
                    <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">ID</th>
                    <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Người Báo cáo</th>
                    <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Loại</th>
                    <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Đối tượng</th>
                    <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Lý do</th>
                    <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Thời gian</th>
                    <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${borderColor}`}>
                  {reports.map((report) => (
                    <tr key={report.id} className={`${hoverBg} transition-colors`}>
                      <td className={`px-5 py-4 font-medium ${textPrimary}`}>#{report.id}</td>
                      <td className="px-5 py-4">
                        <div className={`font-semibold ${textPrimary}`}>{report.user.username}</div>
                        <div className={`text-xs ${textSecondary}`}>{report.user.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          report.targetType === 'course' 
                            ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
                            : 'bg-purple-500/10 text-purple-500 dark:text-purple-400'
                        }`}>
                          {report.targetType === 'course' ? 'Khóa học' : 'Bài học'}
                        </span>
                      </td>
                      <td className={`px-5 py-4 max-w-[200px] truncate font-medium ${textPrimary}`} title={report.targetTitle}>
                        {report.targetTitle}
                      </td>
                      <td className="px-5 py-4 max-w-[250px]">
                        <div className={`font-medium ${textPrimary}`}>{report.reason}</div>
                        {report.details && <div className={`text-xs truncate ${textSecondary}`} title={report.details}>{report.details}</div>}
                      </td>
                      <td className={`px-5 py-4 text-xs ${textSecondary}`}>
                        {new Date(report.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link 
                          href={report.targetType === 'course' 
                            ? `/admin/courses/${report.courseId}` 
                            : `/admin/courses/${report.courseId}?tab=curriculum`
                          }
                          className="inline-flex items-center justify-center rounded-lg text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-9 px-4 py-2"
                        >
                          Xem / Sửa
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
