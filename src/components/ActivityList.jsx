import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Clock, CheckCircle, Play, AlertCircle, Calendar, DollarSign, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const ACTIVITY_TYPES = {
  free_build: { label: 'Free Build', icon: '🖥️', color: 'bg-rose-100 text-rose-700' },
  guided_build: { label: 'Guided Build', icon: '📋', color: 'bg-blue-100 text-blue-700' },
  budget_challenge: { label: 'Budget Challenge', icon: '💰', color: 'bg-emerald-100 text-emerald-700' },
  quiz_challenge: { label: 'Quiz Challenge', icon: '🎮', color: 'bg-amber-100 text-amber-700' },
  detective_mission: { label: 'Detective Mission', icon: '🔍', color: 'bg-violet-100 text-violet-700' },
};

const STATUS_MAP = {
  pending: { label: 'Belum Dikerjakan', color: 'bg-slate-100 dark:bg-slate-800 text-secondary', icon: AlertCircle },
  in_progress: { label: 'Sedang Dikerjakan', color: 'bg-amber-100 text-amber-700', icon: Clock },
  submitted: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

export default function ActivityList({ roomId, studentId, token, apiUrl, onOpenActivity }) {
  const [activities, setActivities] = useState([]);
  const [studentWork, setStudentWork] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'in_progress', 'submitted'

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activitiesRes, workRes] = await Promise.all([
        fetch(`${apiUrl}/api/activities/room/${roomId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/student-work/student/${studentId}?room_id=${roomId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (workRes.ok) setStudentWork(await workRes.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [roomId, studentId, apiUrl, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStatus = (activityId) => {
    const work = studentWork.find(w => w.activity_id === activityId);
    if (!work) return 'pending';
    if (work.is_submitted) return 'submitted';
    return 'in_progress';
  };

  const filteredActivities = activities.filter(a => {
    if (filter === 'all') return true;
    return getStatus(a.id) === filter;
  });

  const counts = {
    all: activities.length,
    pending: activities.filter(a => getStatus(a.id) === 'pending').length,
    in_progress: activities.filter(a => getStatus(a.id) === 'in_progress').length,
    submitted: activities.filter(a => getStatus(a.id) === 'submitted').length,
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 custom-scrollbar">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <ClipboardList className="text-amber-500" size={28} /> Tugas Saya
          </h2>
          <p className="text-sm text-secondary mt-1">Tugas yang diberikan Dosen di room ini.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-[var(--bg-surface)] rounded-xl p-1.5 border border-border dark:border-slate-800 shadow-sm w-fit">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pending', label: 'Pending' },
            { id: 'in_progress', label: 'Dikerjakan' },
            { id: 'submitted', label: 'Selesai' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === tab.id
                  ? 'bg-primary text-foreground shadow-md'
                  : 'text-secondary hover:bg-slate-50 dark:bg-slate-900'
              }`}
            >
              {tab.label} ({counts[tab.id]})
            </button>
          ))}
        </div>

        {/* Activity Cards */}
        {isLoading ? (
          <div className="text-center py-16 text-secondary">Memuat tugas...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-surface)] rounded-2xl border border-dashed border-border dark:border-slate-700">
            <ClipboardList size={48} className="mx-auto text-foreground mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              {filter === 'all' ? 'Belum Ada Tugas' : `Tidak Ada Tugas ${filter === 'pending' ? 'Pending' : filter === 'in_progress' ? 'yang Sedang Dikerjakan' : 'yang Selesai'}`}
            </h3>
            <p className="text-sm text-secondary">
              {filter === 'all' ? 'Dosen belum memberikan tugas di room ini.' : 'Coba lihat tab lain.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity, i) => {
              const type = ACTIVITY_TYPES[activity.activity_type] || ACTIVITY_TYPES.free_build;
              const status = getStatus(activity.id);
              const statusInfo = STATUS_MAP[status];
              const StatusIcon = statusInfo.icon;
              const isOverdue = activity.due_date && new Date(activity.due_date) < new Date() && status !== 'submitted';

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-[var(--bg-surface)] rounded-2xl border shadow-sm p-6 transition-all hover:shadow-md ${
                    isOverdue ? 'border-red-200' : 'border-border dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${type.color}`}>
                        {type.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-foreground">{activity.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.color} flex items-center gap-1`}>
                            <StatusIcon size={10} /> {statusInfo.label}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-secondary mt-1.5 line-clamp-2">{activity.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${type.color}`}>{type.label}</span>
                          {activity.due_date && (
                            <span className={`flex items-center gap-1 text-[10px] font-bold ${isOverdue ? 'text-red-500' : 'text-secondary'}`}>
                              <Calendar size={10} />
                              {isOverdue && '⚠️ '}
                              {new Date(activity.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {activity.config?.budget_limit && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                              <DollarSign size={10} /> Rp {activity.config.budget_limit.toLocaleString('id-ID')}
                            </span>
                          )}
                          {activity.config?.target_use && activity.config.target_use !== 'any' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                              <Target size={10} /> {activity.config.target_use}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenActivity(activity)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 flex items-center gap-2 shadow-md ${
                        status === 'submitted'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-primary text-foreground hover:bg-primary-hover shadow-emerald-500/20'
                      }`}
                    >
                      {status === 'submitted' ? (
                        <><CheckCircle size={14} /> Lihat Hasil</>
                      ) : status === 'in_progress' ? (
                        <><Play size={14} /> Lanjutkan</>
                      ) : (
                        <><Play size={14} /> Kerjakan</>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
