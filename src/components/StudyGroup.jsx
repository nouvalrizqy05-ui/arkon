import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './Toast';
import {
  Users, Send, MessageSquare, BookOpen, UserPlus,
  ChevronRight, LogOut, Hash, Plus, Trash2, Check,
  CheckCircle2, Loader2, Info, Layout, Clock, ArrowLeft,
  Search, Eye, Activity, Shield
} from 'lucide-react';

// ─── Avatar helper ───────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
];
function getAvatarColor(name) {
  const safeName = name || '?';
  const code = safeName.charCodeAt(0) || 63;
  const idx = code % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
function Avatar({ name, size = 'sm' }) {
  const safeName = name || '?';
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${cls} ${getAvatarColor(safeName)} rounded-full flex items-center justify-center font-bold shrink-0`}>
      {safeName.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Typing dots ─────────────────────────────────────────────────────────────
function TypingDots({ users }) {
  if (!users.length) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-white border-t border-border">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-[11px] text-secondary">
        {users.slice(0, 2).join(', ')}{users.length > 2 ? ` +${users.length - 2}` : ''} sedang mengetik...
      </span>
    </div>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────
function ChatBubble({ msg, isMe }) {
  if (!msg) return null;
  const isNote = msg.message_type === 'note';
  const isSystem = msg.message_type === 'system';
  
  const dateObj = msg.created_at ? new Date(msg.created_at) : new Date();
  const time = isNaN(dateObj.getTime())
    ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const senderName = msg.student_name || 'System';

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-[10px] bg-slate-100 text-secondary px-3 py-1 rounded-full border border-border font-medium">
          {msg.content}
        </span>
      </div>
    );
  }

  if (isNote) {
    return (
      <div className="flex justify-center my-2">
        <div className="max-w-[85%] bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 w-full">
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookOpen size={12} className="text-amber-600" />
            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Catatan dari {senderName}</span>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed italic">{msg.content}</p>
          <p className="text-[10px] text-amber-500 mt-1.5 text-right">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 mb-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && <Avatar name={senderName} size="sm" />}
      <div className={`flex flex-col gap-0.5 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && (
          <span className="text-[11px] font-semibold text-secondary px-1">{senderName}</span>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
          isMe
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-white border border-border text-foreground rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        <span className="text-[10px] text-secondary px-1">{time}</span>
      </div>
    </div>
  );
}

// ─── Group card ───────────────────────────────────────────────────────────────
function GroupCard({ group, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white border border-border rounded-2xl hover:border-primary/30 hover:shadow-card-hover transition-all text-left group flex items-center gap-3"
    >
      <div className="w-10 h-10 bg-primary-soft border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
        <Hash size={16} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {group.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-secondary font-mono">{group.group_code}</span>
          <span className="text-[10px] text-secondary flex items-center gap-1">
            <Users size={9} /> {group.member_count || 0}
          </span>
        </div>
      </div>
      <ChevronRight size={16} className="text-secondary group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}

// ─── Dosen Monitor Lobby ──────────────────────────────────────────────────────
function DosenMonitorView({ onEnterGroup, token, apiUrl, roomId }) {
  const [activityData, setActivityData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/study-groups/activity/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setActivityData(await res.json());
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    fetchActivity();
  }, [roomId, token, apiUrl]);

  const filtered = activityData.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-4 bg-slate-50 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-primary-soft rounded-lg flex items-center justify-center">
            <Shield size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Mode Observer</p>
            <p className="text-[10px] text-secondary">Pantau semua grup aktif di kelas ini</p>
          </div>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama grup..."
            className="w-full bg-white border border-border rounded-xl pl-8 pr-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 size={18} className="text-primary animate-spin" />
            <span className="text-xs text-secondary">Memuat data grup...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <Users size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-secondary">Belum ada grup di kelas ini</p>
          </div>
        ) : (
          filtered.map(group => (
            <div key={group.id} className="bg-white border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-soft rounded-xl flex items-center justify-center">
                    <Hash size={15} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{group.name}</p>
                    <p className="text-[10px] font-mono text-secondary">{group.group_code}</p>
                  </div>
                </div>
                <button
                  onClick={() => onEnterGroup(group)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-primary bg-primary-soft border border-primary/20 rounded-xl hover:bg-primary hover:text-white transition-all shrink-0"
                >
                  <Eye size={12} /> Pantau
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Anggota', value: group.member_count || 0 },
                  { label: 'Pesan', value: group.message_count || 0 },
                  { label: 'Online', value: group.online_count || 0, dot: true },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
                    {stat.dot ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${stat.value > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <p className="text-base font-bold text-foreground">{stat.value}</p>
                      </div>
                    ) : (
                      <p className="text-base font-bold text-foreground">{stat.value}</p>
                    )}
                    <p className="text-[9px] text-secondary uppercase tracking-wide mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              {group.last_activity && (
                <p className="text-[10px] text-secondary mt-2.5 flex items-center gap-1">
                  <Activity size={9} />
                  {new Date(group.last_activity).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudyGroup({ roomId, studentId, studentName, token, apiUrl, socket, onOpenClassroomRoom, userRole }) {
  const isDosen = userRole === 'dosen';
  const toast = useToast();

  const [view, setView] = useState('lobby');
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastTypingTime = useRef(0);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/study-groups/room/${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setGroups(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [apiUrl, roomId, token]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    if (!activeGroup || !socket) return;
    socket.emit('sg:join', { groupId: activeGroup.id, studentId, studentName });

    const onMessage = (msg) => {
      // Deduplicate: don't add if we already have this message (from optimistic update or duplicate broadcast)
      setMessages(prev => {
        // Check by database id if available, or by content+timestamp combo for optimistic messages
        const isDuplicate = prev.some(m => 
          (m.id && msg.id && m.id === msg.id) ||
          (m._optimistic && m.content === msg.content && m.student_id === msg.student_id)
        );
        if (isDuplicate) {
          // Replace optimistic message with real server message (has proper id, created_at, etc.)
          return prev.map(m => 
            (m._optimistic && m.content === msg.content && m.student_id === msg.student_id) 
              ? msg 
              : m
          );
        }
        return [...prev, msg];
      });
    };
    const onNote = (c) => setNoteContent(c);
    const onTyping = ({ studentName: who, isTyping: on }) => {
      if (who === studentName) return;
      setTypingUsers(prev => on ? [...new Set([...prev, who])] : prev.filter(u => u !== who));
    };
    const onMembers = (m) => setMembers(m);
    const onTasks = (t) => setTasks(t);
    const onGroupDeleted = ({ groupId }) => {
      if (activeGroup?.id === groupId) {
        leaveGroup();
        fetchGroups();
        toast.info('Grup ini telah dihapus oleh pembuat grup atau dosen.');
      }
    };

    socket.on('sg:message', onMessage);
    socket.on('sg:note-update', onNote);
    socket.on('sg:typing', onTyping);
    socket.on('sg:member-update', onMembers);
    socket.on('sg:tasks-update', onTasks);
    socket.on('sg:group-deleted', onGroupDeleted);

    return () => {
      socket.emit('sg:leave', { groupId: activeGroup.id, studentId });
      socket.off('sg:message', onMessage);
      socket.off('sg:note-update', onNote);
      socket.off('sg:typing', onTyping);
      socket.off('sg:member-update', onMembers);
      socket.off('sg:tasks-update', onTasks);
      socket.off('sg:group-deleted', onGroupDeleted);
    };
  }, [activeGroup, socket, studentId, studentName]);

  // Fallback polling: periodically sync messages from database in case WebSocket misses any
  useEffect(() => {
    if (!activeGroup || !token || !apiUrl) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const serverMessages = await res.json();
          setMessages(prev => {
            // Only update if server has more messages than local (avoid overwriting optimistic)
            if (serverMessages.length > prev.filter(m => !m._optimistic).length) {
              return serverMessages;
            }
            return prev;
          });
        }
      } catch (err) { /* silent — polling is a fallback */ }
    }, 8000); // Poll every 8 seconds
    return () => clearInterval(interval);
  }, [activeGroup, token, apiUrl]);

  // Fetch existing messages and notes on group load
  useEffect(() => {
    if (!activeGroup || !token || !apiUrl) return;
    const fetchGroupData = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const serverMessages = await res.json();
          setMessages(serverMessages);
          const latestNote = serverMessages.filter(m => m.message_type === 'note').pop();
          if (latestNote) {
            setNoteContent(latestNote.content);
          } else {
            setNoteContent('');
          }
        }
      } catch (err) { console.error('Failed to load group data:', err); }
    };
    fetchGroupData();
  }, [activeGroup, token, apiUrl]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/api/study-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ room_id: roomId, name: newGroupName, creator_id: studentId })
      });
      if (res.ok) { setNewGroupName(''); setShowCreateForm(false); fetchGroups(); toast.success('Grup berhasil dibuat!'); }
    } catch (err) { console.error(err); }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/api/study-groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id: studentId, group_code: joinCode.trim() })
      });
      if (res.ok) { setJoinCode(''); setShowJoinForm(false); fetchGroups(); toast.success('Berhasil bergabung!'); }
      else toast.error('Kode grup tidak valid atau Anda sudah bergabung.');
    } catch (err) { console.error(err); }
  };

  const enterGroup = async (group) => {
    setActiveGroup(group);
    setView('chat');
    setIsLoading(true);
    try {
      // Fetch messages from database
      const res = await fetch(`${apiUrl}/api/study-groups/${group.id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
        // Load the latest note content into the Catatan textarea
        const lastNote = [...msgs].reverse().find(m => m.message_type === 'note');
        if (lastNote) setNoteContent(lastNote.content);
      }

      // Fetch persisted Kanban tasks from database
      const taskRes = await fetch(`${apiUrl}/api/study-groups/${group.id}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (taskRes.ok) setTasks(await taskRes.json());
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsLoading(false); 
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeGroup) return;
    const content = inputText;
    setInputText('');

    // Optimistic update: show message immediately on sender's screen
    const optimisticMsg = {
      _optimistic: true,
      id: `opt_${Date.now()}`,
      student_id: studentId,
      student_name: studentName,
      content,
      message_type: 'chat',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content, message_type: 'chat' })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('❌ Send message failed:', res.status, errData);
        toast.error(errData.error || 'Gagal mengirim pesan');
        // Remove the optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      }
    } catch (err) {
      console.error('❌ Send message network error:', err);
      toast.error('Gagal mengirim pesan. Periksa koneksi internet Anda.');
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  const handleTypingEvent = () => {
    const now = Date.now();
    if (now - lastTypingTime.current > 1000) {
      socket?.emit('sg:typing', { groupId: activeGroup.id, studentName, isTyping: true });
      lastTypingTime.current = now;
      setTimeout(() => socket?.emit('sg:typing', { groupId: activeGroup.id, studentName, isTyping: false }), 3000);
    }
  };

  const leaveGroup = () => {
    setActiveGroup(null); setMessages([]); setMembers([]);
    setTasks([]); setNoteContent(''); setView('lobby');
  };

  const handleDeleteGroup = async () => {
    if (!activeGroup) return;
    if (!window.confirm(`Apakah Anda yakin ingin menghapus grup "${activeGroup.name}" secara permanen? Semua pesan, catatan, dan tugas akan terhapus selamanya.`)) return;
    
    try {
      const res = await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Grup berhasil dihapus.');
        leaveGroup();
        fetchGroups();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menghapus grup.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menghapus grup.');
    }
  };

  const handleSaveNotesToChat = async () => {
    if (!noteContent.trim() || !activeGroup) return;
    
    // Optimistic: show note bubble immediately
    const optimisticNote = {
      _optimistic: true,
      id: `opt_note_${Date.now()}`,
      student_id: studentId,
      student_name: studentName,
      content: noteContent,
      message_type: 'note',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticNote]);
    setView('chat');

    try {
      const res = await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: noteContent, message_type: 'note' })
      });
      if (res.ok) {
        toast.success('Catatan dikirim ke chat!');
      } else {
        toast.error('Gagal mengirim catatan.');
        setMessages(prev => prev.filter(m => m.id !== optimisticNote.id));
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengirim catatan.');
      setMessages(prev => prev.filter(m => m.id !== optimisticNote.id));
    }
  };

  const [addingTaskFor, setAddingTaskFor] = useState(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');

  const addTask = async () => {
    if (!newTaskTitle.trim() || !activeGroup) return;
    const title = newTaskTitle.trim();
    setNewTaskTitle('');
    try {
      await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, status: 'todo', assignee: '' })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const addInlineTask = async (assigneeName) => {
    if (!inlineTaskTitle.trim() || !activeGroup) return;
    const isBacklog = assigneeName === 'Belum Ditugaskan';
    const payload = {
      title: inlineTaskTitle.trim(),
      status: 'todo',
      assignee: isBacklog ? '' : assigneeName
    };
    
    // Reset inputs immediately for responsive feel
    setInlineTaskTitle('');
    setAddingTaskFor(null);

    try {
      await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error(err);
      toast.error('Gagal menambahkan tugas ke database.');
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
  };

  const handleDrop = async (e, targetAssignee) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr || !activeGroup) return;
    const taskId = Number(taskIdStr);
    const isBacklog = targetAssignee === 'Belum Ditugaskan';
    const newAssignee = isBacklog ? '' : targetAssignee;

    // Optimistic local state update for zero lag drag-and-drop
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee: newAssignee } : t));

    try {
      await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ assignee: newAssignee })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (id) => {
    if (!activeGroup) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    try {
      await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    if (!activeGroup) return;

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Tugas berhasil dihapus.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus tugas.');
    }
  };

  const myGroups = isDosen ? [] : groups.filter(g => g.is_member);
  const availableGroups = isDosen ? [] : groups.filter(g => !g.is_member);

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">

      {/* Top bar */}
      <div className="px-4 py-3 border-b border-border bg-white flex items-center gap-3 shrink-0 shadow-sm">
        {activeGroup ? (
          <>
            <button onClick={leaveGroup} className="p-1.5 text-secondary hover:text-foreground hover:bg-slate-100 rounded-lg transition-colors" aria-label="Kembali">
              <ArrowLeft size={16} />
            </button>
            <div className="w-8 h-8 bg-primary-soft rounded-xl flex items-center justify-center">
              <Hash size={15} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-foreground truncate">{activeGroup.name}</h2>
              <p className="text-[10px] text-secondary font-mono">
                {activeGroup.group_code}
                {isDosen && <span className="ml-1.5 text-primary font-sans not-italic">• Observer</span>}
              </p>
            </div>
            {members.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full shrink-0">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-700">{members.length}</span>
              </div>
            )}
            {(isDosen || activeGroup.creator_id === studentId) && (
              <button
                onClick={handleDeleteGroup}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0 ml-1"
                title="Hapus Grup"
              >
                <Trash2 size={16} />
              </button>
            )}
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-primary-soft rounded-xl flex items-center justify-center">
              <MessageSquare size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-foreground">Group Chat</h2>
              <p className="text-[10px] text-secondary">{isDosen ? 'Monitor semua grup kelas' : 'Kolaborasi & Diskusi'}</p>
            </div>
          </>
        )}
      </div>

      {/* Sub-tabs (inside group) */}
      {activeGroup && (
        <div className="flex border-b border-border bg-white shrink-0">
          {[
            { id: 'chat',  label: 'Chat',    icon: MessageSquare },
            { id: 'notes', label: 'Catatan', icon: BookOpen },
            { id: 'tasks', label: 'Tugas',   icon: Layout },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${
                view === tab.id ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-foreground'
              }`}
            >
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading && !activeGroup ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Loader2 size={22} className="text-primary animate-spin" />
          <p className="text-xs text-secondary">Memuat grup...</p>
        </div>
      ) : (
        <>
          {/* LOBBY — Mahasiswa */}
          {view === 'lobby' && !isDosen && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4 space-y-4">

                {/* My groups */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold text-secondary uppercase tracking-widest">Grup Saya</p>
                    <span className="text-[10px] bg-primary-soft text-primary px-2 py-0.5 rounded-full font-semibold">{myGroups.length}</span>
                  </div>
                  {myGroups.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center">
                      <Users size={24} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-secondary">Belum ada grup</p>
                      <p className="text-[11px] text-secondary/70 mt-1">Buat atau join menggunakan kode</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myGroups.map(g => <GroupCard key={g.id} group={g} onClick={() => enterGroup(g)} />)}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setShowJoinForm(!showJoinForm); setShowCreateForm(false); }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${showJoinForm ? 'bg-primary text-white border-primary' : 'bg-white text-foreground border-border hover:border-primary/40'}`}
                  >
                    <UserPlus size={14} /> Join Grup
                  </button>
                  <button
                    onClick={() => { setShowCreateForm(!showCreateForm); setShowJoinForm(false); }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${showCreateForm ? 'bg-primary text-white border-primary' : 'bg-white text-foreground border-border hover:border-primary/40'}`}
                  >
                    <Plus size={14} /> Buat Grup
                  </button>
                </div>

                {showJoinForm && (
                  <form onSubmit={handleJoinGroup} className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2">
                    <p className="text-[11px] font-semibold text-sky-700 uppercase tracking-wide">Kode Grup</p>
                    <div className="flex gap-2">
                      <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: KEL-1234"
                        className="flex-1 bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary transition-colors" />
                      <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover transition-colors">Join</button>
                    </div>
                  </form>
                )}

                {showCreateForm && (
                  <form onSubmit={handleCreateGroup} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Nama Grup</p>
                    <div className="flex gap-2">
                      <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                        placeholder="Contoh: Kelompok 1"
                        className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors" />
                      <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover transition-colors">Buat</button>
                    </div>
                  </form>
                )}

                {availableGroups.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-secondary uppercase tracking-widest mb-2 pt-2 border-t border-border">Grup Lain di Kelas</p>
                    <div className="space-y-2">
                      {availableGroups.map(g => <GroupCard key={g.id} group={g} onClick={() => enterGroup(g)} />)}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-border rounded-xl flex items-start gap-2.5">
                  <Info size={14} className="text-secondary mt-0.5 shrink-0" />
                  <p className="text-[11px] text-secondary leading-relaxed">
                    Hanya mahasiswa dalam kelas ini yang bisa bergabung. Bagikan kode grup ke teman sekelasmu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* LOBBY — Dosen */}
          {view === 'lobby' && isDosen && (
            <DosenMonitorView onEnterGroup={enterGroup} token={token} apiUrl={apiUrl} roomId={roomId} />
          )}

          {/* CHAT */}
          {view === 'chat' && activeGroup && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12 gap-2">
                    <Loader2 size={16} className="text-primary animate-spin" />
                    <span className="text-xs text-secondary">Memuat pesan...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm text-secondary">Belum ada pesan</p>
                    <p className="text-[11px] text-secondary/70 mt-1">Mulai diskusi kelompokmu di sini 👋</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <ChatBubble key={idx} msg={msg} isMe={msg.student_id === studentId} />
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <TypingDots users={typingUsers} />

              {isDosen ? (
                <div className="px-4 py-3 border-t border-border bg-white shrink-0 text-center">
                  <p className="text-[11px] text-secondary flex items-center justify-center gap-1.5">
                    <Eye size={12} className="text-primary" /> Anda sedang memantau percakapan grup ini
                  </p>
                </div>
              ) : (
                <div className="p-3 border-t border-border bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={e => { setInputText(e.target.value); handleTypingEvent(); }}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Tulis pesan..."
                      autoComplete="off"
                      className="flex-1 bg-slate-50 border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:bg-white transition-all"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputText.trim()}
                      className="p-2.5 bg-primary text-white rounded-2xl hover:bg-primary-hover transition-colors shadow-emerald-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTES */}
          {view === 'notes' && activeGroup && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden mb-3">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 bg-amber-100/50">
                    <BookOpen size={14} className="text-amber-600" />
                    <p className="text-[11px] font-semibold text-amber-700">Catatan Bersama — {activeGroup.name}</p>
                  </div>
                  <textarea
                    value={noteContent}
                    onChange={e => {
                      setNoteContent(e.target.value);
                      socket?.emit('sg:note-update', { groupId: activeGroup.id, content: e.target.value });
                    }}
                    readOnly={isDosen}
                    placeholder="Tulis catatan bersama di sini. Semua anggota dapat melihat dan mengedit secara real-time..."
                    rows={12}
                    className="w-full bg-transparent px-4 py-3 text-sm text-foreground outline-none resize-none leading-relaxed"
                  />
                </div>
                <p className="text-[10px] text-secondary flex items-center gap-1 px-1">
                  <Info size={10} /> Sinkron real-time ke semua anggota grup
                </p>
              </div>
              {!isDosen && (
                <div className="p-3 border-t border-border bg-white shrink-0">
                  <button
                    onClick={handleSaveNotesToChat}
                    disabled={!noteContent.trim()}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Send size={13} /> Kirim Catatan ke Chat
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TASKS */}
          {view === 'tasks' && activeGroup && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
              {/* Kanban Info / Subtitle */}
              <div className="px-4 py-3 bg-white border-b border-border shrink-0 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    📋 Papan Tugas Notion-style
                  </p>
                  <p className="text-[10px] text-secondary">Seret dan lepas (drag & drop) tugas ke kolom anggota untuk pembagian kerja secara real-time</p>
                </div>
              </div>

              {/* Kanban Scroll Container */}
              <div className="flex-1 overflow-x-auto p-4 flex gap-4 min-h-0 custom-scrollbar select-none">
                {[
                  'Belum Ditugaskan',
                  ...[
                    ...members.map(m => m.student_name),
                    ...(!isDosen ? [studentName] : [])
                  ].filter((v, i, a) => v && v !== 'System' && a.indexOf(v) === i)
                ].map((colName) => {
                  const colTasks = tasks.filter(t => {
                    if (colName === 'Belum Ditugaskan') {
                      return !t.assignee || t.assignee === 'Belum Ditugaskan';
                    }
                    return t.assignee === colName;
                  });

                  return (
                    <div
                      key={colName}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, colName)}
                      className="w-72 bg-slate-50 border border-border rounded-2xl flex flex-col shrink-0 p-3 shadow-sm hover:shadow-card transition-shadow max-h-full"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {colName === 'Belum Ditugaskan' ? (
                            <div className="w-5 h-5 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                              📥
                            </div>
                          ) : (
                            <Avatar name={colName} size="sm" />
                          )}
                          <p className="text-xs font-bold text-foreground truncate">{colName}</p>
                          <span className="text-[10px] font-bold bg-slate-200 text-secondary px-1.5 py-0.5 rounded-full shrink-0">
                            {colTasks.length}
                          </span>
                        </div>
                      </div>

                      {/* Column Task Cards */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 mb-2 min-h-[150px]">
                        {colTasks.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300">
                            <span className="text-base mb-1">💤</span>
                            <p className="text-[10px] text-secondary/60 italic">Belum ada tugas</p>
                          </div>
                        ) : (
                          colTasks.map(task => {
                            const isDone = task.status === 'done';
                            return (
                              <div
                                key={task.id}
                                draggable={!isDosen}
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                className={`bg-white border border-border hover:border-primary/30 p-3 rounded-xl shadow-sm hover:shadow transition-all group ${
                                  isDone ? 'opacity-65' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <button
                                    onClick={() => !isDosen && toggleTask(task.id)}
                                    disabled={isDosen}
                                    className={`w-4 h-4 rounded-full border border-border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                      isDone ? 'bg-primary border-primary' : 'hover:border-primary bg-white'
                                    }`}
                                  >
                                    {isDone && <Check size={9} className="text-white" />}
                                  </button>
                                  <p className={`text-xs font-medium text-foreground leading-tight flex-1 break-words ${
                                    isDone ? 'line-through text-secondary' : ''
                                  }`}>
                                    {task.title}
                                  </p>
                                  {!isDosen && (
                                    <button
                                      onClick={() => deleteTask(task.id)}
                                      className="p-0.5 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Inline Add Task inside Column */}
                      {!isDosen && (
                        <div className="shrink-0 pt-2 border-t border-slate-200/60">
                          {addingTaskFor === colName ? (
                            <div className="space-y-1.5">
                              <input
                                autoFocus
                                type="text"
                                value={inlineTaskTitle}
                                onChange={e => setInlineTaskTitle(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') addInlineTask(colName);
                                  else if (e.key === 'Escape') setAddingTaskFor(null);
                                }}
                                placeholder="Tulis tugas & tekan Enter..."
                                className="w-full bg-white border border-primary rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-none shadow-sm"
                              />
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => setAddingTaskFor(null)}
                                  className="px-2 py-1 text-[10px] font-semibold text-secondary hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                  Batal
                                </button>
                                <button
                                  onClick={() => addInlineTask(colName)}
                                  disabled={!inlineTaskTitle.trim()}
                                  className="px-2.5 py-1 text-[10px] font-semibold bg-primary text-white hover:bg-primary-hover disabled:opacity-40 rounded-lg transition-colors"
                                >
                                  Tambah
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAddingTaskFor(colName); setInlineTaskTitle(''); }}
                              className="w-full py-1.5 text-[10px] font-semibold text-secondary hover:text-primary hover:bg-white border border-dashed border-slate-300 hover:border-primary/40 rounded-xl transition-all flex items-center justify-center gap-1 bg-slate-50"
                            >
                              <Plus size={11} /> Tambah Tugas
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
