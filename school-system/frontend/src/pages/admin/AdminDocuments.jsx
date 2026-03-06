import { useState, useEffect, useCallback } from 'react';
import { documentAPI } from '../../utils/api';
import {
  FileText, Download, CheckCircle, XCircle, Clock,
  Filter, ChevronDown, Loader2, Eye, X, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  icon: Clock,        cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  approved: { label: 'Approved', icon: CheckCircle,  cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  rejected: { label: 'Rejected', icon: XCircle,      cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
};

const TYPE_CONFIG = {
  bonafide: { label: 'Bonafide Certificate', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  tc:       { label: 'Transfer Certificate', color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
};

const FIELD = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";

export default function AdminDocuments() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewItem, setViewItem] = useState(null);
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterType !== 'all') params.type = filterType;
      const res = await documentAPI.getAll(params);
      setRequests(res.data || []);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  }, [filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (status) => {
    setSubmitting(true);
    try {
      await documentAPI.update(actionItem._id, { status, adminRemarks });
      toast.success(`Request ${status}! ${status === 'approved' ? 'PDF certificate generated.' : ''}`);
      setActionItem(null);
      setAdminRemarks('');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const pending  = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <FileText size={24} className="text-indigo-400" /> Document Requests
          </h1>
          <p className="text-slate-400 text-sm mt-1">{requests.length} total requests</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Review', count: pending, cls: 'border-amber-500/30 bg-amber-500/5', textCls: 'text-amber-400' },
          { label: 'Approved', count: approved, cls: 'border-green-500/30 bg-green-500/5', textCls: 'text-green-400' },
          { label: 'Rejected', count: rejected, cls: 'border-red-500/30 bg-red-500/5', textCls: 'text-red-400' },
        ].map(({ label, count, cls, textCls }) => (
          <div key={label} className={`border rounded-2xl p-4 ${cls}`}>
            <p className={`text-2xl font-display font-bold ${textCls}`}>{count}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}>{s === 'all' ? 'All Status' : s}</button>
        ))}
        <div className="w-px bg-slate-700 mx-1" />
        {['all', 'bonafide', 'tc'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filterType === t ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}>{t === 'all' ? 'All Types' : t === 'bonafide' ? 'Bonafide' : 'Transfer Cert.'}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-slate-900 rounded-2xl p-8 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto" /></div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
          <FileText size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No requests found</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Req #', 'Student', 'Type', 'Reason', 'Submitted', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {requests.map(req => {
                  const { label: sLabel, icon: StatusIcon, cls: sCls } = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  const { label: tLabel, color: tColor } = TYPE_CONFIG[req.type] || {};
                  return (
                    <tr key={req._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-indigo-400">{req.requestNumber}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-white">{req.student?.user?.name || '—'}</p>
                          <p className="text-xs text-slate-500">{req.student?.rollNumber} · {req.student?.class?.name || ''}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${tColor}`}>{tLabel}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-sm text-slate-300 truncate">{req.reason}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {format(new Date(req.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 w-fit ${sCls}`}>
                          <StatusIcon size={11} /> {sLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewItem(req)}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="View details">
                            <Eye size={14} />
                          </button>
                          {req.status === 'pending' && (
                            <>
                              <button onClick={() => { setActionItem(req); setActionType('approved'); setAdminRemarks(''); }}
                                className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors" title="Approve">
                                <CheckCircle size={14} />
                              </button>
                              <button onClick={() => { setActionItem(req); setActionType('rejected'); setAdminRemarks(''); }}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Reject">
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {req.status === 'approved' && req.generatedCertificate && (
                            <a href={`/${req.generatedCertificate}`} target="_blank" rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-colors" title="Download PDF">
                              <Download size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h3 className="font-display font-semibold text-white">Request Details</h3>
              <button onClick={() => setViewItem(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                ['Request Number', viewItem.requestNumber],
                ['Student Name', viewItem.student?.user?.name],
                ['Roll Number', viewItem.student?.rollNumber],
                ['Class', `${viewItem.student?.class?.name || '—'} ${viewItem.student?.class?.section || ''}`],
                ['Certificate Type', TYPE_CONFIG[viewItem.type]?.label],
                ['Reason', viewItem.reason],
                ['Submitted On', format(new Date(viewItem.createdAt), 'dd MMMM yyyy, hh:mm a')],
                ['Status', viewItem.status],
                ['Reviewed By', viewItem.reviewedBy?.name || '—'],
                ['Admin Remarks', viewItem.adminRemarks || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm border-b border-slate-800 pb-2 last:border-0">
                  <span className="text-slate-400 font-medium flex-shrink-0">{label}</span>
                  <span className="text-white text-right">{value || '—'}</span>
                </div>
              ))}
              {viewItem.generatedCertificate && (
                <a href={`/${viewItem.generatedCertificate}`} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors mt-2">
                  <Download size={15} /> Download Certificate PDF <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Confirm Modal */}
      {actionItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className={`px-6 py-4 border-b ${actionType === 'approved' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <h3 className={`font-display font-semibold text-lg ${actionType === 'approved' ? 'text-green-300' : 'text-red-300'}`}>
                {actionType === 'approved' ? '✅ Approve Request' : '❌ Reject Request'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-800 rounded-xl p-3 text-sm">
                <p className="text-white font-medium">{actionItem.student?.user?.name}</p>
                <p className="text-slate-400 text-xs mt-0.5">{TYPE_CONFIG[actionItem.type]?.label} · {actionItem.requestNumber}</p>
              </div>
              {actionType === 'approved' && (
                <div className="flex items-start gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-300">
                  <FileText size={15} className="flex-shrink-0 mt-0.5" />
                  <span>A PDF certificate will be automatically generated and attached to this request.</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Remarks {actionType === 'rejected' ? '(required)' : '(optional)'}
                </label>
                <textarea className={FIELD + ' resize-none'} rows={3}
                  value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)}
                  placeholder={actionType === 'approved' ? 'Optional remarks for the student...' : 'Reason for rejection...'} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActionItem(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-medium text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleAction(actionType)} disabled={submitting || (actionType === 'rejected' && !adminRemarks.trim())}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-colors text-white ${
                    actionType === 'approved' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                  }`}>
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {actionType === 'approved' ? 'Approve & Generate PDF' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
