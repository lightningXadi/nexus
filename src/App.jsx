import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

/* ── SOCKET CONNECTION ───────────────────────────────────────────────────────
   Change this to your server IP if friends are joining over LAN:
   e.g. "http://192.168.1.5:3001"
────────────────────────────────────────────────────────────────────────────── */
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
let socket = null;

const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false });
  }
  return socket;
};

/* ── DESIGN TOKENS ───────────────────────────────────────────────────────────
   Theme: Deep navy-slate base · Electric indigo accent · Warm gold secondary
   Feels: premium, modern, high-contrast, crisp
────────────────────────────────────────────────────────────────────────────── */
const C = {
  // Backgrounds — cool blue-slate dark
  bg0: "#0a0b0f",   // deepest
  bg1: "#0f1117",   // base
  bg2: "#14161e",   // panels
  bg3: "#1a1d28",   // hover targets
  bg4: "#202433",   // elevated
  bg5: "#272b3d",   // borders/dividers
  bg6: "#2f3448",   // highlights

  // Indigo accent — electric, vivid
  accent:       "#6366f1",
  accentDark:   "#4f52d4",
  accentLight:  "#818cf8",
  accentSoft:   "rgba(99,102,241,0.15)",
  accentSofter: "rgba(99,102,241,0.08)",

  // Gold secondary — warm contrast
  gold:     "#f0a843",
  goldSoft: "rgba(240,168,67,0.13)",

  // Rose danger
  rose:     "#f06f7a",
  roseSoft: "rgba(240,111,122,0.13)",

  // Text — cooler whites
  t0: "#eef0f8",   // primary
  t1: "#b8bdd4",   // secondary
  t2: "#727898",   // muted
  t3: "#454860",   // very muted
  t4: "#2a2d40",   // ghost

  // Borders
  border:      "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.11)",

  // Status
  online:  "#34d399",
  idle:    "#f0a843",
  dnd:     "#f06f7a",
  offline: "#454860",

  // Shadows — deeper on cool theme
  shadow:   "0 8px 40px rgba(0,0,0,0.75)",
  shadowSm: "0 2px 10px rgba(0,0,0,0.5)",
};

const R  = { sm:"4px", md:"8px", lg:"12px", xl:"16px", full:"9999px" };
const T  = { fast:"130ms ease", base:"190ms ease", slow:"280ms ease" };
const FONT   = "'Playfair Display','DM Serif Display',Georgia,serif";
const FONTUI = "'DM Sans','Outfit',system-ui,sans-serif";

/* ── GLOBAL CSS ──────────────────────────────────────────────────────────────── */
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;width:100%;overflow:hidden}
    body{font-family:${FONTUI};background:${C.bg0};color:${C.t0};-webkit-font-smoothing:antialiased;margin:0}
    #root{display:flex;flex-direction:column}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:${C.bg5};border-radius:2px}
    input,textarea,button,select{font-family:${FONTUI}}
    button{cursor:pointer;border:none;background:none}
    ::selection{background:${C.accentSoft}}

    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
    @keyframes slideL{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
    @keyframes slideR{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes dot{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
    @keyframes toastIn{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes authIn{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-18px,14px) scale(1.04)}}
    @keyframes progressBar{from{width:0%}to{width:100%}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

    .btn-hover:hover{opacity:0.88;transform:translateY(-1px)}
    .btn-hover:active{transform:translateY(0)}
    .ch-item:hover{background:${C.bg3}!important;color:${C.t0}!important}
    .space-btn:hover{border-radius:${R.lg}!important;background:${C.bg4}!important}
    input:focus,textarea:focus{border-color:${C.accent}!important;box-shadow:0 0 0 3px ${C.accentSofter}!important}

    /* ── RESPONSIVE ── */

    /* Tablet (≤768px): shrink sidebars, hide members */
    @media (max-width: 768px) {
      .space-sidebar { width:56px!important; min-width:56px!important; }
      .channel-sidebar { width:210px!important; min-width:210px!important; }
      .members-panel { display:none!important; }
    }

    /* Mobile (≤580px): channel sidebar slides over as a drawer */
    @media (max-width: 580px) {
      .space-sidebar { width:56px!important; min-width:56px!important; }
      .members-panel { display:none!important; }
      .mobile-menu-btn { display:flex!important; }
      .home-btn { display:none!important; }

      /* channel sidebar becomes a fixed drawer */
      .channel-sidebar {
        position:fixed!important;
        left:56px!important; top:0; bottom:0;
        width:calc(100vw - 56px)!important;
        max-width:280px!important;
        z-index:200;
        transform:translateX(-110%);
        transition:transform 260ms cubic-bezier(0.4,0,0.2,1);
        box-shadow:4px 0 24px rgba(0,0,0,0.5);
      }
      .channel-sidebar.open {
        transform:translateX(0)!important;
      }

      /* backdrop when drawer open */
      .ch-backdrop {
        display:block!important;
      }

      /* chat area goes full width */
      .chat-area { width:100%!important; }

      /* auth form fits small screens */
      .auth-card { padding:20px 16px!important; }
      .auth-wrap  { padding:0 14px!important; }

      /* modals full-width on mobile */
      .modal-inner { width:calc(100vw - 28px)!important; border-radius:14px!important; }

      /* composer textarea bigger tap area */
      .composer-wrap { padding:8px 10px 12px!important; }
    }

    /* Very small (≤380px) */
    @media (max-width: 380px) {
      .space-sidebar { width:50px!important; min-width:50px!important; }
      .channel-sidebar { left:50px!important; }
    }

    /* Touch devices: remove hover transforms */
    @media (hover: none) {
      .btn-hover:hover { opacity:1!important; transform:none!important; }
    }

    /* Hide backdrop and hamburger by default */
    .ch-backdrop { display:none; }
    .mobile-menu-btn { display:none; }
  `}</style>
);

/* ── ICONS ───────────────────────────────────────────────────────────────────── */
const I = ({ n, s=16, c, style:st }) => {
  const d = {
    hash:    <><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" strokeLinecap="round"/></>,
    vol:     <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" strokeLinecap="round"/></>,
    plus:    <path d="M12 5v14M5 12h14" strokeLinecap="round"/>,
    cfg:     <><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/></>,
    search:  <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></>,
    x:       <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>,
    chev:    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>,
    send:    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>,
    smile:   <><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round"/></>,
    clip:    <path d="M21.44 11.05L12 20.49a5.54 5.54 0 01-7.84-7.84l9.44-9.44a3.69 3.69 0 015.23 5.22L9.38 17.87a1.85 1.85 0 01-2.62-2.62l8.49-8.49" strokeLinecap="round"/>,
    bell:    <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    users:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    pin:     <><path d="M12 17v5M8 3h8l-1 7H9L8 3z" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 17h12" strokeLinecap="round"/></>,
    eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff:  <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round" strokeLinejoin="round"/></>,
    logout:  <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/></>,
    edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/></>,
    home:    <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
    check:   <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>,
    at:      <><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" strokeLinecap="round"/></>,
    chevR:   <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>,
    sparkle: <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" strokeLinecap="round" strokeLinejoin="round"/>,
    message: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>,
    zap:     <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>,
    wifi:    <><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" strokeLinecap="round"/></>,
    wifiOff: <><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" strokeLinecap="round"/></>,
    globe:   <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c||"currentColor"}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{flexShrink:0,display:"block",...st}}>
      {d[n]}
    </svg>
  );
};

/* ── UTILS ───────────────────────────────────────────────────────────────────── */
const fmtTime = d => new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
const fmtDate = d => {
  const diff = Date.now() - new Date(d);
  if(diff<86400000) return "Today";
  if(diff<172800000) return "Yesterday";
  return new Date(d).toLocaleDateString([],{month:"long",day:"numeric"});
};
const initials = n => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const uid = () => Math.random().toString(36).slice(2,9);
const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── ARC SPINNER ─────────────────────────────────────────────────────────────── */
const ArcSpinner = ({ size=36, color=C.accent }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{display:"block",flexShrink:0}}>
    <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeOpacity="0.15" strokeWidth="3"/>
    <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3"
      strokeLinecap="round" strokeDasharray="70 30"
      style={{transformOrigin:"center",animation:"spin 0.85s linear infinite"}}/>
  </svg>
);

/* ── AVATAR ──────────────────────────────────────────────────────────────────── */
const Av = ({ user, size=34, showDot=false }) => {
  const sc = { online:C.online, idle:C.idle, dnd:C.dnd, offline:C.offline };
  return (
    <div style={{position:"relative",flexShrink:0}}>
      <div style={{
        width:size,height:size,borderRadius:R.full,
        background:user?.avatar?"transparent":user?.color||C.accent,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:size*0.36,fontWeight:600,color:"#fff",
        letterSpacing:"-0.01em",userSelect:"none",
        boxShadow:`0 0 0 2px ${C.bg2}`,
        overflow:"hidden",
      }}>
        {user?.avatar
          ? <img src={user.avatar} alt={user?.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : initials(user?.name||"?")}
      </div>
      {showDot&&(
        <div style={{
          position:"absolute",bottom:-1,right:-1,
          width:size*0.28,height:size*0.28,borderRadius:"50%",
          background:sc[user?.status]||C.offline,
          border:`2px solid ${C.bg2}`,
        }}/>
      )}
    </div>
  );
};

/* ── TOOLTIP ─────────────────────────────────────────────────────────────────── */
const Tip = ({children,text,side="right"}) => {
  const [v,sv]=useState(false);
  const pos={
    right:{left:"calc(100% + 9px)",top:"50%",transform:"translateY(-50%)"},
    bottom:{top:"calc(100% + 9px)",left:"50%",transform:"translateX(-50%)"},
    top:{bottom:"calc(100% + 9px)",left:"50%",transform:"translateX(-50%)"},
    left:{right:"calc(100% + 9px)",top:"50%",transform:"translateY(-50%)"},
  };
  return (
    <div style={{position:"relative",display:"inline-flex"}}
      onMouseEnter={()=>sv(true)} onMouseLeave={()=>sv(false)}>
      {children}
      {v&&text&&(
        <div style={{
          position:"absolute",zIndex:9999,pointerEvents:"none",...pos[side],
          background:C.bg6,color:C.t0,fontSize:11,fontWeight:500,
          padding:"5px 10px",borderRadius:R.md,whiteSpace:"nowrap",
          boxShadow:C.shadow,border:`1px solid ${C.border}`,
          animation:"fadeIn 100ms ease",letterSpacing:"0.01em",
        }}>{text}</div>
      )}
    </div>
  );
};

/* ── INPUT STYLE ─────────────────────────────────────────────────────────────── */
const IS = {
  width:"100%",padding:"9px 12px",
  background:"rgba(255,255,255,0.04)",
  border:`1px solid ${C.border}`,
  borderRadius:R.md,color:C.t0,fontSize:13,outline:"none",
  transition:"border-color 190ms ease, box-shadow 190ms ease",
};

/* ── CONNECTION BANNER ───────────────────────────────────────────────────────── */
const ConnBanner = ({ connected }) => (
  <div style={{
    position:"fixed",bottom:14,left:"50%",transform:"translateX(-50%)",
    display:"flex",alignItems:"center",gap:8,
    padding:"7px 14px",borderRadius:R.full,
    background:connected?`rgba(52,211,153,0.12)`:`rgba(240,111,122,0.12)`,
    border:`1px solid ${connected?"rgba(52,211,153,0.3)":"rgba(240,111,122,0.3)"}`,
    fontSize:11,fontWeight:500,color:connected?C.online:C.rose,
    zIndex:500,animation:"fadeIn 300ms ease",boxShadow:C.shadowSm,
    backdropFilter:"blur(8px)",
  }}>
    <I n={connected?"wifi":"wifiOff"} s={12} c={connected?C.online:C.rose}/>
    {connected?"Connected to server":"Connecting to server…"}
  </div>
);

/* ── AUTH ────────────────────────────────────────────────────────────────────── */
const Auth = ({ onLogin }) => {
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({email:"",password:"",name:"",color:C.accent});
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);

  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const validate = () => {
    if(!form.email.trim()) return "Email is required.";
    if(!VALID_EMAIL.test(form.email.trim())) return "Please enter a valid email address.";
    if(!form.password) return "Password is required.";
    if(form.password.length < 6) return "Password must be at least 6 characters.";
    if(mode==="signup"&&!form.name.trim()) return "Display name is required.";
    return null;
  };

  const submit = async () => {
    const e=validate();
    if(e){setErr(e);return;}
    setLoading(true);setErr("");
    try {
      const endpoint = mode==="signup" ? "/auth/register" : "/auth/login";
      const body = mode==="signup"
        ? {email:form.email.trim(),password:form.password,name:form.name.trim(),color:form.color}
        : {email:form.email.trim(),password:form.password};
      const res = await fetch(`${SOCKET_URL}${endpoint}`,{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
      });
      const data = await res.json();
      if(!res.ok){setErr(data.error||"Something went wrong.");setLoading(false);return;}
      setDone(true);
      setTimeout(()=>onLogin(data.account, data.spaces||[]),900);
    } catch(_){
      setErr("Cannot connect to server. Make sure it's running.");
      setLoading(false);
    }
  };

  const COLORS=[C.accent,"#ec4899","#f0a843","#34d399","#60a5fa","#a78bfa","#f06f7a","#14b8a6"];

  if(done) return (
    <div style={{height:"100vh",width:"100%",background:C.bg0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:22}}>
      <div style={{position:"relative"}}>
        <ArcSpinner size={56} color={C.accent}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,animation:"pulse 1s ease infinite"}}/>
        </div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:15,fontWeight:500,color:C.t0,marginBottom:4}}>Loading your workspace</div>
        <div style={{fontSize:12,color:C.t2}}>Connecting to server…</div>
      </div>
      <div style={{width:200,height:2,background:C.bg4,borderRadius:1,overflow:"hidden"}}>
        <div style={{height:"100%",background:C.accent,borderRadius:1,animation:"progressBar 1s cubic-bezier(0.4,0,0.2,1) forwards"}}/>
      </div>
    </div>
  );

  return (
    <div style={{height:"100vh",width:"100%",background:C.bg0,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      {/* Ambient glows */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",top:"5%",left:"15%",width:600,height:600,borderRadius:"50%",background:"rgba(99,102,241,0.06)",filter:"blur(100px)",animation:"orbFloat 16s ease infinite"}}/>
        <div style={{position:"absolute",bottom:"10%",right:"10%",width:400,height:400,borderRadius:"50%",background:"rgba(240,168,67,0.05)",filter:"blur(80px)",animation:"orbFloat 20s ease infinite reverse"}}/>
        <div style={{position:"absolute",top:"50%",right:"25%",width:300,height:300,borderRadius:"50%",background:"rgba(240,111,122,0.04)",filter:"blur(70px)",animation:"orbFloat 12s ease infinite 3s"}}/>
      </div>

      <div style={{width:"100%",maxWidth:420,padding:"0 20px",animation:"authIn 400ms cubic-bezier(0.4,0,0.2,1)"}}>
        {/* Brand */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:11,marginBottom:12}}>
            <div style={{width:44,height:44,borderRadius:14,background:`linear-gradient(135deg,${C.accent},${C.accentLight})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${C.accentSoft}`}}>
              <span style={{fontFamily:FONT,fontWeight:600,fontSize:22,color:"#fff",fontStyle:"italic"}}>N</span>
            </div>
            <span style={{fontFamily:FONT,fontSize:30,fontWeight:600,letterSpacing:"-0.03em",color:C.t0}}>Nexus</span>
          </div>
          <p style={{fontSize:13,color:C.t2,lineHeight:1.5}}>
            {mode==="login"?"Welcome back — sign in to continue":"Create your account to get started"}
          </p>
        </div>

        <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:20,padding:"28px 26px",boxShadow:C.shadow}}>
          {/* Toggle */}
          <div style={{display:"flex",background:C.bg3,borderRadius:R.lg,padding:3,marginBottom:22}}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");}}
                style={{flex:1,padding:"7px 0",borderRadius:R.md,fontSize:12,fontWeight:500,
                  background:mode===m?C.bg6:"transparent",
                  color:mode===m?C.t0:C.t2,transition:T.base}}>
                {m==="login"?"Sign In":"Create Account"}
              </button>
            ))}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            {mode==="signup"&&(
              <div>
                <label style={{fontSize:10,color:C.t3,fontWeight:600,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Display Name</label>
                <input value={form.name} onChange={set("name")} placeholder="Your name" style={IS}/>
              </div>
            )}
            <div>
              <label style={{fontSize:10,color:C.t3,fontWeight:600,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Email</label>
              <input value={form.email} onChange={set("email")} type="email" placeholder="you@example.com" style={IS}/>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <label style={{fontSize:10,color:C.t3,fontWeight:600,letterSpacing:"0.09em",textTransform:"uppercase"}}>Password</label>
                {mode==="login"&&<button style={{fontSize:11,color:C.accentLight,background:"none",border:"none",cursor:"pointer"}}>Forgot?</button>}
              </div>
              <div style={{position:"relative"}}>
                <input value={form.password} onChange={set("password")} type={showPw?"text":"password"}
                  placeholder="••••••••" style={{...IS,paddingRight:40}}
                  onKeyDown={e=>e.key==="Enter"&&submit()}/>
                <button onClick={()=>setShowPw(!showPw)}
                  style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:C.t3,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center"}}>
                  <I n={showPw?"eyeOff":"eye"} s={14}/>
                </button>
              </div>
            </div>

            {mode==="signup"&&(
              <div>
                <label style={{fontSize:10,color:C.t3,fontWeight:600,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Avatar Color</label>
                <div style={{display:"flex",gap:7}}>
                  {COLORS.map(cl=>(
                    <button key={cl} onClick={()=>setForm(p=>({...p,color:cl}))}
                      style={{width:24,height:24,borderRadius:"50%",background:cl,
                        border:`2.5px solid ${form.color===cl?"#fff":"transparent"}`,
                        cursor:"pointer",transition:T.fast,flexShrink:0}}/>
                  ))}
                </div>
              </div>
            )}

            {err&&<div style={{fontSize:12,color:C.rose,padding:"8px 11px",background:C.roseSoft,borderRadius:R.md,border:`1px solid rgba(240,111,122,0.25)`,lineHeight:1.5}}>{err}</div>}

            <button onClick={submit} disabled={loading} className="btn-hover"
              style={{width:"100%",padding:"11px",marginTop:2,
                background:loading?C.bg4:`linear-gradient(135deg,${C.accent},${C.accentLight})`,
                color:loading?C.t3:"#fff",
                borderRadius:R.lg,fontSize:13,fontWeight:600,border:"none",cursor:loading?"not-allowed":"pointer",
                transition:T.base,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                boxShadow:loading?"none":`0 4px 20px ${C.accentSoft}`}}>
              {loading
                ? <><ArcSpinner size={18} color={C.t2}/> Signing in…</>
                : mode==="login"?"Sign In →":"Create Account →"}
            </button>

            <div style={{position:"relative",textAlign:"center"}}>
              <div style={{position:"absolute",inset:"50% 0 auto",height:1,background:C.border}}/>
              <span style={{position:"relative",fontSize:11,color:C.t3,background:C.bg2,padding:"0 10px"}}>or</span>
            </div>

            <div style={{display:"flex",gap:8}}>
              {["Google","GitHub"].map(p=>(
                <button key={p} onClick={submit} className="btn-hover"
                  style={{flex:1,padding:"9px",border:`1px solid ${C.border}`,borderRadius:R.md,
                    background:C.bg3,color:C.t1,fontSize:12,fontWeight:500,cursor:"pointer",transition:T.base}}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p style={{textAlign:"center",fontSize:11,color:C.t4,marginTop:14}}>By signing in you agree to our Terms & Privacy Policy.</p>
      </div>
    </div>
  );
};

/* ── SPACE SIDEBAR ───────────────────────────────────────────────────────────── */
const SpaceSidebar = ({ spaces, active, onSelect, onCreate, me, onToggleSidebar, sidebarOpen }) => (
  <div className="space-sidebar" style={{width:66,minWidth:66,background:C.bg0,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:12,gap:6,borderRight:`1px solid ${C.border}`,flexShrink:0,height:"100%",overflowY:"auto",overflowX:"hidden"}}>
    {/* Hamburger — only visible on mobile via CSS */}
    <button onClick={onToggleSidebar} className="mobile-menu-btn" style={{
      width:44,height:44,borderRadius:R.lg,
      background:sidebarOpen?C.accentSoft:C.bg3,
      color:sidebarOpen?C.accentLight:C.t2,
      alignItems:"center",justifyContent:"center",
      border:"none",cursor:"pointer",flexShrink:0,
    }}>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <Tip text="Home" side="right">
      <button onClick={()=>onSelect(null)} className="space-btn home-btn" style={{
        width:44,height:44,borderRadius:active===null?R.lg:R.full,
        background:active===null?C.accent:C.bg3,
        color:active===null?"#fff":C.t2,
        display:"flex",alignItems:"center",justifyContent:"center",
        border:"none",cursor:"pointer",transition:`all ${T.slow}`,flexShrink:0,
      }}>
        <I n="home" s={17} c={active===null?"#fff":undefined}/>
      </button>
    </Tip>

    <div style={{width:30,height:1,background:C.border,margin:"3px 0",flexShrink:0}}/>

    {spaces.map(sp=>{
      const isActive=active?.id===sp.id;
      const total=sp.categories?.flatMap(c=>c.channels).reduce((a,ch)=>a+(ch.unread||0),0)||0;
      return (
        <Tip key={sp.id} text={sp.name} side="right">
          <div style={{position:"relative"}}>
            {isActive&&<div style={{position:"absolute",left:-6,top:"50%",transform:"translateY(-50%)",width:3,height:26,background:C.t0,borderRadius:"0 3px 3px 0"}}/>}
            <button onClick={()=>onSelect(sp)} className="space-btn" style={{
              width:44,height:44,borderRadius:isActive?R.lg:R.full,
              background:isActive?sp.color:C.bg3,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:20,border:"none",cursor:"pointer",
              transition:`all ${T.slow}`,position:"relative",flexShrink:0,
            }}>
              {sp.icon}
              {!isActive&&total>0&&<div style={{position:"absolute",bottom:-2,right:-2,minWidth:16,height:16,borderRadius:8,background:C.rose,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{total>9?"9+":total}</div>}
            </button>
          </div>
        </Tip>
      );
    })}

    <div style={{width:30,height:1,background:C.border,margin:"2px 0",flexShrink:0}}/>

    <Tip text="Create Space" side="right">
      <button onClick={onCreate} style={{
        width:44,height:44,borderRadius:R.full,
        border:`1.5px dashed ${C.accentLight}`,
        background:"transparent",color:C.accentLight,
        display:"flex",alignItems:"center",justifyContent:"center",
        cursor:"pointer",transition:T.base,opacity:0.65,flexShrink:0,
      }}>
        <I n="plus" s={17}/>
      </button>
    </Tip>

    <div style={{marginTop:"auto",marginBottom:12,flexShrink:0}}>
      <Av user={me} size={34} showDot/>
    </div>
  </div>
);

/* ── CHANNEL SIDEBAR ─────────────────────────────────────────────────────────── */
const ChannelSidebar = ({ space, activeCh, onSelectCh, me, onLogout, onOpenProfile, onAddChannel, onInvite, open, onClose }) => {
  const [collapsed,setCollapsed]=useState({});
  const [q,setQ]=useState("");

  if(!space) return (
    <div className={`channel-sidebar${open?" open":""}`} style={{width:236,minWidth:236,background:C.bg1,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",height:"100%",flexShrink:0}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:24,opacity:0.5}}>
        <div style={{fontSize:30}}>◈</div>
        <div style={{fontSize:13,color:C.t3,textAlign:"center",lineHeight:1.7}}>Select a space<br/>or create a new one.</div>
      </div>
      <UserPanel me={me} onLogout={onLogout} onOpenProfile={onOpenProfile}/>
    </div>
  );

  const allChs = space.categories.flatMap(c=>c.channels);
  const filtered = q ? allChs.filter(ch=>ch.name.toLowerCase().includes(q.toLowerCase())) : null;

  return (
    <div className={`channel-sidebar${open?" open":""}`} style={{width:236,minWidth:236,background:C.bg1,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",animation:"slideL 200ms ease",height:"100%",flexShrink:0}}>
      <div style={{padding:"14px 12px 10px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,overflow:"hidden"}}>
            <div style={{width:30,height:30,borderRadius:9,background:space.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{space.icon}</div>
            <div style={{overflow:"hidden"}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{space.name}</div>
              <div style={{fontSize:10,color:C.t3}}>{space.members?.length||1} member{(space.members?.length||1)!==1?"s":""}</div>
            </div>
          </div>
          <Tip text="Settings" side="bottom">
            <button style={{color:C.t3,display:"flex",alignItems:"center",background:"none",border:"none",cursor:"pointer",padding:3,flexShrink:0}}><I n="cfg" s={13}/></button>
          </Tip>
          <Tip text="Invite People" side="bottom">
            <button onClick={onInvite} style={{color:C.accentLight,display:"flex",alignItems:"center",background:"none",border:"none",cursor:"pointer",padding:3,flexShrink:0}}><I n="users" s={13}/></button>
          </Tip>
          {/* Close drawer — mobile only */}
          <button onClick={onClose} className="mobile-menu-btn" style={{color:C.t3,alignItems:"center",background:"none",border:"none",cursor:"pointer",padding:3,flexShrink:0,marginLeft:2}}><I n="x" s={15}/></button>
        </div>
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:C.t3,display:"flex"}}><I n="search" s={12}/></div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Find channel…"
            style={{...IS,padding:"5px 8px 5px 26px",fontSize:12}}/>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"6px 4px"}}>
        {filtered ? (
          filtered.length===0
            ? <div style={{padding:"12px 8px",fontSize:12,color:C.t3}}>No results.</div>
            : filtered.map(ch=><ChItem key={ch.id} ch={ch} active={activeCh?.id===ch.id} onClick={()=>onSelectCh(ch)}/>)
        ) : (
          space.categories.map(cat=>{
            const isCol=collapsed[cat.id];
            return (
              <div key={cat.id} style={{marginBottom:6}}>
                <button onClick={()=>setCollapsed(p=>({...p,[cat.id]:!p[cat.id]}))}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:3,padding:"3px 6px",
                    color:C.t3,fontSize:10,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",
                    background:"none",border:"none",cursor:"pointer"}}>
                  <div style={{transition:T.fast,transform:isCol?"rotate(-90deg)":"rotate(0deg)",display:"flex"}}><I n="chev" s={11}/></div>
                  {cat.name}
                  <Tip text="Add channel" side="right">
                    <div style={{marginLeft:"auto",display:"flex",alignItems:"center",color:C.t3,padding:2}}
                      onClick={e=>{e.stopPropagation();onAddChannel();}}>
                      <I n="plus" s={12}/>
                    </div>
                  </Tip>
                </button>
                {!isCol&&cat.channels.map(ch=>(
                  <ChItem key={ch.id} ch={ch} active={activeCh?.id===ch.id} onClick={()=>onSelectCh(ch)}/>
                ))}
              </div>
            );
          })
        )}
      </div>

      <UserPanel me={me} onLogout={onLogout} onOpenProfile={onOpenProfile}/>
    </div>
  );
};

const ChItem = ({ ch, active, onClick }) => (
  <button onClick={onClick} className="ch-item" style={{
    width:"100%",display:"flex",alignItems:"center",gap:6,padding:"5px 8px",
    borderRadius:R.md,
    background:active?C.accentSoft:"transparent",
    color:active?C.t0:ch.unread?C.t1:C.t2,
    fontSize:12,fontWeight:ch.unread?600:active?500:400,
    border:"none",cursor:"pointer",textAlign:"left",transition:T.fast,
  }}>
    <div style={{color:active?C.accentLight:undefined,display:"flex",flexShrink:0}}>
      <I n={ch.type==="voice"?"vol":"hash"} s={13}/>
    </div>
    <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.name}</span>
    {ch.unread>0&&(
      <div style={{minWidth:16,height:16,borderRadius:8,background:C.rose,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>
        {ch.unread>99?"99+":ch.unread}
      </div>
    )}
  </button>
);

const UserPanel = ({ me, onLogout, onOpenProfile }) => (
  <div style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8,flexShrink:0,background:C.bg0}}>
    <div style={{cursor:"pointer"}} onClick={onOpenProfile}><Av user={me} size={30} showDot/></div>
    <div style={{flex:1,overflow:"hidden",cursor:"pointer",minWidth:0}} onClick={onOpenProfile}>
      <div style={{fontSize:12,fontWeight:600,color:C.t0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{me?.name}</div>
      <div style={{fontSize:10,color:C.t3}}>#{me?.tag||"0001"}</div>
    </div>
    <div style={{display:"flex",gap:1,flexShrink:0}}>
      <Tip text="Profile" side="top">
        <button onClick={onOpenProfile} style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,color:C.t3,background:"none",border:"none",cursor:"pointer"}}><I n="cfg" s={13}/></button>
      </Tip>
      <Tip text="Sign Out" side="top">
        <button onClick={onLogout} style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,color:C.t3,background:"none",border:"none",cursor:"pointer"}}><I n="logout" s={13}/></button>
      </Tip>
    </div>
  </div>
);

/* ── INVITE MODAL (per-space) ────────────────────────────────────────────────── */
const InviteModal = ({ space, onClose }) => {
  const [copied,setCopied]=useState(false);
  const [code,setCode]=useState(space.inviteCode||"");

  useEffect(()=>{
    if(!space.inviteCode){
      getSocket().emit("get_invite",space.id);
      const sk=getSocket();
      const handler=({code:c,spaceId})=>{ if(spaceId===space.id) setCode(c); };
      sk.on("invite_info",handler);
      return()=>sk.off("invite_info",handler);
    }
  },[space.id,space.inviteCode]);

  const inviteUrl = code ? `${window.location.origin}?invite=${code}` : "Generating…";

  const copy = () => {
    if(!code) return;
    navigator.clipboard.writeText(inviteUrl).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false),2500);
    });
  };

  return (
    <Modal title={`Invite to ${space.name}`} onClose={onClose} width={420}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:C.bg3,borderRadius:R.lg,border:`1px solid ${C.border}`}}>
          <div style={{width:40,height:40,borderRadius:12,background:space.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{space.icon}</div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.t0}}>{space.name}</div>
            <div style={{fontSize:11,color:C.t3}}>{space.members?.length||1} member{(space.members?.length||1)!==1?"s":""}</div>
          </div>
        </div>

        <div>
          <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:8}}>Invite Link</div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,background:C.bg3,border:`1px solid ${C.border}`,borderRadius:R.md,padding:"10px 12px",fontSize:12,color:C.t2,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",userSelect:"all"}}>
              {inviteUrl}
            </div>
            <button onClick={copy} className="btn-hover"
              style={{padding:"10px 16px",borderRadius:R.md,background:copied?C.online:C.accent,color:"#fff",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",transition:T.base,flexShrink:0,display:"flex",alignItems:"center",gap:6}}>
              <I n={copied?"check":"at"} s={13} c="#fff"/>
              {copied?"Copied!":"Copy Link"}
            </button>
          </div>
        </div>

        <div style={{fontSize:12,color:C.t2,lineHeight:1.7,padding:"10px 12px",background:C.accentSofter,borderRadius:R.md,border:`1px solid ${C.accentSoft}`}}>
          Anyone with this link can join <strong style={{color:C.t0,fontWeight:600}}>{space.name}</strong>. Send it via any messaging app — they just paste it in their browser.
        </div>

        <div style={{fontSize:11,color:C.t3}}>
          Invite code: <span style={{fontFamily:"monospace",color:C.accentLight,letterSpacing:"0.08em"}}>{code||"…"}</span>
        </div>
      </div>
    </Modal>
  );
};

/* ── JOIN BY INVITE (shown on load if ?invite= param present) ───────────────── */
const JoinInviteScreen = ({ code, onJoined, onCancel, me }) => {
  const [info,setInfo]=useState(null);
  const [err,setErr]=useState("");
  const [joining,setJoining]=useState(false);

  useEffect(()=>{
    fetch(`${SOCKET_URL}/invite/${code}`)
      .then(r=>r.json())
      .then(d=>{ if(d.error) setErr(d.error); else setInfo(d); })
      .catch(()=>setErr("Could not reach server."));
  },[code]);

  const join = () => {
    setJoining(true);
    getSocket().emit("join_by_invite",code);
    const sk=getSocket();
    const onResolved=({spaceId})=>{
      sk.emit("join_space",spaceId);
      sk.once("space_joined",({space})=>{ onJoined(space); });
      sk.off("invite_error",onErr);
    };
    const onErr=(msg)=>{ setErr(msg); setJoining(false); sk.off("invite_resolved",onResolved); };
    sk.once("invite_resolved",onResolved);
    sk.once("invite_error",onErr);
  };

  return (
    <div style={{height:"100vh",width:"100%",background:C.bg0,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:380,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:20,padding:28,boxShadow:C.shadow,animation:"authIn 400ms ease"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:FONT,fontSize:20,fontWeight:600,color:C.t0,marginBottom:6}}>You've been invited!</div>
          <div style={{fontSize:13,color:C.t2}}>You're about to join a Nexus space.</div>
        </div>
        {err && <div style={{fontSize:12,color:C.rose,padding:"8px 11px",background:C.roseSoft,borderRadius:R.md,marginBottom:14,textAlign:"center"}}>{err}</div>}
        {info ? (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:C.bg3,borderRadius:R.lg,border:`1px solid ${C.border}`}}>
              <div style={{width:48,height:48,borderRadius:14,background:info.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{info.icon}</div>
              <div>
                <div style={{fontSize:15,fontWeight:600,color:C.t0}}>{info.name}</div>
                <div style={{fontSize:11,color:C.t3}}>{info.memberCount} member{info.memberCount!==1?"s":""}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={onCancel} style={{flex:1,padding:"10px",border:`1px solid ${C.border}`,borderRadius:R.md,background:"transparent",color:C.t2,fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={join} disabled={joining} className="btn-hover"
                style={{flex:1,padding:"10px",background:C.accent,borderRadius:R.md,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:joining?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {joining?<><ArcSpinner size={16} color="#fff"/> Joining…</>:"Join Space →"}
              </button>
            </div>
          </div>
        ) : !err && (
          <div style={{display:"flex",justifyContent:"center",padding:"20px 0"}}><ArcSpinner size={32} color={C.accent}/></div>
        )}
      </div>
    </div>
  );
};

/* ── HOME DASHBOARD ──────────────────────────────────────────────────────────── */
const HomeDashboard = ({ me, spaces, onSelectSpace, onCreate, onlineUsers }) => {
  const hour=new Date().getHours();
  const greeting=hour<12?"Good morning":hour<18?"Good afternoon":"Good evening";

  return (
    <div style={{flex:1,background:C.bg1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
      <div style={{height:50,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <span style={{fontSize:14,fontWeight:600,color:C.t0}}>Home</span>
        <div style={{fontSize:11,color:C.t2,display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.online}}/>
          {onlineUsers} online
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"32px 28px"}}>
        <div style={{marginBottom:32,animation:"fadeUp 300ms ease"}}>
          <div style={{fontFamily:FONT,fontSize:26,fontWeight:600,color:C.t0,letterSpacing:"-0.03em",marginBottom:6}}>
            {greeting}, {me?.name?.split(" ")[0]} ◈
          </div>
          <div style={{fontSize:14,color:C.t2}}>
            {spaces.length===0
              ? "Create your first space to start chatting with others."
              : `You're in ${spaces.length} space${spaces.length!==1?"s":""}. ${onlineUsers} people online now.`}
          </div>
        </div>

        {spaces.length>0&&(
          <div style={{marginBottom:30,animation:"fadeUp 350ms ease"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.t3,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:12}}>Your Spaces</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>
              {spaces.map(sp=>{
                const unread=sp.categories?.flatMap(c=>c.channels).reduce((a,ch)=>a+(ch.unread||0),0)||0;
                const chCount=sp.categories?.flatMap(c=>c.channels).length||0;
                return (
                  <button key={sp.id} onClick={()=>onSelectSpace(sp)} className="btn-hover"
                    style={{textAlign:"left",padding:"14px 16px",borderRadius:R.xl,
                      background:C.bg2,border:`1px solid ${C.border}`,cursor:"pointer",
                      transition:T.base,display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <div style={{width:38,height:38,borderRadius:12,background:sp.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,boxShadow:`0 4px 12px ${sp.color}40`}}>{sp.icon}</div>
                      <div style={{overflow:"hidden"}}>
                        <div style={{fontSize:13,fontWeight:600,color:C.t0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.name}</div>
                        <div style={{fontSize:10,color:C.t3}}>{chCount} channel{chCount!==1?"s":""}</div>
                      </div>
                    </div>
                    {unread>0&&<div style={{fontSize:11,color:C.accentLight,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:C.accentLight}}/>{unread} unread</div>}
                  </button>
                );
              })}
              <button onClick={onCreate} className="btn-hover"
                style={{textAlign:"left",padding:"14px 16px",borderRadius:R.xl,
                  background:"transparent",border:`1.5px dashed ${C.border}`,cursor:"pointer",
                  transition:T.base,display:"flex",alignItems:"center",gap:9,color:C.t3}}>
                <div style={{width:38,height:38,borderRadius:12,border:`1.5px dashed ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <I n="plus" s={16}/>
                </div>
                <span style={{fontSize:13,fontWeight:500}}>New Space</span>
              </button>
            </div>
          </div>
        )}

        <div style={{animation:"fadeUp 400ms ease"}}>
          <div style={{fontSize:11,fontWeight:700,color:C.t3,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:12}}>
            {spaces.length===0?"Getting Started":"Tips"}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {icon:"sparkle",title:"Create a Space",body:"Group your channels by topic, team, or project.",action:onCreate},
              {icon:"message",title:"Start chatting",body:"Messages sync in real-time across all connected users."},
              {icon:"users",  title:"Invite friends",body:"Open any space and click the Invite button to get a shareable link."},
            ].map((tip,i)=>(
              <div key={i} onClick={tip.action}
                style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",
                  borderRadius:R.xl,background:C.bg2,border:`1px solid ${C.border}`,
                  cursor:tip.action?"pointer":"default",transition:T.base}}>
                <div style={{width:34,height:34,borderRadius:10,background:C.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <I n={tip.icon} s={15} c={C.accentLight}/>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:C.t0,marginBottom:3}}>{tip.title}</div>
                  <div style={{fontSize:12,color:C.t2,lineHeight:1.55}}>{tip.body}</div>
                </div>
                {tip.action&&<I n="chevR" s={14} c={C.t4} style={{marginLeft:"auto",marginTop:2,flexShrink:0}}/>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── CHAT ────────────────────────────────────────────────────────────────────── */
const Chat = ({ ch, spaceId, msgs, onSend, typing, onReact, me, onOpenSidebar }) => {
  const [input,setInput]=useState("");
  const [emojiOpen,setEmojiOpen]=useState(false);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);
  const typingTimer=useRef(null);
  const EMOJIS=["👍","❤️","🔥","🎉","😂","😮","🙌","👀","💯","⚡","🚀","✨","🤔","😄","🌊","🎯"];

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,typing]);

  const handleInput = (e) => {
    setInput(e.target.value);
    const sk = getSocket();
    sk.emit("typing_start",{channelId:ch.id,spaceId});
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(()=>sk.emit("typing_stop",{channelId:ch.id,spaceId}),1500);
  };

  const send = () => {
    if(!input.trim()) return;
    onSend(input.trim());
    setInput("");
    getSocket().emit("typing_stop",{channelId:ch.id,spaceId});
    inputRef.current?.focus();
  };

  const grouped = msgs.reduce((acc,m,i)=>{
    const prev=msgs[i-1];
    acc.push({...m,grouped:prev&&prev.authorId===m.authorId&&(new Date(m.ts)-new Date(prev.ts))<240000});
    return acc;
  },[]);

  let lastDate=null;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:C.bg1,overflow:"hidden",minWidth:0}}>
      {/* Header */}
      <div style={{height:50,padding:"0 18px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7,overflow:"hidden"}}>
          {/* Mobile: back to sidebar */}
          <button onClick={onOpenSidebar} className="mobile-menu-btn" style={{alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:R.md,background:"none",border:"none",cursor:"pointer",color:C.t2,flexShrink:0,marginRight:2}}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{color:C.t2,display:"flex",flexShrink:0}}><I n={ch.type==="voice"?"vol":"hash"} s={17}/></div>
          <span style={{fontSize:14,fontWeight:500,color:C.t0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.name}</span>
          {ch.desc&&<><div style={{width:1,height:14,background:C.border,margin:"0 5px",flexShrink:0}}/><span style={{fontSize:12,color:C.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.desc}</span></>}
        </div>
        <div style={{display:"flex",gap:2,flexShrink:0}}>
          {[{n:"bell",t:"Notifications"},{n:"pin",t:"Pinned"},{n:"users",t:"Members"},{n:"search",t:"Search"}].map(({n,t})=>(
            <Tip key={n} text={t} side="bottom">
              <button style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:R.md,color:C.t3,background:"none",border:"none",cursor:"pointer"}}><I n={n} s={16}/></button>
            </Tip>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px",display:"flex",flexDirection:"column"}}>
        <div style={{marginBottom:22,padding:18,background:C.bg2,borderRadius:R.xl,border:`1px solid ${C.border}`,animation:"fadeUp 300ms ease",flexShrink:0}}>
          <div style={{fontSize:22,marginBottom:6,color:C.accentLight}}>#</div>
          <div style={{fontFamily:FONT,fontSize:17,fontWeight:600,color:C.t0,marginBottom:4,letterSpacing:"-0.02em"}}>Welcome to #{ch.name}</div>
          <div style={{fontSize:13,color:C.t2}}>{ch.desc||"Start the conversation!"}</div>
        </div>

        {msgs.length===0&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,opacity:0.3,paddingBottom:40}}>
            <div style={{fontSize:32}}>◈</div>
            <div style={{fontSize:13,color:C.t2}}>No messages yet.</div>
          </div>
        )}

        {grouped.map(msg=>{
          const dateStr=fmtDate(msg.ts);
          const showSep=dateStr!==lastDate;
          if(showSep) lastDate=dateStr;
          return (
            <div key={msg.id}>
              {showSep&&(
                <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0 10px"}}>
                  <div style={{flex:1,height:1,background:C.border}}/>
                  <span style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase"}}>{dateStr}</span>
                  <div style={{flex:1,height:1,background:C.border}}/>
                </div>
              )}
              <MsgItem msg={msg} me={me} onReact={emoji=>onReact(msg.id,emoji)}/>
            </div>
          );
        })}

        {typing.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",animation:"fadeIn 150ms ease"}}>
            <div style={{display:"flex",gap:3}}>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:C.t2,animation:`dot 1.2s ease ${i*0.2}s infinite`}}/>)}
            </div>
            <span style={{fontSize:11,color:C.t2}}>
              <strong style={{color:C.t1,fontWeight:600}}>{typing.join(", ")}</strong> {typing.length===1?"is":"are"} typing…
            </span>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Composer */}
      <div style={{padding:"10px 18px 14px",flexShrink:0}}>
        <div
          style={{background:C.bg3,border:`1px solid ${C.borderHover}`,borderRadius:R.xl,overflow:"hidden",cursor:"text"}}
          onClick={()=>inputRef.current?.focus()}
        >
          <div style={{display:"flex",alignItems:"flex-end",gap:6,padding:"9px 12px 9px 14px"}}>
            <textarea ref={inputRef} value={input}
              onChange={handleInput}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),send())}
              placeholder={`Message #${ch.name}`}
              style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.t0,fontSize:13,resize:"none",maxHeight:140,lineHeight:1.5,minHeight:20,fontFamily:FONTUI,cursor:"text"}}
              rows={1}/>
            <div style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
              <Tip text="Attach" side="top"><button style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:R.md,color:C.t3,background:"none",border:"none",cursor:"pointer"}}><I n="clip" s={15}/></button></Tip>
              <Tip text="Emoji" side="top">
                <button onClick={()=>setEmojiOpen(!emojiOpen)} style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:R.md,color:emojiOpen?C.gold:C.t3,background:emojiOpen?C.goldSoft:"none",border:"none",cursor:"pointer"}}><I n="smile" s={15}/></button>
              </Tip>
              <button onClick={send} disabled={!input.trim()}
                style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:R.md,
                  background:input.trim()?C.accent:C.bg5,
                  color:input.trim()?"#fff":C.t3,
                  border:"none",cursor:input.trim()?"pointer":"not-allowed",transition:T.fast,
                  boxShadow:input.trim()?`0 2px 10px ${C.accentSoft}`:"none"}}>
                <I n="send" s={13} c={input.trim()?"#fff":undefined}/>
              </button>
            </div>
          </div>
          {emojiOpen&&(
            <div style={{padding:"6px 10px 10px",borderTop:`1px solid ${C.border}`,display:"flex",flexWrap:"wrap",gap:3}}>
              {EMOJIS.map(e=>(
                <button key={e} onClick={()=>{setInput(p=>p+e);setEmojiOpen(false);}}
                  style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,borderRadius:R.md,border:"none",background:"transparent",cursor:"pointer"}}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── MESSAGE ITEM ────────────────────────────────────────────────────────────── */
const MsgItem = ({ msg, me, onReact }) => {
  const [hov,setHov]=useState(false);
  const QUICK=["👍","❤️","🔥","🎉","😂"];
  const isMe = msg.authorId===me?.id || msg.authorId==="me";

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",gap:10,padding:msg.grouped?"1px 6px":"5px 6px",
        borderRadius:R.md,background:hov?"rgba(255,255,255,0.025)":"transparent",
        margin:"0 -6px",position:"relative",alignItems:"flex-start",transition:"background 100ms ease"}}>

      {msg.grouped
        ? <div style={{width:34,flexShrink:0,display:"flex",justifyContent:"center",alignItems:"center"}}>
            {hov&&<span style={{fontSize:9,color:C.t4}}>{fmtTime(msg.ts)}</span>}
          </div>
        : <Av user={msg.author} size={34}/>
      }

      <div style={{flex:1,minWidth:0}}>
        {!msg.grouped&&(
          <div style={{display:"flex",alignItems:"baseline",gap:7,marginBottom:2}}>
            <span style={{fontSize:13,fontWeight:600,color:msg.author?.color||C.t0}}>{msg.author?.name}{isMe&&<span style={{fontSize:10,color:C.t3,fontWeight:400,marginLeft:4}}>(you)</span>}</span>
            <span style={{fontSize:10,color:C.t3}}>{fmtTime(msg.ts)}</span>
          </div>
        )}
        <div style={{fontSize:13,color:C.t1,lineHeight:1.6,wordBreak:"break-word",fontWeight:400}}>{msg.content}</div>

        {msg.reactions?.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:5}}>
            {msg.reactions.map((r,i)=>{
              const mine = r.users.includes(me?.id)||r.users.includes("me");
              return (
                <button key={i} onClick={()=>onReact(r.emoji)}
                  style={{display:"flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:R.full,
                    background:mine?C.accentSoft:C.bg4,
                    border:`1px solid ${mine?C.accent:C.border}`,
                    fontSize:11,color:mine?C.accentLight:C.t2,cursor:"pointer"}}>
                  <span style={{fontSize:12}}>{r.emoji}</span>
                  <span style={{fontWeight:600}}>{r.users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {hov&&(
        <div style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",
          display:"flex",gap:1,background:C.bg4,border:`1px solid ${C.border}`,
          borderRadius:R.lg,padding:"2px 3px",boxShadow:C.shadowSm,animation:"scaleIn 100ms ease",zIndex:5}}>
          {QUICK.map(e=>(
            <button key={e} onClick={()=>onReact(e)}
              style={{width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:14,borderRadius:R.md,border:"none",background:"transparent",cursor:"pointer"}}>
              {e}
            </button>
          ))}
          <div style={{width:1,background:C.border,margin:"3px 2px"}}/>
          <Tip text="Reply" side="top">
            <button style={{width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:R.md,color:C.t3,border:"none",background:"none",cursor:"pointer"}}><I n="at" s={13}/></button>
          </Tip>
          <Tip text="Edit" side="top">
            <button style={{width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:R.md,color:C.t3,border:"none",background:"none",cursor:"pointer"}}><I n="edit" s={13}/></button>
          </Tip>
        </div>
      )}
    </div>
  );
};

/* ── MEMBERS PANEL ───────────────────────────────────────────────────────────── */
const Members = ({ spaceMembers, allOnlineUsers }) => {
  const online=[],offline=[];
  (spaceMembers||[]).forEach(u=>{
    const live=allOnlineUsers.find(x=>x.id===u.id)||u;
    if(live.status==="online"||live.status==="idle"||live.status==="dnd") online.push(live);
    else offline.push(live);
  });
  const Sec=({title,users,color})=>users.length===0?null:(
    <div style={{marginBottom:14}}>
      <div style={{fontSize:9,fontWeight:700,color:C.t4,letterSpacing:"0.1em",textTransform:"uppercase",padding:"0 8px",marginBottom:3}}>{title} — {users.length}</div>
      {users.map(u=>(
        <div key={u.id} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 8px",borderRadius:R.md,cursor:"pointer"}}>
          <Av user={u} size={28} showDot/>
          <div style={{overflow:"hidden"}}>
            <div style={{fontSize:12,fontWeight:500,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
            {u.bio&&<div style={{fontSize:10,color:C.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.bio}</div>}
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="members-panel" style={{width:204,minWidth:204,background:C.bg1,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,height:"100%",overflow:"hidden",animation:"slideR 200ms ease"}}>
      <div style={{padding:"13px 12px 8px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{fontSize:11,fontWeight:700,color:C.t2,letterSpacing:"0.05em"}}>Members</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 4px"}}>
        <Sec title="Online" users={online}/>
        <Sec title="Offline" users={offline}/>
      </div>
    </div>
  );
};

/* ── MODALS ──────────────────────────────────────────────────────────────────── */
const Overlay = ({children,onClose})=>(
  <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)",padding:20}}>
    <div onClick={e=>e.stopPropagation()} style={{animation:"scaleIn 200ms cubic-bezier(0.4,0,0.2,1)",maxHeight:"calc(100vh - 40px)",overflowY:"auto",borderRadius:R.xl}}>
      {children}
    </div>
  </div>
);

const Modal = ({children,title,onClose,width=380})=>(
  <div style={{width:Math.min(width,typeof window!=="undefined"?window.innerWidth-40:360),background:C.bg2,border:`1px solid ${C.border}`,borderRadius:20,padding:26,boxShadow:C.shadow}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div style={{fontFamily:FONT,fontSize:16,fontWeight:600,color:C.t0,letterSpacing:"-0.02em"}}>{title}</div>
      <button onClick={onClose} style={{color:C.t3,background:"none",border:"none",cursor:"pointer",display:"flex"}}><I n="x" s={17}/></button>
    </div>
    {children}
  </div>
);

const CreateSpaceModal = ({ onClose, onCreate }) => {
  const [name,setName]=useState("");
  const [icon,setIcon]=useState("✦");
  const [color,setColor]=useState(C.accent);
  const ICONS=["✦","🌿","🔮","🏔","🌊","🎯","🌙","☀️","🦋","🌸","🎵","📐","🌴","🔬","⚡","🎨","🍃","🌾"];
  const COLORS=[C.accent,"#ec4899","#f0a843","#34d399","#60a5fa","#a78bfa","#f06f7a","#14b8a6"];

  return (
    <Modal title="Create a Space" onClose={onClose} width={380}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,marginBottom:20}}>
        <div style={{width:64,height:64,borderRadius:20,background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,transition:"all 200ms ease",boxShadow:`0 8px 24px ${color}50`}}>{icon}</div>
        <div style={{fontSize:11,color:C.t3}}>Preview</div>
      </div>

      <div style={{marginBottom:14}}>
        <label style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Icon</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {ICONS.map(ic=>(
            <button key={ic} onClick={()=>setIcon(ic)}
              style={{width:32,height:32,borderRadius:R.md,fontSize:16,border:`1.5px solid ${icon===ic?C.accent:C.border}`,background:icon===ic?C.accentSoft:C.bg3,cursor:"pointer"}}>
              {ic}
            </button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:14}}>
        <label style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Color</label>
        <div style={{display:"flex",gap:7}}>
          {COLORS.map(cl=>(
            <button key={cl} onClick={()=>setColor(cl)}
              style={{width:24,height:24,borderRadius:"50%",background:cl,border:`2.5px solid ${color===cl?"#fff":"transparent"}`,cursor:"pointer",transition:T.fast}}/>
          ))}
        </div>
      </div>

      <div style={{marginBottom:20}}>
        <label style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Space Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Study Group, Gaming Squad…"
          style={IS} autoFocus onKeyDown={e=>e.key==="Enter"&&name.trim()&&(onCreate({name:name.trim(),icon,color}),onClose())}/>
      </div>

      <div style={{display:"flex",gap:8}}>
        <button onClick={onClose} style={{flex:1,padding:"9px",border:`1px solid ${C.border}`,borderRadius:R.md,background:"transparent",color:C.t2,fontSize:13,cursor:"pointer"}}>Cancel</button>
        <button onClick={()=>{if(name.trim()){onCreate({name:name.trim(),icon,color});onClose();}}} className="btn-hover"
          style={{flex:1,padding:"9px",background:C.accent,borderRadius:R.md,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer"}}>
          Create Space
        </button>
      </div>
    </Modal>
  );
};

const ProfileModal = ({ me, onClose, onUpdate, onLogout }) => {
  const [name,setName]=useState(me.name);
  const [bio,setBio]=useState(me.bio||"");
  const [status,setStatus]=useState(me.status);
  const [avatar,setAvatar]=useState(me.avatar||null);
  const fileRef=useRef(null);

  const handleAvatarChange = (e) => {
    const file=e.target.files?.[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const STATUSES=[
    {v:"online",label:"Online",c:C.online},
    {v:"idle",label:"Idle",c:C.idle},
    {v:"dnd",label:"Do Not Disturb",c:C.dnd},
    {v:"offline",label:"Appear Offline",c:C.offline},
  ];
  return (
    <Modal title="My Profile" onClose={onClose} width={360}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,marginBottom:22}}>
        <div style={{position:"relative"}}>
          <Av user={{...me,name,avatar}} size={66}/>
          <button
            onClick={()=>fileRef.current?.click()}
            style={{position:"absolute",bottom:-2,right:-2,width:22,height:22,borderRadius:"50%",background:C.bg5,border:`2px solid ${C.bg2}`,display:"flex",alignItems:"center",justifyContent:"center",color:C.t2,cursor:"pointer"}}
            title="Upload profile photo">
            <I n="edit" s={10}/>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{display:"none"}}/>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:FONT,fontSize:16,fontWeight:600,color:C.t0}}>{name||me.name}</div>
          <div style={{fontSize:11,color:C.t3}}>#{me.tag}</div>
          {avatar&&<button onClick={()=>setAvatar(null)} style={{fontSize:10,color:C.rose,background:"none",border:"none",cursor:"pointer",marginTop:3}}>Remove photo</button>}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div>
          <label style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Display Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} style={IS}/>
        </div>
        <div>
          <label style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Bio</label>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Something about you…"
            style={{...IS,resize:"none",height:60,lineHeight:1.5}}/>
        </div>
        <div>
          <label style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Status</label>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {STATUSES.map(s=>(
              <button key={s.v} onClick={()=>setStatus(s.v)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:R.md,border:`1px solid ${status===s.v?C.accent:C.border}`,background:status===s.v?C.accentSoft:C.bg3,cursor:"pointer",textAlign:"left"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:s.c,flexShrink:0}}/>
                <span style={{fontSize:12,color:status===s.v?C.t0:C.t2,fontWeight:status===s.v?500:400}}>{s.label}</span>
                {status===s.v&&<I n="check" s={12} c={C.accentLight} style={{marginLeft:"auto"}}/>}
              </button>
            ))}
          </div>
        </div>

        <button onClick={()=>{onUpdate({name,bio,status,avatar});onClose();}} className="btn-hover"
          style={{width:"100%",padding:"10px",background:C.accent,borderRadius:R.md,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer",marginTop:2}}>
          Save Changes
        </button>

        <div style={{height:1,background:C.border}}/>

        <button onClick={()=>{onLogout();onClose();}} className="btn-hover"
          style={{width:"100%",padding:"10px",background:"transparent",borderRadius:R.md,color:C.rose,fontSize:13,fontWeight:500,border:`1px solid rgba(240,111,122,0.3)`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <I n="logout" s={14} c={C.rose}/> Sign Out
        </button>
      </div>
    </Modal>
  );
};

const AddChannelModal = ({ space, onClose, onAdd }) => {
  const [name,setName]=useState("");
  const [type,setType]=useState("text");
  const [catId,setCatId]=useState(space.categories[0]?.id||"");
  const [desc,setDesc]=useState("");
  return (
    <Modal title="Add Channel" onClose={onClose} width={360}>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div>
          <label style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Type</label>
          <div style={{display:"flex",gap:6}}>
            {[{v:"text",icon:"hash",label:"Text"},{v:"voice",icon:"vol",label:"Voice"}].map(t=>(
              <button key={t.v} onClick={()=>setType(t.v)}
                style={{flex:1,padding:"8px",borderRadius:R.md,border:`1px solid ${type===t.v?C.accent:C.border}`,background:type===t.v?C.accentSoft:C.bg3,color:type===t.v?C.t0:C.t2,fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <I n={t.icon} s={13}/>{t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Name</label>
          <input value={name} onChange={e=>setName(e.target.value.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""))}
            placeholder="channel-name" style={IS} autoFocus/>
        </div>
        {type==="text"&&(
          <div>
            <label style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Description</label>
            <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What's this about?" style={IS}/>
          </div>
        )}
        <div>
          <label style={{fontSize:10,color:C.t3,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",display:"block",marginBottom:6}}>Category</label>
          <select value={catId} onChange={e=>setCatId(e.target.value)}
            style={{...IS,appearance:"none",cursor:"pointer",background:C.bg3}}>
            {space.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",border:`1px solid ${C.border}`,borderRadius:R.md,background:"transparent",color:C.t2,fontSize:13,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>{if(name.trim()){onAdd(catId,{name:name.trim(),type,desc});onClose();}}} className="btn-hover"
            style={{flex:1,padding:"9px",background:C.accent,borderRadius:R.md,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer"}}>
            Add Channel
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ── TOAST ───────────────────────────────────────────────────────────────────── */
const Toast = ({ t, onClose }) => (
  <div onClick={onClose} style={{
    display:"flex",alignItems:"flex-start",gap:9,padding:"11px 14px",
    background:C.bg4,border:`1px solid ${C.border}`,borderRadius:R.lg,
    boxShadow:C.shadow,minWidth:240,maxWidth:320,cursor:"pointer",
    animation:"toastIn 300ms cubic-bezier(0.4,0,0.2,1)",
  }}>
    <div style={{width:7,height:7,borderRadius:"50%",background:C.accent,flexShrink:0,marginTop:3}}/>
    <div style={{flex:1}}>
      <div style={{fontSize:12,fontWeight:600,color:C.t0,marginBottom:1}}>{t.title}</div>
      <div style={{fontSize:11,color:C.t2}}>{t.body}</div>
    </div>
    <button onClick={onClose} style={{color:C.t3,background:"none",border:"none",cursor:"pointer",display:"flex",marginTop:-1}}><I n="x" s={12}/></button>
  </div>
);

/* ── EMPTY STATE ─────────────────────────────────────────────────────────────── */
const Empty = ({ type }) => (
  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:C.bg1,flexDirection:"column",gap:10,minWidth:0}}>
    {type==="voice"
      ? <><div style={{fontSize:36}}>🎙</div><div style={{fontFamily:FONT,fontSize:16,fontWeight:600,color:C.t0}}>Voice Channel</div><div style={{fontSize:13,color:C.t2,marginTop:4}}>Voice & video coming soon.</div></>
      : <><div style={{fontSize:28,opacity:0.15}}>◈</div><div style={{fontSize:13,color:C.t3,marginTop:4}}>Select a channel to start chatting.</div></>
    }
  </div>
);

/* ── MAIN APP ────────────────────────────────────────────────────────────────── */
const App = () => {
  // ── Session restore from localStorage ──
  const savedSession = (() => {
    try { return JSON.parse(localStorage.getItem("nexus_session")||"null"); } catch{ return null; }
  })();

  const [me,setMe]=useState(savedSession?.me||null);
  const [connected,setConnected]=useState(false);
  const [showConn,setShowConn]=useState(false);
  const [spaces,setSpaces]=useState([]);
  const [activeSpace,setActiveSpace]=useState(null);
  const [activeCh,setActiveCh]=useState(null);
  const [messages,setMessages]=useState({});
  const [typing,setTyping]=useState({});
  const [onlineUsers,setOnlineUsers]=useState([]);
  const [spaceMembers,setSpaceMembers]=useState({});
  const [modal,setModal]=useState(null);
  const [toasts,setToasts]=useState([]);
  const [sidebarOpen,setSidebarOpen]=useState(false);

  // Persist session to localStorage whenever me changes
  useEffect(()=>{
    if(me) localStorage.setItem("nexus_session", JSON.stringify({me}));
    else localStorage.removeItem("nexus_session");
  },[me]);

  // Auto-connect if session exists
  useEffect(()=>{
    if(savedSession?.me && !connected){
      const sk = getSocket();
      sk.connect();
      sk.once("connect",()=>{
        sk.emit("auth", savedSession.me);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Invite URL detection
  const [pendingInvite]=useState(()=>{
    const p=new URLSearchParams(window.location.search);
    return p.get("invite")||null;
  });
  const [showInviteJoin,setShowInviteJoin]=useState(!!pendingInvite);

  const addToast = useCallback((t)=>{
    const id=uid();
    setToasts(p=>[...p,{...t,id}]);
    setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000);
  },[]);

  /* ── SOCKET SETUP ── */
  useEffect(()=>{
    const sk = getSocket();

    sk.on("connect",    ()=>{ setConnected(true);  setShowConn(true); setTimeout(()=>setShowConn(false),3000); });
    sk.on("disconnect", ()=>{ setConnected(false); setShowConn(true); });

    sk.on("init", ({user, spaces: sps})=>{
      setMe(prev=>({...prev,...user}));
      setSpaces(sps);
    });
    sk.on("space_created", (sp)=>{
      setSpaces(p=>[...p.filter(x=>x.id!==sp.id),sp]);
      addToast({title:"Space created!",body:`Welcome to ${sp.name} ◈`});
    });

    sk.on("space_joined", ({space, channelMessages})=>{
      setSpaces(p=>{
        const exists=p.find(x=>x.id===space.id);
        return exists ? p.map(x=>x.id===space.id?space:x) : [...p,space];
      });
      setMessages(p=>({...p,...channelMessages}));
    });

    sk.on("new_message", ({channelId, msg})=>{
      setMessages(p=>({...p,[channelId]:[...(p[channelId]||[]),msg]}));
      // Increment unread if not active channel
      setSpaces(p=>p.map(sp=>({
        ...sp,
        categories:sp.categories.map(cat=>({
          ...cat,
          channels:cat.channels.map(ch=>
            ch.id===channelId && ch.id!==activeCh?.id
              ? {...ch,unread:(ch.unread||0)+1}
              : ch
          )
        }))
      })));
    });

    sk.on("reaction_update", ({channelId, msgId, reactions})=>{
      setMessages(p=>{
        const list=[...(p[channelId]||[])];
        const i=list.findIndex(m=>m.id===msgId);
        if(i===-1) return p;
        list[i]={...list[i],reactions};
        return{...p,[channelId]:list};
      });
    });

    sk.on("typing_update", ({channelId, typing: t})=>{
      setTyping(p=>({...p,[channelId]:t}));
    });

    sk.on("channel_added", ({spaceId, catId, channel})=>{
      setSpaces(p=>p.map(sp=>sp.id===spaceId?{...sp,categories:sp.categories.map(c=>c.id===catId?{...c,channels:[...c.channels,channel]}:c)}:sp));
      setActiveSpace(p=>p?.id===spaceId?{...p,categories:p.categories.map(c=>c.id===catId?{...c,channels:[...c.channels,channel]}:c)}:p);
      addToast({title:"Channel added",body:`#${channel.name} is ready!`});
    });

    sk.on("users_update", (users)=>{
      setOnlineUsers(users);
      // Update message authors to show latest avatar/name
      setMessages(prev=>{
        const updated={};
        let changed=false;
        Object.entries(prev).forEach(([chId,msgs])=>{
          updated[chId]=msgs.map(m=>{
            const freshAuthor=users.find(u=>u.id===m.authorId);
            if(freshAuthor&&(freshAuthor.avatar!==m.author?.avatar||freshAuthor.name!==m.author?.name)){
              changed=true;
              return {...m,author:{...m.author,...freshAuthor}};
            }
            return m;
          });
        });
        return changed?updated:prev;
      });
    });
    sk.on("space_members_update", ({spaceId, members})=>{
      setSpaceMembers(p=>({...p,[spaceId]:members}));
    });

    sk.on("member_joined", ({user})=>{
      addToast({title:`${user.name} joined`,body:"Welcome to the space!"});
    });

    return ()=>{
      sk.off("connect"); sk.off("disconnect"); sk.off("init");
      sk.off("space_created"); sk.off("space_joined"); sk.off("new_message");
      sk.off("reaction_update"); sk.off("typing_update"); sk.off("channel_added");
      sk.off("users_update"); sk.off("space_members_update"); sk.off("member_joined");
    };
  },[activeCh]);

  /* ── LOGIN ── */
  const handleLogin = (userData, initialSpaces=[]) => {
    setMe(userData);
    setSpaces(initialSpaces);
    localStorage.setItem("nexus_session", JSON.stringify({me:userData}));
    const sk = getSocket();
    sk.connect();
    sk.once("connect", ()=>{
      sk.emit("auth", userData);
    });
  };

  const handleLogout = () => {
    getSocket().disconnect();
    socket = null;
    localStorage.removeItem("nexus_session");
    setMe(null); setSpaces([]); setActiveSpace(null); setActiveCh(null);
    setMessages({}); setOnlineUsers([]); setSpaceMembers({});
  };

  const handleCreateSpace = (data) => {
    getSocket().emit("create_space", data);
    setTimeout(()=>{
      const sk=getSocket();
      sk.once("space_created",(sp)=>{
        sk.emit("join_space",sp.id);
        setActiveSpace(sp);
        setActiveCh(sp.categories[0].channels[0]);
      });
    },50);
  };

  const handleAddChannel = (catId, chData) => {
    if(!activeSpace) return;
    getSocket().emit("add_channel",{spaceId:activeSpace.id,catId,channel:chData});
  };

  const handleSelectSpace = (sp) => {
    setActiveSpace(sp);
    if(sp){
      getSocket().emit("join_space",sp.id);
      const first=sp.categories.flatMap(c=>c.channels).find(c=>c.type==="text");
      setActiveCh(first||null);
    } else {
      setActiveCh(null);
    }
  };

  const handleSelectCh = (ch) => {
    setActiveCh(ch);
    // Clear unread
    setSpaces(p=>p.map(sp=>sp.id===activeSpace?.id?{...sp,categories:sp.categories.map(c=>({...c,channels:c.channels.map(x=>x.id===ch.id?{...x,unread:0}:x)}))}:sp));
  };

  const handleSend = (content) => {
    if(!activeCh||!activeSpace) return;
    getSocket().emit("send_message",{channelId:activeCh.id,spaceId:activeSpace.id,content});
  };

  const handleReact = (msgId, emoji) => {
    if(!activeCh||!activeSpace) return;
    getSocket().emit("react",{channelId:activeCh.id,spaceId:activeSpace.id,msgId,emoji});
  };

  const handleUpdateProfile = (data) => {
    setMe(p=>({...p,...data}));
    if(data.status) getSocket().emit("update_status",data.status);
    if(data.avatar !== undefined) getSocket().emit("update_avatar",{avatar:data.avatar,name:data.name});
    addToast({title:"Profile updated",body:"Your changes have been saved."});
  };

  const handleInviteJoined = (space) => {
    setSpaces(p=>{
      const exists=p.find(x=>x.id===space.id);
      return exists ? p.map(x=>x.id===space.id?space:x) : [...p,space];
    });
    setActiveSpace(space);
    const first=space.categories.flatMap(c=>c.channels).find(c=>c.type==="text");
    setActiveCh(first||null);
    setShowInviteJoin(false);
    window.history.replaceState({},"",window.location.pathname);
    addToast({title:`Joined ${space.name}!`,body:"Welcome to the space ◈"});
  };

  const currentTyping = activeCh ? (typing[activeCh.id]||[]) : [];
  const currentMembers = activeSpace ? (spaceMembers[activeSpace.id]||activeSpace.members||[]) : [];

  if(!me) return <><GS/><Auth onLogin={handleLogin}/></>;

  if(showInviteJoin && pendingInvite) return (
    <><GS/>
      <JoinInviteScreen code={pendingInvite} me={me}
        onJoined={handleInviteJoined}
        onCancel={()=>{ setShowInviteJoin(false); window.history.replaceState({},"",window.location.pathname); }}/>
    </>
  );

  return (
    <>
      <GS/>
      <div style={{display:"flex",width:"100vw",height:"100vh",overflow:"hidden",background:C.bg0}}>
        <SpaceSidebar spaces={spaces} active={activeSpace} onSelect={(sp)=>{ handleSelectSpace(sp); setSidebarOpen(false); }}
          onCreate={()=>setModal("createSpace")} me={me}
          onToggleSidebar={()=>setSidebarOpen(p=>!p)} sidebarOpen={sidebarOpen}/>

        {/* Backdrop — tapping outside closes drawer on mobile */}
        {sidebarOpen&&<div className="ch-backdrop" onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:190,backdropFilter:"blur(2px)"}}/>}

        <ChannelSidebar space={activeSpace} activeCh={activeCh}
          onSelectCh={(ch)=>{ handleSelectCh(ch); setSidebarOpen(false); }}
          me={me} onLogout={handleLogout} onOpenProfile={()=>setModal("profile")}
          onAddChannel={()=>setModal("addChannel")}
          onInvite={()=>activeSpace&&setModal("invite")}
          open={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>

        <div style={{flex:1,display:"flex",overflow:"hidden",minWidth:0}}>
          {!activeSpace
            ? <HomeDashboard me={me} spaces={spaces} onSelectSpace={(sp)=>{ handleSelectSpace(sp); setSidebarOpen(false); }}
                onCreate={()=>setModal("createSpace")} onlineUsers={onlineUsers.length}/>
            : !activeCh||activeCh.type==="voice"
              ? <Empty type={activeCh?.type}/>
              : <>
                  <Chat ch={activeCh} spaceId={activeSpace.id}
                    msgs={messages[activeCh.id]||[]} onSend={handleSend}
                    typing={currentTyping} onReact={handleReact} me={me}
                    onOpenSidebar={()=>setSidebarOpen(true)}/>
                  <Members spaceMembers={currentMembers.map(m=>typeof m==="string"?onlineUsers.find(u=>u.id===m)||{id:m,name:"User",status:"offline"}:m)} allOnlineUsers={onlineUsers}/>
                </>
          }
        </div>

        {/* Modals */}
        {modal==="createSpace"&&<Overlay onClose={()=>setModal(null)}><CreateSpaceModal onClose={()=>setModal(null)} onCreate={handleCreateSpace}/></Overlay>}
        {modal==="profile"&&<Overlay onClose={()=>setModal(null)}><ProfileModal me={me} onClose={()=>setModal(null)} onUpdate={handleUpdateProfile} onLogout={handleLogout}/></Overlay>}
        {modal==="addChannel"&&activeSpace&&<Overlay onClose={()=>setModal(null)}><AddChannelModal space={activeSpace} onClose={()=>setModal(null)} onAdd={handleAddChannel}/></Overlay>}
        {modal==="invite"&&activeSpace&&<Overlay onClose={()=>setModal(null)}><InviteModal space={activeSpace} onClose={()=>setModal(null)}/></Overlay>}

        {/* Toasts */}
        <div style={{position:"fixed",top:14,right:14,zIndex:2000,display:"flex",flexDirection:"column",gap:7}}>
          {toasts.map(t=><Toast key={t.id} t={t} onClose={()=>setToasts(p=>p.filter(x=>x.id!==t.id))}/>)}
        </div>

        {/* Connection banner */}
        {showConn&&<ConnBanner connected={connected}/>}
      </div>
    </>
  );
};

export default App;
