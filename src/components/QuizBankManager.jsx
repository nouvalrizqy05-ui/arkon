import { useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import quizData from '../data/quizzes.json';

const API_URL = import.meta.env.VITE_API_URL || '';

const DIFFICULTY_LABELS = { 1: { label: 'Mudah', color: 'text-green-600 bg-green-50', dot: 'bg-green-500' },
  2: { label: 'Sedang', color: 'text-yellow-700 bg-yellow-50', dot: 'bg-yellow-500' },
  3: { label: 'Sulit',  color: 'text-red-600 bg-red-50',   dot: 'bg-red-500' } };

const TOPICS = [
  'CPU Architecture','Memory Hierarchy','ALU & Arithmetic','Cache Memory',
  'Instruction Set Architecture (ISA)','Pipeline Processing','I/O & Interkoneksi',
  'Number Systems','RISC vs CISC','Parallel Processing','Bus Architecture',
  'Virtual Memory','Floating Point','Assembly Language','Lainnya'
];

const EMPTY_FORM = { question_text: '', options: ['', '', '', ''], correct_index: 0, difficulty: 2, topic: TOPICS[0], explanation: '' };

// ─── Sub-component: Question Form ─────────────────────────────────
function QuestionForm({ initial = EMPTY_FORM, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.question_text.trim()) e.question_text = 'Pertanyaan wajib diisi.';
    form.options.forEach((opt, i) => { if (!opt.trim()) e[`opt_${i}`] = 'Pilihan wajib diisi.'; });
    return e;
  };

  const handleOptionChange = (i, val) => {
    const opts = [...form.options]; opts[i] = val; setForm(f => ({ ...f, options: opts }));
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  return (
    <div className="space-y-4">
      {/* Question text */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Teks Pertanyaan <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3} value={form.question_text}
          onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
          placeholder="Tulis pertanyaan di sini..."
          className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 dark:text-gray-100
            dark:border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500
            ${errors.question_text ? 'border-red-400' : 'border-gray-300'}`}
        />
        {errors.question_text && <p className="text-xs text-red-500 mt-1">{errors.question_text}</p>}
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Pilihan Jawaban <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-gray-500">(klik radio untuk pilih jawaban benar)</span>
        </label>
        <div className="space-y-2">
          {['A','B','C','D'].map((letter, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors
              ${form.correct_index === i ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <input type="radio" name="correct" checked={form.correct_index === i}
                onChange={() => setForm(f => ({ ...f, correct_index: i }))}
                className="accent-green-500 flex-shrink-0" />
              <span className={`text-xs font-bold w-5 flex-shrink-0 ${form.correct_index === i ? 'text-green-600' : 'text-gray-500'}`}>{letter}.</span>
              <input type="text" value={form.options[i]} onChange={e => handleOptionChange(i, e.target.value)}
                placeholder={`Pilihan ${letter}`}
                className={`flex-1 bg-transparent text-sm focus:outline-none dark:text-gray-200
                  ${errors[`opt_${i}`] ? 'placeholder-red-400' : 'placeholder-gray-400'}`} />
              {form.correct_index === i && <span className="text-xs text-green-600 font-semibold flex-shrink-0">✓ Benar</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty + Topic */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Kesulitan</label>
          <div className="flex gap-2">
            {[1,2,3].map(d => (
              <button key={d} onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all
                  ${form.difficulty === d ? `${DIFFICULTY_LABELS[d].color} border-current` : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {DIFFICULTY_LABELS[d].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Topik</label>
          <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Penjelasan Jawaban <span className="text-gray-400 font-normal text-xs">(opsional — ditampilkan setelah mahasiswa menjawab)</span>
        </label>
        <textarea rows={2} value={form.explanation}
          onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
          placeholder="Jelaskan mengapa jawaban tersebut benar..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors">
          {loading ? 'Menyimpan...' : (initial === EMPTY_FORM ? '+ Tambah Soal' : 'Simpan Perubahan')}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Batal
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-component: Import via CSV/JSON ───────────────────────────
function BulkImportPanel({ roomId, token, onImported }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { showToast } = useToast();

  const CSV_TEMPLATE = `question_text,optionA,optionB,optionC,optionD,correct_index,difficulty,topic,explanation
"Apa kepanjangan dari CPU?","Central Processing Unit","Computer Power Unit","Core Processing Unit","Central Power Unit",0,1,"CPU Architecture","CPU adalah otak dari komputer."
"Berapa bit pada register umum x86-64?","16","32","64","128",2,2,"CPU Architecture","x86-64 menggunakan register 64-bit."`;

  const handleSyncFromJson = async () => {
    if (!confirm('Peringatan: Ini akan mengeksekusi script update soal dan menyinkronkan seluruh soal dari quizzes.json. Lanjutkan?')) return;
    setLoading(true); setResult(null);
    try {
      // Panggil endpoint khusus yang melakukan merge data JSON + import ke DB secara otomatis di server
      const res = await fetch(`${API_URL}/api/irt/bank/${roomId}/force-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        showToast(`✅ Sinkronisasi 1-to-1 sukses! ${data.inserted} soal ditambahkan, ${data.deleted || 0} soal lama/sampah dihapus.`, 'success');
        onImported?.();
      } else {
        showToast(data.error || 'Sinkronisasi gagal', 'error');
      }
    } catch {
      showToast('Gagal memproses sinkronisasi dengan backend.', 'error');
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!text.trim()) return;
    setLoading(true); setResult(null);
    try {
      // Parse CSV
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const questions = lines.slice(1).filter(l => l.trim()).map(line => {
        // Handle quoted commas properly
        const vals = [];
        let curr = '', inQuote = false;
        for (const ch of line) {
          if (ch === '"') { inQuote = !inQuote; }
          else if (ch === ',' && !inQuote) { vals.push(curr.trim()); curr = ''; }
          else curr += ch;
        }
        vals.push(curr.trim());
        const q = {};
        headers.forEach((h, i) => { q[h] = vals[i]?.replace(/^"|"$/g, '') || ''; });
        return {
          question_text: q.question_text,
          options: [q.optionA, q.optionB, q.optionC, q.optionD],
          correct_index: parseInt(q.correct_index) || 0,
          difficulty: parseInt(q.difficulty) || 2,
          topic: q.topic || 'Lainnya',
          explanation: q.explanation || ''
        };
      });

      const res = await fetch(`${API_URL}/api/irt/bank/${roomId}/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questions })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        showToast(`✅ ${data.inserted} soal berhasil diimport!`, 'success');
        onImported?.();
        setText('');
      } else {
        showToast(data.error || 'Import gagal', 'error');
      }
    } catch {
      showToast('Gagal memproses file. Periksa format CSV.', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* JSON Sync Section */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2">Sinkronisasi Otomatis</h4>
        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
          Tarik semua data soal yang ada di master file (quizzes.json). Cocok digunakan setelah menjalankan script update_quizzes.js.
        </p>
        <button onClick={handleSyncFromJson} disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors">
          {loading ? 'Menyinkronkan...' : '🔄 Sinkronisasi dari quizzes.json'}
        </button>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* CSV Import Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Import Manual CSV</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Import soal spesifik via CSV. Maks 200 soal per import.</p>
          </div>
          <button onClick={() => {
            const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'template_soal_arkon.csv'; a.click();
          }} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">
            ⬇ Download Template CSV
          </button>
        </div>
        <textarea rows={8} value={text} onChange={e => setText(e.target.value)}
          placeholder={`Paste isi CSV di sini:\n\n${CSV_TEMPLATE}`}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-mono bg-white dark:bg-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={handleImport} disabled={loading || !text.trim()}
          className="w-full py-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors">
          {loading ? 'Mengimport...' : `Import ${text.trim().split('\n').length > 1 ? text.trim().split('\n').length - 1 : 0} Baris`}
        </button>
      </div>

      {result && (
        <div className={`p-3 rounded-lg text-sm ${result.errors?.length ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
          <p className="font-semibold">{result.message}</p>
          {result.errors?.length > 0 && (
            <ul className="mt-1 text-xs text-red-600 space-y-0.5 max-h-32 overflow-y-auto">
              {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
              {result.errors.length > 10 && <li>...dan {result.errors.length - 10} error lainnya</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component: QuizBankManager ─────────────────────────────
export default function QuizBankManager({ roomId, token }) {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ difficulty: '', topic: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add' | 'import'
  const [bankHealth, setBankHealth] = useState(null);
  const { showToast } = useToast();

  const fetchQuestions = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.topic) params.append('topic', filters.topic);
      const res = await fetch(`${API_URL}/api/irt/bank/${roomId}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Auto-sync jika jumlah soal di database kurang dari jumlah soal di master data (quizzes.json)
        let qList = [];
        if (Array.isArray(quizData)) {
          qList = quizData;
        } else if (quizData.levels) {
          qList = quizData.levels.flatMap(l => l.questions.map(q => ({
            question_text: q.question,
            options: q.options,
            correct_index: q.answer,
            difficulty: q.difficulty || 2,
            topic: l.chapterTitle || l.name || 'General',
            explanation: q.explanation || ''
          })));
        }

        if (data.total < qList.length && !filters.difficulty && !filters.topic) {
          try {
            const syncRes = await fetch(`${API_URL}/api/irt/bank/${roomId}/bulk-import`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ questions: qList })
            });

            if (syncRes.ok) {
              const resAfterSync = await fetch(`${API_URL}/api/irt/bank/${roomId}?page=1&limit=15`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (resAfterSync.ok) {
                const newData = await resAfterSync.json();
                setQuestions(newData.questions || []);
                setTotal(newData.total || 0);
                setTotalPages(newData.totalPages || 1);
              }
              // re-fetch health after sync
              fetchHealth();
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Auto sync failed:', e);
          }
        }
        
        setQuestions(data.questions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [roomId, token, page, filters]);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/irt/bank/health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setBankHealth(await res.json());
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => { fetchQuestions(); fetchHealth(); }, [fetchQuestions, fetchHealth]);

  const handleCreate = async (form) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/irt/bank/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('✅ Soal berhasil ditambahkan!', 'success');
        setActiveTab('list'); setShowAdd(false);
        fetchQuestions(); fetchHealth();
      } else showToast(data.error || 'Gagal menambah soal', 'error');
    } catch { showToast('Koneksi gagal', 'error'); }
    setActionLoading(false);
  };

  const handleUpdate = async (id, form) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/irt/bank/${roomId}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('✅ Soal berhasil diperbarui!', 'success');
        setEditingId(null); fetchQuestions();
      } else showToast(data.error || 'Gagal memperbarui soal', 'error');
    } catch { showToast('Koneksi gagal', 'error'); }
    setActionLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus soal ini? Aksi tidak dapat dibatalkan.')) return;
    try {
      const res = await fetch(`${API_URL}/api/irt/bank/${roomId}/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { showToast('Soal dihapus.', 'success'); fetchQuestions(); fetchHealth(); }
      else showToast('Gagal menghapus soal', 'error');
    } catch { showToast('Koneksi gagal', 'error'); }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">📚 Bank Soal</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{total} soal tersedia · Kelola soal adaptif untuk IRT Rasch</p>
        </div>
        <div className="flex gap-2">
          {['list','add','import'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {tab === 'list' ? '📋 Daftar' : tab === 'add' ? '+ Tambah' : '⬆ Import'}
            </button>
          ))}
        </div>
      </div>

      {/* Bank Health Warning */}
      {bankHealth && bankHealth.warnings?.length > 0 && (
        <div className="mx-6 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
          <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">⚠️ Peringatan IRT Bank Soal</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">{bankHealth.recommendation}</p>
        </div>
      )}
      {bankHealth && bankHealth.is_sufficient && (
        <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
          <p className="text-xs font-semibold text-green-800 dark:text-green-300">✅ Bank soal sudah cukup untuk IRT reliable</p>
          <p className="text-xs text-green-700 dark:text-green-400">{bankHealth.total_questions} soal terdaftar</p>
        </div>
      )}

      <div className="p-6">
        {/* Tab: Add */}
        {activeTab === 'add' && (
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Tambah Soal Baru</h3>
            <QuestionForm onSave={handleCreate} loading={actionLoading} onCancel={() => setActiveTab('list')} />
          </div>
        )}

        {/* Tab: Import */}
        {activeTab === 'import' && (
          <BulkImportPanel roomId={roomId} token={token} onImported={() => { fetchQuestions(); fetchHealth(); setActiveTab('list'); }} />
        )}

        {/* Tab: List */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3">
              <select value={filters.difficulty} onChange={e => { setFilters(f => ({...f, difficulty: e.target.value})); setPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Semua Kesulitan</option>
                {[1,2,3].map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d].label}</option>)}
              </select>
              <select value={filters.topic} onChange={e => { setFilters(f => ({...f, topic: e.target.value})); setPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Semua Topik</option>
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 self-center">{total} soal</span>
            </div>

            {/* Questions list */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-semibold">Belum ada soal</p>
                <p className="text-sm mt-1">Tambahkan soal pertama atau import dari CSV</p>
                <button onClick={() => setActiveTab('add')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
                  + Tambah Soal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    {editingId === q.id ? (
                      <div className="p-4">
                        <QuestionForm
                          initial={{ question_text: q.question_text, options: JSON.parse(typeof q.options === 'string' ? q.options : JSON.stringify(q.options)),
                            correct_index: q.correct_index, difficulty: q.difficulty, topic: q.topic || TOPICS[0], explanation: q.explanation || '' }}
                          onSave={(form) => handleUpdate(q.id, form)}
                          onCancel={() => setEditingId(null)}
                          loading={actionLoading} />
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs text-gray-400">#{(page-1)*15 + i + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${DIFFICULTY_LABELS[q.difficulty]?.color || 'text-gray-500 bg-gray-100'}`}>
                                {DIFFICULTY_LABELS[q.difficulty]?.label || '?'}
                              </span>
                              {q.topic && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{q.topic}</span>}
                            </div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{q.question_text}</p>
                            <div className="grid grid-cols-2 gap-1 mt-2">
                              {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt, oi) => (
                                <span key={oi} className={`text-xs px-2 py-1 rounded-lg ${q.correct_index === oi
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                  {['A','B','C','D'][oi]}. {opt}
                                </span>
                              ))}
                            </div>
                            {q.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">💡 {q.explanation}</p>}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => setEditingId(q.id)}
                              className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              ✏ Edit
                            </button>
                            <button onClick={() => handleDelete(q.id)}
                              className="px-2.5 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  ← Prev
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">Hal {page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
