"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileCheck2,
  Home as HomeIcon,
  MapPin,
  Menu,
  Search,
  Navigation,
  LayoutDashboard,
  Settings,
  HelpCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Scan,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Clock3,
  Users,
  LocateFixed,
  Shield,
  Upload,
  UserRound,
  LogOut,
  Send,
  XCircle,
  Images,
  Star,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyzeCivicImage } from "@/lib/local-civic-ai";

type Props = { screen: string };
type Category =
  | "Pothole"
  | "Road Damage"
  | "Open Manhole"
  | "Garbage Dump"
  | "Waterlogging"
  | "Broken Streetlight"
  | "Illegal Dumping"
  | "Road Crack"
  | "Blocked Drain"
  | "Fallen Tree / Obstruction"
  | "Other Civic Issue"
  | "Normal / No Issue";

type Case = {
  id: string;
  category: Category;
  title: string;
  status: string;
  date: string;
  color: string;
  location: string;
  confidence: string;
  severity: string;
  risk: string;
  size: string;
  department: string;
  photo: boolean;
  ssimScore?: string;
  siftLandmarks?: number;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  community_support?: number;
  duplicate_of?: string;
  sla_hours?: number;
  submitted_at?: string;
  analysis?: AnalysisResult;
};

const KEY = "civicproof-created-case";
const CASES_KEY = "civicproof-local-complaints";
const AUTH_KEY = "civicproof-citizen";
const AUTH_VERSION_KEY = "civicproof-auth-version";
const AUTH_VERSION = "3";
const DRAFT = "civicproof-report-draft";

type AnalysisResult = {
  issue_type: string;
  confidence: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  evidence: string[];
  description: string;
  estimated_size: string;
  hazard: string;
  recommended_action: string;
  department: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  visible_text: string[];
};

const cats: Category[] = [
  "Pothole", "Garbage Dump", "Waterlogging", "Broken Streetlight",
  "Road Damage", "Open Manhole", "Illegal Dumping", "Road Crack",
  "Blocked Drain", "Fallen Tree / Obstruction", "Other Civic Issue", "Normal / No Issue",
] as Category[];

const baseCases: Case[] = [];

const colors: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

const initialDraft = {
  category: "Pothole" as Category,
  otherDescription: "",
  photo: false,
  location: "",
  hasExif: false,
  lat: "",
  lng: "",
  imageUrl: "",
  latitude: null as number | null,
  longitude: null as number | null,
  address: "",
  analysis: null as AnalysisResult | null,
};

const getDraft = () => {
  try {
    return { ...initialDraft, ...JSON.parse(localStorage.getItem(DRAFT) || "{}") };
  } catch {
    return initialDraft;
  }
};

const saveDraft = (d: typeof initialDraft) =>
  localStorage.setItem(DRAFT, JSON.stringify(d));

const getSavedCases = (): Case[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(CASES_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const getSavedCase = () => {
  const cases = getSavedCases();
  return cases[0] || null;
};

const getLocalCitizen = (): AuthUser | null => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null") as AuthUser | null;
  } catch {
    return null;
  }
};


/* --- AUTH + CITIZEN ASSISTANT --- */
type AuthUser = { id: string; email: string; name?: string };

function LoginScreen() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      if (!cleanName) throw new Error("Please enter your full name.");
      if (!cleanEmail || !cleanEmail.includes("@")) throw new Error("Please enter a valid email address.");
      if (password.length < 8) throw new Error("Your password must have at least 8 characters.");
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new Error("Use at least one letter and one number in your password.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      const existing = getLocalCitizen();
      const user: AuthUser = {
        id: existing?.id || `citizen-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`,
        email: cleanEmail,
        name: cleanName,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_VERSION_KEY, AUTH_VERSION);
      window.location.href = "/";
    } catch (e) { setError(e instanceof Error ? e.message : "Could not continue."); }
    finally { setBusy(false); }
  };

  return <Shell nav={false} className="bg-gradient-to-b from-[#e9f7ff] to-white">
    <section className="flex min-h-full flex-col px-6 pt-14 pb-8">
      <div className="mx-auto grid h-[82px] w-[82px] place-items-center overflow-hidden rounded-[24px] bg-white p-1 shadow-xl ring-1 ring-slate-200/70"><Image src="/civicproof-logo.jpeg" alt="CivicProofAI logo" width={82} height={82} className="h-full w-full object-cover object-top" priority /></div>
      <p className="mt-5 text-center text-[10px] font-black uppercase tracking-[0.22em] text-[#0ea5e9]">Citizen accountability platform</p>
      <h1 className="mt-2 text-center text-3xl font-black tracking-tight text-[#112340]">CivicProof<span className="text-[#0ea5e9]">AI</span></h1>
      <p className="mx-auto mt-2 max-w-[300px] text-center text-xs leading-relaxed text-slate-500">Report real civic problems, see them on the public map, and track every update from one account.</p>
      <form onSubmit={submit} className="mt-7 rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/70 border border-slate-100">
        <div className="mb-4 rounded-2xl bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-800"><b>Citizen access</b><br/>Enter your details and choose a password to continue.</div>
        <label className="block text-xs font-bold text-slate-700">Full name<input value={name} onChange={e=>setName(e.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500" placeholder="Your name"/></label>
        <label className="mt-3 block text-xs font-bold text-slate-700">Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500" placeholder="you@example.com"/></label>
        <label className="mt-3 block text-xs font-bold text-slate-700">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500" placeholder="At least 8 characters"/></label>
        <label className="mt-3 block text-xs font-bold text-slate-700">Confirm password<input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500" placeholder="Re-enter your password"/></label>
        <p className="mt-2 text-[9px] text-slate-400">Use 8+ characters with at least one letter and one number.</p>
        {error && <div className="mt-3 rounded-xl bg-red-50 p-3 text-[11px] font-semibold text-red-700">{error}</div>}
        <button disabled={busy} className="mt-5 w-full rounded-xl bg-[#005a7a] py-3.5 text-sm font-black text-white shadow-md disabled:opacity-60">{busy ? "Signing you in…" : "Continue as Citizen"}</button>
      </form>
      <p className="mt-auto pt-5 text-center text-[9px] text-slate-400">Your profile and complaint history are linked to this email on this CivicProof installation. Public map markers show issue evidence and status, not private account details.</p>
    </section>
  </Shell>;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const r = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    // Clear stale authentication from older CivicProof builds once.
    // This guarantees a fresh installation shows the Citizen Login page.
    const version = localStorage.getItem(AUTH_VERSION_KEY);
    if (version !== AUTH_VERSION) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.setItem(AUTH_VERSION_KEY, AUTH_VERSION);
    }
    setUser(getLocalCitizen());
    setLoading(false);
  }, []);
  if (loading) return <Shell nav={false}><div className="grid h-full place-items-center text-xs font-bold text-slate-500">Checking secure session…</div></Shell>;
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}

function CitizenChatbot({ compactOnly = false }: { compactOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{from:"bot"|"user"; text:string}[]>([
    {from:"bot",text:"Hi! I can help you report, track and understand civic issues."}
  ]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const [pendingQuestion, setPendingQuestion] = useState("");
  useEffect(()=>{
    const openAssistant=()=>setOpen(true);
    const openQuestion=(event: Event)=>{
      const question=(event as CustomEvent<string>).detail || "";
      setPendingQuestion(question);
      setOpen(true);
    };
    window.addEventListener("civicproof:assistant",openAssistant);
    window.addEventListener("civicproof:assistant-question",openQuestion);
    return ()=>{
      window.removeEventListener("civicproof:assistant",openAssistant);
      window.removeEventListener("civicproof:assistant-question",openQuestion);
    };
  },[]);

  const send = async (text=q) => {
    const clean=text.trim();
    if (!clean || busy) return;
    setQ("");
    setMessages(m=>[...m,{from:"user",text:clean}]);
    setBusy(true);
    try {
      const citizen = getLocalCitizen();
      const cases = getSavedCases().filter((x:any)=>!citizen || !x.user_id || x.user_id===citizen.id);
      const t=clean.toLowerCase();
      let answer="Try one of the quick questions below, or ask me about reporting, complaint status, location, or proof verification.";
      if(/report|pothole|garbage|streetlight|drain|water|issue|complaint/.test(t)) {
        answer="To report an issue: open Report Issue, capture a clear photo, let the local AI check it, confirm your location, and submit the case.";
      } else if(/status|pending|resolved|case|track/.test(t)) {
        answer=cases.length ? `You have ${cases.length} complaint${cases.length===1?"":"s"}. Open My Complaints to see the latest status and evidence.` : "You have no complaints saved on this device yet.";
      } else if(/map|route|safe|safer|location|nearby/.test(t)) {
        answer="City Map shows reported civic risks. Safer Path uses nearby reported risks as guidance; it is not a guarantee of road safety.";
      } else if(/verify|proof|repair|after/.test(t)) {
        answer="Proof compares before-and-after evidence locally to support a repair audit. It is an AI-assisted evidence check, not legal certification.";
      }
      setMessages(m=>[...m,{from:"bot",text:answer}]);
    } finally { setBusy(false); }
  };

  useEffect(()=>{
    if (!pendingQuestion) return;
    const question=pendingQuestion;
    setPendingQuestion("");
    send(question);
  },[pendingQuestion]);

  if (!open) return compactOnly ? null : null;

  return <div className="absolute bottom-[82px] left-3 right-3 z-50 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
    <div className="flex items-center justify-between bg-[#005a7a] px-4 py-3 text-white">
      <div><p className="text-xs font-black">CivicProof AI Assistant</p><p className="text-[9px] text-white/75">Quick civic help</p></div>
      <button onClick={()=>setOpen(false)} aria-label="Close assistant"><XCircle size={18}/></button>
    </div>
    <div className="max-h-60 space-y-2 overflow-y-auto p-3">
      {messages.map((m,i)=><div key={i} className={cn("max-w-[90%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed",m.from==="user"?"ml-auto bg-blue-600 text-white":"bg-slate-100 text-slate-700")}>{m.text}</div>)}
      {busy && <div className="w-fit rounded-2xl bg-slate-100 px-3 py-2 text-[11px] text-slate-500">Thinking…</div>}
    </div>
    <div className="border-t p-2">
      <p className="px-1 pb-1 text-[9px] font-black uppercase tracking-wide text-slate-400">Quick questions</p>
      <div className="grid grid-cols-2 gap-1.5">
        {["How do I report a pothole?","What does my status mean?","How do I use Safer Path?","How is repair proof checked?"] .map(x=><button key={x} onClick={()=>send(x)} className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-left text-[9px] font-bold text-slate-700 hover:bg-blue-50">{x}</button>)}
      </div>
      <div className="mt-2 flex gap-1.5"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs outline-none" placeholder="Ask about CivicProof…"/><button disabled={busy} onClick={()=>send()} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#005a7a] text-white disabled:opacity-50"><Send size={15}/></button></div>
    </div>
  </div>;
}

/* --- SHARED COMPONENTS --- */

function Header({
  title,
  back = false,
  isHome = false,
}: {
  title?: string;
  back?: boolean;
  isHome?: boolean;
}) {
  const r = useRouter();

  if (isHome) {
    return (
      <header className="relative z-30 flex h-14 items-center justify-between px-5 pt-3">
        <button
          aria-label="Menu"
          onClick={() => window.dispatchEvent(new Event("civicproof:menu"))}
          className="p-1 text-[#112340] transition active:scale-90"
        >
          <Menu size={26} strokeWidth={2.4} />
        </button>
        <div aria-hidden="true" />
        <button aria-label="Notifications" onClick={() => r.push("/complaints")} className="relative grid h-9 w-9 place-items-center rounded-full bg-white text-[#112340] shadow-sm transition active:scale-90"><Bell size={19} strokeWidth={2.2}/><span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white">!</span></button>
      </header>
    );
  }

  return (
    <header className="relative z-30 flex h-14 items-center justify-between px-5">
      {back ? (
        <button onClick={() => r.back()} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm transition hover:bg-slate-50 active:scale-95">
          <ArrowLeft size={19} className="text-slate-800" />
        </button>
      ) : (
        <div className="flex items-center gap-2.5">
          {title && <><div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"><Image src="/civicproof-logo.jpeg" alt="CivicProofAI" width={36} height={36} className="h-full w-full object-cover object-top" /></div><b className="text-slate-900 text-sm">{title}</b></>}
        </div>
      )}
      <button aria-label="Open complaints" onClick={() => r.push("/complaints")} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm text-slate-800">
        <Bell size={18} />
      </button>
    </header>
  );
}

function Nav() {
  const p = usePathname();
  const a = [
    ["/", HomeIcon, "Home"],
    ["/map", MapPin, "Map"],
    ["/report", Plus, "Report"],
    ["/complaints", FileCheck2, "Cases"],
    ["/profile", UserRound, "Me"],
  ] as const;

  return (
    <nav className="absolute bottom-0 z-40 flex h-[86px] w-full items-end justify-around border-t border-slate-200/80 bg-white/95 px-2 pb-2 backdrop-blur-md shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
      {a.map(([h, I, t]) => {
        const isActive = p === h || (t === "Home" && p === "/");
        if (t === "Report") {
          return (
            <Link
              key={t}
              href={h}
              aria-label="Report an issue"
              className="-mt-8 flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#005a7a] p-2 text-white shadow-[0_8px_22px_rgba(0,90,122,0.35)] transition hover:bg-[#004a66] active:scale-90"
            >
              <I size={30} strokeWidth={2.8} />
            </Link>
          );
        }
        return (
          <Link
            key={t}
            href={h}
            className={cn(
              "flex min-w-[54px] shrink-0 flex-col items-center justify-end gap-1 text-[10px] font-bold transition active:scale-95",
              isActive ? "text-[#006b8f]" : "text-[#93a6bf] hover:text-slate-600"
            )}
          >
            <span className={cn("grid h-8 w-9 place-items-center rounded-xl transition", isActive ? "bg-[#e7f7fb]" : "bg-transparent")}>
              <I size={21} strokeWidth={isActive ? 2.7 : 2.1} />
            </span>
            <span>{t}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SideMenu({open,onClose}:{open:boolean;onClose:()=>void}) {
  const r=useRouter();
  const citizen=getLocalCitizen();
  const cases=getSavedCases().filter((x:any)=>!citizen || !x.user_id || x.user_id===citizen.id);
  const go=(path:string)=>{onClose();r.push(path);};
  if(!open) return null;
  return <div className="absolute inset-0 z-[90]">
    <button aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-slate-900/35" />
    <aside className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[315px] bg-white shadow-2xl">
      <div className="bg-[#005a7a] px-5 pb-5 pt-8 text-white">
        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-md"><Image src="/civicproof-logo.jpeg" alt="CivicProofAI logo" width={48} height={48} className="h-full w-full object-cover object-top" /></div><div><p className="text-lg font-black">CivicProof<span className="text-cyan-300">AI</span></p><p className="text-[10px] text-white/70">Citizen accountability</p></div></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><XCircle size={19}/></button></div>
        <div className="mt-5 rounded-2xl bg-white/10 p-3"><p className="text-xs font-black">{citizen?.name || "Citizen"}</p><p className="mt-0.5 truncate text-[10px] text-white/70">{citizen?.email || "Local citizen account"}</p></div>
      </div>
      <div className="p-3">
        <p className="px-3 pb-2 pt-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Workspace</p>
        {[['/','Dashboard',LayoutDashboard],['/profile','Profile',UserRound],['/complaints',`My Complaints (${cases.length})`,FileCheck2],['/proof','Repair Proof',Images],['/map','City Map',MapPin],['/report','Report an Issue',Camera]].map(([path,label,I]:any)=><button key={path} onClick={()=>go(path)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-100"><I size={18} className="text-[#005a7a]"/><span>{label}</span><ChevronRight size={15} className="ml-auto text-slate-300"/></button>)}
        <div className="my-2 border-t border-slate-100"/>
        <p className="px-3 pb-2 pt-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Support</p>
        <button onClick={()=>{onClose();window.dispatchEvent(new Event("civicproof:assistant"));}} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-100"><Bot size={18} className="text-[#005a7a]"/>AI Assistant</button>
        <button onClick={()=>go('/admin')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-100"><Settings size={18} className="text-[#005a7a]"/>Operations & Admin</button>
        <div className="mt-4 rounded-2xl bg-blue-50 p-3 text-[10px] leading-relaxed text-blue-800"><b>{cases.length} complaint{cases.length===1?'':'s'}</b> linked to this device account. GPS-tagged complaints can appear on the city map.</div>
      </div>
    </aside>
  </div>;
}

function Shell({
  children,
  nav = true,
  className,
}: {
  children: React.ReactNode;
  nav?: boolean;
  className?: string;
}) {
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>{const a=()=>setMenuOpen(true); const b=()=>{}; window.addEventListener("civicproof:menu",a); window.addEventListener("civicproof:assistant",b); return()=>{window.removeEventListener("civicproof:menu",a);window.removeEventListener("civicproof:assistant",b)}},[]);
  return (
    <div className="flex min-h-[100dvh] w-full items-stretch justify-center bg-slate-900 font-sans select-none sm:min-h-screen sm:items-center sm:py-6">
      <main className={cn("relative flex h-[100dvh] w-full max-w-none flex-col overflow-hidden border-0 bg-gradient-to-b from-[#d3ebf9] via-[#e4f3fc] to-[#edf7fd] shadow-none sm:h-[795px] sm:max-w-[385px] sm:rounded-[40px] sm:border-[6px] sm:border-slate-800 sm:shadow-2xl",className)}>
        <div className="h-full overflow-y-auto pb-24 scrollbar-none">{children}</div>
        {nav && <Nav />}
        {nav && <CitizenChatbot compactOnly />}
        {nav && <SideMenu open={menuOpen} onClose={()=>setMenuOpen(false)} />}
      </main>
    </div>
  );
}
function Badge({ c, children }: { c: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border",
        colors[c] || "bg-slate-100 text-slate-700"
      )}
    >
      {children}
    </span>
  );
}

function Metric({
  v,
  l,
  red = false,
}: {
  v: string;
  l: string;
  red?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100">
      <b className={cn("text-sm", red ? "text-red-600" : "text-slate-800")}>{v}</b>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{l}</p>
    </div>
  );
}

/* --- SCREEN 1: HOME --- */

function Home() {
  const [cases,setCases]=useState<Case[]>([]);
  useEffect(()=>{const load=()=>setCases(getSavedCases());load();window.addEventListener("civicproof:cases-updated",load);return()=>window.removeEventListener("civicproof:cases-updated",load)},[]);
  const resolved=cases.filter(c=>String(c.status).toLowerCase()==="resolved").length;
  const active=cases.length-resolved;
  return (
    <Shell nav={true}>
      <div className="relative w-full overflow-hidden">
        <Header isHome />
        <div className="relative -mt-12 w-full">
          <img src="/city-banner.jpeg" alt="CivicProof city" className="w-full h-[232px] object-cover object-top block" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#e4f3fc] to-transparent" />
        </div>
      </div>
      <section className="relative z-10 px-5 pt-0 text-center">
        <div className="mx-auto -mt-1 max-w-[320px]">
          <h1 className="text-[25px] leading-[1.08] font-black tracking-[-0.6px] text-[#112340]">Let's make our city<br/>better together!</h1>
          <p className="mt-2 text-[10px] font-semibold text-slate-500">Spot it · Prove it · Track it · Fix it</p>
        </div>
        <Link href="/report" className="group mt-4 flex h-[78px] w-full items-center justify-center gap-3 rounded-[27px] bg-gradient-to-br from-[#ffd21a] to-[#ffbd00] font-black text-[#112340] shadow-[0_10px_24px_rgba(245,175,0,0.28)] ring-1 ring-[#f7b900]/40 transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/35 shadow-inner"><Camera size={28} strokeWidth={2.7}/></span>
          <span className="text-[19px]">Report Issue</span>
          <ChevronRight size={19} className="-ml-1 opacity-60 transition group-hover:translate-x-1" />
        </Link>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link href="/complaints" className="group flex h-[112px] flex-col items-center justify-center rounded-[23px] bg-white px-3 shadow-[0_5px_18px_rgba(25,60,90,0.07)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 active:scale-95">
            <div className="mb-1.5 flex h-11 w-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-red-50 to-rose-100 text-red-500 ring-1 ring-red-100"><ShieldCheck size={24} /></div>
            <span className="text-[12px] font-extrabold text-[#1c2e4a]">My Complaints</span>
            <span className="mt-0.5 text-[9px] font-bold text-slate-400">{active} active</span>
          </Link>
          <Link href="/map" className="group flex h-[112px] flex-col items-center justify-center rounded-[23px] bg-white px-3 shadow-[0_5px_18px_rgba(25,60,90,0.07)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 active:scale-95">
            <div className="mb-1.5 flex h-11 w-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-50 to-teal-100 text-[#0f9260] ring-1 ring-emerald-100"><MapPin size={23} /></div>
            <span className="text-[12px] font-extrabold text-[#1c2e4a]">City Map</span>
            <span className="mt-0.5 text-[9px] font-bold text-slate-400">{cases.length} reports nearby</span>
          </Link>
        </div>
        <div className="mt-3 overflow-hidden rounded-[23px] bg-white px-4 py-4 text-left shadow-[0_5px_18px_rgba(25,60,90,0.07)] ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div><p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Your civic impact</p><p className="mt-1 text-[16px] font-black text-[#1c2e4a]">You reported <span className="text-red-500">{cases.length}</span> {cases.length===1?'issue':'issues'} till now!</p><p className="mt-1 text-[9px] font-semibold text-slate-400">{resolved} resolved · {active} in progress</p></div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-500 text-[26px] shadow-inner">🏆</div>
          </div>
        </div>
        <div className="mt-3 mb-2 flex items-center justify-center gap-2 text-[9px] font-bold text-slate-400"><ShieldCheck size={13} className="text-emerald-500"/> Evidence-first civic reporting</div>
      </section>
    </Shell>
  );
}

/* --- SCREEN 2: REPORT & CAPTURE --- */

function Report() {
  const r = useRouter();
  const [d, set] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  useEffect(() => set(getDraft()), []);

  const up = (v: Partial<typeof d>) => {
    const n = { ...d, ...v };
    set(n);
    saveDraft(n);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Live camera is not supported in this browser. Please use Chrome/Edge on HTTPS.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : "Camera permission was denied.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const max = 1600;
    const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    up({ photo: true, imageUrl: canvas.toDataURL("image/jpeg", 0.86) });
    stopCamera();
  };

  useEffect(() => () => stopCamera(), []);

  const runAnalysis = async () => {
    if (!d.imageUrl) return;
    setBusy(true);
    setAnalysisError("");
    try {
      const analysis = await analyzeCivicImage(d.imageUrl);
      if (d.category === "Other Civic Issue" && d.otherDescription.trim()) {
        analysis.issue_type = "Other Civic Issue";
        analysis.description = `Citizen reported: ${d.otherDescription.trim()}`;
        analysis.department = "Municipal Inspection";
        analysis.recommended_action = "Review the submitted evidence and route it to the appropriate department.";
      }
      up({ analysis });
      r.push("/analysis");
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : "Local AI analysis failed. Check your internet connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell nav={false} className="bg-slate-50">
      <Header title="Report Issue" back />
      <section className="px-5 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">STEP 1 · CAPTURE EVIDENCE</p>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">REAL PHOTO</span>
        </div>

        <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {d.imageUrl ? (
            <div className="relative p-2">
              <img src={d.imageUrl} alt="Captured civic evidence" className="h-60 w-full rounded-2xl object-cover" />
              <div className="absolute left-4 top-4 rounded-full bg-emerald-600 px-2.5 py-1 text-[9px] font-black text-white">LIVE CAMERA PHOTO</div>
              <button onClick={startCamera} className="absolute right-4 bottom-4 rounded-xl bg-white/95 px-3 py-2 text-[10px] font-black text-slate-800 shadow">Retake</button>
            </div>
          ) : (
            <button onClick={startCamera} className="flex w-full flex-col items-center justify-center p-7 text-center active:bg-slate-50">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-blue-600 text-white shadow-lg"><Camera size={30} /></span>
              <h2 className="mt-4 text-base font-black text-slate-900">Open Live Camera</h2>
              <p className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-slate-500">Take a fresh photo of the civic problem. CivicProof AI will analyze the actual image.</p>
            </button>
          )}
        </div>

        {cameraError && <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold text-red-700">{cameraError}</div>}

        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[11px] text-blue-800">
          <b>AI scans 12 civic observations.</b> It checks potholes, garbage, waterlogging, streetlights, road damage, open manholes, illegal dumping, drains, fallen obstructions, other civic issues and normal/no-issue photos.
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-black text-slate-900">Other issue</p><p className="mt-0.5 text-[10px] text-slate-500">Can't find your problem? Add it manually.</p></div>
            <button onClick={()=>{setOtherOpen(!otherOpen); up({category:"Other Civic Issue" as Category});}} className={cn("rounded-xl px-3 py-2 text-[10px] font-black", otherOpen ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700")}>{otherOpen ? "Selected" : "Report Other"}</button>
          </div>
          {otherOpen && <textarea value={d.otherDescription} onChange={e=>up({otherDescription:e.target.value})} placeholder="Describe the civic problem briefly…" className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-400" />}
        </div>

        {analysisError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-left text-[11px] font-semibold leading-relaxed text-red-700">
            <p className="font-black">AI analysis could not start</p>
            <p className="mt-1">{analysisError}</p>
            <p className="mt-2 text-[10px] font-medium text-red-600">The report analysis runs locally in your browser. The first analysis downloads the public vision model; no OpenAI API key is required.</p>
          </div>
        )}

        <Button disabled={!d.imageUrl || busy} onClick={runAnalysis}
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md">
          {busy ? <><RefreshCw className="mr-2 animate-spin" size={16} />Analyzing Photo...</> : <>Analyze locally with CivicProof AI <Sparkles className="ml-2" size={16} /></>}
        </Button>
      </section>

      {cameraOpen && (
        <div className="absolute inset-0 z-[100] flex flex-col bg-black">
          <div className="flex items-center justify-between px-5 py-4 text-white">
            <span className="text-xs font-black">LIVE CAMERA</span>
            <button onClick={stopCamera} className="grid h-9 w-9 place-items-center rounded-full bg-white/15"><XCircle size={22} /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
            <video ref={videoRef} muted playsInline autoPlay className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-7 rounded-3xl border-2 border-white/70" />
          </div>
          <div className="flex items-center justify-center gap-5 px-5 py-6 pb-8">
            <button onClick={stopCamera} className="rounded-xl px-4 py-3 text-xs font-bold text-white">Cancel</button>
            <button onClick={capturePhoto} aria-label="Capture photo" className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-white/20 shadow-xl">
              <span className="h-14 w-14 rounded-full bg-white" />
            </button>
            <span className="w-16" />
          </div>
        </div>
      )}
    </Shell>
  );
}

/* --- SCREEN 3: YOLOv8 AI TRIAGE --- */

function Analysis() {
  const r = useRouter();
  const [d, set] = useState(initialDraft);

  useEffect(() => set(getDraft()), []);

  const a = d.analysis;
  if (!a) {
    return <Shell nav={false}><Header title="AI Analysis" back /><section className="p-5 text-center"><p className="text-sm text-slate-500">No analysis found. Please capture a photo first.</p><Button onClick={() => r.push("/report")} className="mt-4">Capture Photo</Button></section></Shell>;
  }

  return (
    <Shell nav={false} className="bg-slate-50">
      <Header title="AI Vision Analysis" back />
      <section className="px-5 pt-3">
        {d.imageUrl && <img src={d.imageUrl} alt="Analyzed civic evidence" className="w-full h-40 object-cover rounded-2xl shadow-sm" />}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-blue-600">REAL IMAGE ANALYSIS</p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">{a.issue_type}</h1>
          </div>
          <Badge c={a.severity === "CRITICAL" || a.severity === "HIGH" ? "red" : "orange"}>{a.severity}</Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-left">
          <Metric v={`${a.confidence.toFixed(1)}%`} l="AI Confidence" />
          <Metric v={`${a.risk_score}/100`} l="Risk Score" red={a.risk_score >= 60} />
        </div>

        <div className="mt-3 rounded-2xl bg-white p-4 text-left shadow-sm border border-slate-100 text-xs">
          <p className="font-black text-slate-700">What AI found</p>
          <p className="mt-1 text-slate-600">{a.description}</p>
          <div className="mt-3 space-y-1.5">
            {a.evidence.map((x, i) => <p key={i} className="flex gap-2 text-slate-600"><CheckCircle2 size={14} className="text-emerald-600 shrink-0" />{x}</p>)}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric v={a.priority} l="Priority" red={a.priority === "URGENT" || a.priority === "HIGH"} />
          <Metric v={a.department} l="Likely Department" />
        </div>

        <div className="mt-3 rounded-2xl bg-blue-50 border border-blue-100 p-3 text-[11px] text-blue-900">
          <b>Recommended action:</b> {a.recommended_action}
          <br /><b>Hazard:</b> {a.hazard}
          <br /><b>Estimated size:</b> {a.estimated_size}
        </div>

        {a.visible_text.length > 0 && (
          <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm border text-xs">
            <b className="text-slate-700">Readable text in image</b>
            <p className="mt-1 text-slate-500">{a.visible_text.join(" · ")}</p>
          </div>
        )}

        <p className="mt-3 text-[9px] leading-tight text-slate-400">
          AI assessment is based on visible evidence and is not a certified engineering inspection. Location is obtained separately from device GPS.
        </p>

        <Button onClick={() => r.push("/location")} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md">
          Capture Live GPS & Continue <ChevronRight className="ml-1" size={16} />
        </Button>
      </section>
    </Shell>
  );
}

/* --- SCREEN 4: LOCATION CONFIRMATION --- */

function Location() {
  const r = useRouter();
  const [d, set] = useState(initialDraft);
  const [status, setStatus] = useState("Requesting device location…");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const draft = getDraft();
    set(draft);
    if (draft.latitude && draft.longitude) {
      setStatus("GPS location already captured.");
      setAddress(draft.address || "");
      return;
    }
    if (!navigator.geolocation) {
      setStatus("GPS is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      setStatus("GPS captured from this device.");
      const next = { ...draft, latitude, longitude, lat: `${latitude.toFixed(6)}°`, lng: `${longitude.toFixed(6)}°` };
      set(next); saveDraft(next);
      const a = `GPS ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setAddress(a);
      saveDraft({ ...next, address: a, location: a });
    }, (err) => {
      setStatus(`Location permission required (${err.message}).`);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }, []);

  const handleFinish = async () => {
    const draft = getDraft();
    if (!draft.latitude || !draft.longitude) {
      alert("Please allow GPS location before submitting.");
      return;
    }
    setBusy(true);
    try {
      const a = draft.analysis;
      const newCase: Case = {
        id: `CP-${Date.now().toString().slice(-8)}`,
        category: (a?.issue_type || draft.category) as Category,
        title: `${a?.issue_type || draft.category} near ${(draft.address || draft.location).split(",")[0]}`,
        status: "Submitted",
        date: "Just now",
        color: "blue",
        location: draft.address || draft.location,
        confidence: `${a?.confidence?.toFixed(1) || "0"}%`,
        severity: a?.severity || "MEDIUM",
        risk: `${a?.risk_score || 0}/100`,
        size: a?.estimated_size || "Not measured",
        department: a?.department || "Municipal Operations",
        photo: Boolean(draft.imageUrl),
        imageUrl: draft.imageUrl,
        latitude: draft.latitude,
        longitude: draft.longitude,
      };
      const citizen = getLocalCitizen();
      if (!citizen) throw new Error("Please continue as a citizen before reporting an issue.");
      const storedCase = { ...newCase, user_id: citizen.id, email: citizen.email, analysis: a };
      const existingCases = getSavedCases();
      const duplicate = existingCases.find((x:any)=>x.latitude!=null&&x.longitude!=null&&String(x.category).toLowerCase()===String(storedCase.category).toLowerCase()&&haversine(Number(x.latitude),Number(x.longitude),Number(storedCase.latitude),Number(storedCase.longitude))<0.1&&String(x.status).toLowerCase()!=="resolved");
      const finalCase:any = duplicate ? {...storedCase, duplicate_of:duplicate.id, status:"Submitted · Similar case found", community_support:duplicate.community_support||1} : {...storedCase, community_support:1, sla_hours: storedCase.severity==="CRITICAL"?4:storedCase.severity==="HIGH"?24:72, submitted_at:new Date().toISOString()};
      localStorage.setItem(CASES_KEY, JSON.stringify([finalCase, ...existingCases]));
      localStorage.setItem(KEY, JSON.stringify(finalCase));
      window.dispatchEvent(new Event("civicproof:cases-updated"));
      r.push("/created");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell nav={false} className="bg-slate-50">
      <Header title="Live GPS Location" back />
      <section className="px-5 pt-3">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">STEP 3 OF 4 · REAL GEO-TAGGING</p>
        <div className="mt-3 rounded-3xl bg-white p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-blue-700"><MapPin size={22}/></span>
            <div><p className="text-xs font-black text-slate-900">{status}</p><p className="text-[10px] text-slate-500">High-accuracy browser GPS is used when available.</p></div>
          </div>
          <div className="mt-3 rounded-xl bg-slate-900 p-3 font-mono text-[10px] text-emerald-300">
            LAT: {d.latitude?.toFixed(6) || "—"}<br />LNG: {d.longitude?.toFixed(6) || "—"}
          </div>
        </div>
        <label className="mt-4 block text-xs font-bold text-slate-700">RESOLVED ADDRESS</label>
        <div className="mt-1.5 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs font-medium text-slate-700 min-h-12">{address || d.address || "Resolving address…"}</div>

        <Button disabled={busy || !d.latitude} onClick={handleFinish} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md">
          {busy ? <><RefreshCw className="mr-2 animate-spin" size={16}/>Submitting…</> : <>Submit Real Complaint <Check className="ml-1.5" size={16}/></>}
        </Button>
      </section>
    </Shell>
  );
}

/* --- SCREEN 5: CREATED CONFIRMATION --- */

function Created() {
  const [c, setC] = useState<Case | null>(null);

  useEffect(() => setC(getSavedCase()), []);

  return (
    <Shell nav={false} className="bg-slate-50">
      <Header title="Case Submitted" />
      <section className="px-5 pt-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </span>
        <h1 className="mt-4 text-2xl font-black text-slate-900">
          Complaint Registered!
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Your evidence and GPS location were submitted successfully.
        </p>

        <div className="mt-5 rounded-2xl bg-white p-4 text-left shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase">Case ID</p>
          <p className="text-xl font-black text-blue-600">{c?.id || "—"}</p>
          <p className="mt-2 text-xs font-bold text-slate-800">{c?.title || "Complaint submitted"}</p>
          <p className="text-[11px] text-slate-500">{c?.location || "GPS location captured"}</p>
        </div>

        <Link
          href="/complaints"
          className="mt-3 block text-xs font-bold text-blue-600 hover:underline"
        >
          View in My Complaints List
        </Link>
      </section>
    </Shell>
  );
}

/* --- SCREEN 6: MY COMPLAINTS LIST --- */

function Complaints() {
  const [allCases, setAllCases] = useState<any[]>([]);
  const [tab,setTab]=useState("All");
  useEffect(() => { const load=()=>{const citizen=getLocalCitizen();setAllCases(getSavedCases().filter((x:any)=>!citizen||!x.user_id||x.user_id===citizen.id).map((x:any)=>({...x,date:x.date||"Just now",photo:Boolean(x.imageUrl),color:String(x.status).toLowerCase().includes("resolved")?"green":"blue"})));};load();window.addEventListener("civicproof:cases-updated",load);return()=>window.removeEventListener("civicproof:cases-updated",load)}, []);
  const visible=allCases.filter(c=>tab==="All"||(tab==="Active"&&!String(c.status).toLowerCase().includes("resolved"))||(tab==="Resolved"&&String(c.status).toLowerCase().includes("resolved")));
  const support=(id:string)=>{const arr=getSavedCases();const n=arr.map((c:any)=>c.id===id?{...c,community_support:(c.community_support||0)+1}:c);localStorage.setItem(CASES_KEY,JSON.stringify(n));window.dispatchEvent(new Event("civicproof:cases-updated"));};
  return <Shell className="bg-slate-50"><Header title="My Complaints"/><section className="px-5 pt-1"><div className="rounded-3xl bg-slate-900 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Civic accountability</p><h2 className="mt-1 text-lg font-black">Track every case to closure</h2><p className="mt-1 text-[10px] text-slate-300">See progress, evidence, community support and verification.</p></div><div className="mt-3 grid grid-cols-3 gap-1.5">{["All","Active","Resolved"].map(x=><button key={x} onClick={()=>setTab(x)} className={cn("rounded-xl py-2 text-[10px] font-black",tab===x?"bg-[#005a7a] text-white":"bg-white border border-slate-200 text-slate-500")}>{x}</button>)}</div>{visible.length===0?<div className="mt-3 rounded-3xl bg-white p-7 text-center border border-slate-100 shadow-sm"><FileCheck2 className="mx-auto text-slate-300" size={38}/><h3 className="mt-3 text-sm font-black">No complaints here</h3><p className="mt-1 text-[11px] text-slate-500">Use Report to capture a real civic problem.</p><Link href="/report" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white">Report an issue</Link></div>:<div className="mt-3 space-y-3">{visible.map(x=><div key={x.id} className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100"><div className="flex items-start gap-3"><span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl",colors[x.color])}><CircleDot size={18}/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-black text-slate-900">{x.title}</p><Badge c={x.color}>{x.status}</Badge></div><p className="mt-1 text-[10px] text-slate-400">{x.id} · {x.date}</p><div className="mt-3 grid grid-cols-4 gap-1 text-center text-[8px] font-bold"><span className="rounded-lg bg-emerald-50 p-1 text-emerald-700">✓ Submitted</span><span className="rounded-lg bg-blue-50 p-1 text-blue-700">{String(x.status).toLowerCase().includes("assigned")?"✓":"•"} Assigned</span><span className="rounded-lg bg-amber-50 p-1 text-amber-700">{String(x.status).toLowerCase().includes("resolved")?"✓":"•"} Repair</span><span className="rounded-lg bg-violet-50 p-1 text-violet-700">{String(x.status).toLowerCase().includes("resolved")?"✓":"•"} Verify</span></div><div className="mt-2 flex items-center justify-between"><span className="flex items-center gap-1 text-[9px] font-bold text-slate-500"><Users size={12}/> {x.community_support||0} support</span><button onClick={()=>support(x.id)} className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-700">Support issue +1</button></div>{x.duplicate_of&&<p className="mt-2 rounded-lg bg-amber-50 p-2 text-[9px] font-bold text-amber-800">Similar nearby case detected: {x.duplicate_of}. This helps reduce duplicate complaints.</p>}</div></div></div>)}</div>}</section></Shell>;
}

/* --- SCREEN 7: CV RESOLUTION AUDIT (BEFORE VS AFTER SSIM / SIFT) --- */

function Proof() {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [result, setResult] = useState<{verdict:string;confidence:number;explanation:string;changes:string[];residual_issue:string;tamper_warning:string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraFor, setCameraFor] = useState<"before" | "after" | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraFor(null);
  };

  const startCamera = async (target: "before" | "after") => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Live camera is not supported by this browser. Use Chrome/Edge on HTTPS or localhost.");
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraFor(target);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : "Camera permission was denied.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !cameraFor) return;
    const max = 1600;
    const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg", 0.86);
    if (cameraFor === "before") setBefore(image);
    else setAfter(image);
    stopCamera();
  };

  useEffect(() => () => stopCamera(), []);

  const saveSatisfaction = () => {
    if (!satisfaction) return;
    try {
      localStorage.setItem("civicproof-repair-satisfaction", JSON.stringify({
        rating: satisfaction,
        feedback: feedback.trim(),
        savedAt: new Date().toISOString(),
      }));
    } catch {}
    setFeedbackSaved(true);
  };

  const verify = async () => {
    if (!before || !after) return;
    setBusy(true);
    try {
      const compare = async (a:string,b:string) => new Promise<number>((resolve,reject)=>{
        const ia=new window.Image(), ib=new window.Image(); let done=0; const imgs=[ia,ib];
        const finish=()=>{done++;if(done<2)return;const w=96,h=96,ca=document.createElement("canvas"),cb=document.createElement("canvas");ca.width=cb.width=w;ca.height=cb.height=h;const xa=ca.getContext("2d"),xb=cb.getContext("2d");if(!xa||!xb)return reject(new Error("Canvas unavailable"));xa.drawImage(ia,0,0,w,h);xb.drawImage(ib,0,0,w,h);const da=xa.getImageData(0,0,w,h).data,db=xb.getImageData(0,0,w,h).data;let diff=0;for(let i=0;i<da.length;i+=4){diff+=Math.abs(da[i]-db[i])+Math.abs(da[i+1]-db[i+1])+Math.abs(da[i+2]-db[i+2]);}resolve(Math.max(0,100-diff/(w*h*7.65)));};imgs.forEach((im,i)=>{im.onload=finish;im.onerror=()=>reject(new Error("Could not read evidence image"));im.src=i?b:a;});
      });
      const similarity=await compare(before,after);
      const confidence=Math.max(50,Math.min(98,similarity));
      const verdict=similarity>=78?"VERIFIED":similarity>=58?"PARTIAL":"NOT_VERIFIED";
      setResult({verdict,confidence,explanation:verdict==="VERIFIED"?"The before and after images show strong visual consistency with meaningful scene continuity.":verdict==="PARTIAL"?"The images share some visual consistency, but the evidence should be reviewed manually before closure.":"The images differ substantially. Capture the same location from a similar angle for a stronger audit.",changes:verdict==="VERIFIED"?["Strong scene consistency detected","Visual difference is compatible with a repaired/changed surface"]:["Image similarity is not strong enough for an automatic closure"],residual_issue:verdict==="VERIFIED"?"No major residual issue inferred from the image comparison.":"Manual inspection recommended.",tamper_warning:"Visual comparison cannot prove tampering or fraud; angle, lighting and camera differences can affect the result."});
    } catch (e) { alert(e instanceof Error ? e.message : "Verification failed."); }
    finally { setBusy(false); }
  };

  return (
    <Shell nav={false} className="bg-slate-50">
      <Header title="AI Resolution Audit" back />
      <section className="px-5 pb-8 pt-1">
        <div className="rounded-3xl bg-gradient-to-br from-[#004e6a] to-[#087c92] p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow"><Image src="/civicproof-logo.jpeg" alt="CivicProofAI" width={44} height={44} className="h-full w-full object-cover object-top" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">Department Resolution Proof</p><h2 className="mt-1 text-base font-black">See the change. Verify the repair.</h2></div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-white/80">The citizen can compare the original issue with the department's post-repair photo before marking the resolution satisfactory.</p>
        </div>
        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
          <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600"/><div><p className="text-[11px] font-black text-slate-900">Citizen-visible repair evidence</p><p className="text-[9px] text-slate-600">Before photo = reported problem · After photo = department's repair proof</p></div></div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["before", "after"] as const).map((label) => {
            const img = label === "before" ? before : after;
            return (
              <div key={label} className="rounded-2xl bg-white border border-slate-200 p-2">
                <button onClick={() => startCamera(label)} className="block w-full text-left">
                  {img ? <img src={img} alt={`${label} evidence`} className="h-32 w-full object-cover rounded-xl" /> :
                    <div className="h-32 rounded-xl bg-slate-100 grid place-items-center text-center">
                      <Camera size={22} className="text-blue-600" />
                      <span className="text-[10px] font-black text-slate-600">{label === "before" ? "ORIGINAL CITIZEN PHOTO" : "DEPARTMENT REPAIR PHOTO"}</span>
                    </div>}
                </button>
                {img && <button onClick={() => startCamera(label)} className="mt-2 w-full rounded-xl bg-slate-100 py-2 text-[10px] font-black text-slate-700">Retake</button>}
                <label className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-[10px] font-black text-slate-700">
                  <Upload size={13}/> Upload {label === "before" ? "original" : "department repair"} photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(!f) return; const rd=new FileReader(); rd.onload=()=>{if(label === "before") setBefore(String(rd.result)); else setAfter(String(rd.result));}; rd.readAsDataURL(f);}} />
                </label>
              </div>
            );
          })}
        </div>

        {cameraError && <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold text-red-700">{cameraError}</div>}

        <Button disabled={!before || !after || busy} onClick={verify}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl">
          {busy ? <><RefreshCw className="mr-2 animate-spin" size={16}/>AI Comparing Evidence…</> : <>Run AI Repair Audit <Scan className="ml-2" size={16}/></>}
        </Button>

        {result && (
          <div className={cn("mt-4 rounded-2xl p-4 text-white shadow-md", result.verdict === "VERIFIED" ? "bg-emerald-600" : result.verdict === "PARTIAL" ? "bg-amber-600" : "bg-red-600")}>
            <div className="flex justify-between items-center">
              <div><p className="text-[10px] font-black uppercase">AI Audit Verdict</p><p className="text-2xl font-black mt-1">{result.verdict}</p></div>
              <span className="text-2xl font-black">{result.confidence.toFixed(0)}%</span>
            </div>
            <p className="mt-2 text-xs font-bold">{result.explanation}</p>
          </div>
        )}

        {result && <div className="mt-3 rounded-2xl bg-white p-4 border border-slate-100 shadow-sm text-xs">
          <p className="font-black text-slate-700">Evidence changes</p>
          <div className="mt-2 space-y-1.5">{result.changes.map((x,i)=><p key={i} className="flex gap-2 text-slate-600"><CheckCircle2 size={14} className="text-emerald-600 shrink-0"/>{x}</p>)}</div>
          <p className="mt-3 text-slate-600"><b>Residual issue:</b> {result.residual_issue}</p>
          <p className="mt-2 text-slate-600"><b>Tamper/angle warning:</b> {result.tamper_warning}</p>
        </div>}

        {result?.verdict === "VERIFIED" && <div className="mt-3 rounded-3xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-500"><Star size={19} fill="currentColor"/></div>
            <div><p className="text-sm font-black text-slate-900">Are you satisfied with the repair?</p><p className="mt-0.5 text-[9px] text-slate-500">Your feedback helps confirm whether the department's fix actually solved the issue.</p></div>
          </div>
          <div className="mt-3 flex justify-between gap-1">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>{setSatisfaction(n);setFeedbackSaved(false)}} aria-label={`${n} star rating`} className={cn("grid h-10 flex-1 place-items-center rounded-xl border transition", satisfaction && n <= satisfaction ? "border-amber-300 bg-amber-50 text-amber-500" : "border-slate-100 bg-slate-50 text-slate-300")}><Star size={17} fill={satisfaction && n <= satisfaction ? "currentColor" : "none"}/></button>)}</div>
          <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Optional: tell us if the repair looks complete…" className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[10px] outline-none focus:border-amber-300" />
          <button disabled={!satisfaction} onClick={saveSatisfaction} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#005a7a] py-3 text-[10px] font-black text-white disabled:opacity-40"><MessageCircle size={14}/> {feedbackSaved ? "Feedback Saved" : "Submit Satisfaction"}</button>
          {feedbackSaved && <p className="mt-2 text-center text-[9px] font-bold text-emerald-600">Thanks — your satisfaction response is saved on this device.</p>}
        </div>}
      </section>

      {cameraFor && (
        <div className="absolute inset-0 z-[100] flex flex-col bg-black">
          <div className="flex items-center justify-between px-5 py-4 text-white">
            <span className="text-xs font-black">CAPTURE {cameraFor.toUpperCase()} PHOTO</span>
            <button onClick={stopCamera} className="grid h-9 w-9 place-items-center rounded-full bg-white/15"><XCircle size={22} /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
            <video ref={videoRef} muted playsInline autoPlay className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-7 rounded-3xl border-2 border-white/70" />
          </div>
          <div className="flex items-center justify-center gap-5 px-5 py-6 pb-8">
            <button onClick={stopCamera} className="rounded-xl px-4 py-3 text-xs font-bold text-white">Cancel</button>
            <button onClick={capturePhoto} aria-label="Capture photo" className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-white/20 shadow-xl">
              <span className="h-14 w-14 rounded-full bg-white" />
            </button>
            <span className="w-16" />
          </div>
        </div>
      )}
    </Shell>
  );
}

/* --- SCREEN 8: GEOSPATIAL RISK MAP & HOTSPOTS --- */

function googleMapsDirections(destination:string, mode:"driving"|"walking"|"bicycling"|"two-wheeler"="driving") {
  const url=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=${mode}&dir_action=navigate`;
  window.open(url,"_blank","noopener,noreferrer");
}

function haversine(a:number,b:number,c:number,d:number){const R=6371;const p=Math.PI/180;const x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return 2*R*Math.asin(Math.sqrt(x));}

// Reports within roughly 100 m share one hotspot. Its size and label represent
// every matching complaint, rather than hiding overlapping reports under one dot.
function buildHotspots(reports:any[]) {
  const groups=new Map<string,any[]>();
  reports.forEach(report=>{
    const key=`${Math.round(report.latitude*1000)}:${Math.round(report.longitude*1000)}`;
    groups.set(key,[...(groups.get(key)||[]),report]);
  });
  return [...groups.entries()].map(([id,items])=>({
    id,
    cases:items,
    count:items.length,
    latitude:items.reduce((sum,item)=>sum+item.latitude,0)/items.length,
    longitude:items.reduce((sum,item)=>sum+item.longitude,0)/items.length,
  }));
}

function RiskMap() {
  const mapRef=React.useRef<HTMLDivElement|null>(null); const leafletRef=React.useRef<any>(null);
  const [cases,setCases]=useState<any[]>([]); const [filter,setFilter]=useState("All"); const [query,setQuery]=useState("");
  const [selectedCase,setSelectedCase]=useState<any|null>(null); const [userPos,setUserPos]=useState<{lat:number;lng:number}|null>(null);
  const [mapReady,setMapReady]=useState(false); const [mapError,setMapError]=useState(false); const [routeMode,setRouteMode]=useState<"safer"|"direct">("safer");

  // The public map is deliberately not scoped to the signed-in citizen.
  const load=()=>setCases(getSavedCases().map((x:any)=>({...x,latitude:Number(x.latitude??x.lat),longitude:Number(x.longitude??x.lng)})));
  useEffect(()=>{
    load();
    const f=()=>load();
    window.addEventListener("storage",f); window.addEventListener("civicproof:cases-updated",f);
    return()=>{window.removeEventListener("storage",f);window.removeEventListener("civicproof:cases-updated",f)}
  },[]);
  useEffect(()=>{if(navigator.geolocation)navigator.geolocation.getCurrentPosition(p=>setUserPos({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{});},[]);

  const geoCases=cases.filter(c=>Number.isFinite(c.latitude)&&Number.isFinite(c.longitude));
  const visible=geoCases.filter(c=>{
    const sev=String(c.severity||"").toUpperCase();
    const status=String(c.status||"").toLowerCase();
    const f=filter==="All"||(filter==="Critical"&&sev==="CRITICAL")||(filter==="High"&&sev==="HIGH")||(filter==="Resolved"&&status.includes("resolved"));
    const q=query.toLowerCase().trim();
    return f&&(!q||[c.id,c.title,c.category,c.location,c.department,c.status].some(v=>String(v||"").toLowerCase().includes(q)));
  });
  const visibleHotspots=buildHotspots(visible);

  const riskCases=geoCases.filter(c=>["CRITICAL","HIGH"].includes(String(c.severity||"").toUpperCase()));
  const nearbyRisk=userPos?riskCases.filter(c=>haversine(userPos.lat,userPos.lng,c.latitude,c.longitude)<2):[];
  const center= userPos || (geoCases[0]?{lat:geoCases[0].latitude,lng:geoCases[0].longitude}:{lat:28.6692,lng:77.4538});

  const fitAll=()=>{
    const map=leafletRef.current; if(!map) return;
    if(visible.length){const L=(window as any).L; const bounds=L.latLngBounds(visible.map((c:any)=>[c.latitude,c.longitude])); if(userPos)bounds.extend([userPos.lat,userPos.lng]); map.fitBounds(bounds,{padding:[35,35],maxZoom:15});}
    else map.setView([center.lat,center.lng],12);
  };
  const focusCase=(c:any)=>{setSelectedCase(c); const map=leafletRef.current; if(map){map.setView([c.latitude,c.longitude],16,{animate:true}); const layer=(c as any).__marker; layer?.openPopup?.();}};

  useEffect(()=>{
    let cancelled=false;
    setMapError(false);
    const init=async()=>{
      if(!mapRef.current)return;
      if(!(window as any).L){
        const link=document.createElement("link");link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(link);
        await new Promise<void>((resolve,reject)=>{const script=document.createElement("script");script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";script.onload=()=>resolve();script.onerror=()=>reject(new Error("Map failed"));document.head.appendChild(script);});
      }
      if(cancelled||!mapRef.current)return;
      const L=(window as any).L;
      const map=L.map(mapRef.current,{zoomControl:false,attributionControl:true}).setView([center.lat,center.lng],12); leafletRef.current=map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
      L.control.zoom({position:"bottomright"}).addTo(map);
      visibleHotspots.forEach((hotspot:any)=>{
        const lead=hotspot.cases.slice().sort((a:any,b:any)=>{
          const rank=(value:any)=>({CRITICAL:3,HIGH:2,MEDIUM:1,LOW:0}[String(value||"").toUpperCase()]??1);
          return rank(b.severity)-rank(a.severity);
        })[0];
        const sev=String(lead.severity||"").toUpperCase(); const status=String(lead.status||"").toLowerCase();
        const color=sev==="CRITICAL"?"#dc2626":sev==="HIGH"?"#f97316":status.includes("resolved")?"#16a34a":"#0ea5e9";
        const marker=L.circleMarker([hotspot.latitude,hotspot.longitude],{radius:Math.min(28,10+Math.sqrt(hotspot.count)*4),color:"#fff",weight:2.5,fillColor:color,fillOpacity:.95}).addTo(map);
        const label=sev==="CRITICAL"?"Critical":sev==="HIGH"?"High":status.includes("resolved")?"Resolved":"Reported";
        marker.bindTooltip(String(hotspot.count),{permanent:true,direction:"center",className:"civic-hotspot-count",opacity:1});
        marker.bindPopup(`<div style="min-width:170px"><b>${hotspot.count} complaint${hotspot.count===1?"":"s"} in this area</b><br/><span>${String(lead.title||lead.category).replace(/</g,"&lt;")}</span><br/><span>${label} risk</span><br/><br/><b>${hotspot.cases.reduce((sum:number,item:any)=>sum+(item.community_support||0),0)}</b> community support</div>`);
        hotspot.cases.forEach((report:any)=>report.__marker=marker);
        marker.on("click",()=>setSelectedCase(lead));
      });
      if(userPos)L.circleMarker([userPos.lat,userPos.lng],{radius:8,color:"#fff",weight:3,fillColor:"#0284c7",fillOpacity:1}).addTo(map).bindPopup("<b>You are here</b>");
      setMapReady(true); setTimeout(()=>{map.invalidateSize();fitAll()},150);
    };
    init().catch(()=>setMapError(true));
    return()=>{cancelled=true;leafletRef.current?.remove();leafletRef.current=null;setMapReady(false)}
  },[cases,filter,query,userPos]);

  const getSaferWaypoints=(destination:any)=>{
    if(!userPos)return [];
    return riskCases
      .filter(x=>x.id!==destination.id)
      .filter(x=>haversine(userPos.lat,userPos.lng,x.latitude,x.longitude)<3)
      .sort((a,b)=>haversine(userPos.lat,userPos.lng,a.latitude,a.longitude)-haversine(userPos.lat,userPos.lng,b.latitude,b.longitude))
      .slice(0,3)
      .map((x:any)=>`${x.latitude},${x.longitude}`);
  };
  const navigate=(c:any)=>{
    const destination=`${c.latitude},${c.longitude}`;
    const waypoints=routeMode==="safer"?getSaferWaypoints(c):[];
    let url=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving&dir_action=navigate`;
    if(waypoints.length)url+=`&waypoints=${encodeURIComponent(waypoints.join("|"))}`;
    window.open(url,"_blank","noopener,noreferrer");
    setSelectedCase(null);
  };

  return <Shell className="bg-gradient-to-b from-[#edf8fc] via-[#f7fbfd] to-white">
    <Header title="Civic Map"/>
    <section className="px-4 pt-1 pb-4">
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#004b68] via-[#005f7d] to-[#087f98] p-4 text-white shadow-[0_12px_30px_rgba(0,82,110,.20)]">
        <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200">CivicProof live layer</p><h2 className="mt-1 text-[19px] font-black leading-tight">Find issues. Choose a safer road.</h2><p className="mt-1 text-[9px] font-semibold text-white/70">All GPS-tagged reports are included. Larger numbered dots mean more complaints nearby.</p></div><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10"><ShieldCheck size={22} className="text-cyan-200"/></div></div>
        <div className="mt-3 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-white/10 p-2.5 text-center"><b className="text-base">{geoCases.length}</b><p className="text-[8px] font-bold text-white/65">Mapped</p></div><div className="rounded-2xl bg-white/10 p-2.5 text-center"><b className="text-base">{riskCases.length}</b><p className="text-[8px] font-bold text-white/65">High risk</p></div><div className="rounded-2xl bg-white/10 p-2.5 text-center"><b className="text-base">{nearbyRisk.length}</b><p className="text-[8px] font-bold text-white/65">Near you</p></div></div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">{["All","Critical","High","Resolved"].map(x=><button key={x} onClick={()=>setFilter(x)} className={cn("rounded-full border px-3.5 py-2 text-[9px] font-black whitespace-nowrap transition",filter===x?"border-[#005f7d] bg-[#005f7d] text-white shadow-sm":"border-white bg-white text-slate-500")}>{x}{x==="All"?` · ${geoCases.length}`:""}</button>)}</div>

      <div className="relative mt-2.5"><Search className="absolute left-3 top-3 z-10 text-slate-400" size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search issue, area, case or department…" className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-[10px] font-semibold outline-none shadow-sm focus:border-[#00718f]"/></div>

      <div className="relative mt-3 h-[365px] overflow-hidden rounded-[28px] border border-white bg-slate-200 shadow-[0_10px_28px_rgba(15,45,65,.12)]">
        <div ref={mapRef} className="h-full w-full"/>
        <div className="absolute left-2.5 top-2.5 z-10 rounded-2xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur"><div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[8px] font-black text-slate-600"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-red-600"/>Critical</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-500"/>High</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500"/>Open</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-green-600"/>Resolved</span></div></div>
        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-2"><button onClick={fitAll} disabled={!mapReady} className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-lg disabled:opacity-50" aria-label="Show all reports"><LayoutDashboard size={17} className="text-[#005f7d]"/></button><button onClick={()=>navigator.geolocation?.getCurrentPosition(p=>{setUserPos({lat:p.coords.latitude,lng:p.coords.longitude});leafletRef.current?.setView([p.coords.latitude,p.coords.longitude],15,{animate:true})})} className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-lg" aria-label="My location"><LocateFixed size={18} className="text-[#005f7d]"/></button></div>
        {!mapReady&&<div className="absolute inset-0 grid place-items-center bg-slate-100/80"><div className="rounded-2xl bg-white px-4 py-3 text-center text-[10px] font-black text-slate-500 shadow">{mapError?"Map could not load. Check your internet connection and try again.":"Loading civic map…"}</div></div>}
      </div>

      <div className={cn("mt-3 rounded-[24px] border p-3.5 shadow-sm",nearbyRisk.length?"border-amber-200 bg-amber-50":"border-emerald-200 bg-emerald-50")}>
        <div className="flex items-center gap-3"><div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl",nearbyRisk.length?"bg-amber-100 text-amber-600":"bg-emerald-100 text-emerald-600")}><ShieldCheck size={20}/></div><div className="min-w-0"><p className="text-[11px] font-black text-slate-900">{nearbyRisk.length?`${nearbyRisk.length} high-risk report${nearbyRisk.length>1?"s":""} within 2 km`:(userPos?"No high-risk reports within 2 km":"Location not enabled yet")}</p><p className="mt-0.5 text-[9px] font-semibold leading-snug text-slate-600">Use <b>Safer Path</b> when navigating to an issue. It uses reported civic risks as guidance, not a guarantee of road safety.</p></div></div>
        <button onClick={()=>{if(nearbyRisk[0]){setSelectedCase(nearbyRisk[0]);setRouteMode("safer");}else if(geoCases[0]){setSelectedCase(geoCases[0]);setRouteMode("safer");}}} disabled={!geoCases.length} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffc300] py-3 text-[10px] font-black text-slate-950 shadow-sm disabled:opacity-40"><ShieldCheck size={15}/> Suggest Safer Route</button>
      </div>

      <div className="mt-4 flex items-end justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Reported issues</p><h3 className="mt-0.5 text-base font-black text-slate-900">Explore the civic map</h3></div><span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-black text-slate-400 shadow-sm">{visible.length} shown</span></div>
      <div className="mt-2.5 space-y-2">{visible.length===0?<div className="rounded-[22px] bg-white p-6 text-center text-xs text-slate-500 shadow-sm">No mapped reports match your search or filter.</div>:visible.map((c:any)=><button key={c.id} onClick={()=>focusCase(c)} className="w-full rounded-[22px] border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 active:scale-[.99]"><div className="flex items-center gap-3"><div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl",String(c.severity).toUpperCase()==="CRITICAL"?"bg-red-50 text-red-600":String(c.severity).toUpperCase()==="HIGH"?"bg-orange-50 text-orange-600":String(c.status).toLowerCase().includes("resolved")?"bg-emerald-50 text-emerald-600":"bg-sky-50 text-sky-600")}><MapPin size={18}/></div><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-black text-slate-900">{c.title||c.category}</p><p className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">{c.id} · {c.location||"GPS location captured"}</p></div><ChevronRight size={16} className="shrink-0 text-slate-300"/></div><div className="mt-2 flex items-center justify-between"><Badge c={String(c.severity).toUpperCase()==="CRITICAL"?"red":String(c.severity).toUpperCase()==="HIGH"?"orange":String(c.status).toLowerCase().includes("resolved")?"green":"blue"}>{c.severity||"MEDIUM"}</Badge><span className="text-[8px] font-bold text-slate-400">{c.community_support||0} community support</span></div></button>)}</div>
    </section>

    {selectedCase&&<div className="absolute inset-0 z-[90] flex items-end bg-slate-950/40 backdrop-blur-[2px]" onClick={()=>setSelectedCase(null)}><div className="w-full rounded-t-[30px] bg-white p-5 shadow-2xl" onClick={e=>e.stopPropagation()}><div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200"/><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#00718f]">Map report</p><h3 className="mt-1 text-base font-black text-slate-900">{selectedCase.title||selectedCase.category}</h3><p className="mt-1 text-[9px] font-semibold text-slate-400">{selectedCase.id} · {selectedCase.status||"Submitted"}</p></div><button onClick={()=>setSelectedCase(null)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100"><XCircle size={18} className="text-slate-500"/></button></div><div className="mt-3 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-slate-50 p-2.5 text-center"><p className="text-[8px] font-bold text-slate-400">Risk</p><p className="mt-0.5 text-[10px] font-black text-slate-900">{selectedCase.severity||"Medium"}</p></div><div className="rounded-2xl bg-slate-50 p-2.5 text-center"><p className="text-[8px] font-bold text-slate-400">Support</p><p className="mt-0.5 text-[10px] font-black text-slate-900">{selectedCase.community_support||0}</p></div><div className="rounded-2xl bg-slate-50 p-2.5 text-center"><p className="text-[8px] font-bold text-slate-400">Department</p><p className="mt-0.5 truncate text-[9px] font-black text-slate-900">{selectedCase.department||"Civic body"}</p></div></div><div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600"/><div><p className="text-[10px] font-black text-slate-900">Route guidance</p><p className="text-[8px] font-semibold text-slate-600">Safer Path will try to avoid nearby High/Critical reported risks before opening navigation.</p></div></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={()=>setRouteMode("safer")} className={cn("rounded-2xl border p-3 text-left",routeMode==="safer"?"border-emerald-300 bg-emerald-50":"border-slate-200 bg-white")}><ShieldCheck size={18} className="text-emerald-600"/><p className="mt-2 text-[10px] font-black">Safer Path</p><p className="mt-0.5 text-[8px] text-slate-500">Risk-aware guidance</p></button><button onClick={()=>setRouteMode("direct")} className={cn("rounded-2xl border p-3 text-left",routeMode==="direct"?"border-sky-300 bg-sky-50":"border-slate-200 bg-white")}><Navigation size={18} className="text-sky-600"/><p className="mt-2 text-[10px] font-black">Direct Route</p><p className="mt-0.5 text-[8px] text-slate-500">Normal navigation</p></button></div><button onClick={()=>navigate(selectedCase)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ffc300] py-3.5 text-[10px] font-black text-slate-950 shadow-sm"><Navigation size={15}/> Start {routeMode==="safer"?"Safer Path":"Navigation"}</button></div></div>}
  </Shell>;
}

/* --- SCREEN 9 & 10: AUTHORITY & ADMIN DEMO --- */

function AuthorityLogin() {
  const r = useRouter();
  return (
    <Shell nav={false} className="bg-slate-900 text-white">
      <section className="flex flex-col justify-between h-full p-6 pt-12">
        <div>
          <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={32} />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-blue-400">
            Municipal Workspace
          </p>
          <h1 className="mt-1 text-2xl font-black">Authority & Contractor Portal</h1>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Upload post-repair photographic evidence. CivicProof AI independently audits the resolution before contractor invoice clearance.
          </p>
        </div>

        <div className="flex flex-col gap-2 pb-6">
          <Button
            onClick={() => r.push("/authority")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl"
          >
            Enter Authority Operations Mode
          </Button>
          <Button
            onClick={() => r.push("/admin")}
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Open Admin Resolution Intelligence
          </Button>
        </div>
      </section>
    </Shell>
  );
}

function Authority() {
  const r = useRouter();

  return (
    <Shell nav={false} className="bg-slate-50">
      <Header title="Municipal Operations" />
      <section className="px-5 pt-1">
        <div className="rounded-3xl bg-slate-900 p-4 text-white shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
            PWD Ghaziabad · Division 2
          </p>
          <h2 className="text-lg font-black mt-1">Pending Contractor Closures</h2>
        </div>

        <div className="mt-3 space-y-2.5">
          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-xs text-slate-900">Pothole on Lake View Road</p>
              <p className="text-[10px] text-slate-400">CP-240819 · Awaiting After Proof</p>
            </div>
            <Button
              size="sm"
              onClick={() => r.push("/proof")}
              className="bg-[#ffc300] hover:bg-[#f5b800] text-slate-950 font-black text-xs h-8 px-3 rounded-lg"
            >
              Audit Proof
            </Button>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Admin() {
  return (
    <Shell nav={false} className="bg-slate-50">
      <Header title="Admin Intelligence" />
      <section className="px-5 pt-1">
        <div className="rounded-3xl bg-slate-900 p-4 text-white shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
            City Performance Audit
          </p>
          <h2 className="text-lg font-black mt-1">74% Paper Resolution Crisis</h2>
          <p className="text-[11px] text-slate-300 mt-1">
            Historical audits show 74% of tickets marked closed had physical mismatch.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-left">
          <Metric v="176" l="Verified Physical Fixes" />
          <Metric v="63" l="Disputed / Angle Spoofs" red />
        </div>
      </section>
    </Shell>
  );
}

function Profile() {
  const r = useRouter();
  const [user, setUser] = useState<AuthUser|null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  useEffect(()=>{
    const citizen = getLocalCitizen();
    setUser(citizen);
    const mine = getSavedCases().filter((x:any) => !citizen || x.user_id === citizen.id).map((x:any)=>({...x,date:x.date || (x.created_at ? new Date(x.created_at).toLocaleDateString() : "—"),imageUrl:x.imageUrl || x.image_url,color:x.status==="Resolved"?"green":"blue",photo:!!(x.imageUrl || x.image_url)}));
    setCases(mine as Case[]);
  },[]);
  const logout=()=>{localStorage.removeItem(AUTH_KEY); r.replace("/");};
  const resolved=cases.filter(c=>String(c.status).toLowerCase()==="resolved").length;
  const ask=(x:string)=>window.dispatchEvent(new CustomEvent("civicproof:assistant-question", { detail: x }));
  return <Shell className="bg-gradient-to-b from-[#eaf6fc] to-[#f8fbfd]"><Header title="My Profile"/><section className="px-5 pt-3 pb-4">
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#004e6a] via-[#005f7d] to-[#0a7892] p-5 text-white shadow-[0_12px_28px_rgba(0,82,110,0.22)]">
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10"/><div className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-cyan-300/10"/>
      <div className="relative flex items-center gap-3"><div className="grid h-16 w-16 place-items-center overflow-hidden rounded-[20px] bg-white p-1 shadow-lg"><Image src="/civicproof-logo.jpeg" alt="CivicProofAI" width={64} height={64} className="h-full w-full object-cover object-top" /></div><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">Verified citizen</p><p className="mt-1 truncate text-[19px] font-black">{user?.name||"Citizen"}</p><p className="truncate text-[10px] text-white/70">{user?.email||"Local citizen account"}</p></div></div>
      <div className="relative mt-5 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-white/10 p-2.5 text-center ring-1 ring-white/10"><b className="text-base">{cases.length}</b><p className="text-[8px] font-bold text-white/65">Reports</p></div><div className="rounded-2xl bg-white/10 p-2.5 text-center ring-1 ring-white/10"><b className="text-base">{resolved}</b><p className="text-[8px] font-bold text-white/65">Resolved</p></div><div className="rounded-2xl bg-white/10 p-2.5 text-center ring-1 ring-white/10"><b className="text-base">{cases.length-resolved}</b><p className="text-[8px] font-bold text-white/65">Open</p></div></div>
    </div>
    <div className="mt-4 rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_5px_18px_rgba(25,60,90,0.06)]"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e8f7fb] text-[#005f7d]"><Bot size={19}/></div><div><p className="text-sm font-black text-slate-900">CivicProof Assistant</p><p className="text-[9px] font-semibold text-slate-400">Quick answers — no unnecessary information</p></div></div><div className="mt-3 grid grid-cols-2 gap-2">{["How do I report a pothole?","What does my status mean?","How does Safer Path work?","How is repair proof checked?"] .map(x=><button key={x} onClick={()=>ask(x)} className="rounded-2xl border border-slate-100 bg-slate-50 px-2.5 py-2.5 text-left text-[9px] font-bold leading-snug text-slate-700 transition hover:border-blue-100 hover:bg-blue-50 active:scale-[0.98]">{x}</button>)}</div></div>
    <div className="mt-5 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Your activity</p><h2 className="mt-0.5 text-base font-black text-slate-900">Issue history</h2></div><button onClick={()=>r.push("/complaints")} className="text-[10px] font-black text-[#006b8f]">View all →</button></div>
    <div className="mt-2 space-y-2">{cases.length===0?<div className="rounded-[22px] bg-white p-6 text-center text-xs text-slate-500 shadow-sm ring-1 ring-slate-100">Your reported issues will appear here.</div>:cases.map(c=><button key={c.id} onClick={()=>r.push("/complaints")} className="w-full rounded-[20px] border border-slate-100 bg-white p-3.5 text-left shadow-sm transition active:scale-[0.99]"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-black text-slate-900">{c.title||c.category}</p><Badge c={c.color}>{c.status}</Badge></div><p className="mt-1 text-[10px] font-semibold text-slate-400">{c.id} · {c.date}</p><p className="mt-1 truncate text-[10px] text-slate-400">{c.location||"GPS location captured"}</p></button>)}</div>
    <button onClick={logout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white py-3 text-xs font-black text-red-600 shadow-sm"><LogOut size={15}/> Sign out</button>
  </section></Shell>;
}

export default function CivicProofApp({ screen }: Props) {
  const routes: Record<string, React.ReactNode> = {
    home: <Home />,
    report: <Report />,
    analysis: <Analysis />,
    location: <Location />,
    created: <Created />,
    complaints: <Complaints />,
    proof: <Proof />,
    map: <RiskMap />,
    "authority-login": <AuthorityLogin />,
    authority: <Authority />,
    admin: <Admin />,
    profile: <Profile />,
  };

  const publicScreens = new Set(["map","authority-login","authority","admin"]);
  if (screen === "home") return <AuthGate><Home /></AuthGate>;
  if (publicScreens.has(screen)) return routes[screen] || <Home />;
  return <AuthGate>{routes[screen] || <Home />}</AuthGate>;
}
