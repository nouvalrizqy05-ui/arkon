import { useState, useEffect, useCallback } from 'react';
import { BarChart2, TrendingUp, Users, AlertTriangle, Award, RefreshCw, ChevronDown, Info, Bot, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion } from 'framer-motion';
import SkeletonLoader from './SkeletonLoader';
import ErrorBoundary from './ErrorBoundary';

const THETA_RANGES = [
  { min: 2.0, max: 4.0, label: 'A (Sangat Baik)', color: '#10b981', bg: 'bg-emerald-500' },
  { min: 1.0, max: 2.0, label: 'B+ (Baik)', color: '#22c55e', bg: 'bg-green-500' },
  { min: 0.0, max: 1.0, label: 'B (Cukup Baik)', color: '#eab308', bg: 'bg-yellow-500' },
  { min: -1.0, max: 0.0, label: 'C (Cukup)', color: '#f97316', bg: 'bg-orange-500' },
  { min: -2.0, max: -1.0, label: 'D (Kurang)', color: '#ef4444', bg: 'bg-red-500' },
  { min: -4.0, max: -2.0, label: 'E (Sangat Kurang)', color: '#dc2626', bg: 'bg-red-600' },
];

const NGAIN_COLORS = {
  high: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' },
  low: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
  negative: { bg: 'bg-red-200', text: 'text-red-800', bar: 'bg-red-700' },
  ceiling: { bg: 'bg-primary-light', text: 'text-indigo-700', bar: 'bg-primary' },
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function ThetaDistribution({ students }) {
  const distribution = THETA_RANGES.map(range => ({
    ...range,
    count: students.filter(s => s.theta >= range.min && s.theta < range.max).length,
  }));
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-2">
        <BarChart2 size={16} className="text-primary" /> Distribusi Kemampuan Kelas (IRT θ)
      </h3>
      <p className="text-[10px] text-secondary mb-5">Berdasarkan Rasch Model 1-PL · {students.length} mahasiswa</p>
      
      <div className="space-y-3">
        {distribution.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-500 w-28 text-right shrink-0">{d.label}</span>
            <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(d.count / maxCount) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`h-full ${d.bg} rounded-lg flex items-center justify-end pr-2`}
                style={{ minWidth: d.count > 0 ? '32px' : '0' }}
              >
                {d.count > 0 && (
                  <span className="text-[11px] font-black text-white">{d.count}</span>
                )}
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NGainPanel({ ngainData }) {
  if (!ngainData) return null;
  
  const { students, classAverage, distribution, effectiveness } = ngainData;
  const avgColor = NGAIN_COLORS[classAverage?.category] || NGAIN_COLORS.low;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-2">
        <TrendingUp size={16} className="text-emerald-500" /> Analisis N-Gain Kelas
      </h3>
      <p className="text-[10px] text-secondary mb-5">Hake (1999) · Pre-test vs Post-test</p>

      {/* Class Average */}
      <div className={`${avgColor.bg} rounded-xl p-4 mb-5 border`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs font-bold ${avgColor.text} uppercase`}>Rata-rata N-Gain Kelas</p>
            <p className={`text-3xl font-black ${avgColor.text} mt-1`}>{classAverage?.gain?.toFixed(3) ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold ${avgColor.text}`}>{classAverage?.label}</p>
            <p className={`text-[10px] ${avgColor.text} opacity-70`}>{classAverage?.totalStudents} mahasiswa</p>
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {Object.entries(distribution || {}).map(([key, count]) => {
          const c = NGAIN_COLORS[key] || NGAIN_COLORS.low;
          return (
            <div key={key} className={`${c.bg} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-black ${c.text}`}>{count}</p>
              <p className={`text-[9px] font-bold ${c.text} uppercase`}>{key}</p>
            </div>
          );
        })}
      </div>

      {/* Effectiveness */}
      {effectiveness && (
        <div className="bg-primary-soft border border-indigo-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-indigo-700">{effectiveness.level}</p>
              <p className="text-[11px] text-primary mt-1 leading-relaxed">{effectiveness.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Per-Student Table */}
      {students && students.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Detail Per Mahasiswa</p>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Nama</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Pre</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Post</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">N-Gain</th>
                  <th className="text-center px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Kategori</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const c = NGAIN_COLORS[s.category] || NGAIN_COLORS.low;
                  return (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-2.5 font-bold text-gray-800 text-xs">{s.student_name}</td>
                      <td className="text-center px-3 py-2.5 text-xs text-gray-600">{s.pre_score}</td>
                      <td className="text-center px-3 py-2.5 text-xs text-gray-600">{s.post_score}</td>
                      <td className="text-center px-3 py-2.5 text-xs font-bold text-gray-800">{s.gain?.toFixed(3)}</td>
                      <td className="text-center px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>{s.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function IRTTable({ students }) {
  if (!students || students.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-2">
        <Award size={16} className="text-amber-500" /> Profil IRT Per Mahasiswa
      </h3>
      <p className="text-[10px] text-secondary mb-5">Estimasi kemampuan (θ) via Newton-Raphson MLE</p>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Mahasiswa</th>
              <th className="text-center px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">θ (Theta)</th>
              <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Kategori</th>
              <th className="text-center px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Respons</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Visual</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              // Normalize theta from [-4, 4] to [0, 100] for bar width
              const barWidth = Math.max(5, ((s.theta + 4) / 8) * 100);
              const barColor = s.theta >= 2 ? 'bg-emerald-500' : s.theta >= 1 ? 'bg-green-500' : s.theta >= 0 ? 'bg-yellow-500' : s.theta >= -1 ? 'bg-orange-500' : 'bg-red-500';
              return (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 font-bold text-gray-800 text-xs">{s.full_name}</td>
                  <td className="text-center px-3 py-2.5 text-xs font-mono font-bold text-gray-800">{s.theta?.toFixed(3)}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-bold" style={{ color: s.category_color }}>{s.category_label}</span>
                  </td>
                  <td className="text-center px-3 py-2.5 text-xs text-gray-500">{s.responses_count || 0}</td>
                  <td className="px-3 py-2.5">
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className={`h-full ${barColor} rounded-full`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * AnalyticsDashboard — Full IRT + N-Gain analytics panel for Dosen.
 * Replaces the placeholder that was in RoomHub.
 */
function AnalyticsDashboard({ roomId, token, apiUrl }) {
  const [irtStudents, setIrtStudents] = useState([]);
  const [ngainData, setNgainData] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAiSummary = async (classStats) => {
    setIsAiLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/ai/analytics-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomName: 'Classroom Insight',
          classData: classStats
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch AI summary:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let irtData = [];
      const summaryRes = await fetch(`${apiUrl}/api/irt/room/${roomId}/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (summaryRes.ok) {
        irtData = await summaryRes.json();
      } else {
        throw new Error('Gagal memuat ringkasan IRT kelas');
      }
      setIrtStudents(irtData.sort((a, b) => b.theta - a.theta));

      // Fetch N-Gain
      let ngainFetched = null;
      try {
        const ngainRes = await fetch(`${apiUrl}/api/analytics/n-gain/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ngainRes.ok) {
          ngainFetched = await ngainRes.json();
          setNgainData(ngainFetched);
        }
      } catch { /* N-Gain may have no data */ }

      // Compute stats for AI
      const avgThetaCalc = irtData.length > 0 ? irtData.reduce((s, x) => s + x.theta, 0) / irtData.length : 0;
      const atRiskCount = irtData.filter(s => s.theta < -1).length;
      
      const classStatsForAi = {
        totalStudents: irtData.length,
        avgTheta: avgThetaCalc,
        atRisk: atRiskCount,
        avgNGain: ngainFetched?.classAverage?.gain || 0,
        distribution: ngainFetched?.distribution || {}
      };

      // Trigger AI summary fetch asynchronously
      fetchAiSummary(classStatsForAi);

    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Gagal memuat data analitik');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, apiUrl, token]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 p-8 overflow-y-auto">
        <SkeletonLoader variant="dashboard" />
      </div>
    );
  }

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Laporan Analitik Kelas (ARKON)', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 30);
    
    // Summary Stats
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Ringkasan Metrik', 14, 45);
    
    const avgTheta = irtStudents.length > 0 ? (irtStudents.reduce((s, x) => s + x.theta, 0) / irtStudents.length).toFixed(2) : '0.00';
    const studentsAtRisk = irtStudents.filter(s => s.theta < -1).length;
    
    doc.autoTable({
      startY: 50,
      head: [['Total Mahasiswa', 'Rata-rata Theta (IRT)', 'Mahasiswa Berisiko (Theta < -1)']],
      body: [[irtStudents.length.toString(), avgTheta.toString(), studentsAtRisk.toString()]],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });
    
    // Student Data
    doc.text('Data Detail Mahasiswa (IRT & N-Gain)', 14, doc.lastAutoTable.finalY + 15);
    
    const tableData = irtStudents.map(s => {
      const gData = ngainData?.students?.find(g => g.student_name === s.full_name || g.student_id === s.student_id);
      return [
        s.full_name, // Changed from s.student_name to s.full_name because irtStudents uses full_name
        s.responses_count.toString(),
        s.theta.toFixed(2),
        gData ? gData.pre_score.toString() : '-',
        gData ? gData.post_score.toString() : '-',
        gData?.gain !== undefined && gData.gain !== null ? gData.gain.toFixed(3) : '-'
      ];
    });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Nama Mahasiswa', 'Jml Respon', 'Theta (IRT)', 'Pre-test', 'Post-test', 'N-Gain']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save(`Arkon_Analytics_${new Date().getTime()}.pdf`);
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-lg font-bold text-gray-700 mb-2">{error}</p>
          <button onClick={fetchAnalytics} className="px-4 py-2 bg-primary text-foreground rounded-xl text-sm font-bold hover:bg-primary-hover transition">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Compute summary stats
  const avgTheta = irtStudents.length > 0 ? (irtStudents.reduce((s, x) => s + x.theta, 0) / irtStudents.length).toFixed(2) : '0.00';
  const studentsWithData = irtStudents.filter(s => s.responses_count > 0).length;
  const studentsAtRisk = irtStudents.filter(s => s.theta < -1).length;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 custom-scrollbar">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <BarChart2 className="text-primary" size={28} /> Analytics & IRT
            </h2>
            <p className="text-sm text-gray-500 mt-1">Dashboard analitik psikometrik untuk room ini.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              aria-label="Export laporan analitik ke PDF"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
              disabled={irtStudents.length === 0}
            >
              <Download size={14} aria-hidden="true" /> Export PDF
            </button>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = `${apiUrl}/api/analytics/report/pdf/${roomId}`;
                link.setAttribute('download', '');
                // Add auth header via fetch for protected endpoint
                fetch(`${apiUrl}/api/analytics/report/pdf/${roomId}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.blob()).then(blob => {
                  const url = window.URL.createObjectURL(blob);
                  link.href = url;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                }).catch(() => alert('Gagal mengunduh laporan PDF dari server.'));
              }}
              aria-label="Download laporan PDF server-side"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-sm"
              disabled={irtStudents.length === 0}
            >
              <Download size={14} aria-hidden="true" /> Laporan Lengkap
            </button>
            <button
              onClick={fetchAnalytics}
              aria-label="Refresh data analitik kelas"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm"
            >
              <RefreshCw size={14} aria-hidden="true" /> Refresh
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Mahasiswa" value={irtStudents.length} sub="di room ini" color="bg-primary" />
          <StatCard icon={BarChart2} label="θ Rata-rata" value={avgTheta} sub="kemampuan kelas" color="bg-emerald-500" />
          <StatCard icon={Award} label="Sudah IRT" value={studentsWithData} sub={`dari ${irtStudents.length} mahasiswa`} color="bg-amber-500" />
          <StatCard icon={AlertTriangle} label="Perlu Perhatian" value={studentsAtRisk} sub="θ < -1.0" color="bg-red-500" />
        </div>

        {/* AI Summary Panel */}
        {irtStudents.length > 0 && (
          <div className="bg-primary-soft rounded-2xl border border-indigo-100 p-6 shadow-sm mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Bot size={100} className="text-indigo-900" />
            </div>
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
              <Bot size={18} className="text-primary" /> AI Insight & Rekomendasi
            </h3>
            <div className="relative z-10 text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">
              {isAiLoading ? (
                <div className="flex items-center gap-3 text-primary font-medium">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-indigo-500 rounded-full animate-spin" />
                  Gemini AI sedang menganalisis performa kelas...
                </div>
              ) : aiSummary ? (
                <div className="prose prose-sm prose-indigo max-w-none">
                  {aiSummary.split('\n').map((line, i) => (
                    <p key={i} className="mb-1">{line}</p>
                  ))}
                </div>
              ) : (
                <div className="bg-white shadow-sm border border-border border border-indigo-200 p-4 rounded-xl text-indigo-700 text-[13px]">
                  <p className="font-black mb-2 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> AI Insight Sedang Offline</p>
                  <p className="mb-2">Saat ini layanan AI Gemini tidak dapat diakses. Anda tetap dapat melakukan evaluasi manual melalui metrik di bawah:</p>
                  <ul className="list-disc list-inside space-y-1 opacity-80 pl-1 text-xs">
                    <li><strong>Distribusi Theta (θ):</strong> Estimasi kemampuan kognitif riil mahasiswa (IRT Rasch Model).</li>
                    <li><strong>Analisis N-Gain:</strong> Efektivitas peningkatan pemahaman (Pre-test vs Post-test).</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="space-y-6">
          <div>
            <ThetaDistribution students={irtStudents} />
            <p className="text-center text-[10px] text-secondary mt-2 font-medium">
              *<strong className="text-gray-500">θ (Theta)</strong> adalah estimasi kemampuan laten mahasiswa menurut IRT Rasch Model. Semakin besar θ, semakin tinggi pemahaman konsepnya.
            </p>
          </div>
          <NGainPanel ngainData={ngainData} />
          <IRTTable students={irtStudents} />
        </div>

        {/* No data notice */}
        {irtStudents.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 mt-6">
            <BarChart2 size={48} className="mx-auto text-foreground mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">Belum Ada Data</h3>
            <p className="text-sm text-secondary">Mahasiswa belum mengerjakan quiz di room ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsDashboardWithErrorBoundary(props) {
  return (
    <ErrorBoundary inline name="Analytics Dashboard">
      <AnalyticsDashboard {...props} />
    </ErrorBoundary>
  );
}
