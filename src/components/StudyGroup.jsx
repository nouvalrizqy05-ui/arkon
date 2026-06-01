import React, { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';
import { 
  Users, Send, MessageSquare, BookOpen, UserPlus, 
  ChevronRight, LogOut, Code, Clock, Hash, 
  MoreVertical, Pin, Paperclip, Share2, AlertCircle,
  CheckCircle2, Loader2, Info, Layout, Plus, Trash2, CheckCircle
} from 'lucide-react';

export default function StudyGroup({ roomId, studentId, studentName, token, apiUrl, socket, onOpenClassroomRoom, userRole }) {
  const isDosen = userRole === 'dosen';
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('lobby'); // lobby, chat, notes
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [members, setMembers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const chatEndRef = useRef(null);
  const lastTypingTime = useRef(0);

  // Fetch groups in this room
  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/study-groups/room/${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [roomId]);

  // Socket.IO Setup
  useEffect(() => {
    if (!activeGroup || !socket) return;

    socket.emit('sg:join', { groupId: activeGroup.id, studentId, studentName });

    const handleMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleNoteUpdate = (content) => {
      setNoteContent(content);
    };

    const handleTyping = ({ studentName: typingUser, isTyping: typingStatus }) => {
      if (typingUser === studentName) return;
      setTypingUsers(prev => {
        if (typingStatus) return [...new Set([...prev, typingUser])];
        return prev.filter(u => u !== typingUser);
      });
    };

    const handleMemberUpdate = (updatedMembers) => {
      setMembers(updatedMembers);
    };

    const handleTasksUpdate = (updatedTasks) => {
      setTasks(updatedTasks);
    };

    socket.on('sg:message', handleMessage);
    socket.on('sg:note-update', handleNoteUpdate);
    socket.on('sg:typing', handleTyping);
    socket.on('sg:member-update', handleMemberUpdate);
    socket.on('sg:tasks-update', handleTasksUpdate);

    return () => {
      socket.emit('sg:leave', { groupId: activeGroup.id, studentId });
      socket.off('sg:message', handleMessage);
      socket.off('sg:note-update', handleNoteUpdate);
      socket.off('sg:typing', handleTyping);
      socket.off('sg:member-update', handleMemberUpdate);
      socket.off('sg:tasks-update', handleTasksUpdate);
    };
  }, [activeGroup, socket, studentId, studentName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/api/study-groups`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          room_id: roomId, 
          name: newGroupName, 
          creator_id: studentId 
        })
      });
      if (res.ok) {
        setNewGroupName('');
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/api/study-groups/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ student_id: studentId, group_code: joinCode.trim() })
      });
      if (res.ok) {
        setJoinCode('');
        fetchGroups();
      } else {
        toast.error('Kode grup tidak valid atau Anda sudah bergabung.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const enterGroup = async (group) => {
    setActiveGroup(group);
    setActiveTab('chat');
    setIsLoading(true);
    
    try {
      const msgRes = await fetch(`${apiUrl}/api/study-groups/${group.id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (msgRes.ok) {
        const data = await msgRes.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeGroup) return;

    const messageData = {
      content: inputText,
      message_type: 'chat'
    };

    try {
      await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...messageData, student_id: studentId })
      });
      setInputText('');
    } catch (err) {
      console.error(err);
    }
  };

  // Throttle note updates to DB
  const noteTimeoutRef = useRef(null);
  const updateNote = (newContent) => {
    setNoteContent(newContent);
    
    // Immediate broadcast to others
    socket?.emit('sg:note-update', { 
      groupId: activeGroup.id, 
      content: newContent 
    });

    // Throttled save to DB logic is now handled on server-side 
    // but we can add a local indicator if needed.
  };

  const handleSaveNotesToChat = async () => {
    if (!noteContent.trim() || !activeGroup) return;
    
    try {
      await fetch(`${apiUrl}/api/study-groups/${activeGroup.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: noteContent, 
          message_type: 'note', 
          student_id: studentId 
        })
      });
      setActiveTab('chat');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypingTime.current > 1000) {
      socket?.emit('sg:typing', { 
        groupId: activeGroup.id, 
        studentName, 
        isTyping: true 
      });
      lastTypingTime.current = now;
      
      setTimeout(() => {
        socket?.emit('sg:typing', { 
          groupId: activeGroup.id, 
          studentName, 
          isTyping: false 
        });
      }, 3000);
    }
  };

  const leaveGroup = () => {
    setActiveGroup(null);
    setMessages([]);
    setMembers([]);
    setTasks([]);
    setActiveTab('lobby');
  };

  const addTask = () => {
    if (!newTaskTitle.trim() || !activeGroup) return;
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      status: 'todo',
      assignee: studentName,
      created_at: new Date()
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTaskTitle('');
    socket?.emit('sg:tasks-update', { groupId: activeGroup.id, tasks: updatedTasks });
  };

  const toggleTaskStatus = (taskId) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: t.status === 'done' ? 'todo' : 'done' };
      }
      return t;
    });
    setTasks(updatedTasks);
    socket?.emit('sg:tasks-update', { groupId: activeGroup.id, tasks: updatedTasks });
  };

  const deleteTask = (taskId) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    socket?.emit('sg:tasks-update', { groupId: activeGroup.id, tasks: updatedTasks });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0f172a] overflow-hidden border-l border-border animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-white/[0.02] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${activeGroup ? 'bg-cyan-500 shadow-cyan-500/20' : 'bg-white shadow-sm border border-border'}`}>
            <Users size={22} className="text-foreground" />
          </div>
          <div>
            <h2 className="font-black text-sm text-foreground tracking-tight">
              {activeGroup ? activeGroup.name : 'Group Chat'}
            </h2>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">
              {activeGroup ? `KODE: ${activeGroup.group_code}` : 'Kolaborasi & Diskusi'}
              {isDosen && activeGroup && ' • MODE OBSERVER'}
            </p>
          </div>
        </div>
        {activeGroup && (
          <button onClick={leaveGroup} className="p-2 text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" aria-label="LogOut">
            <LogOut size={18} />
          </button>
        )}
      </div>

      {/* Tabs */}
      {activeGroup && (
        <div className="flex p-1 bg-white/[0.03] border-b border-border shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm border border-border text-cyan-400 shadow-sm' : 'text-secondary hover:text-secondary'}`}
          >
            <MessageSquare size={14} /> Chat
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'notes' ? 'bg-white shadow-sm border border-border text-amber-600 shadow-sm' : 'text-secondary hover:text-secondary'}`}
          >
            <BookOpen size={14} /> Notes
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'tasks' ? 'bg-white shadow-sm border border-border text-emerald-600 shadow-sm' : 'text-secondary hover:text-secondary'}`}
          >
            <Layout size={14} /> Tasks
          </button>
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'lobby' ? 'bg-white shadow-sm border border-border text-foreground shadow-sm' : 'text-secondary hover:text-secondary'}`}
          >
            <Users size={14} /> Grup
          </button>
        </div>
      )}

      {/* View Content */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 size={24} className="text-cyan-500 animate-spin" />
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Sinkronisasi...</p>
        </div>
      ) : (
        <>
          {/* ===== LOBBY VIEW ===== */}
          {activeTab === 'lobby' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              <div>
                <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500" /> {isDosen ? 'Semua Grup di Room' : 'Grup Saya'}
                </h3>
                <div className="space-y-2">
                  {(isDosen ? groups : groups.filter(g => g.is_member)).length === 0 && (
                    <p className="text-[10px] text-secondary italic px-2">{isDosen ? 'Belum ada grup di room ini.' : 'Anda belum bergabung ke grup manapun.'}</p>
                  )}
                  {(isDosen ? groups : groups.filter(g => g.is_member)).map(group => (
                    <button
                      key={group.id}
                      onClick={() => enterGroup(group)}
                      className="w-full p-4 bg-white/[0.03] border border-border rounded-2xl hover:bg-white shadow-sm border border-border transition-all text-left group flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-cyan-400 transition-colors">{group.name}</h4>
                        <p className="text-[10px] text-secondary font-mono mt-1 uppercase tracking-tight">{group.group_code}</p>
                      </div>
                      <ChevronRight size={16} className="text-secondary group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-border">
                <form onSubmit={handleJoinGroup} className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest px-1">Join via Kode</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="CONTOH: CS101-ABCD"
                      className="flex-1 bg-white shadow-sm border border-border border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500 transition-all font-mono"
                    />
                    <button type="submit" disabled={isLoading} className="p-2 bg-cyan-500 text-foreground rounded-xl hover:bg-cyan-600 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50">
                      <UserPlus size={16} />
                    </button>
                  </div>
                </form>

                <form onSubmit={handleCreateGroup} className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest px-1">Buat Grup Baru</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Nama Grup..."
                      className="flex-1 bg-white shadow-sm border border-border border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500 transition-all"
                    />
                    <button type="submit" disabled={isLoading} className="p-2 bg-emerald-500 text-foreground rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                      <Hash size={16} />
                    </button>
                  </div>
                </form>
              </div>

              <button
                onClick={fetchGroups}
                className="w-full py-2 text-[10px] font-black text-secondary hover:text-secondary uppercase tracking-[0.2em] transition-colors"
              >
                Refresh Group List
              </button>

              <div className="p-4 bg-white/[0.02] border border-border rounded-2xl">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-cyan-400 mt-0.5" />
                  <p className="text-[10px] text-secondary leading-relaxed">
                    {isDosen
                      ? 'Mode Dosen: Anda dapat melihat semua grup dan memantau aktivitas mahasiswa.'
                      : 'Group Chat bersifat privat. Hanya mahasiswa di kelas ini yang bisa bergabung melalui kode unik grup.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== CHAT VIEW ===== */}
          {activeTab === 'chat' && activeGroup && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => {
                  const isMe = msg.student_id === studentId;
                  const isNote = msg.message_type === 'note';
                  const isSystem = msg.message_type === 'system';

                  if (isSystem) return (
                    <div key={idx} className="flex justify-center">
                      <span className="text-[9px] bg-white shadow-sm border border-border text-secondary px-2 py-0.5 rounded-full uppercase tracking-widest font-black">{msg.content}</span>
                    </div>
                  );

                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        {!isMe && <span className="text-[10px] font-black text-secondary">{msg.student_name}</span>}
                        <span className="text-[8px] text-secondary">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                        isNote
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200 font-medium italic'
                          : isMe
                            ? 'bg-cyan-500 text-foreground rounded-tr-none'
                            : 'bg-white shadow-sm border border-border border border-border text-foreground rounded-tl-none'
                      }`}>
                        {isNote && <BookOpen size={12} className="inline mr-2 mb-0.5 opacity-50" />}
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="px-4 py-1 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                  <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-tighter">
                    {typingUsers.join(', ')} sedang mengetik...
                  </p>
                </div>
              )}

              {/* Input */}
              <div className="p-3 bg-white/[0.03] border-t border-border shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ketik pesan..."
                    autoComplete="off"
                    className="w-full bg-white shadow-sm border border-border border border-border rounded-xl pl-4 pr-12 py-3 text-sm text-foreground outline-none focus:border-cyan-500 transition-all shadow-inner"
                  />
                  <button
                    onClick={sendMessage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-500 text-foreground rounded-lg hover:bg-cyan-600 transition shadow-lg shadow-cyan-500/20"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== TASKS VIEW (KANBAN) ===== */}
          {activeTab === 'tasks' && activeGroup && (
            <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Layout className="text-emerald-600" size={16} />
                  <h4 className="text-xs font-black text-emerald-200 uppercase tracking-widest">Kanban Board</h4>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                {/* Add Task Input */}
                <div className="bg-white/[0.03] border border-border rounded-2xl p-4">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3">Tambah Tugas Baru</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTask()}
                      placeholder="Apa yang perlu dikerjakan?"
                      className="flex-1 bg-white shadow-sm border border-border border border-border rounded-xl px-4 py-2 text-xs text-foreground outline-none focus:border-emerald-500 transition-all"
                    />
                    <button 
                      onClick={addTask}
                      className="p-2 bg-emerald-500 text-foreground rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Columns */}
                <div className="space-y-4">
                  {/* TODO SECTION */}
                  <div>
                    <h5 className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Clock size={10} /> To Do ({tasks.filter(t => t.status !== 'done').length})
                    </h5>
                    <div className="space-y-2">
                      {tasks.filter(t => t.status !== 'done').map(task => (
                        <div key={task.id} className="bg-white shadow-sm border border-border border border-border p-3 rounded-xl group flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleTaskStatus(task.id)}
                              className="w-5 h-5 rounded-full border border-border hover:border-emerald-500/50 transition-colors"
                            />
                            <div>
                              <p className="text-xs text-foreground font-medium">{task.title}</p>
                              <p className="text-[8px] text-secondary mt-0.5">Dibuat oleh: {task.assignee}</p>
                            </div>
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="p-1 text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DONE SECTION */}
                  <div className="pt-4 border-t border-border">
                    <h5 className="text-[9px] font-black text-emerald-500/40 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <CheckCircle size={10} /> Selesai ({tasks.filter(t => t.status === 'done').length})
                    </h5>
                    <div className="space-y-2 opacity-50">
                      {tasks.filter(t => t.status === 'done').map(task => (
                        <div key={task.id} className="bg-white shadow-sm border border-border border border-border p-3 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleTaskStatus(task.id)}
                              className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-600"
                            >
                              <Check size={12} />
                            </button>
                            <p className="text-xs text-secondary line-through font-medium">{task.title}</p>
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="p-1 text-secondary hover:text-red-400 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer / Group Member Info */}
      {activeGroup && activeTab === 'chat' && (
        <div className="px-4 py-2 bg-white/[0.01] border-t border-border flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[8px] font-black text-secondary uppercase tracking-widest mr-1">Online:</span>
          {members.map(m => (
            <div key={m.student_id} className="flex items-center gap-1 bg-white shadow-sm border border-border px-2 py-0.5 rounded-full border border-border shrink-0">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[9px] font-bold text-secondary">{m.student_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

