import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, Flame, MessageCircle, Send, Trophy, Gamepad2, Monitor, Server, Gauge, ChevronDown, Filter, Trash2, Award } from 'lucide-react';
import { findComponentById, CATEGORY_EMOJIS } from '../data/pc-components';

const SORT_OPTIONS = [
  { id: 'newest', label: '🕒 Terbaru' },
  { id: 'most_liked', label: '👍 Most Liked' },
  { id: 'most_fire', label: '🔥 Most Fire' },
  { id: 'best_gaming', label: '🎮 Best Gaming' },
];

function ScoreBar({ icon, label, score, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-secondary w-6">{icon}</span>
      <div className="flex-1 h-1.5 bg-white shadow-sm border border-border rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-bold text-secondary w-6 text-right">{score}</span>
    </div>
  );
}

function BuildCard({ build, studentId, token, apiUrl, onReact, userRole }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(build.comments || []);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  
  // Simulated local state for rating (for UI purposes since DB isn't updated yet)
  const [dosenScore, setDosenScore] = useState(build.dosen_score || '');
  const [isScored, setIsScored] = useState(!!build.dosen_score);

  const myLike = build.my_like;
  const myFire = build.my_fire;
  const components = typeof build.components === 'string' ? JSON.parse(build.components) : build.components;
  const scores = typeof build.benchmark_scores === 'string' ? JSON.parse(build.benchmark_scores) : build.benchmark_scores;

  const handleReact = async (type) => {
    try {
      await fetch(`${apiUrl}/api/showroom/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ build_id: build.id, student_id: studentId, reaction_type: type }),
      });
      if (onReact) onReact();
    } catch (err) { console.error(err); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/showroom/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ build_id: build.id, student_id: studentId, comment_text: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
      }
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await fetch(`${apiUrl}/api/showroom/comment/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) { console.error(err); }
  };

  const handleScoreSubmit = async () => {
    if (!dosenScore) return;
    setIsScored(true);
    // Real implementation would send to backend
    // fetch(...)
  };

  return (
    <div className="bg-white/[0.03] border border-border rounded-2xl overflow-hidden hover:border-border transition-all">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <img src={`https://ui-avatars.com/api/?name=${build.builder_name}&background=6366f1&color=fff&size=36`} className="w-9 h-9 rounded-full" alt="" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{build.build_name}</p>
          <p className="text-[10px] text-secondary">oleh {build.builder_name} · {new Date(build.created_at).toLocaleDateString('id-ID')}</p>
        </div>
        {build.is_compatible && <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-600">✅ Compatible</span>}
      </div>

      {/* Components */}
      <div className="px-4 py-3 flex flex-wrap gap-1.5">
        {Object.entries(components).map(([cat, comp]) => (
          <span key={cat} className="px-2 py-1 bg-white shadow-sm border border-border border border-border rounded-lg text-[10px] font-bold text-secondary">
            {CATEGORY_EMOJIS[cat]} {comp.name || cat}
          </span>
        ))}
      </div>

      {/* Benchmark Scores */}
      {scores && (
        <div className="px-4 pb-3 space-y-1.5">
          <ScoreBar icon="🎮" label="Gaming" score={scores.gaming || 0} color="bg-rose-500" />
          <ScoreBar icon="🎬" label="Render" score={scores.rendering || 0} color="bg-blue-500" />
          <ScoreBar icon="🖥️" label="Server" score={scores.server || 0} color="bg-emerald-500" />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        <button onClick={() => handleReact('like')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${myLike ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' : 'bg-white shadow-sm border border-border text-secondary border border-border hover:bg-blue-500/10 hover:text-blue-600'}`} aria-label="ThumbsUp">
          <ThumbsUp size={13} /> {build.like_count || 0}
        </button>
        <button onClick={() => handleReact('fire')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${myFire ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white shadow-sm border border-border text-secondary border border-border hover:bg-orange-500/10 hover:text-orange-400'}`} aria-label="Flame">
          <Flame size={13} /> {build.fire_count || 0}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white shadow-sm border border-border text-secondary border border-border hover:bg-white shadow-sm border border-border transition-all ml-auto" aria-label="MessageCircle">
          <MessageCircle size={13} /> {build.comment_count || comments.length}
        </button>
      </div>

      {/* Dosen Grading Section */}
      {userRole === 'dosen' && (
        <div className="px-4 py-3 border-t border-indigo-100 bg-indigo-50/50">
          <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Trophy size={12} /> Evaluasi Dosen (Privat)
          </p>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min="0" max="100" 
              value={dosenScore} 
              onChange={e => setDosenScore(e.target.value)} 
              disabled={isScored}
              placeholder="Skor 0-100" 
              className="w-24 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-indigo-500" 
            />
            <button 
              onClick={handleScoreSubmit}
              disabled={!dosenScore || isScored}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all ${isScored ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50'}`}
            >
              {isScored ? 'Ternilai ✅' : 'Beri Nilai'}
            </button>
          </div>
        </div>
      )}

      {/* Student View of Score */}
      {(build.builder_id === studentId || isScored) && userRole !== 'dosen' && (build.dosen_score || isScored) && (
        <div className="px-4 py-2 border-t border-emerald-100 bg-emerald-50/50 flex items-center gap-2">
          <Award size={14} className="text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">Nilai dari Dosen: {dosenScore || build.dosen_score}/100</span>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-2 animate-in fade-in duration-200">
          {comments.length === 0 && <p className="text-[10px] text-secondary italic text-center py-2">Belum ada komentar</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2 group">
              <img src={`https://ui-avatars.com/api/?name=${c.commenter_name || 'U'}&background=374151&color=fff&size=24`} className="w-6 h-6 rounded-full shrink-0 mt-0.5" alt="" />
              <div className="flex-1 bg-white/[0.03] border border-border rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-secondary">{c.commenter_name || 'User'}</span>
                  <span className="text-[10px] text-secondary">{c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID') : ''}</span>
                  {c.student_id === studentId && (
                    <button onClick={() => handleDeleteComment(c.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition"><Trash2 size={10} /></button>
                  )}
                </div>
                <p className="text-[11px] text-secondary leading-relaxed mt-0.5">{c.comment_text}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} placeholder="Tulis komentar..." maxLength={300} className="flex-1 bg-white shadow-sm border border-border border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder-white/20 focus:outline-none focus:border-indigo-500/50" />
            <button onClick={handleComment} disabled={sending || !commentText.trim()} className="p-2 bg-indigo-500 text-foreground rounded-xl hover:bg-indigo-400 transition disabled:opacity-30"><Send size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PcShowroom({ embeddedMode = false, studentId: propStudentId, token: propToken, apiUrl: propApiUrl, userRole } = {}) {
  const navigate = useNavigate();
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const studentId = propStudentId || localStorage.getItem('user_id');
  const studentName = localStorage.getItem('user_name') || 'User';
  const token = propToken || localStorage.getItem('auth_token');
  const API_URL = propApiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchBuilds = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const res = await fetch(`${API_URL}/api/showroom/builds?sort=${sortBy}&page=${currentPage}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setBuilds(data);
        } else {
          setBuilds(prev => [...prev, ...data]);
        }
        setHasMore(data.length === 10);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [sortBy, page]);

  useEffect(() => { 
    setPage(1);
    fetchBuilds(true); 
  }, [sortBy]);

  useEffect(() => {
    if (page > 1) fetchBuilds(false);
  }, [page]);

  return (
    <div className="min-h-screen bg-muted text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-muted/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!embeddedMode && (
              <button onClick={() => navigate(-1)} className="p-2 bg-white shadow-sm border border-border border border-border rounded-xl text-secondary hover:text-foreground hover:bg-white shadow-sm border border-border transition" aria-label="ArrowLeft">
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h1 className="text-lg font-black flex items-center gap-2"><Trophy size={20} className="text-amber-600" /> PC Showroom</h1>
              <p className="text-[10px] text-secondary">Build PC terbaik dari seluruh mahasiswa</p>
            </div>
          </div>
          {/* Sort */}
          <div className="relative">
            <button onClick={() => setShowSort(!showSort)} className="flex items-center gap-2 px-3 py-2 bg-white shadow-sm border border-border border border-border rounded-xl text-xs font-bold text-secondary hover:text-foreground transition" aria-label="Filter">
              <Filter size={14} /> {SORT_OPTIONS.find(s => s.id === sortBy)?.label} <ChevronDown size={12} />
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-2 bg-[#1a1f35] border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 min-w-[180px]">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => { setSortBy(opt.id); setShowSort(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold transition ${sortBy === opt.id ? 'bg-indigo-100 text-indigo-600' : 'text-secondary hover:bg-white shadow-sm border border-border hover:text-foreground'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : builds.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white shadow-sm border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gauge size={40} className="text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-secondary mb-2">Belum Ada Build</h3>
            <p className="text-sm text-secondary">Rakit PC pertamamu dan share ke sini!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {builds.map(build => (
                <BuildCard key={build.id} build={build} studentId={studentId} token={token} apiUrl={API_URL} onReact={() => fetchBuilds(true)} userRole={userRole} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => setPage(p => p + 1)}
                  className="px-6 py-2 bg-white shadow-sm border border-border hover:bg-white shadow-sm border border-border text-secondary border border-border rounded-xl transition"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
