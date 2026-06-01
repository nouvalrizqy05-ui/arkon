import { useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare, Star, HelpCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const NOTE_TYPES = [
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, color: 'text-blue-600 bg-blue-100' },
  { id: 'correction', label: 'Koreksi', icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
  { id: 'praise', label: 'Pujian', icon: Star, color: 'text-amber-600 bg-amber-100' },
  { id: 'question', label: 'Pertanyaan', icon: HelpCircle, color: 'text-violet-600 bg-violet-100' },
];

/**
 * ProjectNotes — Tinkercad-style feedback system.
 * Supports note types (feedback, correction, praise, question)
 * and optional spatial position data for 3D/canvas targeting.
 */
export default function ProjectNotes({ workId, authorId, authorName, authorRole, token, apiUrl, socket }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState('feedback');
  const [isSending, setIsSending] = useState(false);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/notes/work/${workId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setNotes(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [workId, apiUrl, token]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // Mark notes as read when viewing
  useEffect(() => {
    if (!workId || !token) return;
    fetch(`${apiUrl}/api/notes/read/${workId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
  }, [workId, apiUrl, token]);

  // Real-time: listen for new notes via socket
  useEffect(() => {
    if (!socket) return;
    const handleNewNote = (data) => {
      if (data.work_id === workId) {
        setNotes(prev => [data.note, ...prev]);
      }
    };
    socket.on('note:new', handleNewNote);
    return () => socket.off('note:new', handleNewNote);
  }, [socket, workId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          work_id: workId,
          author_id: authorId,
          author_name: authorName,
          author_role: authorRole,
          content: content.trim(),
          note_type: noteType,
          position_data: {} // Phase 4+: spatial coordinates from 3D canvas
        })
      });

      if (res.ok) {
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        setContent('');
      }
    } catch (e) { console.error(e); }
    finally { setIsSending(false); }
  };

  const getNoteIcon = (type) => {
    const t = NOTE_TYPES.find(n => n.id === type);
    if (!t) return { Icon: MessageSquare, color: 'text-gray-600 bg-gray-100' };
    return { Icon: t.icon, color: t.color };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare size={14} className="text-indigo-500" />
          Project Notes ({notes.length})
        </h4>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-secondary text-xs">Memuat catatan...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-xs text-secondary font-medium">Belum ada catatan.</p>
            <p className="text-[10px] text-foreground mt-1">Berikan feedback pertama!</p>
          </div>
        ) : (
          notes.map((note) => {
            const { Icon, color } = getNoteIcon(note.note_type);
            const isOwn = note.author_id === authorId;
            return (
              <div
                key={note.id}
                className={`p-3 rounded-xl border transition-all ${
                  isOwn ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-700">
                        {note.author_name || (note.author_role === 'dosen' ? 'Dosen' : 'Mahasiswa')}
                      </span>
                      <span className="text-[9px] text-secondary">
                        {new Date(note.created_at).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    {note.position_data?.component && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-gray-100 rounded text-[9px] font-bold text-gray-500">
                        📍 {note.position_data.component}
                        {note.position_data.slot && ` → ${note.position_data.slot}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compose */}
      <div className="border-t border-gray-100 p-3 bg-white shrink-0">
        {/* Note Type Selector */}
        <div className="flex items-center gap-1 mb-2">
          {NOTE_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setNoteType(type.id)}
                title={type.label}
                className={`p-1.5 rounded-lg transition-all ${
                  noteType === type.id
                    ? `${type.color} ring-1 ring-current/20`
                    : 'text-secondary hover:bg-gray-50'
                }`}
              >
                <Icon size={14} />
              </button>
            );
          })}
          <span className="text-[9px] text-secondary ml-auto font-bold">
            {NOTE_TYPES.find(t => t.id === noteType)?.label}
          </span>
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Tulis feedback..."
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
          />
          <button
            type="submit"
            disabled={isSending || !content.trim()}
            className="p-2.5 bg-indigo-600 text-foreground rounded-xl hover:bg-indigo-700 transition disabled:opacity-40 shadow-sm"
          >
            {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </div>
  );
}
