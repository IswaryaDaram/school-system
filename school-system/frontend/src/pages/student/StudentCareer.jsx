import { useState } from 'react';
import {
  Compass, ChevronDown, ChevronRight, GraduationCap, Building2,
  Star, BookOpen, Briefcase, Award, ArrowRight, Landmark,
  FlaskConical, Stethoscope, Scale, Cpu, Leaf, Shield,
  TrendingUp, Music, Palette, Globe
} from 'lucide-react';

// ─── DATA ─────────────────────────────────────────────────────────────────────

const STREAMS = [
  {
    id: 'science',
    label: 'Science Stream (PCM / PCB)',
    icon: FlaskConical,
    color: 'from-blue-600/20 to-cyan-700/10 border-blue-500/30',
    headerColor: 'bg-blue-600',
    description: 'Best if you are strong in Mathematics, Physics, Chemistry or Biology. Opens the widest range of career options.',
    subjects: { pcm: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Optional: Computer Science / Biology'], pcb: ['Physics', 'Chemistry', 'Biology', 'English', 'Optional: Mathematics'] },
    careers: [
      { name: 'Engineering (B.Tech)', desc: 'Civil, Mechanical, Computer Science, Electrical, Electronics and many branches. Entrance: JEE Main / JEE Advanced / AP EAMCET', type: 'pcm' },
      { name: 'Medicine (MBBS / BDS)', desc: 'Become a doctor or dentist. Entrance: NEET UG — taken after Class 12 PCB', type: 'pcb' },
      { name: 'Architecture (B.Arch)', desc: 'Design buildings and spaces. Entrance: NATA / JEE Main Paper 2', type: 'pcm' },
      { name: 'B.Sc (Physics / Chemistry / Maths / Biology)', desc: 'Pure science degree — leads to research, teaching, or specialised fields', type: 'both' },
      { name: 'Pharmacy (B.Pharm)', desc: 'Drug sciences, medicines. Entrance: EAMCET / GPAT', type: 'pcb' },
      { name: 'Biotechnology / Bioinformatics', desc: 'Cutting-edge biology + technology field with growing job opportunities', type: 'pcb' },
      { name: 'Nursing / Allied Health Sciences', desc: 'GNM, B.Sc Nursing — always in demand, good government job prospects', type: 'pcb' },
      { name: 'Agriculture (B.Sc Ag)', desc: 'Highly relevant in AP/Telangana. Entrance: EAMCET — strong government job options', type: 'both' },
    ]
  },
  {
    id: 'commerce',
    label: 'Commerce Stream',
    icon: TrendingUp,
    color: 'from-emerald-600/20 to-green-700/10 border-emerald-500/30',
    headerColor: 'bg-emerald-600',
    description: 'Best if you are interested in business, finance, accounting or economics.',
    subjects: { main: ['Accountancy', 'Business Studies', 'Economics', 'English', 'Optional: Mathematics / Computer Science'] },
    careers: [
      { name: 'Chartered Accountancy (CA)', desc: 'Most prestigious commerce career. 3-level exam: CA Foundation → Intermediate → Final. Conducted by ICAI.' },
      { name: 'B.Com / B.Com (Hons)', desc: 'Foundation degree for commerce — opens paths to MBA, CA, CS, banking' },
      { name: 'Company Secretary (CS)', desc: 'Legal compliance expert for companies. Conducted by ICSI. 3 levels: Foundation → Executive → Professional' },
      { name: 'BBA / BBM', desc: 'Bachelor of Business Administration — management fundamentals, leads to MBA' },
      { name: 'Economics (B.A/B.Sc)', desc: 'Leads to UPSC/IAS, banking, policy, research, or MBA' },
      { name: 'Banking & Finance', desc: 'BBA Banking, B.Com Banking — prepares for bank jobs (IBPS, SBI PO)' },
      { name: 'Cost & Management Accountant (CMA)', desc: 'Financial management in companies. Conducted by ICMAI' },
      { name: 'MBA (after graduation)', desc: 'Master of Business Administration — top management career option. Entrance: CAT / MAT / XAT' },
    ]
  },
  {
    id: 'arts',
    label: 'Arts / Humanities Stream',
    icon: Palette,
    color: 'from-purple-600/20 to-violet-700/10 border-purple-500/30',
    headerColor: 'bg-purple-600',
    description: 'Best if you are interested in languages, history, political science, psychology, law or creative fields.',
    subjects: { main: ['History', 'Political Science', 'Geography', 'Economics', 'Sociology / Psychology', 'Languages'] },
    careers: [
      { name: 'Civil Services (IAS / IPS / IFS)', desc: 'Most prestigious government career. After graduation: UPSC CSE Exam. Requires dedication and 2–3 years preparation.' },
      { name: 'Law (LLB / BA LLB)', desc: 'Become a lawyer or judge. 5-year integrated BA LLB after 12th. Entrance: CLAT / LSAT India' },
      { name: 'Journalism & Mass Communication', desc: 'Media, news, PR, digital content. Growing field with government & private media jobs' },
      { name: 'Psychology (B.A / B.Sc)', desc: 'Counselling, HR, clinical psychology, academia. MSc/MA for specialisation' },
      { name: 'Social Work (BSW)', desc: 'NGOs, government welfare departments, hospitals' },
      { name: 'B.Ed (Teaching)', desc: 'Become a school teacher. After any graduation. Required for govt school teacher jobs (TET/DTET exams)' },
      { name: 'Fine Arts / Design (BFA / B.Des)', desc: 'Creative career in art, design, animation. Entrance: NID / NIFT' },
      { name: 'Hotel Management / Tourism', desc: 'Hospitality industry. Entrance: NCHMCT JEE' },
    ]
  },
  {
    id: 'vocational',
    label: 'Vocational / ITI / Polytechnic',
    icon: Briefcase,
    color: 'from-orange-600/20 to-amber-700/10 border-orange-500/30',
    headerColor: 'bg-orange-600',
    description: 'Best for students who want job-ready skills quickly or prefer hands-on training over theoretical studies.',
    subjects: { main: ['Trade-specific technical subjects', 'Engineering drawing', 'Workshop practice', 'Mathematics & Science'] },
    careers: [
      { name: 'ITI (Industrial Training Institute)', desc: 'After 10th — 1 to 2 year trade-based training. Trades: Electrician, Fitter, Plumber, Welder, Turner, Mechanic, COPA (Computer). Immediate employment possible.' },
      { name: 'Polytechnic Diploma', desc: 'After 10th — 3-year diploma in Engineering. Civil, Mechanical, EEE, ECE, CSE. Can join B.Tech 2nd year (lateral entry) later.' },
      { name: 'NIOS / Open Schooling', desc: 'Flexible secondary education. Continue studies at your own pace while working or training.' },
      { name: 'Para-Medical Courses', desc: 'Lab Technician, X-Ray Tech, Dental Tech, Physiotherapy Assistant — 1–2 year courses, good hospital jobs' },
      { name: 'Agriculture Certificate Courses', desc: 'AP Agri University offers short courses — very relevant in Krishna district farming communities' },
    ]
  }
];

const GOVT_EXAMS = [
  {
    category: 'Central Government (UPSC / SSC)',
    icon: Landmark,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    exams: [
      { name: 'UPSC Civil Services (IAS/IPS/IFS)', eligibility: 'Any Degree, Min 21 years', description: 'India\'s most prestigious exam. Selected candidates become IAS, IPS, IFS officers. 3 stages: Prelims → Mains → Personality Test. Preparation typically takes 2–3 years.' },
      { name: 'SSC CGL (Combined Graduate Level)', eligibility: 'Any Degree, 18–32 years', description: 'Recruitment to central government posts: Income Tax Inspector, CBI Inspector, Accountant. 4 tiers of exam.' },
      { name: 'SSC CHSL (10+2 Level)', eligibility: 'Class 12 Pass, 18–27 years', description: 'LDC, DEO, Postal Assistant posts. Can apply right after 12th. Good starting government job.' },
      { name: 'SSC MTS (Multi-Tasking Staff)', eligibility: 'Class 10 Pass, 18–25 years', description: 'Can apply straight after 10th! Central government peon/office support roles. Good entry-level government job.' },
      { name: 'Railway Recruitment Board (RRB)', eligibility: 'Class 10/12/Degree depending on post', description: 'NTPC, Group D, ALP, JE posts. Lakhs of vacancies. Good salary and job security.' },
      { name: 'NDA (National Defence Academy)', eligibility: 'Class 12 PCM, 16.5–19.5 years', description: 'Join Indian Army, Navy or Air Force as an officer. Written exam + SSB Interview. UPSC conducts this twice a year.' },
      { name: 'IBPS / SBI Bank PO & Clerk', eligibility: 'Any Degree, 20–28 years', description: 'Bank Probationary Officer (PO) and Clerk posts. Good salary, stable government job in banking sector.' },
    ]
  },
  {
    category: 'Andhra Pradesh State Government',
    icon: Building2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    exams: [
      { name: 'APPSC (AP Public Service Commission)', eligibility: 'Degree + AP domicile', description: 'Group 1 (DSP, RTO, ACTO), Group 2 (Sub-Registrar, Municipal Commissioner), Group 3 (Junior Assistant) posts. Highly competitive — needs 1–2 years dedicated preparation.' },
      { name: 'AP TET (Teacher Eligibility Test)', eligibility: 'B.Ed / D.Ed degree', description: 'Mandatory to teach in AP government schools. Paper 1 for Classes 1–5, Paper 2 for Classes 6–8.' },
      { name: 'AP DSC (District Selection Committee)', eligibility: 'B.Ed + TET pass', description: 'Actual teacher recruitment in AP government schools. Separate for SGT, SA, Language Pandit posts.' },
      { name: 'AP Police Constable / SI', eligibility: 'Class 10/12 + physical fitness', description: 'SI needs 12th pass. Constable needs 10th pass. Physical tests + written exam. Good career in AP Police.' },
      { name: 'AP Grama Sachivalayam', eligibility: 'Class 10/12/Degree depending on post', description: 'Village-level government jobs (Ward/Village Volunteer, Panchayat Secretary, Digital Assistant). Large-scale recruitments happen periodically.' },
      { name: 'AP EAMCET', eligibility: 'Class 12 PCM/PCB', description: 'Engineering and Medical admissions in AP colleges. Conducted by JNTUK. Gateway to B.Tech and B.Pharmacy in AP.' },
      { name: 'APSSB (AP Subordinate Service Board)', eligibility: 'Various — 10th to Degree', description: 'Lower division clerk, typist, lab attender, and other subordinate posts in AP government departments.' },
    ]
  }
];

const SCHOLARSHIPS = [
  { name: 'Pre-Matric & Post-Matric SC/ST/BC Scholarship', authority: 'AP Social Welfare Dept', eligibility: 'SC/ST/BC students studying in govt schools', amount: '₹3,500–₹7,000/year + maintenance', link: 'apepass.apcfss.in' },
  { name: 'National Means-cum-Merit Scholarship (NMMS)', authority: 'Ministry of Education (Central)', eligibility: 'Class 8 students, family income < ₹1.5 lakh/year', amount: '₹12,000/year (₹1,000/month) for Classes 9–12', link: 'scholarships.gov.in' },
  { name: 'National Talent Search (NTSE)', authority: 'NCERT (Central)', eligibility: 'Class 10 students — State + National level exam', amount: '₹1,250–₹2,000/month for entire study duration', link: 'ncert.nic.in' },
  { name: 'PM YASASVI Scholarship', authority: 'Ministry of Social Justice (Central)', eligibility: 'OBC/EBC/DNT students, Class 9 & 11, income < ₹2.5 lakh', amount: '₹75,000–₹1,25,000/year', link: 'yet.nta.ac.in' },
  { name: 'Jagananna Vidya Deevena', authority: 'AP Government', eligibility: 'AP students in govt colleges, family income < ₹2.5 lakh', amount: 'Full tuition fee reimbursement', link: 'jaganannavidyadeevena.ap.gov.in' },
  { name: 'Jagananna Vasathi Deevena', authority: 'AP Government', eligibility: 'Same as above', amount: '₹10,000–₹20,000/year for hostel & food expenses', link: 'jaganannavasathideevena.ap.gov.in' },
  { name: 'EBC / Kapu Welfare Scholarships', authority: 'AP EBC / Kapu Welfare Dept', eligibility: 'Kapu / EBC category students', amount: 'Varies by course', link: 'kapuwelfare.ap.gov.in' },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function StudentCareer() {
  const [activeSection, setActiveSection] = useState('streams');
  const [openStream,    setOpenStream]    = useState(null);
  const [openExam,      setOpenExam]      = useState(null);

  const SECTIONS = [
    { id: 'streams',      label: 'After 10th — Choose Stream', icon: BookOpen },
    { id: 'govt',         label: 'Govt Job Exams',             icon: Landmark },
    { id: 'scholarships', label: 'Scholarships',               icon: Award },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Compass size={24} className="text-indigo-400" /> Career Guidance
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Everything you need to know — streams after 10th, government job exams, and scholarships
        </p>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-pink-600/10 border border-indigo-500/30 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-lg">Your Future Starts Here</h2>
            <p className="text-slate-300 text-sm mt-1 leading-relaxed">
              After Class 10, you have many paths — Science, Commerce, Arts, or Vocational. Each leads to excellent government jobs and careers.
              This page gives you complete, honest information to make the right choice. You can also <span className="text-indigo-300 font-medium">ask the School Assistant chatbot</span> at the bottom-right for personalised guidance.
            </p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeSection === id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── STREAMS ─────────────────────────────────────────────────────────── */}
      {activeSection === 'streams' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-300">
            💡 <strong className="text-white">How to choose?</strong> Pick Science if you like Maths/Biology. Commerce if you like business/money. Arts if you like history/languages/writing. Vocational if you want a quick job-ready skill.
          </div>

          {STREAMS.map(stream => {
            const Icon = stream.icon;
            const isOpen = openStream === stream.id;
            return (
              <div key={stream.id} className={`bg-gradient-to-br border rounded-2xl overflow-hidden ${stream.color}`}>
                <button onClick={() => setOpenStream(isOpen ? null : stream.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${stream.headerColor} rounded-xl flex items-center justify-center`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{stream.label}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{stream.description}</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronDown size={18} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-5 border-t border-white/10">
                    <p className="text-sm text-slate-300 mt-4 leading-relaxed">{stream.description}</p>

                    {/* Subjects */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📚 Subjects You Study</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(stream.subjects).map(([key, subjectList]) => (
                          <div key={key} className="bg-black/20 rounded-xl p-3">
                            {Object.keys(stream.subjects).length > 1 && (
                              <p className="text-xs font-semibold text-slate-300 mb-2 uppercase">{key.toUpperCase()} Group</p>
                            )}
                            <ul className="space-y-1">
                              {subjectList.map((s, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" /> {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Careers */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🎯 Career Options</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stream.careers.map((career, i) => (
                          <div key={i} className="bg-black/20 rounded-xl p-4">
                            <div className="flex items-start gap-2">
                              <ArrowRight size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-white">{career.name}</p>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{career.desc}</p>
                                {career.type && career.type !== 'both' && (
                                  <span className="mt-1.5 inline-block text-xs px-2 py-0.5 bg-indigo-600/30 text-indigo-300 rounded-lg">
                                    {career.type.toUpperCase()} group
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── GOVT EXAMS ──────────────────────────────────────────────────────── */}
      {activeSection === 'govt' && (
        <div className="space-y-5">
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-300">
            💡 <strong className="text-white">Government jobs offer</strong> job security, pension, health benefits, and social respect. Plan early — most exams need 1–3 years of dedicated preparation after completing your degree.
          </div>

          {GOVT_EXAMS.map(section => {
            const Icon = section.icon;
            return (
              <div key={section.category} className="space-y-3">
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${section.bgColor}`}>
                  <Icon size={20} className={section.color} />
                  <h3 className={`font-display font-bold text-lg ${section.color}`}>{section.category}</h3>
                </div>

                <div className="space-y-2">
                  {section.exams.map((exam, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden">
                      <button onClick={() => setOpenExam(openExam === `${section.category}-${i}` ? null : `${section.category}-${i}`)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition-colors text-left">
                        <div>
                          <p className="font-semibold text-white text-sm">{exam.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Eligibility: {exam.eligibility}</p>
                        </div>
                        {openExam === `${section.category}-${i}`
                          ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                          : <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />}
                      </button>
                      {openExam === `${section.category}-${i}` && (
                        <div className="px-5 pb-4 border-t border-slate-700/50">
                          <p className="text-sm text-slate-300 mt-3 leading-relaxed">{exam.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SCHOLARSHIPS ────────────────────────────────────────────────────── */}
      {activeSection === 'scholarships' && (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-300">
            💰 <strong>Important:</strong> Apply for every scholarship you are eligible for — they are free money for your education! Check the official websites and apply before deadlines.
          </div>

          <div className="grid grid-cols-1 gap-4">
            {SCHOLARSHIPS.map((s, i) => (
              <div key={i} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{s.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-indigo-600/20 text-indigo-300 rounded-lg border border-indigo-500/20">
                        {s.authority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2"><span className="text-slate-300 font-medium">Who can apply:</span> {s.eligibility}</p>
                    <p className="text-xs text-green-400 mt-1 font-medium">Amount: {s.amount}</p>
                  </div>
                  <a href={`https://${s.link}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                    Apply <Globe size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <h3 className="font-semibold text-amber-400 mb-2 flex items-center gap-2"><Star size={16} /> Tips for Scholarship Applications</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              {[
                'Keep all certificates ready: caste certificate, income certificate, Aadhaar, bank passbook copy, school bonafide',
                'Apply on the National Scholarship Portal (scholarships.gov.in) for central government scholarships',
                'AP state scholarships are on apepass.apcfss.in — register early, apply before deadline',
                'Ask your class teacher or school office for help if you have trouble with the online application',
                'Never pay anyone to apply for a scholarship — all government scholarships are completely free to apply',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 flex-shrink-0 mt-0.5">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
