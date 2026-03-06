import { useState, useEffect, useCallback } from 'react';
import { newsAPI } from '../../utils/api';
import {
  Plus, Search, Edit2, Trash2, X, Loader2, Newspaper,
  Star, StarOff, Globe, BookOpen, FlaskConical, Trophy, Flag,
  RefreshCw, MapPin, Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: 'all',               label: 'All',            icon: Globe,       color: 'text-slate-400' },
  { value: 'local',             label: 'Local (AP)',     icon: MapPin,      color: 'text-rose-400' },
  { value: 'national',          label: 'National',       icon: Flag,        color: 'text-orange-400' },
  { value: 'international',     label: 'International',  icon: Globe,       color: 'text-blue-400' },
  { value: 'education',         label: 'Education',      icon: BookOpen,    color: 'text-green-400' },
  { value: 'science_technology',label: 'Science & Tech', icon: FlaskConical,color: 'text-purple-400' },
  { value: 'sports',            label: 'Sports',         icon: Trophy,      color: 'text-yellow-400' },
];

const CATEGORY_BADGES = {
  local:              'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  national:           'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  international:      'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  education:          'bg-green-500/15 text-green-400 border border-green-500/30',
  science_technology: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  sports:             'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
};

const FIELD = "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all";

const emptyForm = { title: '', content: '', summary: '', category: 'national', source: '', sourceUrl: '', imageUrl: '', isTopNews: false };

export default function AdminNews() {
  const { t } = useTranslation();
  const [news,           setNews]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [fetching,       setFetching]       = useState(false);
  const [search,         setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showModal,      setShowModal]      = useState(false);
  const [editItem,       setEditItem]       = useState(null);
  const [form,           setForm]           = useState(emptyForm);
  const [page,           setPage]           = useState(1);
  const [total,          setTotal]          = useState(0);
  const [fetchResult,    setFetchResult]    = useState(null);
  const LIMIT = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (activeCategory !== 'all') params.category = activeCategory;
      if (search.trim()) params.search = search.trim();
      const res = await newsAPI.getAll(params);
      setNews(res.data || []);
      setTotal(res.total || 0);
    } catch (err) { toast.error('Failed to load news'); }
    finally { setLoading(false); }
  }, [activeCategory, search, page]);

  useEffect(() => { load(); }, [load]);

  // Fetch from NewsAPI
  const handleFetchNews = async (category = 'all') => {
    setFetching(true);
    setFetchResult(null);
    try {
      const res = await newsAPI.fetchFromAPI(category);
      setFetchResult(res);
      toast.success(`${res.message || 'News fetched!'}`);
      load();
    } catch (err) {
      toast.error(err.message || 'Fetch failed — check NEWS_API_KEY in .env');
    } finally { setFetching(false); }
  };

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ title: item.title, content: item.content, summary: item.summary || '', category: item.category, source: item.source || '', sourceUrl: item.sourceUrl || '', imageUrl: item.imageUrl || '', isTopNews: item.isTopNews }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content are required.');
    setSubmitting(true);
    try {
      if (editItem) await newsAPI.update(editItem._id, form);
      else await newsAPI.create(form);
      toast.success(editItem ? 'News updated!' : 'News published!');
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this news article?')) return;
    try { await newsAPI.delete(id); toast.success('Removed.'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const handleTopToggle = async (item) => {
    try {
      await newsAPI.update(item._id, { isTopNews: !item.isTopNews });
      toast.success(item.isTopNews ? 'Removed from Top News' : 'Added to Top News');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const topCount = news.filter(n => n.isTopNews).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Newspaper size={24} className="text-indigo-400" /> Daily News
          </h1>
          <p className="text-slate-400 text-sm mt-1">{total} articles in database</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Fetch from NewsAPI */}
          <button onClick={() => handleFetchNews('all')} disabled={fetching}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
            {fetching ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {fetching ? 'Fetching...' : 'Fetch Latest News'}
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-900/40">
            <Plus size={16} /> Post News
          </button>
        </div>
      </div>

      {/* Fetch result summary */}
      {fetchResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm">
          <p className="text-emerald-400 font-medium">✅ {fetchResult.message}</p>
          {fetchResult.data?.results && (
            <div className="flex flex-wrap gap-3 mt-2">
              {fetchResult.data.results.map(r => (
                <span key={r.category} className="text-xs text-slate-400">
                  {r.category}: {r.error ? `❌ ${r.error}` : `✓`}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(({ value, label, icon: Icon, color }) => (
          <button key={value} onClick={() => { setActiveCategory(value); setPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === value ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}>
            <Icon size={14} className={activeCategory === value ? 'text-white' : color} />
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search news..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Top News Banner */}
      {activeCategory === 'all' && !search && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-amber-300">Top News ({topCount}/5)</span>
            <span className="text-xs text-slate-500 ml-1">Click ⭐ on any article to toggle</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {news.filter(n => n.isTopNews).map(n => (
              <span key={n._id} className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 truncate max-w-xs">
                {n.title}
              </span>
            ))}
            {topCount === 0 && <span className="text-xs text-slate-500">No top news selected yet</span>}
          </div>
        </div>
      )}

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-900 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
          <Newspaper size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No news found</p>
          <p className="text-slate-500 text-sm mt-1">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {news.map(item => (
            <div key={item._id}
              className="group bg-slate-900 border border-slate-700/50 hover:border-slate-600 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col">
              {item.imageUrl && (
                <div className="h-36 overflow-hidden">
                  <img src={item.imageUrl} alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => e.target.style.display = 'none'} />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${CATEGORY_BADGES[item.category] || 'bg-slate-700 text-slate-400'}`}>
                    {item.category.replace('_', ' & ')}
                  </span>
                  {item.isTopNews && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1">
                      <Star size={10} className="fill-amber-400" /> Top
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white leading-snug mb-1 line-clamp-2">{item.title}</h3>
                {item.summary && <p className="text-xs text-slate-400 line-clamp-2 mb-2">{item.summary}</p>}
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-500">
                    {item.postedBy?.name || 'Admin'} · {format(new Date(item.publishedAt), 'MMM d, yyyy')}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleTopToggle(item)}
                      title={item.isTopNews ? 'Remove from top' : 'Add to top'}
                      className="p-1.5 rounded-lg hover:bg-amber-500/20 text-slate-500 hover:text-amber-400 transition-colors">
                      {item.isTopNews ? <StarOff size={14} /> : <Star size={14} />}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(item._id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm disabled:opacity-40 hover:bg-slate-700 transition-colors">
            ← Prev
          </button>
          <span className="text-sm text-slate-400">Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm disabled:opacity-40 hover:bg-slate-700 transition-colors">
            Next →
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h3 className="font-display font-semibold text-white text-lg">{editItem ? 'Edit Article' : 'Post New Article'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Title *</label>
                <input className={FIELD} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Article headline..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Category *</label>
                  <select className={FIELD} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Source</label>
                  <input className={FIELD} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="e.g. The Hindu" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Summary</label>
                <input className={FIELD} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Brief summary (shown in card preview)..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Full Content *</label>
                <textarea className={`${FIELD} resize-none`} rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Full article content..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Source URL</label>
                  <input className={FIELD} value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://..." type="url" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Image URL</label>
                  <input className={FIELD} value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://... (optional)" type="url" />
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl cursor-pointer hover:bg-amber-500/15 transition-colors">
                <input type="checkbox" checked={form.isTopNews} onChange={e => setForm({ ...form, isTopNews: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded" />
                <div>
                  <p className="text-sm font-medium text-amber-300 flex items-center gap-1.5"><Star size={13} className="fill-amber-400" /> Mark as Top News</p>
                  <p className="text-xs text-slate-500">Will appear in the Top 5 section on student dashboard</p>
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
                  {editItem ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
