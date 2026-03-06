import { useState, useEffect, useCallback } from 'react';
import { announcementAPI } from '../../utils/api';
import { Plus, Edit2, Trash2, X, Loader2, Bell, BellRing, Users, GraduationCap, ShieldCheck, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

const FIELD = "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all";

const ROLE_CONFIG = {
  all:     { label: 'Everyone',  icon: Users,         color: 'bg-slate-600', badge: 'bg-slate-700 text-slate-300' },
  student: { label: 'Students',  icon: GraduationCap, color: 'bg-indigo-600', badge: 'bg-indigo-500/20 text-indigo-300' },
  teacher: { label: 'Teachers',  icon: Users,         color: 'bg-purple-600', badge: 'bg-purple-500/20 text-purple-300' },
  admin:   { label: 'Admins',    icon: ShieldCheck,   color: 'bg-rose-600',   badge: 'bg-rose-500/20 text-rose-300' },
};

const emptyForm = { title: '', content: '', targetRoles: ['all'], isUrgent: false, expiresAt: '' };

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementAPI.getAll();
      setItems(res.data || []);
    } catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, content: item.content, targetRoles: item.targetRoles, isUrgent: item.isUrgent, expiresAt: item.expiresAt ? item.expiresAt.slice(0, 10) : '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content are required.');
    setSubmitting(true);
    try {
      const payload = { ...form, expiresAt: form.expiresAt || undefined };
      if (editItem) await announcementAPI.update(editItem._id, payload);
      else await announcementAPI.create(payload);
      toast.success(editItem ? 'Announcement updated!' : 'Announcement posted!');
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await announcementAPI.delete(id); toast.success('Deleted.'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const toggleRole = (role) => {
    if (role === 'all') { setForm({ ...form, targetRoles: ['all'] }); return; }
    let roles = form.targetRoles.filter(r => r !== 'all');
    if (roles.includes(role)) roles = roles.filter(r => r !== role);
    else roles = [...roles, role];
    setForm({ ...form, targetRoles: roles.length ? roles : ['all'] });
  };

  const displayed = filterUrgent ? items.filter(i => i.isUrgent) : items;
  const urgentCount = items.filter(i => i.isUrgent).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Bell size={24} className="text-indigo-400" /> Announcements
          </h1>
          <p className="text-slate-400 text-sm mt-1">{items.length} total · <span className="text-red-400">{urgentCount} urgent</span></p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFilterUrgent(!filterUrgent)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${filterUrgent ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            <Filter size={14} /> {filterUrgent ? 'Show All' : 'Urgent Only'}
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
            <Plus size={16} /> New Announcement
          </button>
        </div>
      </div>

      {/* Urgent Banner */}
      {urgentCount > 0 && !filterUrgent && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <BellRing size={18} className="text-red-400 flex-shrink-0 animate-pulse-slow" />
          <p className="text-sm text-red-300">{urgentCount} urgent announcement{urgentCount > 1 ? 's' : ''} active</p>
          <button onClick={() => setFilterUrgent(true)} className="ml-auto text-xs text-red-400 hover:text-red-300 underline">View</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-900 rounded-2xl animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
          <Bell size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(item => {
            const roleLabels = item.targetRoles.map(r => ROLE_CONFIG[r]?.label || r).join(', ');
            const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
            return (
              <div key={item._id}
                className={`group bg-slate-900 border rounded-2xl p-5 transition-all hover:border-slate-600 ${
                  item.isUrgent ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700/50'
                } ${isExpired ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${item.isUrgent ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}>
                      {item.isUrgent
                        ? <BellRing size={17} className="text-red-400" />
                        : <Bell size={17} className="text-indigo-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                        {item.isUrgent && (
                          <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-lg font-medium">⚠ URGENT</span>
                        )}
                        {isExpired && <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-lg">Expired</span>}
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{item.content}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${ROLE_CONFIG[item.targetRoles?.[0]]?.badge || 'bg-slate-700 text-slate-300'}`}>
                          → {roleLabels}
                        </span>
                        <span className="text-xs text-slate-500">
                          by {item.author?.name} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                        {item.expiresAt && (
                          <span className="text-xs text-slate-500">
                            Expires {format(new Date(item.expiresAt), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => openEdit(item)}
                      className="p-2 rounded-xl hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-colors">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(item._id)}
                      className="p-2 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h3 className="font-display font-semibold text-white text-lg">{editItem ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Title *</label>
                <input className={FIELD} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title..." required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Content *</label>
                <textarea className={`${FIELD} resize-none`} rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write the announcement details..." required />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Target Audience</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ROLE_CONFIG).map(([role, { label, icon: Icon, color }]) => (
                    <button key={role} type="button" onClick={() => toggleRole(role)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                        form.targetRoles.includes(role) ? `${color} text-white` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}>
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Expiry Date (optional)</label>
                <input type="date" className={FIELD} value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} min={new Date().toISOString().slice(0, 10)} />
              </div>

              <label className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl cursor-pointer hover:bg-red-500/15 transition-colors">
                <input type="checkbox" checked={form.isUrgent} onChange={e => setForm({ ...form, isUrgent: e.target.checked })}
                  className="w-4 h-4 accent-red-500 rounded" />
                <div>
                  <p className="text-sm font-medium text-red-300 flex items-center gap-1.5"><BellRing size={13} /> Mark as Urgent</p>
                  <p className="text-xs text-slate-500">Will be highlighted with a red badge</p>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-medium text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {editItem ? 'Save Changes' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
