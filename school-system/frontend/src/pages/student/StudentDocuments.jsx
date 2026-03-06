import { useState, useEffect, useCallback } from 'react';
import { documentAPI } from '../../utils/api';
import {
  FileText, Plus, Clock, CheckCircle, XCircle, Download,
  X, Loader2, AlertCircle, Upload, Info, BookOpen,
  ChevronDown, ChevronRight, CheckSquare, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending:  { label: 'Pending Review', icon: Clock,       cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  approved: { label: 'Approved',       icon: CheckCircle, cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  rejected: { label: 'Rejected',       icon: XCircle,     cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
};

const FIELD = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";

// ─── Info Guide Data ──────────────────────────────────────────────────────────
const DOCUMENT_GUIDES = [
  {
    id: 'bonafide',
    title: 'Bonafide Certificate',
    icon: '📋',
    color: 'from-blue-600/20 to-blue-700/10 border-blue-500/30',
    headerColor: 'text-blue-400',
    description: 'A Bonafide Certificate confirms you are a currently enrolled student of this school.',
    uses: [
      'Opening a bank account (student savings)',
      'Applying for scholarships and financial aid',
      'Proving student status for concessions (railways, bus pass)',
      'Submitting to competition registrations',
      'Applying for passport or visa as a student',
    ],
    documents: [
      'School ID card (for verification)',
      'Reason letter specifying the purpose',
    ],
    process: [
      'Go to Documents → Click "New Request"',
      'Select "Bonafide Certificate"',
      'Write your reason clearly (e.g. "For bank account opening")',
      'Upload any supporting documents if required',
      'Submit — Admin will review within 1–2 working days',
      'Once approved, download your PDF certificate',
    ],
    time: '1–2 working days',
    fee: 'Free',
  },
  {
    id: 'tc',
    title: 'Transfer Certificate (TC)',
    icon: '🏫',
    color: 'from-purple-600/20 to-purple-700/10 border-purple-500/30',
    headerColor: 'text-purple-400',
    description: 'A TC is issued when a student permanently leaves this school to join another institution.',
    uses: [
      'Admission to another school or college',
      'Required by the new school at the time of admission',
      'Proof of date of leaving and conduct',
    ],
    documents: [
      'All school fee dues cleared',
      'Library books and items returned',
      'No Dues Certificate from concerned departments',
      'Parent/Guardian written application',
    ],
    process: [
      'Ensure all dues (fees, library, etc.) are cleared',
      'Go to Documents → Click "New Request"',
      'Select "Transfer Certificate"',
      'Provide clear reason for transfer',
      'Submit request — Admin reviews and approves',
      'Download TC PDF once approved',
      '⚠️ Note: TC approval archives your student account permanently',
    ],
    time: '2–3 working days',
    fee: 'Free (after clearing all dues)',
    warning: 'TC approval is irreversible. Your student account will be archived.',
  },
];

const FAQ = [
  { q: 'How long does it take to get my certificate?', a: 'Bonafide certificates are usually approved within 1–2 working days. TC may take 2–3 days as admin verifies dues clearance.' },
  { q: 'Can I apply for both at the same time?', a: 'You can have one pending request per type. If you have a pending Bonafide request, you can still apply for TC and vice versa.' },
  { q: 'What if my certificate has wrong information?', a: 'Contact your class teacher or admin directly and request a correction. Do not apply for a new certificate until the existing one is corrected.' },
  { q: 'Is the downloaded PDF valid for official use?', a: 'Yes, the computer-generated certificate carries the school\'s details and certificate number. For some purposes, you may also need a physical copy with the principal\'s original signature — ask the office.' },
  { q: 'What if I need an urgent certificate?', a: 'Contact the school office directly and explain the urgency. The admin can expedite the process for genuine emergencies.' },
  { q: 'My TC was approved but I changed my mind. Can it be reversed?', a: 'No. TC approval archives your account permanently. Think carefully before applying for TC.' },
];

export default function StudentDocuments() {
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewItem,   setViewItem]   = useState(null);
  const [activeTab,  setActiveTab]  = useState('requests'); // 'requests' | 'guide'
  const [openGuide,  setOpenGuide]  = useState(null);
  const [openFaq,    setOpenFaq]    = useState(null);
  const [downloading,setDownloading]= useState(null);
  const [form,       setForm]       = useState({ type: 'bonafide', reason: '', files: [] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentAPI.getAll();
      setRequests(res.data || []);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) return toast.error('Please provide a reason.');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('reason', form.reason);
      form.files.forEach(f => fd.append('documents', f));
      await documentAPI.create(fd);
      toast.success('Request submitted! Admin will review it shortly.');
      setShowModal(false);
      setForm({ type: 'bonafide', reason: '', files: [] });
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDownload = async (req) => {
    setDownloading(req._id);
    try {
      const response = await fetch(`/api/documents/download/${req._id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Download failed');
      }
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${req.type}_certificate_${req.requestNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Download failed. Please try again.');
    } finally { setDownloading(null); }
  };

  const hasActiveRequest = (type) => requests.some(r => r.type === type && r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <FileText size={24} className="text-indigo-400" /> Document Requests
          </h1>
          <p className="text-slate-400 text-sm mt-1">Apply for certificates and track your requests</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'guide' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            <Info size={15} /> How to Apply
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
            <Plus size={16} /> New Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-700/50 rounded-xl p-1 w-fit">
        {[
          { id: 'requests', label: 'My Requests', icon: FileText },
          { id: 'guide',    label: 'How to Apply & Process',  icon: BookOpen },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── MY REQUESTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <>
          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOCUMENT_GUIDES.map(g => (
              <div key={g.id} className={`bg-gradient-to-br border rounded-2xl p-5 ${g.color}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{g.icon}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${g.headerColor}`}>{g.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{g.description}</p>
                    {g.warning && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
                        <AlertCircle size={12} /> {g.warning}
                      </div>
                    )}
                    {hasActiveRequest(g.id) && (
                      <div className="mt-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                        ⏳ You have a pending {g.id} request
                      </div>
                    )}
                    <button onClick={() => { setActiveTab('guide'); setOpenGuide(g.id); }}
                      className="mt-2 text-xs underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity">
                      View process guide →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Request History */}
          <div>
            <h2 className="text-lg font-display font-semibold text-white mb-3">Request History</h2>
            {loading ? (
              <div className="bg-slate-900 rounded-2xl p-8 text-center">
                <Loader2 size={24} className="animate-spin text-indigo-400 mx-auto" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-10 text-center">
                <FileText size={36} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No requests yet</p>
                <p className="text-slate-500 text-sm mt-1">Click "New Request" to apply for a certificate</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => {
                  const { label: sLabel, icon: StatusIcon, cls: sCls } = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={req._id} className="bg-slate-900 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-5 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${req.type === 'bonafide' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                            <FileText size={18} className={req.type === 'bonafide' ? 'text-blue-400' : 'text-purple-400'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white text-sm capitalize">
                                {req.type === 'bonafide' ? 'Bonafide Certificate' : 'Transfer Certificate'}
                              </span>
                              <span className="text-xs font-mono text-slate-500">{req.requestNumber}</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{req.reason}</p>
                            <p className="text-xs text-slate-500 mt-1">Applied {format(new Date(req.createdAt), 'dd MMM yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${sCls}`}>
                            <StatusIcon size={11} /> {sLabel}
                          </span>
                          <button onClick={() => setViewItem(req)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                            View details →
                          </button>
                        </div>
                      </div>

                      {req.status !== 'pending' && (
                        <div className={`mt-4 pt-3 border-t border-slate-800 text-xs ${req.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                          {req.status === 'approved' ? '✓' : '✗'} {req.status === 'approved' ? 'Approved' : 'Rejected'} by {req.reviewedBy?.name || 'Admin'}
                          {req.reviewedAt && ` on ${format(new Date(req.reviewedAt), 'dd MMM yyyy')}`}
                          {req.adminRemarks && <span className="text-slate-400 ml-2">· "{req.adminRemarks}"</span>}
                        </div>
                      )}

                      {/* PDF Download — uses secure API route */}
                      {req.status === 'approved' && (
                        <div className="mt-3">
                          <button onClick={() => handleDownload(req)} disabled={downloading === req._id}
                            className="inline-flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50">
                            {downloading === req._id
                              ? <><Loader2 size={14} className="animate-spin" /> Preparing...</>
                              : <><Download size={14} /> Download Certificate PDF</>}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── HOW TO APPLY TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'guide' && (
        <div className="space-y-5">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 flex items-start gap-3">
            <Info size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-200">
              This guide explains what each certificate is for, what documents you need, and step-by-step how to apply. Read before submitting a request.
            </p>
          </div>

          {/* Document Guides */}
          {DOCUMENT_GUIDES.map(g => (
            <div key={g.id} className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenGuide(openGuide === g.id ? null : g.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-800/40 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{g.icon}</span>
                  <div>
                    <h3 className={`font-semibold text-base ${g.headerColor}`}>{g.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Processing: {g.time} · {g.fee}</p>
                  </div>
                </div>
                {openGuide === g.id ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
              </button>

              {openGuide === g.id && (
                <div className="px-5 pb-5 space-y-5 border-t border-slate-700/50">
                  <p className="text-sm text-slate-300 mt-4 leading-relaxed">{g.description}</p>

                  {g.warning && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <AlertCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-300">{g.warning}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* What it's used for */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📌 When You Need This</h4>
                      <ul className="space-y-2">
                        {g.uses.map((u, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <CheckSquare size={14} className="text-green-400 flex-shrink-0 mt-0.5" /> {u}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Documents needed */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📁 What You Need</h4>
                      <ul className="space-y-2">
                        {g.documents.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <FileText size={14} className="text-blue-400 flex-shrink-0 mt-0.5" /> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Step-by-step process */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🔢 Step-by-Step Process</h4>
                    <div className="space-y-2">
                      {g.process.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                            {step.startsWith('⚠️') ? '!' : i + 1}
                          </span>
                          <p className={`text-sm leading-relaxed ${step.startsWith('⚠️') ? 'text-amber-300' : 'text-slate-300'}`}>
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl">
                    <div className="text-xs text-slate-400 space-y-0.5">
                      <p>⏱️ Processing time: <span className="text-white font-medium">{g.time}</span></p>
                      <p>💰 Fee: <span className="text-white font-medium">{g.fee}</span></p>
                    </div>
                    <button onClick={() => { setActiveTab('requests'); setShowModal(true); setForm({ ...form, type: g.id }); }}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
                      <Plus size={14} /> Apply Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* FAQ */}
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-700/50 flex items-center gap-2">
              <HelpCircle size={18} className="text-amber-400" />
              <h3 className="font-semibold text-white">Frequently Asked Questions</h3>
            </div>
            <div className="divide-y divide-slate-700/30">
              {FAQ.map((item, i) => (
                <div key={i}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition-colors text-left">
                    <span className="text-sm font-medium text-white pr-4">{item.q}</span>
                    {openFaq === i ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4">
                      <p className="text-sm text-slate-300 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── APPLY MODAL ──────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h3 className="font-display font-semibold text-white text-lg">New Certificate Request</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Certificate Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'bonafide', label: 'Bonafide', sub: 'Proof of enrollment', color: 'border-blue-500/50 bg-blue-500/10 text-blue-300' },
                    { value: 'tc', label: 'Transfer Cert.', sub: 'School transfer', color: 'border-purple-500/50 bg-purple-500/10 text-purple-300' },
                  ].map(({ value, label, sub, color }) => (
                    <button key={value} type="button" onClick={() => setForm({ ...form, type: value })}
                      className={`p-3 rounded-xl border text-left transition-all ${form.type === value ? color : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'tc' && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <AlertCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">TC approval will archive your student account permanently. This cannot be undone.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Reason *</label>
                <textarea className={`${FIELD} resize-none`} rows={3}
                  value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder={form.type === 'bonafide' ? 'e.g. Required for bank account opening...' : 'e.g. Relocating to another city...'}
                  required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Supporting Documents (optional)</label>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-indigo-500/50 transition-colors">
                  <Upload size={20} className="text-slate-500 mx-auto mb-2" />
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => setForm({ ...form, files: Array.from(e.target.files) })} className="hidden" id="doc-files" />
                  <label htmlFor="doc-files" className="cursor-pointer text-sm text-indigo-400 hover:text-indigo-300">Click to upload files</label>
                  <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (max 10MB each)</p>
                  {form.files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 justify-center">
                      {form.files.map((f, i) => <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{f.name}</span>)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-medium text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting && <Loader2 size={15} className="animate-spin" />} Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h3 className="font-display font-semibold text-white">Request Details</h3>
              <button onClick={() => setViewItem(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['Request Number', viewItem.requestNumber],
                ['Type', viewItem.type === 'bonafide' ? 'Bonafide Certificate' : 'Transfer Certificate'],
                ['Reason', viewItem.reason],
                ['Submitted', format(new Date(viewItem.createdAt), 'dd MMMM yyyy, hh:mm a')],
                ['Status', viewItem.status],
                ['Reviewed By', viewItem.reviewedBy?.name || '—'],
                ['Admin Remarks', viewItem.adminRemarks || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm border-b border-slate-800 pb-2 last:border-0">
                  <span className="text-slate-400 flex-shrink-0">{label}</span>
                  <span className="text-white text-right capitalize">{value || '—'}</span>
                </div>
              ))}
              {viewItem.status === 'approved' && (
                <button onClick={() => handleDownload(viewItem)} disabled={downloading === viewItem._id}
                  className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium mt-2 disabled:opacity-50">
                  {downloading === viewItem._id ? <><Loader2 size={15} className="animate-spin" /> Preparing...</> : <><Download size={15} /> Download Certificate PDF</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
