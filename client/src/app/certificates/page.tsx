"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useTheme } from "@/components/ui/ThemeProvider";
import { api } from "@/lib/api";
import {
  Award,
  Download,
  Eye,
  X,
  CheckCircle,
  Calendar,
  BookOpen,
  Shield,
  ExternalLink,
  FileText,
} from "lucide-react";

// Mock Data removed - using real API data

interface Certificate {
  id: string;
  course: string;
  instructor: string;
  completionDate: string;
  version?: string;
  issueDate?: string;
  duration?: string;
  gradient?: string;
  category?: string;
}

export default function CertificatesPage() {
  const { isDark } = useTheme();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("certificate-view");
    if (!element) return;
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "pt", [canvas.width, canvas.height]);
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`Certificate_${previewCert?.course || "Completed"}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const res = await api.get('/api/certificates/my-certificates');
        if (res.ok) {
          const data = await res.json();
          setCertificates(data.certificates || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, []);

  // ─── Theme Tokens ───────────────────────────────────────────────────────────
  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const sectionBg = isDark ? "bg-[#13151f]" : "bg-white";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const cardHover = isDark ? "hover:border-indigo-500/30" : "hover:border-indigo-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const pill = isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${bg}`}>
      <Header />

      <main className="flex-1">
        {/* ── Page Header ──────────────────────────────────────────────── */}
        <section className={`border-b ${divider} ${sectionBg} transition-colors duration-300`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>My Certificates</h1>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pill}`}>
                    {certificates.length} earned
                  </span>
                </div>
                <p className={`text-sm ${muted}`}>
                  Download and share your verified completion certificates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Certificates Grid ─────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : certificates.length === 0 ? (
            /* Empty State */
            <div className={`border rounded-2xl p-16 text-center ${card}`}>
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? "bg-[#22263a]" : "bg-slate-100"}`}>
                <Award className={`w-7 h-7 ${muted}`} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${text}`}>No Certificates Yet</h3>
              <p className={`text-sm max-w-xs mx-auto ${muted}`}>
                Complete a course to earn your first certificate of achievement.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className={`border rounded-2xl overflow-hidden transition-all group ${card} ${cardHover}`}
                >
                  {/* Gold/Indigo Banner */}
                  <div className={`h-28 bg-gradient-to-r ${cert.gradient || "from-indigo-500 to-purple-600"} relative flex items-center justify-between px-5`}>
                    <div>
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                        Certificate of Completion
                      </p>
                      <p className="text-white font-extrabold text-lg leading-tight">
                        {cert.course.length > 28 ? cert.course.slice(0, 28) + "…" : cert.course}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center backdrop-blur-sm shrink-0">
                      <Award className="w-7 h-7 text-white drop-shadow" />
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-3 left-3 bg-black/25 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {cert.category}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <h3 className={`text-sm font-bold mb-3 ${text}`}>{cert.course}</h3>

                    <div className={`space-y-2 text-xs ${muted}`}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span>{cert.duration} · Instructor: {cert.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Completed on {cert.completionDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <code className="font-mono text-[11px]">{cert.id}</code>
                      </div>
                    </div>

                    {/* Version badge */}
                    <div className="mt-3 mb-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDark ? "bg-[#22263a] text-[#7a87a1]" : "bg-slate-100 text-slate-500"
                      }`}>
                        Course Version {cert.version || "1.0"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        id={`view-cert-${cert.id}`}
                        onClick={() => setPreviewCert(cert)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm shadow-indigo-600/20"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Certificate
                      </button>
                      <button
                        id={`download-cert-${cert.id}`}
                        onClick={() => setPreviewCert(cert)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 border rounded-xl transition-all ${
                          isDark
                            ? "border-[#252840] text-[#a0aec0] hover:border-indigo-500/40 hover:text-indigo-400"
                            : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Certificate Preview Modal ────────────────────────────────── */}
      {previewCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
          <div
            className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden transition-all ${
              isDark ? "bg-[#0d0f1a]" : "bg-white"
            }`}
          >
            {/* Close Button */}
            <button
              id="close-cert-modal"
              onClick={() => setPreviewCert(null)}
              className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isDark ? "bg-[#1a1d2e] hover:bg-[#252840] text-[#7a87a1]" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Certificate Design */}
            <div className="p-6 sm:p-8">
              {/* Outer decorative border */}
              <div
                id="certificate-view"
                className="relative p-6 sm:p-8"
                style={{
                  border: "3px double #c9a227",
                  borderRadius: "16px",
                  boxShadow: "inset 0 0 0 6px rgba(201, 162, 39, 0.12)",
                  background: isDark
                    ? "linear-gradient(135deg, #0d0f1a 0%, #13151f 100%)"
                    : "linear-gradient(135deg, #fffef5 0%, #fff 100%)",
                }}
              >
                {/* Corner Decorations */}
                {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos) => (
                  <div
                    key={pos}
                    className={`absolute ${pos} w-5 h-5 rounded-sm border-2 border-yellow-500/60`}
                  />
                ))}

                {/* Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500/50" />
                    <Award className="w-8 h-8 text-yellow-500" />
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500/50" />
                  </div>

                  <h2 className={`text-xs font-black tracking-[0.3em] uppercase mb-1 ${
                    isDark ? "text-yellow-400" : "text-yellow-600"
                  }`}>
                    Certificate of Completion
                  </h2>
                  <p className={`text-[10px] font-semibold tracking-widest uppercase ${muted}`}>
                    Elevate E-Learning Platform
                  </p>
                </div>

                {/* Divider */}
                <div className={`h-px mb-6 ${isDark ? "bg-yellow-500/20" : "bg-yellow-300/60"}`} />

                {/* Body */}
                <div className="text-center space-y-3">
                  <p className={`text-xs tracking-wide ${muted}`}>This certifies that</p>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
                    John Doe
                  </h1>
                  <p className={`text-xs tracking-wide ${muted}`}>has successfully completed</p>
                  <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight ${text} max-w-sm mx-auto leading-tight`}>
                    {previewCert.course}
                  </h3>
                  <p className={`text-xs ${muted}`}>
                    on <span className="font-semibold">{previewCert.completionDate}</span>
                  </p>
                </div>

                {/* Divider */}
                <div className={`h-px my-6 ${isDark ? "bg-yellow-500/20" : "bg-yellow-300/60"}`} />

                {/* Signatures */}
                <div className="flex justify-between items-end gap-4">
                  {[
                    { label: "Course Instructor", name: previewCert.instructor },
                    { label: "Platform Director", name: "Michael Carter" },
                  ].map(({ label, name }) => (
                    <div key={label} className="flex-1 text-center">
                      <div className={`font-mono text-xs mb-1 italic ${isDark ? "text-[#4a5568]" : "text-slate-300"}`}>
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~
                      </div>
                      <p className={`text-[10px] font-bold ${text}`}>{name}</p>
                      <p className={`text-[9px] tracking-wide ${muted}`}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Footer Info */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    <code className={`text-[9px] font-mono ${muted}`}>{previewCert.id}</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ExternalLink className={`w-3 h-3 ${muted}`} />
                    <span className={`text-[9px] ${muted}`}>verify.elevate.io/{previewCert.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-end gap-3 px-6 pb-5 -mt-2`}>
              <button
                id="modal-close-btn"
                onClick={() => setPreviewCert(null)}
                className={`px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                  isDark
                    ? "border-[#252840] text-[#e2e8f0] hover:bg-[#1a1d2e]"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Close
              </button>
              <button
                id="modal-download-btn"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20"
              >
                <Download className="w-4 h-4" /> {isDownloading ? "Downloading..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
