import { useState, useEffect, useCallback } from 'react';
import { newsAPI, studentAPI, chatbotAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Newspaper, Search, Bookmark, BookmarkCheck, Star,
  Globe, Flag, BookOpen, FlaskConical, Trophy, ExternalLink,
  Loader2, Calendar, User, ArrowLeft, Languages, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: 'all',                label: 'All',            icon: Globe,         color: 'text-slate-400' },
  { value: 'local',              label: 'Local (AP)',     icon: MapPin,        color: 'text-rose-400' },
  { value: 'national',           label: 'National',       icon: Flag,          color: 'text-orange-400' },
  { value: 'international',      label: 'International',  icon: Globe,         color: 'text-blue-400' },
  { value: 'education',          label: 'Education',      icon: BookOpen,      color: 'text-green-400' },
  { value: 'science_technology', label: 'Science & Tech', icon: FlaskConical,  color: 'text-purple-400' },
  { value: 'sports',             label: 'Sports',         icon: Trophy,        color: 'text-yellow-400' },
];
const BADGE = {
  local:              'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  national:           'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  international:      'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  education:          'bg-green-500/15 text-green-400 border border-green-500/30',
  science_technology: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  sports:             'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
};

// Translate a full article to Telugu via backend — single API call
async function translateArticle(article) {
  const res = await chatbotAPI.translate(null, article.title, article.summary, article.content);
  if (res?.title) return { title: res.title, summary: res.summary || '', content: res.content || '' };
  throw new Error(res?.message || 'Translation failed');
}

export default function StudentNews() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [news,           setNews]           = useState([]);
  const [topNews,        setTopNews]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [bookmarks,      setBookmarks]      = useState(new Set());
  const [bookmarking,    setBookmarking]    = useState(null);
  const [page,           setPage]           = useState(1);
  const [total,          setTotal]          = useState(0);
  const [selected,       setSelected]       = useState(null);
  const [translating,    setTranslating]    = useState(false);
  const [translated,     setTranslated]     = useState(null); // { title, summary, content }
  const LIMIT = 9;

  useEffect(() => {
    if (user?.studentProfile?.bookmarks) {
      setBookmarks(new Set(user.studentProfile.bookmarks.map(b => b._id || b)));
    }
  }, [user]);

  useEffect(() => {
    newsAPI.getAll({ topOnly: 'true', limit: 5 }).then(res => setTopNews(res.data || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (activeCategory !== 'all') params.category = activeCategory;
      if (search.trim()) params.search = search.trim();
      const res = await newsAPI.getAll(params);
      setNews(res.data || []);
      setTotal(res.total || 0);
    } catch { toast.error('Failed to load news'); }
    finally { setLoading(false); }
  }, [activeCategory, search, page]);

  useEffect(() => { load(); }, [load]);

  // Auto-translate when article is opened and language is Telugu
  useEffect(() => {
    if (selected && lang === 'te' && !translated) {
      handleTranslate();
    }
    if (lang === 'en') setTranslated(null);
  }, [selected, lang]);

  const handleTranslate = async () => {
    if (!selected || translating) return;
    setTranslating(true);
    try {
      const result = await translateArticle(selected);
      setTranslated(result);
    } catch (err) {
      console.error('Translation error:', err);
      toast.error(err.message || 'Translation failed. Please try again.');
    } finally { setTranslating(false); }
  };

  const toggleBookmark = async (newsId) => {
    if (!user?.studentProfile) return;
    const sid = typeof user.studentProfile === 'object' ? user.studentProfile._id : user.studentProfile;
    setBookmarking(newsId);
    try {
      await studentAPI.bookmark(sid, newsId);
      setBookmarks(prev => { const n = new Set(prev); n.has(newsId) ? n.delete(newsId) : n.add(newsId); return n; });
    } catch { toast.error('Failed to update bookmark'); }
    finally { setBookmarking(null); }
  };

  // ── Article View ──────────────────────────────────────────────────────────────
  if (selected) {
    const display = translated || {};
    const title   = display.title   || selected.title;
    const summary = display.summary || selected.summary;
    const content = display.content || selected.content;

    return (
      <div className="animate-fade-in max-w-3xl mx-auto space-y-5">
        <button onClick={() => { setSelected(null); setTranslated(null); }}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> {lang === 'te' ? 'వార్తలకు తిరిగి వెళ్ళు' : 'Back to News'}
        </button>

        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
          {selected.imageUrl && (
            <div className="h-56 overflow-hidden">
              <img src={selected.imageUrl} alt={title}
                className="w-full h-full object-cover"
                onError={e => e.target.style.display = 'none'} />
            </div>
          )}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium capitalize ${BADGE[selected.category] || 'bg-slate-700 text-slate-400'}`}>
                {selected.category.replace('_', ' & ')}
              </span>
              {selected.isTopNews && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1">
                  <Star size={10} className="fill-amber-400" /> Top News
                </span>
              )}
              {/* Translate button */}
              <button
                onClick={lang === 'en' ? handleTranslate : () => setTranslated(null)}
                disabled={translating}
                className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-500/25 transition-colors disabled:opacity-50">
                {translating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                {translating
                  ? (lang === 'te' ? 'అనువాదం అవుతోంది...' : 'Translating...')
                  : translated
                    ? (lang === 'te' ? 'తెలుగులో చదువుతున్నారు ✓' : 'Show Original')
                    : (lang === 'te' ? 'తెలుగులో చదవండి' : 'తెలుగులో చదవండి')}
              </button>
            </div>

            <h1 className="text-xl font-display font-bold text-white leading-snug">{title}</h1>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              {selected.source && <span className="flex items-center gap-1"><User size={12} />{selected.source}</span>}
              <span className="flex items-center gap-1">
                <Calendar size={12} />{format(new Date(selected.publishedAt), 'dd MMMM yyyy')}
              </span>
            </div>

            {summary && (
              <p className="text-slate-300 text-sm font-medium leading-relaxed border-l-4 border-indigo-500 pl-4 italic">
                {summary}
              </p>
            )}

            <div className="text-slate-300 text-sm leading-7 whitespace-pre-line">{content}</div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
              {selected.sourceUrl && (
                <a href={selected.sourceUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  <ExternalLink size={14} />
                  {lang === 'te' ? 'అసలు మూలం చదవండి' : 'Read original source'}
                </a>
              )}
              <button onClick={() => toggleBookmark(selected._id)} disabled={bookmarking === selected._id}
                className={`flex items-center gap-2 text-sm transition-colors ml-auto ${bookmarks.has(selected._id) ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}>
                {bookmarks.has(selected._id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                {lang === 'te' ? (bookmarks.has(selected._id) ? 'బుక్‌మార్క్ చేయబడింది' : 'బుక్‌మార్క్') : (bookmarks.has(selected._id) ? 'Bookmarked' : 'Bookmark')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Newspaper size={24} className="text-indigo-400" /> {t('news')}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {lang === 'te' ? 'పాఠశాల మరియు ప్రపంచ వార్తలతో అప్‌డేట్‌గా ఉండండి' : 'Stay updated with the latest school and world news'}
        </p>
      </div>

      {/* Top Stories */}
      {topNews.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={15} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-amber-300">
              {lang === 'te' ? 'ముఖ్యమైన వార్తలు' : 'Top Stories'}
            </span>
          </div>
          <div className="space-y-1">
            {topNews.map((n, i) => (
              <button key={n._id} onClick={() => setSelected(n)}
                className="w-full flex items-start gap-3 text-left hover:bg-amber-500/5 rounded-xl p-2 transition-colors group">
                <span className="text-xs font-bold text-amber-500 mt-0.5 flex-shrink-0 w-5">{i+1}.</span>
                <span className="text-sm text-slate-200 group-hover:text-white line-clamp-1">{n.title}</span>
                <ExternalLink size={12} className="text-slate-600 group-hover:text-amber-400 flex-shrink-0 mt-0.5 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(({ value, label, icon: Icon, color }) => (
          <button key={value} onClick={() => { setActiveCategory(value); setPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeCategory === value ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
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
          placeholder={lang === 'te' ? 'వార్తలు వెతకండి...' : 'Search news...'}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Telugu notice */}
      {lang === 'te' && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2.5 text-xs text-purple-300 flex items-center gap-2">
          <Languages size={14} />
          వార్తలు చదవడానికి క్లిక్ చేయండి — తెలుగు అనువాదం అందుబాటులో ఉంటుంది
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 bg-slate-900 rounded-2xl animate-pulse" />)}
        </div>
      ) : news.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
          <Newspaper size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">{lang === 'te' ? 'వార్తలు కనుగొనబడలేదు' : 'No news found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {news.map(item => {
            const isBookmarked = bookmarks.has(item._id);
            return (
              <div key={item._id} onClick={() => setSelected(item)}
                className="group bg-slate-900 border border-slate-700/50 hover:border-indigo-500/40 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col cursor-pointer hover:shadow-lg hover:shadow-indigo-900/10">
                {item.imageUrl && (
                  <div className="h-36 overflow-hidden flex-shrink-0">
                    <img src={item.imageUrl} alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => e.target.style.display = 'none'} />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${BADGE[item.category] || 'bg-slate-700 text-slate-400'}`}>
                      {item.category.replace('_', ' & ')}
                    </span>
                    {item.isTopNews && <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
                  </div>
                  <h3 className="text-sm font-semibold text-white leading-snug mb-1 line-clamp-2 flex-1 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h3>
                  {item.summary && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{item.summary}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-auto">
                    <span className="text-xs text-slate-500">{format(new Date(item.publishedAt), 'dd MMM yyyy')}</span>
                    <button onClick={e => { e.stopPropagation(); toggleBookmark(item._id); }} disabled={bookmarking === item._id}
                      className={`p-1.5 rounded-lg transition-colors ${isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}>
                      {bookmarking === item._id ? <Loader2 size={13} className="animate-spin" /> : isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm disabled:opacity-40 hover:bg-slate-700">
            ← {lang === 'te' ? 'వెనక్కి' : 'Prev'}
          </button>
          <span className="text-sm text-slate-400">{page} / {Math.ceil(total/LIMIT)}</span>
          <button disabled={page >= Math.ceil(total/LIMIT)} onClick={() => setPage(p => p+1)}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm disabled:opacity-40 hover:bg-slate-700">
            {lang === 'te' ? 'తదుపరి' : 'Next'} →
          </button>
        </div>
      )}
    </div>
  );
}
