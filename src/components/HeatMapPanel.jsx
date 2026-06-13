import { useState, useEffect } from 'react';
import { Flame, Download, Loader2, AlertCircle, Users, BookOpen, X, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HeatMapPanel({ activeRoom, token, apiUrl }) {
  const [heatData, setHeatData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drillDown, setDrillDown] = useState(null); // { studentName, topicName, avgScore, attemptCount }

  useEffect(() => {
    if (activeRoom) fetchHeatMap();
  }, [activeRoom]);

  const fetchHeatMap = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/analytics/heatmap/${activeRoom.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setHeatData(await res.json());
    } catch (err) {
      console.error('Heatmap fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse topic name from JSON file_name
  const parseTopicName = (raw) => {
    try {
      const parsed = JSON.parse(raw);
      return parsed.title || 'Untitled';
    } catch { return raw || 'Untitled'; }
  };

  // Build grid data: students × topics
  const students = [...new Map(heatData.map(d => [d.student_id, d.student_name])).entries()].map(([id, name]) => ({ id, name }));
  const topics = [...new Map(heatData.map(d => [d.material_id, parseTopicName(d.topic_raw)])).entries()].map(([id, name]) => ({ id, name }));

  const getScore = (studentId, materialId) => {
    const entry = heatData.find(d => d.student_id === studentId && d.material_id === materialId);
    return entry ? { avg: entry.avg_score, attempts: entry.attempt_count } : null;
  };

  const getColor = (score) => {
    if (score === null) return 'bg-slate-100 dark:bg-slate-800 text-secondary';
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
    return 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
  };

  const getColorBg = (score) => {
    if (score === null) return '#f3f4f6';
    if (score >= 80) return '#d1fae5';
    if (score >= 60) return '#fef3c7';
    if (score >= 40) return '#ffedd5';
    return '#fee2e2';
  };

  // Topic averages for summary bar
  const topicAverages = topics.map(topic => {
    const scores = heatData.filter(d => d.material_id === topic.id).map(d => d.avg_score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { ...topic, avg };
  });

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(18);
    doc.setTextColor(36, 103, 206);
    doc.text('ARKON Heat Map — Pemahaman per Topik', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Kelas: ${activeRoom?.course_name || '-'}`, 14, 28);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 34);

    const headers = ['Mahasiswa', ...topics.map(t => t.name)];
    const rows = students.map(s => [
      s.name,
      ...topics.map(t => {
        const sc = getScore(s.id, t.id);
        return sc ? `${sc.avg}%` : '-';
      })
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 42,
      theme: 'grid',
      headStyles: { fillColor: [36, 103, 206], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index > 0) {
          const val = parseInt(data.cell.raw);
          if (!isNaN(val)) {
            if (val >= 80) data.cell.styles.fillColor = [209, 250, 229];
            else if (val >= 60) data.cell.styles.fillColor = [254, 243, 199];
            else if (val >= 40) data.cell.styles.fillColor = [255, 237, 213];
            else data.cell.styles.fillColor = [254, 226, 226];
          }
        }
      }
    });

    const safeRoomName = activeRoom?.course_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Class';
    doc.save(`ARKON_HeatMap_${safeRoomName}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#2467ce] mr-3" size={24} />
        <span className="text-secondary font-bold">Memuat data heat map...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Flame className="text-orange-500" size={28} /> Heat Map Pemahaman
          </h2>
          <p className="text-secondary text-sm mt-1">Visualisasi pemahaman mahasiswa per topik materi</p>
        </div>
        {heatData.length > 0 && (
          <button onClick={exportPDF} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-foreground rounded-xl font-bold shadow-md transition-all active:scale-95 text-sm" aria-label="Unduh">
            <Download size={16} /> Unduh PDF
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-xs font-black text-secondary uppercase tracking-widest">Skala:</span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded bg-emerald-200 border border-emerald-300" />
          <span className="text-[10px] font-bold text-emerald-700">≥80</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded bg-amber-200 border border-amber-300" />
          <span className="text-[10px] font-bold text-amber-700">60-79</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded bg-orange-200 border border-orange-300" />
          <span className="text-[10px] font-bold text-orange-700">40-59</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded bg-red-200 border border-red-300" />
          <span className="text-[10px] font-bold text-red-700">&lt;40</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          <span className="text-[10px] font-bold text-secondary">Belum ada</span>
        </div>
      </div>

      {heatData.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-dashed border-border dark:border-slate-700 p-16 text-center">
          <AlertCircle className="mx-auto text-foreground mb-3" size={32} />
          <h3 className="font-bold text-foreground mb-1">Belum Ada Data</h3>
          <p className="text-secondary text-sm">Data heat map akan muncul setelah mahasiswa menyelesaikan kuis dari materi yang telah Anda upload.</p>
        </div>
      ) : (
        <>
          {/* Topic Average Summary Bar */}
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-border shadow-sm p-6 mb-6">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Rata-Rata Per Topik
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {topicAverages.map(t => (
                <div key={t.id} className={`rounded-2xl border p-4 text-center ${getColor(t.avg)}`}>
                  <p className="text-2xl font-black">{t.avg !== null ? t.avg : '-'}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-1 truncate">{t.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Heat Map Grid */}
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900">
                    <th className="p-4 border-b border-border dark:border-slate-800 font-bold text-xs text-secondary uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">
                      <div className="flex items-center gap-2"><Users size={14} /> Mahasiswa</div>
                    </th>
                    {topics.map(t => (
                      <th key={t.id} className="p-4 border-b border-border dark:border-slate-800 font-bold text-xs text-secondary uppercase tracking-wider text-center min-w-[100px]">
                        <div className="flex items-center justify-center gap-1"><BookOpen size={12} /> {t.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 border-b border-border dark:border-slate-800 font-medium text-sm text-foreground sticky left-0 bg-[var(--bg-surface)] z-10">
                        {s.name}
                      </td>
                      {topics.map(t => {
                        const scoreData = getScore(s.id, t.id);
                        const avg = scoreData?.avg ?? null;
                        return (
                          <td key={t.id} className="p-2 border-b border-border dark:border-slate-800 text-center">
                            <button
                              onClick={() => scoreData && setDrillDown({ studentName: s.name, topicName: t.name, avgScore: avg, attemptCount: scoreData.attempts })}
                              className={`w-full px-3 py-2 rounded-xl text-sm font-black border transition-all hover:scale-105 ${getColor(avg)} ${scoreData ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              {avg !== null ? avg : '-'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Drill-down Modal */}
      {drillDown && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-surface)] rounded-3xl shadow-2xl p-8 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-foreground">Detail Skor</h3>
              <button onClick={() => setDrillDown(null)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-secondary transition">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Mahasiswa</p>
                <p className="font-bold text-foreground">{drillDown.studentName}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Topik</p>
                <p className="font-bold text-foreground">{drillDown.topicName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-2xl p-4 text-center border ${getColor(drillDown.avgScore)}`}>
                  <p className="text-3xl font-black">{drillDown.avgScore}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Rata-Rata</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400">{drillDown.attemptCount}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Percobaan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
