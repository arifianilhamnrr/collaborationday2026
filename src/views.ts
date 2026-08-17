import { escapeHtml, formatRupiah } from "./domain";
import type { Profile, SessionUser, StaffProfile } from "./types";
import type { WhatsarOverview } from "./whatsar";

export type Edition = {
  id: number;
  year: number;
  slug: string;
  title: string;
  theme: string;
  description: string;
  venue: string;
  starts_at: string;
  ends_at: string;
  registration_opens_at: string;
  registration_closes_at: string;
  capacity: number;
  capacity_unlimited: number;
  ticket_amount: number;
  hero_image_url: string | null;
  map_embed_url: string | null;
};
export type Gallery = {
  id?: number;
  image_url: string;
  alt_text: string;
  caption: string | null;
  photographer: string | null;
  year?: number;
  edition_id?: number;
  object_key?: string | null;
  original_filename?: string | null;
  size_bytes?: number | null;
  is_published?: number;
};

function optimizeLandingImages(html: string): string {
  return html
    .replace(
      /<img([^>]*?)src="(\/media\/archive\/([^"]+))"(?![^>]*\bsrcset=)/g,
      (_match, before: string, source: string, relative: string) =>
        `<img${before}src="${source}" srcset="/media/archive-small/${relative} 720w, ${source} 1920w" sizes="(max-width: 900px) 100vw, 50vw"`,
    )
    .replace(
      'src="/brand/collaboration-day-2026.png" alt=""',
      'src="/brand/collaboration-day-2026-nav.webp" alt="" width="128" height="82"',
    );
}
export type PaymentMethod = {
  id: number;
  type: string;
  label: string;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  qris_image_url: string | null;
  qris_payload?: string | null;
  instructions: string | null;
  is_active?: number;
};
export type BenefitItem = {
  id: number;
  title: string;
  description: string | null;
};

const dashboardCss = `
:root{--app-bg:#eef0f6;--app-ink:#101532;--app-muted:#68708c;--app-line:#d9ddeb;--app-blue:#3757a6;--app-night:#060a37;--app-white:#fff}*{box-sizing:border-box}body{margin:0;background:var(--app-bg);color:var(--app-ink);font:14px/1.55 Manrope,Arial,sans-serif}.app-shell{min-height:100vh;display:grid;grid-template-columns:260px minmax(0,1fr)}.app-sidebar{position:sticky;top:0;height:100vh;background:var(--app-night);color:#fff;padding:24px 18px;display:flex;flex-direction:column}.app-brand{display:flex;align-items:center;gap:12px;padding:4px 8px 28px;color:#fff;text-decoration:none;font-family:'Archivo Black',Arial,sans-serif}.app-brand img{width:42px;height:34px;object-fit:contain}.app-role{margin:0 8px 18px;color:#c2b3da;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.app-nav{display:grid;gap:5px}.app-nav a{padding:11px 12px;color:#cfd4ec;text-decoration:none;font-weight:700;border-left:3px solid transparent}.app-nav a:hover,.app-nav a.active{background:rgba(255,255,255,.08);color:#fff;border-color:#835eb5}.app-account{margin-top:auto;padding:18px 8px 0;border-top:1px solid rgba(255,255,255,.16);overflow-wrap:anywhere}.app-account small{color:#abb3d3}.app-account button{width:100%;margin-top:12px;background:transparent;border:1px solid rgba(255,255,255,.35);color:#fff;padding:10px}.app-main{min-width:0}.app-topbar{height:72px;padding:0 32px;background:#fff;border-bottom:1px solid var(--app-line);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:30}.app-topbar h1{margin:0;font:800 18px/1 Manrope,Arial,sans-serif;letter-spacing:-.02em}.app-content{padding:30px 32px 64px;max-width:1440px;margin:auto}.page-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:26px}.page-head h2{font:800 clamp(28px,3vw,42px)/1.05 Manrope,Arial,sans-serif;letter-spacing:-.035em;margin:0 0 6px}.page-head p{color:var(--app-muted);margin:0}.app-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:18px}.app-card{grid-column:span 12;background:#fff;border:1px solid var(--app-line);padding:22px}.app-card.half{grid-column:span 6}.app-card.third{grid-column:span 4}.app-card h3{margin:0 0 16px;font-size:17px}.metric{font:800 36px/1 Manrope,Arial,sans-serif;letter-spacing:-.04em}.metric-label{margin-top:8px;color:var(--app-muted)}.app-table{overflow:auto;background:#fff;border:1px solid var(--app-line)}table{width:100%;border-collapse:collapse;min-width:760px}th,td{text-align:left;padding:13px 15px;border-bottom:1px solid var(--app-line);vertical-align:top}th{background:#f7f8fb;color:var(--app-muted);font-size:10px;text-transform:uppercase;letter-spacing:.1em}.app-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.app-form .full{grid-column:1/-1}label{display:grid;gap:6px;font-size:12px;font-weight:800}input,select,textarea{width:100%;border:1px solid #c8ccda;background:#fff;padding:11px 12px;font:inherit}button,.app-button{display:inline-block;background:var(--app-blue);border:0;color:#fff;padding:11px 15px;font-weight:800;text-decoration:none;cursor:pointer}.app-button.secondary,button.secondary{background:#fff;color:var(--app-ink);border:1px solid #b8becf}.status{display:inline-block;background:#e8e4f2;color:#3b2b57;padding:5px 8px;font-size:10px;font-weight:800;text-transform:uppercase}.notice{padding:14px;background:#f0edf7;border:1px solid #c9bce0;margin-bottom:18px}.stack{display:grid;gap:12px}.inline{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.mono{font-family:ui-monospace,SFMono-Regular,monospace}.participant-card{max-width:780px;margin:auto;background:#fff;border:1px solid var(--app-line);padding:28px}.participant-card h1{font:800 clamp(30px,5vw,52px)/1.05 Manrope,Arial,sans-serif;letter-spacing:-.04em}.methods{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.method{border:1px solid var(--app-line);padding:16px}.method img{max-width:260px}.mobile-nav{display:none}
@media(max-width:960px){body.sidebar-open{overflow:hidden}.app-shell{display:block}.app-sidebar{display:flex;position:fixed;inset:0 auto 0 0;width:min(320px,88vw);height:100dvh;overflow-y:auto;overscroll-behavior:contain;z-index:90;transform:translateX(-102%);transition:transform .24s ease;box-shadow:18px 0 50px rgba(6,10,55,.28)}.app-sidebar.is-open{transform:translateX(0)}.sidebar-overlay{display:block;position:fixed;inset:0;z-index:80;border:0;background:rgba(6,10,55,.62);opacity:0;pointer-events:none;transition:opacity .24s ease}.sidebar-overlay.is-open{opacity:1;pointer-events:auto}.sidebar-toggle,.sidebar-close{display:inline-flex}.sidebar-close{align-self:flex-end;margin:-6px 0 12px;width:auto;background:transparent;border:1px solid rgba(255,255,255,.3);color:#fff}.sidebar-toggle{width:42px;height:42px;padding:0;align-items:center;justify-content:center;gap:4px;flex-direction:column;background:var(--app-night)}.sidebar-toggle span{display:block;width:18px;height:2px;background:#fff}.app-topbar-title{display:flex;align-items:center;gap:12px}.mobile-nav{display:none}.app-topbar{height:64px;padding:0 16px}.app-content{padding:22px 16px 48px}.app-card.half,.app-card.third{grid-column:span 12}.app-form{grid-template-columns:1fr}.page-head{display:grid}.methods{grid-template-columns:1fr}}
`;

const dashboardEnhancementCss = `
.session-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.session-action{min-width:96px;height:40px;padding:0 14px!important;display:inline-flex!important;align-items:center;justify-content:center;font:700 13px/1 Manrope,Arial,sans-serif;text-decoration:none;white-space:nowrap}.session-actions form{margin:0}.session-actions .status{height:40px;display:inline-flex;align-items:center}.app-dialog{width:min(480px,calc(100vw - 32px));padding:0;border:1px solid var(--app-night);background:#fff;color:var(--app-ink)}.app-dialog::backdrop{background:rgba(6,10,55,.72)}.app-dialog-body{padding:28px}.app-dialog h2{margin:0 0 10px;font-size:24px}.app-dialog p{color:var(--app-muted)}.app-dialog-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}.app-dialog-actions button{min-width:110px}.pool-control{display:inline-flex;align-items:center;gap:8px}.pool-control input{width:17px;height:17px;margin:0}
.payment-methods-table{table-layout:fixed;min-width:1120px}.payment-methods-table th,.payment-methods-table td{white-space:nowrap;vertical-align:middle}.payment-methods-table th:nth-child(1){width:94px}.payment-methods-table th:nth-child(2){width:170px}.payment-methods-table th:nth-child(3){width:330px}.payment-methods-table th:nth-child(4){width:auto}.payment-methods-table th:nth-child(5){width:94px}.payment-methods-table th:nth-child(6){width:210px}.payment-cell{display:block;overflow:hidden;text-overflow:ellipsis}.payment-actions{display:flex;align-items:center;gap:8px}.payment-actions form{margin:0}.payment-actions button{height:38px;padding:0 13px;white-space:nowrap}
.notice{transition:opacity .25s ease,transform .25s ease}.notice.is-dismissing{opacity:0;transform:translateY(-8px)}[hidden]{display:none!important}.qris-modal-preview{display:block;width:min(320px,100%);height:auto;margin:14px auto 0;border:1px solid var(--app-line);background:#fff}.balance{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--app-line);border:1px solid var(--app-line);margin:14px 0}.balance>div{background:#fff;padding:14px}.balance small{display:block;color:var(--app-muted)}.sidebar-toggle,.sidebar-close,.sidebar-overlay{display:none}.app-topbar-title{min-width:0}.app-topbar-title h1{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.profile-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--app-line);border:1px solid var(--app-line);margin-bottom:24px}.profile-meta>div{padding:16px;background:#fff}.profile-meta small{display:block;color:var(--app-muted);margin-bottom:4px}
.social-requirements{display:grid;gap:10px;margin:24px 0 30px}.social-account{display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:16px;padding:16px 18px;border:1px solid var(--app-line);background:#fff;color:var(--app-ink);text-decoration:none;transition:border-color .18s ease,transform .18s ease}.social-account:hover{border-color:var(--app-blue);transform:translateX(3px)}.social-platform{width:48px;height:48px;display:grid;place-items:center;background:var(--app-night);color:#fff;font-size:11px;font-weight:900;letter-spacing:.08em}.social-copy{min-width:0}.social-copy b,.social-copy span{display:block}.social-copy b{font-size:15px}.social-copy span{margin-top:2px;color:var(--app-muted);overflow:hidden;text-overflow:ellipsis}.social-cta{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--app-line);font-weight:800;white-space:nowrap}.social-upload-head{padding-top:26px;border-top:1px solid var(--app-line)}.social-upload-head h2{margin:0 0 5px;font-size:21px}.social-upload-head p{margin:0;color:var(--app-muted)}.social-upload{margin-top:18px}
.otp-cooldown{display:block;margin-top:8px;color:var(--app-muted)}
.registration-summary{margin-top:24px;border:1px solid var(--app-night);background:#fff}.registration-summary-head{padding:26px;background:var(--app-night);color:#fff}.registration-summary-head small{display:block;margin-bottom:10px;color:#c2b3da;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.registration-summary-head h2{margin:0;font:800 clamp(25px,4vw,38px)/1.05 Manrope,Arial,sans-serif;letter-spacing:-.035em}.registration-summary-head p{max-width:680px;margin:10px 0 0;color:#d7dbee;font-size:15px}.registration-facts{display:grid;grid-template-columns:2fr 1fr 1fr;border-top:1px solid var(--app-line)}.registration-fact{min-width:0;padding:20px;border-right:1px solid var(--app-line)}.registration-fact:last-child{border-right:0}.registration-fact small{display:block;margin-bottom:6px;color:var(--app-muted);font-size:10px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}.registration-fact b{display:block;font-size:15px;line-height:1.45}.registration-fact .registration-price{font-size:22px;color:var(--app-blue)}.registration-action{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px;border-top:1px solid var(--app-line);background:#f7f8fb}.registration-action p{margin:0;color:var(--app-muted)}.registration-action button{min-width:210px}
.payment-overview{margin:22px 0;border:1px solid var(--app-line);background:#fff}.payment-overview-head{padding:22px;background:var(--app-night);color:#fff}.payment-overview-head small{display:block;margin-bottom:7px;color:#c2b3da;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.payment-overview-head h2{margin:0;font-size:24px;letter-spacing:-.025em}.payment-overview-head p{margin:7px 0 0;color:#d7dbee}.payment-overview-facts{display:grid;grid-template-columns:minmax(0,1fr) auto}.payment-overview-facts>div{padding:16px 18px}.payment-overview-facts>div+div{border-left:1px solid var(--app-line)}.payment-overview-facts small{display:block;color:var(--app-muted);font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.payment-overview-facts b{display:block;margin-top:4px}.payment-selector{padding:20px;border:1px solid var(--app-line);background:#f7f8fb}.payment-selector label{max-width:520px}.payment-selector select{margin-top:3px;background:#fff}.participant-payment-options{margin-top:14px}.participant-payment-option{border:1px solid var(--app-line);background:#fff}.payment-option-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid var(--app-line)}.payment-option-head h3{margin:0;font-size:19px}.payment-option-body{padding:20px}.payment-option-body>p:first-child{margin-top:0}.payment-type{color:var(--app-blue);font-size:10px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}.bank-details{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;margin:18px 0;background:var(--app-line);border:1px solid var(--app-line)}.bank-details>div{padding:14px;background:#fff}.bank-details small{display:block;color:var(--app-muted);margin-bottom:4px}.bank-details b{display:block;overflow-wrap:anywhere}.payment-qris{display:grid;justify-items:center;gap:12px;margin:18px 0}.payment-qris img{width:min(300px,100%);height:auto;border:1px solid var(--app-line);background:#fff}.payment-action{padding:20px;border-top:1px solid var(--app-line);background:#f7f8fb}.payment-action.stack{margin:0}.payment-empty{padding:22px;border:1px dashed #b8becf;color:var(--app-muted);text-align:center}
.review-payments-table{min-width:1320px;table-layout:fixed}.review-payments-table th,.review-payments-table td{white-space:nowrap;vertical-align:middle}.review-payments-table th:nth-child(1){width:190px}.review-payments-table th:nth-child(2){width:145px}.review-payments-table th:nth-child(3){width:135px}.review-payments-table th:nth-child(4){width:160px}.review-payments-table th:nth-child(5){width:120px}.review-payments-table th:nth-child(6){width:110px}.review-payments-table th:nth-child(7){width:300px}.review-payments-table th:nth-child(8){width:120px}.review-table-cell{display:block;overflow:hidden;text-overflow:ellipsis}.review-receipt,.review-actions{display:flex;align-items:center;gap:8px}.review-receipt form{margin:0}.review-receipt button,.review-actions button{height:36px;padding:0 12px;white-space:nowrap}.delivery-chip{padding:4px 7px;background:#eef0f6;color:var(--app-muted);font-size:10px;font-weight:800;text-transform:uppercase}
.proof-preview-dialog{width:min(980px,calc(100vw - 32px));max-width:none}.proof-preview-dialog .app-dialog-body{padding:0}.proof-preview-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid var(--app-line)}.proof-preview-head h2{margin:0;font-size:19px}.proof-preview-head button{width:auto}.proof-preview-frame{display:block;width:100%;height:min(72vh,760px);border:0;background:#eef0f6}.proof-view-button{height:36px;padding:0 12px!important}
@media(max-width:960px){.sidebar-toggle,.sidebar-close{display:inline-flex}.sidebar-overlay{display:block}}
@media(max-width:640px){.session-actions{justify-content:flex-start}.session-action{flex:1}.app-dialog-actions{display:grid}.app-dialog-actions button{width:100%}.profile-meta,.balance{grid-template-columns:1fr}.app-topbar>.app-button{display:none}.social-account{grid-template-columns:44px minmax(0,1fr);gap:13px;padding:14px}.social-platform{width:44px;height:44px}.social-cta{grid-column:2;justify-self:start}.social-copy span{white-space:normal;overflow-wrap:anywhere}.registration-summary-head{padding:22px 18px}.registration-facts{grid-template-columns:1fr}.registration-fact{padding:17px 18px;border-right:0;border-bottom:1px solid var(--app-line)}.registration-fact:last-child{border-bottom:0}.registration-action{display:grid;padding:18px}.registration-action button{width:100%;min-width:0}.payment-overview-facts,.bank-details{grid-template-columns:1fr}.payment-overview-facts>div+div{border-left:0;border-top:1px solid var(--app-line)}.payment-option-head{align-items:flex-start;padding:16px}.payment-option-body,.payment-action,.payment-selector{padding:16px}}
`;

export function dashboardLayout(
  title: string,
  body: string,
  user: SessionUser,
  active = "overview",
): string {
  const links =
    user.role === "admin"
      ? [
        ["overview", "/dashboard", "Ringkasan"],
        ["payments", "/dashboard/payments", "Pembayaran"],
        ["participants", "/dashboard/participants", "Peserta"],
        ["team", "/dashboard/team", "Tim & kelompok"],
        ["event", "/dashboard/event", "Event"],
        ["gallery", "/dashboard/gallery", "Galeri"],
        ["integrations", "/dashboard/integrations", "Integrasi"],
      ]
      : user.role === "pendamping"
        ? [
            ["overview", "/dashboard", "Kelompok saya"],
            ["event", "/", "Info Event"],
          ]
        : user.role === "bendahara"
          ? [
              ["payments", "/dashboard", "Pembayaran"],
              ["payment-methods", "/dashboard/payment-methods", "Metode pembayaran"],
              ["event", "/", "Info Event"],
            ]
          : [
        ["overview", "/dashboard", "Dashboard"],
        ["event", "/", "Info Event"],
      ];
  if (user.role !== "participant") links.push(["profile", "/dashboard/account", "Profil"]);
  const roleLabels = {
    admin: ["Admin workspace", "Administrator"],
    pendamping: ["Pendamping workspace", "Pendamping"],
    bendahara: ["Bendahara workspace", "Bendahara"],
    participant: ["Participant area", "Peserta"],
  } as const;
  const roleLabel = roleLabels[user.role];
  const nav = links
    .map(
      ([key, href, label]) =>
        `<a class="${active === key ? "active" : ""}" href="${href}">${label}</a>`,
    )
    .join("");
  if (body.includes('action="/dashboard/whatsapp/send"')) body += '<script src="/whatsapp-cooldown.js" defer></script>';
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/favicon.ico"><title>${escapeHtml(title)}</title><style>${dashboardCss}${dashboardEnhancementCss}</style></head><body><div class="app-shell"><aside class="app-sidebar" id="dashboard-sidebar" data-sidebar aria-label="Navigasi dashboard"><button class="sidebar-close" type="button" data-sidebar-close>Tutup menu</button><a class="app-brand" href="/dashboard"><img src="/brand/collaboration-day-2026.png" alt=""><span>Collaboration Day</span></a><p class="app-role">${roleLabel[0]}</p><nav class="app-nav">${nav}</nav><div class="app-account"><b>${escapeHtml(user.display_name || user.email)}</b><br><small>${roleLabel[1]} · ${escapeHtml(user.email)}</small><form method="post" action="/logout"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><button type="submit">Keluar</button></form></div></aside><button class="sidebar-overlay" type="button" data-sidebar-overlay aria-label="Tutup menu navigasi" tabindex="-1"></button><main class="app-main"><header class="app-topbar"><div class="app-topbar-title"><button class="sidebar-toggle" type="button" data-sidebar-toggle aria-controls="dashboard-sidebar" aria-expanded="false" aria-label="Buka menu navigasi"><span></span><span></span><span></span></button><h1>${escapeHtml(title)}</h1></div><a href="/" class="app-button secondary">Lihat website</a></header><div class="app-content">${body}</div></main></div><script src="/dashboard-shell.js" defer></script><script src="/flash.js" defer></script></body></html>`;
}

const css = `
:root{--night:#060a37;--blue:#3757a6;--sky:#6385c9;--purple:#835eb5;--lilac:#c2b3da;--paper:#f5f2ea;--white:#fff;--line:rgba(6,10,55,.2)}*{box-sizing:border-box}html{scroll-behavior:smooth}body{min-height:100vh;min-height:100dvh;margin:0;background:var(--paper);color:var(--night);font:16px/1.55 Arial,sans-serif;display:flex;flex-direction:column}body>footer{margin-top:auto;flex:0 0 auto}a{color:inherit}img{max-width:100%;display:block}nav{display:flex;justify-content:space-between;align-items:center;padding:18px 5vw;border-bottom:1px solid var(--line);font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.brand{text-decoration:none}.navlinks{display:flex;gap:20px;align-items:center}.wrap{width:min(1160px,90vw);margin:auto}.hero{min-height:78vh;display:grid;grid-template-columns:1.2fr .8fr;border-bottom:1px solid var(--line)}.hero-copy{padding:9vh 5vw 7vh;display:flex;flex-direction:column;justify-content:space-between}.kicker,.eyebrow{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.18em}.hero h1{font:900 clamp(64px,10vw,150px)/.78 Arial,sans-serif;letter-spacing:-.04em;margin:36px 0}.hero h1 span{display:block;color:var(--purple)}.hero-art{background:var(--night);color:var(--paper);padding:7vh 4vw;display:flex;flex-direction:column;justify-content:space-between}.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;border-top:1px solid var(--line);padding-top:18px}.facts small{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.14em;margin-bottom:5px}.section{padding:90px 0}.intro{display:grid;grid-template-columns:1fr 2fr;gap:8vw}.intro h2{font:900 clamp(42px,6vw,84px)/.95 Arial,sans-serif;letter-spacing:-.04em;margin:0 0 28px}.intro p{font:20px/1.5 Georgia,serif}.register-band{background:var(--night);color:var(--paper);padding:90px 0}.register-grid{display:grid;grid-template-columns:1fr 1fr;gap:8vw}.register-grid h2{font:900 clamp(40px,5vw,72px)/.95 Arial,sans-serif;letter-spacing:-.04em;margin:22px 0}.panel,.ticket{width:min(760px,90vw);margin:60px auto;padding:32px;border:1px solid var(--line);background:var(--white)}.panel.wide{width:min(1160px,94vw)}.panel h1,.ticket h1,.section h1{font:900 clamp(38px,6vw,72px)/.95 Arial,sans-serif;letter-spacing:-.04em;margin:12px 0 22px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.gallery{columns:2;column-gap:28px}.photo{break-inside:avoid;margin:0 0 52px}.photo img{width:100%;height:auto}.photo figcaption{display:grid;grid-template-columns:70px 1fr;gap:16px;padding-top:12px;border-top:1px solid var(--line);font-size:13px}.photo figcaption span{font-size:10px;letter-spacing:.12em}.stack{display:grid;gap:16px}.dashboard-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:35px}.status{display:inline-block;padding:7px 10px;background:var(--lilac);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.notice{padding:16px;border:1px solid var(--purple);background:#eee8f6;margin:18px 0}.error{border-color:#9c2d3f;background:#f9e5e8}.methods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:20px 0}.method{border:1px solid var(--line);padding:16px}.method img{max-height:260px;margin:14px auto}.content-list{display:grid;gap:0;border-top:1px solid var(--line)}.content-row{display:grid;grid-template-columns:150px 1fr auto;gap:18px;padding:16px 0;border-bottom:1px solid var(--line);align-items:start}.admin-section{padding:32px 0}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:10px;text-transform:uppercase;letter-spacing:.1em}label{display:grid;gap:7px;font-size:12px;font-weight:800}input,select,textarea{width:100%;padding:13px;border:1px solid currentColor;background:transparent;color:inherit;font:inherit}button,.button{display:inline-block;border:0;background:var(--blue);color:#fff;padding:13px 18px;font-weight:800;text-decoration:none;cursor:pointer}.button.secondary,button.secondary{background:transparent;color:inherit;border:1px solid currentColor}.danger{color:#8a2035!important;border-color:#8a2035!important}.inline{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.muted{opacity:.7}.mono{font-family:ui-monospace,SFMono-Regular,monospace}.divider{border:0;border-top:1px solid var(--line);margin:28px 0}footer{padding:30px 5vw;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:12px}@media(max-width:760px){.hero,.register-grid,.intro,.grid,.content-row{grid-template-columns:1fr}.hero h1{font-size:19vw}.hero-art{min-height:380px}.facts{grid-template-columns:1fr}.navlinks a:not(.button){display:none}.methods{grid-template-columns:1fr}.gallery{columns:1}.photo{margin-bottom:34px}.dashboard-head,footer{display:grid}.section,.register-band{padding:60px 0}.panel{padding:22px;margin:28px auto}}
`;

const cssV2 = `
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@400;500;600;700;800&display=swap');
:root{--night:#060a37;--blue:#3757a6;--sky:#6385c9;--purple:#835eb5;--lilac:#c2b3da;--paper:#f3f0e8;--white:#fff;--line:rgba(6,10,55,.16)}
body{font-family:Manrope,Arial,sans-serif;background:var(--paper)}
nav{position:sticky;top:0;z-index:100;height:72px;padding:0 max(24px,5vw);background:rgba(243,240,232,.96);backdrop-filter:blur(14px);border-bottom:1px solid var(--night)}
.brand{display:flex;align-items:center;gap:12px;font-family:'Archivo Black',Arial,sans-serif;font-size:13px;letter-spacing:-.01em}
.brand img{width:42px;height:34px;object-fit:contain}
.navlinks{height:100%;gap:28px}.navlinks>a:not(.button){display:grid;place-items:center;height:100%;text-decoration:none;border-bottom:3px solid transparent}.navlinks>a:not(.button):hover{border-color:var(--purple)}
.button,button{border-radius:0;transition:background-color .2s,color .2s}.button:hover,button:hover{background:var(--night)}:focus-visible{outline:3px solid var(--sky);outline-offset:3px}
.hero{min-height:calc(100vh - 72px);grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr);background:var(--paper)}
.hero-copy{padding:clamp(54px,8vh,94px) max(30px,5vw) 44px}.hero h1{font-family:'Archivo Black',Arial,sans-serif;font-size:clamp(66px,10vw,142px);line-height:.82;letter-spacing:-.04em;margin:30px 0;text-transform:uppercase}.hero h1 span{color:var(--purple)}
.hero-art{position:relative;padding:38px;background:var(--night);overflow:hidden}.hero-art>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.42;filter:saturate(.75) contrast(1.08)}.hero-art:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,10,55,.08),rgba(6,10,55,.92))}.hero-art>div{position:relative;z-index:2;margin-top:auto;max-width:520px}.hero-art h2{font-family:'Archivo Black',Arial,sans-serif;font-size:clamp(28px,4vw,52px);line-height:1;letter-spacing:-.03em}.hero-art .event-logo{position:relative;z-index:2;width:min(300px,70%);height:auto;opacity:1;filter:none}
.facts{grid-template-columns:1fr 1.5fr 1fr;gap:0}.facts>div{padding:18px 18px 0 0;border-right:1px solid var(--line)}.facts>div:last-child{border-right:0}.facts>div+div{padding-left:18px}
.section{padding:clamp(76px,10vw,140px) 0}.section h2,.register-grid h2{font-family:'Archivo Black',Arial,sans-serif;font-size:clamp(38px,6vw,78px);line-height:.98;letter-spacing:-.035em;max-width:900px}.intro{grid-template-columns:240px 1fr}.intro p{font-family:Manrope,Arial,sans-serif;max-width:760px}.eyebrow,.kicker{font-weight:800;color:var(--blue)}
.content-list{border-top:2px solid var(--night)}.content-row{padding:22px 0;grid-template-columns:190px minmax(0,1fr) auto}.content-row:hover{background:rgba(194,179,218,.13)}
.register-band{position:relative;background:var(--night);overflow:hidden}.register-grid{position:relative;z-index:1}
.panel{margin:52px auto;background:#fff;border:1px solid var(--night);box-shadow:14px 14px 0 rgba(55,87,166,.14)}.panel.wide{padding:clamp(24px,4vw,52px)}.panel h1,.ticket h1,.section h1{font-family:'Archivo Black',Arial,sans-serif}.admin-section{padding:46px 0;border-top:2px solid var(--night)}.admin-section h2{font-family:'Archivo Black';font-size:clamp(25px,3vw,38px);letter-spacing:-.025em}
input,select,textarea{background:#fff;border:1px solid rgba(6,10,55,.45);border-radius:0}input:focus,select:focus,textarea:focus{outline:3px solid rgba(99,133,201,.4);border-color:var(--blue)}
.status{background:var(--night);color:#fff;padding:9px 12px}.notice{background:#ece6f4;border:1px solid var(--purple)}
.gallery{columns:2;column-gap:32px}.photo img{background:#ddd}.photo:nth-child(3n){transform:translateY(20px)}
footer{background:var(--lilac);color:var(--night);padding:56px 5vw;border-top:1px solid var(--night);display:flex;align-items:center;justify-content:space-between;gap:32px}footer .inline{display:flex;align-items:center;gap:12px}footer>span{max-width:520px;text-align:right;font-weight:700}.notice{transition:opacity .25s ease,transform .25s ease}.notice.is-dismissing{opacity:0;transform:translateY(-8px)}
@media(max-width:800px){nav{height:64px;padding:0 18px}.brand{font-size:11px}.brand img{width:35px}.navlinks{gap:10px}.navlinks>a:not(.button){display:none}.navlinks .button{padding:10px 12px}.hero{min-height:auto;grid-template-columns:1fr}.hero-copy{min-height:68vh;padding:56px 22px 30px}.hero h1{font-size:19vw}.hero-art{min-height:520px;padding:24px}.facts{grid-template-columns:1fr}.facts>div,.facts>div+div{padding:12px 0;border-right:0;border-top:1px solid var(--line)}.intro{grid-template-columns:1fr}.content-row{grid-template-columns:1fr;gap:8px}.gallery{columns:1}.photo:nth-child(3n){transform:none}.panel{width:calc(100% - 28px);box-shadow:7px 7px 0 rgba(55,87,166,.14)}footer{display:grid;gap:24px;padding:42px 22px}footer>span{text-align:left}}
`;

const cssV3 = `
.hero-copy{padding-bottom:36px}.hero-art>div{padding-top:65vh}.hero-art h2{margin:0}.facts{grid-template-columns:1fr 2fr}
.archive-strip{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.archive-cover{position:relative;min-height:560px;overflow:hidden;background:var(--night);color:#fff;text-decoration:none}.archive-cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.72) contrast(1.05);transition:transform .5s cubic-bezier(.2,.7,.2,1)}.archive-cover:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(6,10,55,.9))}.archive-cover strong{position:absolute;z-index:2;left:28px;bottom:20px;font-family:'Archivo Black';font-size:clamp(72px,9vw,138px);line-height:.8;letter-spacing:-.04em}.archive-cover:hover img{transform:scale(1.025)}
.archive-head{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end;margin-bottom:54px}.archive-head h1{margin-bottom:0}.archive-gallery{columns:3;column-gap:18px}.archive-gallery .photo{margin-bottom:18px}.archive-gallery .photo:nth-child(3n){transform:none}.archive-gallery .photo figcaption{display:none}
.auth-actions{display:grid;gap:12px;margin-top:8px}.auth-actions>*{text-align:center}.auth-switch{text-align:center;font-size:14px;margin:4px 0 0}.auth-switch a{font-weight:800;color:var(--blue)}.checkline{display:flex;grid-template-columns:none;align-items:flex-start;gap:10px;font-size:13px;font-weight:600}.checkline input{flex:0 0 auto;width:17px!important;height:17px;margin:2px 0 0}.panel>form.stack>a.button{color:#fff}
@media(max-width:1000px){.archive-gallery{columns:2}.archive-cover{min-height:460px}.benefit-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:800px){.hero-art>div{padding-top:360px}.facts{grid-template-columns:1fr}.benefit-grid{grid-template-columns:1fr}.benefit-item{min-height:104px}.archive-strip{grid-template-columns:1fr}.archive-cover{min-height:420px}.archive-gallery{columns:1}.archive-head{grid-template-columns:1fr}.auth-actions{grid-template-columns:1fr}}
`;

const cssV4 = `
.collage-section{background:var(--night);color:#fff;padding:clamp(76px,10vw,140px) 0}.collage-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:48px}.collage-head h2{margin:0;font-family:'Archivo Black';font-size:clamp(46px,7vw,92px);line-height:.88;letter-spacing:-.04em}.collage-head span{font-weight:800;color:var(--lilac)}
.intro{grid-template-columns:180px minmax(0,1fr) minmax(280px,.72fr);gap:clamp(28px,5vw,72px);align-items:start}.intro-copy p{max-width:650px}.intro-photo{margin:0;position:relative;min-height:520px;overflow:hidden;background:var(--night)}.intro-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.82) contrast(1.04);transition:transform .6s cubic-bezier(.2,.7,.2,1)}.intro-photo:hover img{transform:scale(1.025)}
.benefits-section{width:min(1320px,92vw)}.benefits-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.45fr);gap:6vw;align-items:end;margin-bottom:54px}.benefits-head h2{margin:0}.benefits-head p{font-size:18px;margin:0 0 6px;max-width:520px}.benefit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:2px solid var(--night)}.benefit-item{position:relative;min-height:210px;padding:30px 34px;display:grid;grid-template-columns:72px minmax(0,1fr);gap:26px;align-content:center;border-bottom:1px solid var(--night);overflow:hidden}.benefit-item:nth-child(odd){border-right:1px solid var(--night)}.benefit-item:nth-child(4n+2),.benefit-item:nth-child(4n+3){background:rgba(194,179,218,.28)}.benefit-item:last-child{grid-column:1/-1;grid-template-columns:72px minmax(0,620px);background:var(--night);color:#fff}.benefit-icon{width:64px;height:64px;display:grid;place-items:center;color:var(--blue);transition:transform .35s cubic-bezier(.16,1,.3,1),color .25s}.benefit-icon svg{width:50px;height:50px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.benefit-item:last-child .benefit-icon{color:var(--lilac)}.benefit-item:hover .benefit-icon{transform:rotate(-6deg) scale(1.08);color:var(--purple)}.benefit-item h3{font-family:'Archivo Black';font-size:clamp(24px,2.6vw,39px);line-height:.98;letter-spacing:-.035em;margin:0 0 12px}.benefit-item p{margin:0;max-width:52ch;color:rgba(6,10,55,.72)}.benefit-item:last-child p{color:#d5d9ed}
.year-collage{display:grid;grid-template-columns:repeat(12,1fr);grid-auto-flow:dense;grid-auto-rows:72px;gap:12px;margin-bottom:72px;content-visibility:auto;contain-intrinsic-size:1600px}.year-mark{grid-column:span 2;grid-row:span 2;display:flex;align-items:flex-end;font-family:'Archivo Black';font-size:clamp(38px,5vw,70px);line-height:.8;color:var(--lilac);border-bottom:2px solid var(--lilac);padding-bottom:10px}.collage-shot{margin:0;overflow:hidden;background:#11194b;grid-column:span 4;grid-row:span 5}.collage-shot img{width:100%;height:100%;object-fit:cover;transition:transform .45s cubic-bezier(.2,.7,.2,1),filter .3s;filter:saturate(.86)}.collage-shot:hover img{transform:scale(1.025);filter:saturate(1)}
.collage-shot.format-0{grid-column:span 5;grid-row:span 5}.collage-shot.format-1{grid-column:span 5;grid-row:span 7}.collage-shot.format-2{grid-column:span 3;grid-row:span 5}.collage-shot.format-3{grid-column:span 4;grid-row:span 6}.collage-shot.format-4{grid-column:span 3;grid-row:span 6}.collage-shot.format-5{grid-column:span 5;grid-row:span 5}.collage-shot.format-6{grid-column:span 4;grid-row:span 5}.collage-shot.format-7{grid-column:span 4;grid-row:span 4}
.map-shell{position:relative;min-height:480px;overflow:hidden;background:var(--night);color:#fff}.map-shell iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.map-placeholder{position:absolute;inset:0;display:grid;align-content:end;justify-items:start;gap:14px;padding:clamp(24px,5vw,52px);background:linear-gradient(135deg,#11194b 0 48%,#060a37 48% 100%)}.map-placeholder:before{content:'';position:absolute;inset:clamp(18px,4vw,40px);border:1px solid rgba(194,179,218,.32);background:linear-gradient(30deg,transparent 49.7%,rgba(194,179,218,.18) 50%,transparent 50.3%),linear-gradient(150deg,transparent 49.7%,rgba(99,133,201,.2) 50%,transparent 50.3%);pointer-events:none}.map-placeholder>*{position:relative;z-index:1}.map-placeholder strong{max-width:680px;font-family:'Archivo Black';font-size:clamp(28px,4vw,48px);line-height:1;letter-spacing:-.03em}.map-placeholder p{max-width:620px;margin:0;color:#d5d9ed}.map-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px}.map-actions a{color:#fff;font-weight:800}.map-shell.is-loading .map-placeholder{opacity:.72;pointer-events:none}.map-shell.is-loaded .map-placeholder{display:none}
.algo-section{position:relative;overflow:hidden;background:var(--lilac);color:var(--night);border-top:1px solid var(--night);border-bottom:1px solid var(--night)}.algo-grid{min-height:560px;display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.72fr);align-items:center;gap:6vw;padding-bottom:42px}.algo-copy{padding:90px 0 48px;position:relative;z-index:2}.algo-copy h2{font-family:'Archivo Black';font-size:clamp(52px,8vw,108px);line-height:.86;letter-spacing:-.04em;margin:0 0 28px;max-width:760px}.algo-copy p{max-width:610px;font-size:18px}.algo-name{display:inline-block;margin-bottom:24px;padding:8px 12px;background:var(--night);color:#fff;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.algo-portrait{align-self:end;justify-self:center;width:min(560px,46vw);height:auto;object-fit:contain;filter:drop-shadow(0 28px 24px rgba(6,10,55,.2))}
@media(max-width:900px){.year-collage{grid-template-columns:repeat(2,1fr);grid-auto-rows:260px;content-visibility:visible}.year-mark{grid-column:1/-1;grid-row:auto;height:90px}.collage-shot,.collage-shot:nth-of-type(n){grid-column:span 1;grid-row:span 1}.collage-shot:nth-of-type(3n){grid-column:1/-1}}
@media(max-width:1000px){.intro{grid-template-columns:160px minmax(0,1fr)}.intro-photo{grid-column:2;min-height:480px}.benefit-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.benefit-item,.benefit-item:nth-child(n){grid-column:span 3}.benefit-item:nth-child(1){grid-column:span 6}.benefit-item:nth-child(9){grid-column:span 6}}
@media(max-width:1000px){.benefit-grid{grid-template-columns:1fr}.benefit-item,.benefit-item:nth-child(n){grid-column:1;border-right:0}.benefit-item:last-child{grid-template-columns:72px minmax(0,1fr)}}
@media(max-width:800px){.intro{grid-template-columns:1fr}.intro-photo{grid-column:1;min-height:0;aspect-ratio:4/5}.benefits-head{grid-template-columns:1fr;gap:18px}.benefit-item{min-height:180px;padding:26px 20px;grid-template-columns:54px minmax(0,1fr);gap:18px}.benefit-item:last-child{grid-template-columns:54px minmax(0,1fr)}.benefit-icon{width:50px;height:50px}.benefit-icon svg{width:42px;height:42px}.algo-grid{min-height:auto;grid-template-columns:1fr;padding-bottom:34px}.algo-copy{padding:72px 0 22px}.algo-portrait{width:min(520px,92vw);margin-top:-20px}}
@media(max-width:560px){.collage-section{padding-left:2px;padding-right:2px}.collage-head{display:grid;margin-bottom:32px}.year-collage{grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-flow:dense;grid-auto-rows:54px;gap:7px;margin-bottom:54px;contain-intrinsic-size:2600px}.year-mark{grid-column:1/-1;grid-row:span 2;height:auto;padding-bottom:12px}.collage-shot,.collage-shot:nth-of-type(n){grid-column:span 2;grid-row:span 4}.collage-shot img,.collage-shot:nth-of-type(3n) img{height:100%;aspect-ratio:auto}.collage-shot.format-0{grid-column:span 2;grid-row:span 4}.collage-shot.format-1{grid-column:span 2;grid-row:span 5}.collage-shot.format-2{grid-column:span 2;grid-row:span 3}.collage-shot.format-3{grid-column:span 2;grid-row:span 4}.collage-shot.format-4{grid-column:span 2;grid-row:span 5}.collage-shot.format-5{grid-column:1/-1;grid-row:span 4}.collage-shot.format-6{grid-column:span 2;grid-row:span 4}.collage-shot.format-7{grid-column:span 2;grid-row:span 3}.algo-copy h2{font-size:16vw}.algo-copy p{font-size:16px}}
`;

const motionCss = `
.hero-slide{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.44;filter:saturate(.75) contrast(1.08);transition:clip-path .9s cubic-bezier(.16,1,.3,1),transform 1.2s cubic-bezier(.16,1,.3,1);clip-path:inset(0)}.hero-slide.next{z-index:1;clip-path:inset(0 0 0 100%);transform:scale(1.045)}.hero-slide.next.enter{clip-path:inset(0);transform:scale(1)}.hero-slide.current{z-index:0}.hero-art:after,.hero-art>div{z-index:2}
.motion-ready [data-reveal]{opacity:0;transform:translateY(22px);filter:blur(5px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1),filter .7s cubic-bezier(.16,1,.3,1)}.motion-ready [data-reveal="image"]{transform:none;clip-path:inset(0 0 100% 0);filter:none;transition:clip-path .85s cubic-bezier(.16,1,.3,1)}.motion-ready [data-reveal="benefits"]{transform:none;filter:none;clip-path:inset(0 100% 0 0);transition:clip-path .8s cubic-bezier(.16,1,.3,1)}.motion-ready [data-reveal].is-visible{opacity:1;transform:none;filter:none;clip-path:inset(0)}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.hero-slide,.motion-ready [data-reveal]{transition:none!important;transform:none!important;filter:none!important;clip-path:inset(0)!important;opacity:1!important}}
@media(max-width:900px){.motion-ready [data-reveal]{transition:none!important;transform:none!important;filter:none!important;clip-path:inset(0)!important;opacity:1!important}}
`;

const benefitDescriptions: Record<string, string> = {
  Relasi:
    "Kenal lebih dekat dengan teman satu angkatan dan mulai membangun support system sejak hari pertama.",
  "E-Sertifikat":
    "Bukti partisipasi digital yang dapat disimpan untuk dokumentasi perjalanan akademikmu.",
  Doorprize:
    "Kesempatan membawa pulang hadiah pilihan dari rangkaian aktivitas selama kegiatan.",
  "Benefit Rahasia":
    "Ada kejutan tambahan yang baru akan dibuka bersama saat Collaboration Day berlangsung.",
  "3x Makan":
    "Konsumsi utama disiapkan tiga kali agar energimu tetap terjaga sepanjang kegiatan.",
  Snack:
    "Camilan untuk menemani jeda, obrolan, dan sesi santai bersama teman baru.",
  Pengalaman:
    "Dua hari berisi permainan, tantangan kelompok, dan cerita yang tidak didapat di ruang kelas.",
  Dokumentasi:
    "Momen terbaik angkatanmu diabadikan oleh tim dokumentasi selama kegiatan.",
  "Jodoh bila beruntung":
    "Setidaknya pulang membawa teman baru. Untuk sisanya, biarkan semesta Codeverse bekerja.",
};

const benefitIcons = [
  '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="17" r="7"/><circle cx="34" cy="19" r="5"/><path d="M5 39c1-8 6-12 12-12s11 4 12 12M28 30c2-2 4-3 7-3 5 0 8 4 9 10"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 5h22l7 7v25H10z"/><path d="M32 5v8h7M16 21h16M16 27h16M16 33h9"/><circle cx="34" cy="36" r="7"/><path d="m31 36 2 2 4-5"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 18h24v23H12zM9 12h30v8H9zM24 12v29M10 12c-3-5 2-9 7-6 3 2 5 6 7 6M38 12c3-5-2-9-7-6-3 2-5 6-7 6"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 29 17 42 18 32 27 35 41 24 34 13 41 16 27 6 18 19 17z"/><path d="M24 14v11M24 31h.01"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 23h32c0 10-6 17-16 17S8 33 8 23Z"/><path d="M12 23c1-9 6-14 12-14s11 5 12 14M17 13l3 10M31 13l-3 10"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 14h20l-2 27H16zM12 14h24M18 14l2-7h8l2 7"/><path d="M20 25c3-3 5-3 8 0M21 31h6"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 43c10-7 16-15 16-24A16 16 0 0 0 8 19c0 9 6 17 16 24Z"/><path d="M17 20h14M24 13v14M18 33c4-2 8-2 12 0"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="12" width="36" height="27" rx="2"/><path d="m14 31 7-7 6 6 5-5 8 8M17 12l3-5h8l3 5"/><circle cx="34" cy="20" r="3"/></svg>',
  '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 41S7 31 7 18c0-8 10-12 17-4 7-8 17-4 17 4 0 13-17 23-17 23Z"/><path d="M17 21h14M24 14v14"/></svg>',
];

export function layout(
  title: string,
  body: string,
  user?: SessionUser | null,
): string {
  const nav = user
    ? `<a href="/#arsip">Arsip</a><a href="/dashboard">Dashboard</a><form method="post" action="/logout" style="display:inline"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><button class="secondary" type="submit">Keluar</button></form>`
    : `<a href="/#tentang">Tentang</a><a href="/#arsip">Arsip</a><a class="button" href="/login">Masuk</a>`;
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Collaboration Day Informatika 2026: Connecting Minds in the Digital Universe."><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" href="/favicon.png"><title>${escapeHtml(title)}</title><style>${css}${cssV2}${cssV3}${cssV4}${motionCss}</style></head><body><nav><a class="brand" href="/"><img src="/brand/collaboration-day-2026.png" alt=""><span>COLLABORATION DAY</span></a><div class="navlinks">${nav}</div></nav>${body}<footer><div class="inline"><img src="/brand/hmps-informatika.png" alt="HMPS Informatika" width="42" height="42"><img src="/brand/program-studi-informatika.png" alt="Program Studi Informatika" width="42" height="42"><b>COLLABORATION DAY 2026</b></div><span>Bangun Relasi, Satu Ambisi. Informatika, Salam Kolaborasi!</span></footer><script src="/flash.js" defer></script></body></html>`;
}

export function landing(
  current: Edition,
  archived: Edition[],
  gallery: Gallery[],
  benefits: BenefitItem[] = [],
): string {
  const start = new Date(current.starts_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  const end = new Date(current.ends_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  const slides = [...new Set(gallery.map((item) => item.image_url))];
  const firstSlide =
    slides[0] || "/media/archive/2025/IMG_20250830_093844.webp";
  const slideData = encodeURIComponent(
    JSON.stringify(slides.length ? slides : [firstSlide]),
  );
  const archiveYears = archived.map((edition) => edition.year);
  const archiveRange = archiveYears.length
    ? `${Math.min(...archiveYears)}—${Math.max(...archiveYears)}`
    : "";
  return optimizeLandingImages(layout(
    current.title,
    `<main><section class="hero" data-slides="${slideData}"><div class="hero-copy"><div><span class="kicker">Informatika UIN SAIZU / 5–6 September 2026</span><h1>CODE<span>VERSE</span></h1></div><div class="facts"><div><small>Tanggal</small>${start}–${end}</div><div><small>Tempat</small>${escapeHtml(current.venue)}</div></div></div><div class="hero-art"><img class="hero-slide current" src="${escapeHtml(firstSlide)}" alt="Dokumentasi Collaboration Day" fetchpriority="high" decoding="async"><img class="hero-slide next" src="${escapeHtml(firstSlide)}" alt="" decoding="async"><div><h2>${escapeHtml(current.theme.replace(/^CODEVERSE:\s*/i, ""))}</h2><p>Bangun Relasi, Satu Ambisi.<br>Informatika, Salam Kolaborasi!</p></div></div></section>
  <section class="section wrap intro" id="tentang"><div class="eyebrow">Untuk mahasiswa baru Informatika</div><div class="intro-copy" data-reveal><h2>Dua hari untuk menjadi satu angkatan.</h2><p>${escapeHtml(current.description)}</p><p>Permainan, aktivitas kelompok, dan sesi edukatif dirancang untuk membantu mahasiswa baru saling mengenal tanpa suasana orientasi yang kaku.</p></div><figure class="intro-photo" data-reveal="image"><img src="/media/archive/2025/IMG_20250830_093926.webp" alt="Mahasiswa baru mengikuti aktivitas Collaboration Day" width="1350" height="1800" loading="lazy" decoding="async"></figure></section>
  ${
    benefits.length
      ? `<section class="section wrap benefits-section"><div class="benefits-head" data-reveal><h2>Yang kamu bawa pulang.</h2><p>Bukan cuma dua hari kegiatan. Ada bekal, cerita, dan orang-orang baru yang ikut tumbuh bersama perjalanan kuliahmu.</p></div><div class="benefit-grid" data-reveal="benefits">${benefits
          .map((item, index) => {
            const title =
              item.title === "Benefit 👀" ? "Benefit Rahasia" : item.title;
            return `<article class="benefit-item"><div class="benefit-icon">${benefitIcons[index % benefitIcons.length]}</div><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(item.description || benefitDescriptions[title] || "Bagian dari pengalaman lengkap Collaboration Day 2026.")}</p></div></article>`;
          })
          .join("")}</div></section>`
      : ""
  }
  ${current.map_embed_url ? `<section class="section wrap"><div data-reveal><h2>Temukan lokasi kegiatan.</h2><p>${escapeHtml(current.venue)}</p></div><div class="map-shell" data-map-src="${escapeHtml(current.map_embed_url)}" data-reveal="image"><div class="map-placeholder"><strong>Peta interaktif sedang disiapkan.</strong><p data-map-status aria-live="polite">Google Maps akan dimuat otomatis saat bagian ini mendekati layar.</p><div class="map-actions"><a class="button" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(current.venue)}" target="_blank" rel="noopener noreferrer">Buka di Google Maps</a></div></div></div></section>` : ""}
  <section class="algo-section"><div class="wrap algo-grid"><div class="algo-copy" data-reveal><span class="algo-name">Algo / Mascot 2026</span><h2>Kenalin, Algo.</h2><p>Penjelajah digital yang ramah, energik, dan selalu sigap. Dengan jet boots dan sayap mekanisnya, Algo siap menemani mahasiswa baru menjelajahi Codeverse dan memulai kolaborasi pertama mereka.</p></div><img class="algo-portrait" data-reveal="image" src="/media/algo.webp" alt="Algo, maskot Collaboration Day 2026, melambaikan tangan" width="1200" height="1200" loading="lazy" decoding="async"></div></section>
  <section class="register-band"><div class="wrap register-grid"><div data-reveal><span class="kicker">Registrasi mahasiswa baru Informatika</span><h2>Mulai dari akunmu.</h2><p>Buat akun, verifikasi email, lengkapi profil, lalu verifikasi nomor WhatsApp sebelum mendaftar sebagai peserta.</p></div><div class="stack" data-reveal><a class="button" href="/signup">Buat akun peserta</a><a class="button secondary" href="/login">Sudah punya akun? Masuk</a></div></div></section>
  ${
    gallery.length
      ? `<section class="collage-section" id="arsip"><div class="wrap"><div class="collage-head" data-reveal><h2>Arsip.</h2><span>${archiveRange}</span></div>${archived
          .map(
            (edition) =>
              `<div class="year-collage"><div class="year-mark">${edition.year}</div>${gallery
                .filter((item) => item.year === edition.year)
                .map(
                  (item, index) =>
                    `<figure class="collage-shot format-${index % 8}"><img loading="lazy" decoding="async" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.alt_text)}"></figure>`,
                )
                .join("")}</div>`,
          )
          .join("")}</div></section>`
      : ""
  }</main><script src="/landing.js?v=20260817-android-reveal" defer></script>`,
  ));
}

export function authPage(
  kind: "signup" | "login" | "forgot" | "reset",
  message = "",
  token = "",
  turnstileSiteKey = "",
): string {
  const turnstile = turnstileSiteKey
    ? `<div class="cf-turnstile" data-sitekey="${escapeHtml(turnstileSiteKey)}"></div>`
    : "";
  const content = {
    signup: [
      "Buat akun",
      "Gunakan email aktif yang dapat kamu buka.",
      `<label>Email<input name="email" type="email" maxlength="254" required autocomplete="email"></label><label>Password<input name="password" type="password" minlength="10" maxlength="128" required autocomplete="new-password"></label><label class="checkline"><input name="consent" type="checkbox" value="yes" required><span>Saya menyetujui kebijakan privasi untuk penyelenggaraan acara.</span></label>${turnstile}<div class="auth-actions"><button type="submit">Daftar</button><p class="auth-switch">Sudah punya akun? <a href="/login">Masuk di sini</a></p></div>`,
    ],
    login: [
      "Masuk",
      "Buka dashboard Collaboration Day.",
      `<label>Email<input name="email" type="email" maxlength="254" required autocomplete="email"></label><label>Password<input name="password" type="password" maxlength="128" required autocomplete="current-password"></label>${turnstile}<div class="auth-actions"><button type="submit">Masuk</button><p class="auth-switch">Belum punya akun? <a href="/signup">Daftar di sini</a></p></div><a href="/forgot-password">Lupa password?</a>`,
    ],
    forgot: [
      "Lupa password",
      "Kami akan mengirim tautan reset jika akun ditemukan.",
      `<label>Email<input name="email" type="email" maxlength="254" required autocomplete="email"></label><button type="submit">Kirim tautan reset</button>`,
    ],
    reset: [
      "Password baru",
      "Gunakan minimal 10 karakter.",
      `<input type="hidden" name="token" value="${escapeHtml(token)}"><label>Password baru<input name="password" type="password" minlength="10" maxlength="128" required autocomplete="new-password"></label><button type="submit">Simpan password</button>`,
    ],
  }[kind];
  const script = turnstileSiteKey
    ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>'
    : "";
  return layout(
    content[0],
    `<main class="panel"><span class="eyebrow">Akun Collaboration Day</span><h1>${content[0]}</h1><p>${content[1]}</p>${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<form class="stack" method="post">${content[2]}</form></main>${script}`,
  );
}

export function verifyEmailPage(token: string, message = ""): string {
  return layout(
    "Verifikasi email",
    `<main class="panel"><span class="eyebrow">Verifikasi akun</span><h1>Konfirmasi emailmu.</h1>${message ? `<div class="notice">${escapeHtml(message)}</div>` : `<p>Tekan tombol berikut untuk menyelesaikan verifikasi email.</p><form method="post"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit">Verifikasi email</button></form>`}</main>`,
  );
}

export function participantDashboard(
  user: SessionUser,
  profile: Profile | null,
  edition: Edition | null,
  registration: Record<string, unknown> | null,
  methods: PaymentMethod[],
  socialProofSubmitted: boolean | string = false,
  admissionProofSubmitted = false,
  message = "",
): string {
  let content = "";
  const socialProofStatus = socialProofSubmitted === true ? "verified" : String(socialProofSubmitted || "");
  if (!user.email_verified_at) {
    content = `<span class="status">Langkah 1 dari 6</span><h1>Verifikasi email.</h1><p>Kami mengirim tautan verifikasi ke <b>${escapeHtml(user.email)}</b>.</p><form method="post" action="/dashboard/email/resend"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><button type="submit">Kirim ulang email</button></form>`;
  } else if (!profile || !profile.gender) {
    content = `<span class="status">Langkah 2 dari 6</span><h1>Lengkapi profil.</h1><p>Data ini digunakan untuk operasional peserta, pembagian kelompok, dan dokumentasi registrasi.</p><form class="stack" method="post" action="/dashboard/profile"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><label>Nama lengkap<input name="full_name" required minlength="2" maxlength="100" autocomplete="name" value="${escapeHtml(profile?.full_name || "")}"></label><label>Jenis kelamin<select name="gender" required><option value="">Pilih jenis kelamin</option><option value="male" ${profile?.gender === "male" ? "selected" : ""}>Laki-laki</option><option value="female" ${profile?.gender === "female" ? "selected" : ""}>Perempuan</option></select></label><label>Nomor WhatsApp<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx" required maxlength="18" value="${escapeHtml(profile?.phone || "")}"></label><small>Jenis kelamin digunakan untuk menyeimbangkan komposisi anggota setiap kelompok.</small><label class="inline" style="display:flex;align-items:flex-start;gap:10px"><input type="checkbox" name="documentation_consent" value="yes" ${profile?.documentation_consent_at ? "checked" : ""} style="width:17px;height:17px;margin:2px 0 0;flex:0 0 auto"><span>Saya menyetujui dokumentasi kegiatan sesuai kebijakan publikasi.</span></label><button type="submit">Simpan profil</button></form>`;
  } else if (!profile.whatsapp_verified_at) {
    content = `<span class="status">Langkah 3 dari 6</span><h1>Verifikasi WhatsApp.</h1><p>Kode dikirim ke <b>${escapeHtml(profile.phone)}</b>.</p><div class="inline"><form method="post" action="/dashboard/whatsapp/send"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><button type="submit">Kirim kode</button></form></div><hr class="divider"><form class="stack" method="post" action="/dashboard/whatsapp/verify"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><label>Kode 6 digit<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label><button type="submit">Verifikasi nomor</button></form><details><summary>Nomor atau data profil salah?</summary><form class="stack" method="post" action="/dashboard/profile"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><label>Nama lengkap<input name="full_name" required minlength="2" maxlength="100" autocomplete="name" value="${escapeHtml(profile.full_name)}"></label><label>Jenis kelamin<select name="gender" required><option value="male" ${profile.gender === "male" ? "selected" : ""}>Laki-laki</option><option value="female" ${profile.gender === "female" ? "selected" : ""}>Perempuan</option></select></label><label>Nomor WhatsApp<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="18" value="${escapeHtml(profile.phone)}"></label><button class="secondary" type="submit">Perbarui profil</button></form></details>`;
  } else if (socialProofStatus !== "verified" && socialProofStatus !== "pending") {
    content = `<span class="status">Langkah 4 dari 6</span><h1>Lengkapi syarat media sosial.</h1>${socialProofStatus === "rejected" ? '<div class="notice error">Bukti sebelumnya ditolak. Periksa kembali akun yang diikuti lalu kirim screenshot baru.</div>' : ""}<p>Follow ketiga akun resmi berikut. Setelah itu, unggah satu screenshot untuk setiap akun sebagai bukti.</p><div class="social-requirements" aria-label="Akun media sosial yang wajib diikuti"><a class="social-account" href="https://www.instagram.com/collaborationday_uinsaizu/" target="_blank" rel="noreferrer"><span class="social-platform" aria-hidden="true">IG</span><span class="social-copy"><b>Instagram Collaboration Day</b><span>@collaborationday_uinsaizu</span></span><span class="social-cta">Buka akun <span aria-hidden="true">↗</span></span></a><a class="social-account" href="https://www.instagram.com/hmpsinf_uinsaizu/" target="_blank" rel="noreferrer"><span class="social-platform" aria-hidden="true">IG</span><span class="social-copy"><b>Instagram HMPS Informatika</b><span>@hmpsinf_uinsaizu</span></span><span class="social-cta">Buka akun <span aria-hidden="true">↗</span></span></a><a class="social-account" href="https://www.tiktok.com/@hmpsinf_uinsaizu" target="_blank" rel="noreferrer"><span class="social-platform" aria-hidden="true">TT</span><span class="social-copy"><b>TikTok HMPS Informatika</b><span>@hmpsinf_uinsaizu</span></span><span class="social-cta">Buka akun <span aria-hidden="true">↗</span></span></a></div><div class="social-upload-head"><h2>Upload bukti follow</h2><p>Gunakan screenshot yang memperlihatkan status sudah mengikuti akun.</p></div><form class="stack social-upload" method="post" action="/dashboard/social-proofs" enctype="multipart/form-data"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><label>Instagram Collaboration Day<input name="collaboration_day_instagram" type="file" accept="image/jpeg,image/png" required></label><label>Instagram HMPS Informatika<input name="hmps_instagram" type="file" accept="image/jpeg,image/png" required></label><label>TikTok HMPS Informatika<input name="hmps_tiktok" type="file" accept="image/jpeg,image/png" required></label><small>Masing-masing file maksimal 5 MB. Bukti disimpan private dan hanya dapat diakses peserta terkait, pendamping kelompok, serta admin.</small><button type="submit">Kirim tiga screenshot</button></form>`;
  } else if (!admissionProofSubmitted) {
    content = `<span class="status">Langkah 5 dari 6</span><h1>Lampirkan bukti kelulusan.</h1>${socialProofStatus === "pending" ? '<div class="notice">Bukti follow sudah diterima dan sedang diperiksa pendamping. Kamu dapat melanjutkan tahap berikutnya.</div>' : ""}<p>Unggah dokumen yang menunjukkan bahwa kamu dinyatakan lulus masuk Program Studi Informatika.</p><div class="notice">Dokumen ini bersifat private dan hanya digunakan panitia untuk memvalidasi kelayakan peserta.</div><form class="stack" method="post" action="/dashboard/admission-proof" enctype="multipart/form-data"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><label>Bukti kelulusan masuk Prodi Informatika<input name="admission_proof" type="file" accept="image/jpeg,image/png,application/pdf" required></label><small>Format JPG, PNG, atau PDF; maksimal 5 MB.</small><button type="submit">Kirim bukti kelulusan</button></form>`;
  } else if (!registration) {
    content = `<span class="status">Langkah 6 dari 6</span><h1>Daftar sebagai peserta.</h1><div class="notice">Bukti follow dan bukti kelulusan sudah tersimpan.</div>${edition ? `<div class="registration-summary"><div class="registration-summary-head"><small>Current edition · ${edition.year}</small><h2>${escapeHtml(edition.title)}</h2><p>${escapeHtml(edition.theme)}</p></div><div class="registration-facts"><div class="registration-fact"><small>Lokasi kegiatan</small><b>${escapeHtml(edition.venue)}</b></div><div class="registration-fact"><small>Biaya pendaftaran</small><b class="registration-price">${formatRupiah(edition.ticket_amount)}</b></div><div class="registration-fact"><small>Kuota</small><b>${edition.capacity_unlimited ? "Tanpa batas" : `${edition.capacity} peserta`}</b></div></div><form class="registration-action" method="post" action="/dashboard/register"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><input type="hidden" name="edition" value="${escapeHtml(edition.slug)}"><p>Periksa kembali detail kegiatan sebelum mengonfirmasi.</p><button type="submit">Konfirmasi pendaftaran</button></form></div>` : '<div class="notice">Pendaftaran belum tersedia.</div>'}`;
  } else {
    const confirmed = registration.status === "confirmed";
    const labels: Record<string, string> = {
      pending_payment: "Menunggu pembayaran",
      payment_review: "Sedang diverifikasi",
      confirmed: "Pembayaran terverifikasi",
      rejected: "Bukti ditolak",
      cancelled: "Dibatalkan",
    };
    const paymentChoices = methods.map((method) => `<option value="${method.id}">${escapeHtml(method.label)}</option>`).join("");
    const paymentOptions = methods.map((method) => participantPaymentOption(method, user)).join("");
    const paymentFlow = methods.length ? `<div class="payment-selector"><label>Pilih metode pembayaran<select id="participant-payment-method" required><option value="">Pilih salah satu metode</option>${paymentChoices}</select></label></div><div class="participant-payment-options" aria-live="polite"><div class="payment-empty" id="participant-payment-empty">Pilih metode pembayaran untuk melihat detail dan melanjutkan.</div>${paymentOptions}</div><script src="/participant-payment.js" defer></script>` : '<div class="notice">Belum ada metode pembayaran yang aktif.</div>';
    const eventOverview = `<div class="payment-overview"><div class="payment-overview-head"><small>Registrasi Collaboration Day</small><h2>${escapeHtml(registration.title)}</h2><p>${escapeHtml(registration.theme)}</p></div><div class="payment-overview-facts"><div><small>Nomor peserta</small><b class="mono">${escapeHtml(registration.public_id)}</b></div><div><small>Total tagihan</small><b>${formatRupiah(Number(registration.amount_due))}</b></div></div></div>`;
    content = `<span class="status">${escapeHtml(labels[String(registration.status)] ?? registration.status)}</span><h1>Halo, ${escapeHtml(profile.full_name)}.</h1>${eventOverview}${confirmed ? `<div class="notice"><b>Participant pass aktif.</b><br>Reference QR: <span class="mono">${escapeHtml(registration.ticket_reference)}</span></div>${registration.receipt_id ? `<a class="button" href="/dashboard/receipts/${escapeHtml(registration.receipt_id)}">Unduh kuitansi elektronik</a>` : "<p>Kuitansi elektronik sedang diproses.</p>"}` : `${registration.rejection_reason ? `<div class="notice error"><b>Pembayaran ditolak:</b> ${escapeHtml(registration.rejection_reason)}</div>` : ""}${registration.status === "payment_review" ? '<div class="notice"><b>Pembayaran sedang diverifikasi.</b><br>Kamu tidak perlu mengirim bukti kembali selama proses review.</div>' : paymentFlow}`}`;
    if (registration.group_name) content += `<div class="notice"><b>Kelompok ${escapeHtml(registration.group_name)}</b>${registration.group_whatsapp_url ? `<br><a href="${escapeHtml(registration.group_whatsapp_url)}" target="_blank" rel="noreferrer">Gabung grup WhatsApp</a>` : "<br>Tautan grup WhatsApp sedang disiapkan pendamping."}</div>`;
    if (!confirmed && Number(registration.cash_paid || 0) > 0) content += `<div class="notice"><b>Cicilan tunai: ${formatRupiah(Number(registration.cash_paid))}</b><br>Sisa ${formatRupiah(Math.max(0, Number(registration.amount_due) - Number(registration.cash_paid)))}${registration.cash_timing ? ` · Penyelesaian ${registration.cash_timing === "technical_meeting" ? "saat technical meeting" : registration.cash_timing === "event" ? "saat acara" : "lunas"}` : ""}</div>`;
    if (confirmed && !registration.receipt_id) content += `<form method="post" action="/dashboard/receipts/recover"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><button type="submit">Coba buat kuitansi</button></form>`;
  }
  if (profile?.whatsapp_verified_at && profile.group_name && !registration) content = `<div class="notice"><b>Kelompok ${escapeHtml(profile.group_name)}</b>${profile.group_whatsapp_url ? `<br><a href="${escapeHtml(profile.group_whatsapp_url)}" target="_blank" rel="noreferrer">Gabung grup WhatsApp</a>` : "<br>Tautan grup WhatsApp sedang disiapkan pendamping."}</div>${content}`;
  return dashboardLayout(
    "Dashboard Peserta",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="participant-card">${content}</div>`,
    user,
    "overview",
  );
}

function participantPaymentOption(method: PaymentMethod, user: SessionUser): string {
  const csrf = `<input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}">`;
  const typeLabel = method.type === "static_qris" ? "QRIS" : method.type === "cash" ? "Tunai" : "Transfer bank";
  const details = method.type === "static_qris"
    ? `<p>Scan kode berikut dari aplikasi pembayaran. Nominal sudah terisi sesuai tagihan.</p><div class="payment-qris"><img src="/dashboard/payment-methods/${method.id}/qris.svg" alt="QRIS dengan nominal pembayaran otomatis"><small>${escapeHtml(method.instructions || "Scan QRIS untuk melanjutkan pembayaran.")}</small></div>`
    : method.type === "cash"
      ? `<p>Bayar langsung kepada pendamping kelompok. Pembayaran dapat dicatat sebagai cicilan sampai lunas.</p><div class="notice">${escapeHtml(method.instructions || "Serahkan pembayaran tunai kepada pendamping kelompok.")}</div>`
      : `<p>Transfer sesuai nominal tagihan ke rekening berikut.</p><div class="bank-details"><div><small>Bank</small><b>${escapeHtml(method.bank_name)}</b></div><div><small>Nomor rekening</small><b class="mono">${escapeHtml(method.account_number)}</b></div><div><small>Atas nama</small><b>${escapeHtml(method.account_name)}</b></div></div><small>${escapeHtml(method.instructions || "Unggah bukti setelah transfer berhasil.")}</small>`;
  const action = method.type === "cash"
    ? `<form class="payment-action" method="post" action="/dashboard/payment-cash">${csrf}<input type="hidden" name="payment_method_id" value="${method.id}"><button type="submit">Ajukan pembayaran tunai</button></form>`
    : `<form class="stack payment-action" method="post" action="/dashboard/payment-proof" enctype="multipart/form-data">${csrf}<input type="hidden" name="payment_method_id" value="${method.id}"><label>Bukti pembayaran<input name="proof" type="file" accept="image/jpeg,image/png,application/pdf" required></label><small>Format JPG, PNG, atau PDF; maksimal 5 MB.</small><button type="submit">Kirim bukti pembayaran</button></form>`;
  return `<section class="participant-payment-option" data-payment-option="${method.id}" hidden><div class="payment-option-head"><div><span class="payment-type">${typeLabel}</span><h3>${escapeHtml(method.label)}</h3></div></div><div class="payment-option-body">${details}</div>${action}</section>`;
}

export function staffVerificationPage(user: SessionUser, message = ""): string {
  return dashboardLayout(
    "Verifikasi Akun Staf",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<section class="app-card"><h2>Verifikasi email staf.</h2><p>Selesaikan verifikasi email sebelum membuka data peserta atau menjalankan tugas operasional.</p><form method="post" action="/dashboard/email/resend"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><button type="submit">Kirim ulang email verifikasi</button></form></section>`,
    user,
  );
}

export function accountProfilePage(
  user: SessionUser,
  staff: StaffProfile | null,
  message = "",
): string {
  const csrf = `<input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}">`;
  const roleLabel = user.role === "admin" ? "Administrator" : user.role === "bendahara" ? "Bendahara" : "Pendamping";
  const whatsappStatus = staff?.phone_e164 ? (staff.whatsapp_verified_at ? "Terverifikasi" : "Belum verifikasi") : "Belum diisi";
  const phoneField = staff ? `<label>Nomor WhatsApp${user.role === "bendahara" ? " (opsional)" : ""}<input name="phone" inputmode="tel" maxlength="18" ${user.role === "pendamping" ? "required" : ""} value="${escapeHtml(staff.phone_e164 || "")}" placeholder="08xxxxxxxxxx"></label>` : "";
  const otpControls = user.role === "pendamping" && staff?.phone_e164 && !staff.whatsapp_verified_at
    ? `<section class="app-card half"><h3>Verifikasi WhatsApp</h3><p>Kirim OTP setelah nomor pada profil sudah benar.</p><form method="post" action="/dashboard/whatsapp/send">${csrf}<button type="submit">Kirim kode OTP</button></form><hr class="divider"><form class="stack" method="post" action="/dashboard/whatsapp/verify">${csrf}<label>Kode 6 digit<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label><button type="submit">Verifikasi nomor</button></form></section>`
    : "";
  return dashboardLayout(
    "Profil",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="page-head"><div><h2>Profil akun.</h2><p>Kelola identitas staf dan keamanan akunmu.</p></div></div><div class="profile-meta"><div><small>Email</small><b>${escapeHtml(user.email)}</b></div><div><small>Role</small><b>${roleLabel}</b></div><div><small>${staff ? "Status WhatsApp" : "Status email"}</small><b>${staff ? whatsappStatus : user.email_verified_at ? "Terverifikasi" : "Belum verifikasi"}</b></div></div><div class="app-grid"><section class="app-card half"><h3>Informasi profil</h3><form class="stack" method="post" action="/dashboard/account">${csrf}<label>Nama lengkap<input name="display_name" required minlength="2" maxlength="100" autocomplete="name" value="${escapeHtml(user.display_name || staff?.full_name || "")}"></label>${phoneField}<button type="submit">Simpan profil</button></form></section><section class="app-card half"><h3>Ubah password</h3><form class="stack" method="post" action="/dashboard/account/password">${csrf}<label>Password saat ini<input name="current_password" type="password" required autocomplete="current-password"></label><label>Password baru<input name="new_password" type="password" minlength="10" maxlength="128" required autocomplete="new-password"></label><label>Ulangi password baru<input name="confirm_password" type="password" minlength="10" maxlength="128" required autocomplete="new-password"></label><button type="submit">Perbarui password</button></form></section>${otpControls}</div>`,
    user,
    "profile",
  );
}

export function pendampingDashboardPage(
  user: SessionUser,
  staff: StaffProfile | null,
  group: Record<string, unknown> | null,
  members: Record<string, unknown>[],
  cashPayments: Record<string, unknown>[],
  message = "",
): string {
  const csrf = `<input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}">`;
  if (!user.email_verified_at) {
    return dashboardLayout(
      "Dashboard Pendamping",
      `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<section class="app-card"><h2>Verifikasi email terlebih dahulu.</h2><p>Akses operasional pendamping baru aktif setelah email akun terverifikasi.</p><form method="post" action="/dashboard/email/resend">${csrf}<button type="submit">Kirim ulang email</button></form></section>`,
      user,
    );
  }
  if (!staff?.phone_e164) {
    return dashboardLayout(
      "Dashboard Pendamping",
      `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<section class="app-card"><h2>Lengkapi profil pendamping.</h2><p>Nomor ini akan diverifikasi melalui OTP sebelum akses review kelompok dibuka.</p><form class="stack" method="post" action="/dashboard/pendamping/profile">${csrf}<label>Nama lengkap<input name="full_name" required minlength="2" maxlength="100" value="${escapeHtml(staff?.full_name || "")}"></label><label>Nomor WhatsApp<input name="phone" required maxlength="18" placeholder="08xxxxxxxxxx"></label><button type="submit">Simpan dan lanjutkan</button></form></section>`,
      user,
    );
  }
  if (!staff.whatsapp_verified_at) {
    return dashboardLayout(
      "Dashboard Pendamping",
      `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<section class="app-card"><h2>Verifikasi nomor WhatsApp.</h2><p>Kode OTP dikirim ke <b>${escapeHtml(staff.phone_e164)}</b>.</p><div class="inline"><form method="post" action="/dashboard/whatsapp/send">${csrf}<button type="submit">Kirim kode</button></form></div><hr class="divider"><form class="stack" method="post" action="/dashboard/whatsapp/verify">${csrf}<label>Kode 6 digit<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label><button type="submit">Verifikasi nomor</button></form></section>`,
      user,
    );
  }
  if (!group) {
    return dashboardLayout(
      "Dashboard Pendamping",
      `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<section class="app-card"><h2>Belum ada kelompok.</h2><p>Akunmu sudah siap, tetapi admin belum menetapkan kelompok yang kamu dampingi.</p></section>`,
      user,
    );
  }
  const proofRows =
    members
      .map((member) => {
        const proofStatus = String(member.social_proof_status || "belum mengirim");
        const proofId = Number(member.social_proof_id || 0);
        const proofLinks = proofId
          ? `<div class="inline"><a href="/dashboard/social-proofs/${proofId}/collaboration-day-instagram" target="_blank">Collab Day</a><a href="/dashboard/social-proofs/${proofId}/hmps-instagram" target="_blank">Instagram HMPS</a><a href="/dashboard/social-proofs/${proofId}/hmps-tiktok" target="_blank">TikTok HMPS</a></div>`
          : "—";
        const review =
          proofId && proofStatus === "pending"
            ? `<form class="stack" method="post" action="/dashboard/social-proofs/${proofId}/review">${csrf}<select name="decision"><option value="verified">Setujui</option><option value="rejected">Tolak</option></select><input name="rejection_reason" maxlength="500" placeholder="Alasan jika ditolak"><button type="submit">Simpan review</button></form>`
            : "—";
        return `<tr><td><b>${escapeHtml(member.full_name)}</b><br><small>${escapeHtml(member.phone)}</small></td><td><span class="status">${escapeHtml(proofStatus)}</span>${member.rejection_reason ? `<br><small>${escapeHtml(member.rejection_reason)}</small>` : ""}</td><td>${proofLinks}</td><td>${review}</td></tr>`;
      })
      .join("") || '<tr><td colspan="4">Belum ada peserta dalam kelompok.</td></tr>';
  const cashRows =
    cashPayments
      .map((payment) => {
        const due = Number(payment.amount_due);
        const paid = Number(payment.amount_paid || 0);
        const remaining = Math.max(0, due - paid);
        return `<tr><td><b>${escapeHtml(payment.full_name)}</b><br><span class="mono">${escapeHtml(payment.public_id)}</span></td><td><div class="balance"><div><small>Tagihan</small><b>${formatRupiah(due)}</b></div><div><small>Diterima</small><b>${formatRupiah(paid)}</b></div><div><small>Sisa</small><b>${formatRupiah(remaining)}</b></div></div>${payment.last_timing ? `<small>Rencana terakhir: ${escapeHtml(payment.last_timing === "technical_meeting" ? "Saat technical meeting" : payment.last_timing === "event" ? "Saat acara" : "Lunas")}</small>` : ""}</td><td><form class="stack" method="post" action="/dashboard/cash-payments/${escapeHtml(payment.id)}/entries">${csrf}<label>Nominal diterima<input name="amount_received" type="number" min="1" max="${remaining}" required></label><label>Status penyelesaian<select name="settlement_timing"><option value="paid">Lunas</option><option value="technical_meeting">Saat technical meeting</option><option value="event">Saat acara</option></select></label><label>Catatan<input name="notes" maxlength="300" placeholder="Opsional"></label><button type="submit">Catat penerimaan</button></form></td></tr>`;
      })
      .join("") || '<tr><td colspan="3">Belum ada pengajuan pembayaran tunai.</td></tr>';
  return dashboardLayout(
    "Kelompok Saya",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="page-head"><div><h2>${escapeHtml(group.name)}</h2><p>${members.length} peserta dalam pendampingan ${escapeHtml(staff.full_name)}.</p></div></div><div class="app-grid"><section class="app-card"><h3>Grup WhatsApp kelompok</h3><form class="app-form" method="post" action="/dashboard/pendamping/group">${csrf}<label class="full">Tautan undangan<input name="whatsapp_invite_url" type="url" required placeholder="https://chat.whatsapp.com/..." value="${escapeHtml(group.whatsapp_invite_url || "")}"></label><button type="submit">Simpan tautan grup</button></form></section><section class="app-card"><h3>Verifikasi bukti follow</h3><div class="app-table"><table><thead><tr><th>Peserta</th><th>Status</th><th>Berkas</th><th>Tindakan</th></tr></thead><tbody>${proofRows}</tbody></table></div></section><section class="app-card"><h3>Pembayaran tunai & cicilan</h3><p>Catat hanya uang yang benar-benar sudah diterima. Registrasi dikonfirmasi otomatis setelah total tepat lunas.</p><div class="app-table"><table><thead><tr><th>Peserta</th><th>Saldo</th><th>Catat penerimaan</th></tr></thead><tbody>${cashRows}</tbody></table></div></section></div>`,
    user,
    "overview",
  );
}

export function adminTeamPage(
  user: SessionUser,
  edition: Edition | null,
  staff: Record<string, unknown>[],
  groups: Record<string, unknown>[],
  participants: Record<string, unknown>[],
  message = "",
): string {
  const csrf = `<input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}">`;
  const pendamping = staff.filter((member) => member.role === "pendamping");
  const groupOptions = groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join("");
  const participantOptions = participants.map((participant) => `<option value="${escapeHtml(participant.id)}">${escapeHtml(participant.full_name)} · ${escapeHtml(participant.email)}</option>`).join("");
  const staffRows = staff.map((member) => `<tr><td><b>${escapeHtml(member.full_name || "Belum melengkapi profil")}</b><br><small>${escapeHtml(member.email)}</small></td><td><span class="status">${escapeHtml(member.role)}</span></td><td>${member.phone_e164 ? escapeHtml(member.phone_e164) : "—"}</td><td>${member.whatsapp_verified_at ? "Terverifikasi" : "Belum verifikasi"}</td></tr>`).join("") || '<tr><td colspan="4">Belum ada staf.</td></tr>';
  const groupRows = groups.map((group) => `<tr><td><b>${escapeHtml(group.name)}</b></td><td>${pendamping.length ? `<form class="stack" method="post" action="/dashboard/team/groups/${escapeHtml(group.id)}/pendamping">${csrf}<select name="pendamping_user_id" required><option value="" ${group.pendamping_user_id ? "" : "selected"} disabled>Pilih pendamping</option>${pendamping.map((member) => `<option value="${escapeHtml(member.user_id)}" ${Number(member.user_id) === Number(group.pendamping_user_id) ? "selected" : ""}>${escapeHtml(member.full_name || member.email)}</option>`).join("")}</select><button class="secondary" type="submit">${group.pendamping_user_id ? "Ganti" : "Tetapkan"} pendamping</button></form>` : '<span class="status">Belum ada pendamping</span>'}</td><td>${escapeHtml(group.member_count || 0)} peserta</td><td>${group.whatsapp_invite_url ? `<a href="${escapeHtml(group.whatsapp_invite_url)}" target="_blank" rel="noreferrer">Buka grup</a>` : "Belum diisi"}</td></tr>`).join("") || '<tr><td colspan="4">Belum ada kelompok.</td></tr>';
  const participantRows = participants.map((participant) => `<tr><td><b>${escapeHtml(participant.full_name)}</b><br><small>${escapeHtml(participant.email)}</small></td><td>${escapeHtml(participant.group_name || "Belum dibagi")}</td></tr>`).join("") || '<tr><td colspan="2">Belum ada peserta.</td></tr>';
  return dashboardLayout(
    "Tim & Kelompok",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="page-head"><div><h2>Tim dan pembagian kelompok.</h2><p>Promosikan akun terdaftar, tetapkan pendamping, lalu tempatkan peserta ke kelompok.</p></div></div>${!edition ? '<div class="notice">Current edition belum tersedia.</div>' : `<div class="app-grid"><section class="app-card third"><h3>Tetapkan role staf</h3><form class="stack" method="post" action="/dashboard/team/roles">${csrf}<label>Email akun<input name="email" type="email" required></label><label>Role<select name="role"><option value="pendamping">Pendamping</option><option value="bendahara">Bendahara</option></select></label><button type="submit">Tetapkan role</button></form></section><section class="app-card third"><h3>Buat kelompok</h3><form class="stack" method="post" action="/dashboard/team/groups">${csrf}<input type="hidden" name="edition_id" value="${edition.id}"><label>Nama kelompok<input name="name" required maxlength="80"></label><label>Pendamping<select name="pendamping_user_id" required><option value="">Pilih pendamping</option>${pendamping.map((member) => `<option value="${escapeHtml(member.user_id)}">${escapeHtml(member.full_name || member.email)}</option>`).join("")}</select></label><button type="submit">Buat kelompok</button></form></section><section class="app-card third"><h3>Tempatkan peserta</h3><form class="stack" method="post" action="/dashboard/team/memberships">${csrf}<input type="hidden" name="edition_id" value="${edition.id}"><label>Peserta<select name="participant_id" required>${participantOptions}</select></label><label>Kelompok<select name="group_id" required>${groupOptions}</select></label><button type="submit">Simpan pembagian</button></form></section><section class="app-card"><h3>Staf operasional</h3><div class="app-table"><table><thead><tr><th>Nama</th><th>Role</th><th>WhatsApp</th><th>Status OTP</th></tr></thead><tbody>${staffRows}</tbody></table></div></section><section class="app-card half"><h3>Kelompok</h3><div class="app-table"><table><thead><tr><th>Kelompok</th><th>Pendamping</th><th>Anggota</th><th>WhatsApp</th></tr></thead><tbody>${groupRows}</tbody></table></div></section><section class="app-card half"><h3>Pembagian peserta</h3><div class="app-table"><table><thead><tr><th>Peserta</th><th>Kelompok</th></tr></thead><tbody>${participantRows}</tbody></table></div></section></div>`}`,
    user,
    "team",
  );
}

export function adminOverviewPage(
  user: SessionUser,
  metrics: Record<string, number>,
  recent: Record<string, unknown>[],
  message = "",
): string {
  return dashboardLayout(
    "Ringkasan",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="page-head"><div><h2>Operasional hari ini.</h2><p>Status registrasi dan pembayaran Collaboration Day 2026.</p></div><a class="app-button" href="/dashboard/payments">Periksa pembayaran</a></div><div class="app-grid"><div class="app-card third"><div class="metric">${metrics.participants ?? 0}</div><div class="metric-label">Peserta terdaftar</div></div><div class="app-card third"><div class="metric">${metrics.pending ?? 0}</div><div class="metric-label">Menunggu verifikasi</div></div><div class="app-card third"><div class="metric">${metrics.confirmed ?? 0}</div><div class="metric-label">Pembayaran terkonfirmasi</div></div><div class="app-card"><h3>Aktivitas pembayaran terbaru</h3><div class="app-table"><table><thead><tr><th>Peserta</th><th>Kode</th><th>Status</th><th>Waktu</th></tr></thead><tbody>${recent.map((row) => `<tr><td>${escapeHtml(row.full_name)}</td><td class="mono">${escapeHtml(row.public_id)}</td><td><span class="status">${escapeHtml(row.status)}</span></td><td>${escapeHtml(row.submitted_at)}</td></tr>`).join("") || '<tr><td colspan="4">Belum ada aktivitas pembayaran.</td></tr>'}</tbody></table></div></div></div>`,
    user,
    "overview",
  );
}

export function adminPaymentsPage(
  user: SessionUser,
  payments: Record<string, unknown>[],
  message = "",
): string {
  const csrf = `<input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}">`;
  const paymentRows =
    payments
      .map((payment) => {
        const receipt = payment.receipt_id ? `<div class="review-receipt"><a href="/dashboard/receipts/${escapeHtml(payment.receipt_id)}">PDF</a><span class="delivery-chip">Email ${escapeHtml(payment.email_status)}</span><span class="delivery-chip">WA ${escapeHtml(payment.whatsapp_status)}</span>${payment.email_status !== "sent" || payment.whatsapp_status !== "sent" ? `<form method="post" action="/dashboard/receipts/${escapeHtml(payment.receipt_id)}/retry">${csrf}<button class="secondary" type="submit">Kirim ulang</button></form>` : ""}</div>` : "—";
        const action = payment.status === "pending" ? `<div class="review-actions"><button class="secondary" type="button" data-review-payment='${escapeHtml(JSON.stringify({ id: payment.id, name: payment.full_name, publicId: payment.public_id }))}'>Review</button></div>` : '<span class="status">Selesai</span>';
        return `<tr><td><b class="review-table-cell" title="${escapeHtml(payment.full_name)}">${escapeHtml(payment.full_name)}</b></td><td><span class="mono review-table-cell">${escapeHtml(payment.public_id)}</span></td><td>${formatRupiah(Number(payment.amount_due))}</td><td><span class="review-table-cell" title="${escapeHtml(payment.payment_method)}">${escapeHtml(payment.payment_method)}</span></td><td><span class="status">${escapeHtml(payment.status)}</span></td><td><button class="secondary proof-view-button" type="button" data-view-proof data-proof-url="/dashboard/payments/${escapeHtml(payment.id)}/proof?preview=1" data-proof-title="Bukti ${escapeHtml(payment.public_id)}">Lihat</button></td><td>${receipt}</td><td>${action}</td></tr>`;
      })
      .join("") || '<tr><td colspan="8">Belum ada pembayaran non-tunai untuk diverifikasi.</td></tr>';
  return dashboardLayout(
    "Pembayaran",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="page-head"><div><h2>Verifikasi pembayaran non-tunai.</h2><p>Periksa bukti transfer atau QRIS, lalu setujui atau tolak.</p></div></div><div class="app-table"><table class="review-payments-table"><thead><tr><th>Peserta</th><th>Nomor peserta</th><th>Nominal</th><th>Metode</th><th>Status</th><th>Bukti</th><th>Kuitansi</th><th>Aksi</th></tr></thead><tbody>${paymentRows}</tbody></table></div><dialog class="app-dialog proof-preview-dialog" id="payment-proof-dialog"><div class="app-dialog-body"><div class="proof-preview-head"><h2 id="payment-proof-title">Bukti pembayaran</h2><button class="secondary" type="button" data-proof-close>Tutup</button></div><iframe class="proof-preview-frame" id="payment-proof-frame" title="Preview bukti pembayaran"></iframe></div></dialog><dialog class="app-dialog" id="payment-review-dialog"><div class="app-dialog-body"><h2 id="payment-review-title">Review pembayaran</h2><p>Pastikan nominal dan identitas bukti pembayaran sudah sesuai.</p><form class="stack" id="payment-review-form" method="post">${csrf}<label>Keputusan<select name="decision" id="payment-review-decision"><option value="verified">Setujui pembayaran</option><option value="rejected">Tolak pembayaran</option></select></label><label id="payment-review-reason-wrap" hidden>Alasan penolakan<input name="rejection_reason" id="payment-review-reason" maxlength="500"></label><div class="app-dialog-actions"><button class="secondary" type="button" data-dialog-close>Batal</button><button type="submit">Simpan review</button></div></form></div></dialog><script src="/payment-review.js" defer></script>`,
    user,
    "payments",
  );
}

export function adminParticipantsPage(
  user: SessionUser,
  participants: Record<string, unknown>[],
  message = "",
): string {
  const participantRows =
    participants
      .map(
        (row) =>
          `<tr><td><b>${escapeHtml(row.full_name)}</b><br>${escapeHtml(row.email)}</td><td>${row.gender === "male" ? "Laki-laki" : row.gender === "female" ? "Perempuan" : "Belum diisi"}<br><small>${escapeHtml(row.group_name || "Belum dibagi")}</small></td><td>${escapeHtml(row.phone)}<br>${row.whatsapp_verified_at ? '<span class="status">Terverifikasi</span>' : "Belum verifikasi"}</td><td>Follow: ${row.social_proof_id ? `<span class="status">${escapeHtml(row.social_proof_status || "pending")}</span>` : "—"}<br>Kelulusan: ${row.admission_proof_id ? "✓" : "—"}</td><td><span class="status">${escapeHtml(row.registration_status || "belum daftar")}</span></td><td>${row.admission_proof_id ? `<a href="/dashboard/admission-proofs/${escapeHtml(row.admission_proof_id)}">Bukti kelulusan</a>` : "—"}${row.social_proof_id ? `<br><a href="/dashboard/social-proofs/${escapeHtml(row.social_proof_id)}/collaboration-day-instagram">Bukti follow</a>` : ""}</td></tr>`,
      )
      .join("") || '<tr><td colspan="6">Belum ada peserta.</td></tr>';
  return dashboardLayout(
    "Peserta",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="page-head"><div><h2>Data peserta.</h2><p>Profil, pembagian kelompok, kelengkapan persyaratan, dan status registrasi.</p></div></div><div class="app-table"><table><thead><tr><th>Peserta</th><th>Gender & kelompok</th><th>WhatsApp</th><th>Syarat</th><th>Registrasi</th><th>Dokumen</th></tr></thead><tbody>${participantRows}</tbody></table></div>`,
    user,
    "participants",
  );
}

export function paymentMethodsPage(
  user: SessionUser,
  edition: Edition | null,
  methods: PaymentMethod[],
  message = "",
): string {
  if (!edition) return dashboardLayout("Metode Pembayaran", '<div class="notice">Current edition belum tersedia.</div>', user, "payment-methods");
  const csrf = `<input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}">`;
  const paymentRows = methods.map((method) => {
    const detail = method.type === "static_qris" ? `QRIS dinamis · payload ${method.qris_payload ? `${method.qris_payload.length} karakter` : "belum tersedia"}` : method.type === "cash" ? "Dibayar langsung kepada pendamping" : `${method.bank_name} · ${method.account_number}`;
    const owner = method.type === "bank_transfer" ? method.account_name || "—" : "—";
    return `<tr><td><span class="status">${escapeHtml(method.type === "static_qris" ? "QRIS" : method.type === "cash" ? "Tunai" : "Transfer")}</span></td><td><b class="payment-cell" title="${escapeHtml(owner)}">${escapeHtml(owner)}</b></td><td><span class="payment-cell" title="${escapeHtml(detail)}">${escapeHtml(detail)}</span></td><td><span class="payment-cell" title="${escapeHtml(method.instructions || "—")}">${escapeHtml(method.instructions || "—")}</span></td><td>${method.is_active ? '<span class="status">Aktif</span>' : '<span class="status" style="background:#68708c">Nonaktif</span>'}</td><td><div class="payment-actions"><button class="secondary" type="button" data-edit-payment='${escapeHtml(JSON.stringify(method))}'>Edit</button><form method="post" action="/dashboard/payment-methods/${method.id}/status">${csrf}<input type="hidden" name="active" value="${method.is_active ? "no" : "yes"}"><button class="${method.is_active ? "danger " : ""}secondary" type="submit">${method.is_active ? "Nonaktifkan" : "Aktifkan"}</button></form></div></td></tr>`;
  }).join("") || '<tr><td colspan="6">Belum ada metode pembayaran.</td></tr>';
  return dashboardLayout(
    "Metode Pembayaran",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="page-head"><div><h2>Metode pembayaran.</h2><p>Kelola transfer, QRIS, dan pembayaran tunai untuk current edition.</p></div><button class="app-button" type="button" data-add-payment>Tambah metode</button></div><div class="app-table"><table class="payment-methods-table"><thead><tr><th>Jenis</th><th>Nama</th><th>Detail</th><th>Instruksi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${paymentRows}</tbody></table></div><dialog class="app-dialog" id="payment-method-dialog"><div class="app-dialog-body"><h2 id="payment-method-title">Tambah metode pembayaran</h2><form class="stack" id="payment-method-form" method="post" action="/dashboard/payment-methods">${csrf}<input type="hidden" name="edition_id" value="${edition.id}"><input type="hidden" name="type" id="payment-method-type" value="bank_transfer"><label>Jenis<select id="payment-method-type-select"><option value="bank_transfer">Transfer bank</option><option value="static_qris">QRIS</option><option value="cash">Tunai</option></select></label><div id="payment-bank-fields"><label>Nama bank<input name="bank_name" id="payment-method-bank" autocomplete="organization"></label><label>Nomor rekening<input name="account_number" id="payment-method-number" inputmode="numeric"></label><label>Nama pemilik / a.n.<input name="account_name" id="payment-method-owner" autocomplete="name"></label></div><div id="payment-qris-fields" hidden><label>Payload QRIS<textarea name="qris_payload" id="payment-method-qris" rows="5" placeholder="000201..."></textarea></label><span id="payment-qris-preview" hidden></span></div><label>Instruksi<textarea name="instructions" id="payment-method-instructions" rows="4"></textarea></label><div class="app-dialog-actions"><button class="secondary" type="button" data-dialog-close>Batal</button><button type="submit" id="payment-method-submit">Tambah metode</button></div></form></div></dialog><script src="/payment-methods.js" defer></script>`,
    user,
    "payment-methods",
  );
}

export function adminEventPage(
  user: SessionUser,
  edition: Edition | null,
  methods: PaymentMethod[],
  benefits: BenefitItem[],
  message = "",
): string {
  const csrf = `<input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}">`;
  if (!edition)
    return dashboardLayout(
      "Event",
      '<div class="notice">Current edition belum tersedia.</div>',
      user,
      "event",
    );
  const paymentRows =
    methods
      .map((method) => {
        const detail =
          method.type === "static_qris"
            ? `QRIS dinamis · payload ${method.qris_payload ? `${method.qris_payload.length} karakter` : "belum tersedia"}`
            : method.type === "cash"
              ? "Dibayar langsung kepada panitia"
              : `${method.bank_name} · ${method.account_number}`;
        const owner = method.type === "bank_transfer" ? method.account_name || "—" : "—";
        return `<tr><td><span class="status">${escapeHtml(method.type === "static_qris" ? "QRIS" : method.type === "cash" ? "Tunai" : "Transfer")}</span></td><td><b class="payment-cell" title="${escapeHtml(owner)}">${escapeHtml(owner)}</b></td><td><span class="payment-cell" title="${escapeHtml(detail)}">${escapeHtml(detail)}</span></td><td><span class="payment-cell" title="${escapeHtml(method.instructions || "—")}">${escapeHtml(method.instructions || "—")}</span></td><td>${method.is_active ? '<span class="status">Aktif</span>' : '<span class="status" style="background:#68708c">Nonaktif</span>'}</td><td><div class="payment-actions"><button class="secondary" type="button" data-edit-payment='${escapeHtml(JSON.stringify(method))}'>Edit</button><form method="post" action="/dashboard/payment-methods/${method.id}/status">${csrf}<input type="hidden" name="active" value="${method.is_active ? "no" : "yes"}"><button class="${method.is_active ? "danger " : ""}secondary" type="submit">${method.is_active ? "Nonaktifkan" : "Aktifkan"}</button></form></div></td></tr>`;
      })
      .join("") || '<tr><td colspan="6">Belum ada metode pembayaran.</td></tr>';
  return dashboardLayout(
    "Event",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="page-head"><div><h2>Current edition.</h2><p>Informasi publik, periode registrasi, dan metode pembayaran.</p></div></div><div class="app-grid"><section class="app-card"><h3>Informasi event</h3><form class="app-form" method="post" action="/dashboard/edition">${csrf}<input type="hidden" name="edition_id" value="${edition.id}"><label>Judul<input name="title" required value="${escapeHtml(edition.title)}"></label><label>Tema<input name="theme" required value="${escapeHtml(edition.theme)}"></label><label class="full">Deskripsi<textarea name="description" rows="4" required>${escapeHtml(edition.description)}</textarea></label><label class="full">Lokasi<input name="venue" required value="${escapeHtml(edition.venue)}"></label><label class="full">Google Maps embed URL<input name="map_embed_url" type="url" value="${escapeHtml(edition.map_embed_url)}"></label><label>Mulai<input name="starts_at" required value="${escapeHtml(edition.starts_at)}"></label><label>Selesai<input name="ends_at" required value="${escapeHtml(edition.ends_at)}"></label><label>Registrasi dibuka<input name="registration_opens_at" required value="${escapeHtml(edition.registration_opens_at)}"></label><label>Registrasi ditutup<input name="registration_closes_at" required value="${escapeHtml(edition.registration_closes_at)}"></label><label>Biaya<input name="ticket_amount" type="number" min="0" required value="${edition.ticket_amount}"></label><label class="inline"><input type="checkbox" name="capacity_unlimited" value="yes" ${edition.capacity_unlimited ? "checked" : ""} style="width:auto"> Tanpa batas kuota</label><button type="submit">Simpan event</button></form></section><section class="app-card"><div class="page-head"><div><h3>Metode pembayaran tersedia</h3><p>Label metode dibuat otomatis berdasarkan jenis dan bank.</p></div><button class="app-button" type="button" data-add-payment>Tambah metode</button></div><div class="app-table"><table class="payment-methods-table"><thead><tr><th>Jenis</th><th>Nama</th><th>Detail</th><th>Instruksi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${paymentRows}</tbody></table></div></section><section class="app-card"><h3>Benefit peserta</h3><ol>${benefits.map((item) => `<li>${escapeHtml(item.title)}</li>`).join("")}</ol><p><small>Benefit dikelola sebagai konten tetap current edition.</small></p></section></div><dialog class="app-dialog" id="payment-method-dialog"><div class="app-dialog-body"><h2 id="payment-method-title">Tambah metode pembayaran</h2><form class="stack" id="payment-method-form" method="post" action="/dashboard/payment-methods">${csrf}<input type="hidden" name="edition_id" value="${edition.id}"><input type="hidden" name="type" id="payment-method-type" value="bank_transfer"><label>Jenis<select id="payment-method-type-select"><option value="bank_transfer">Transfer bank</option><option value="static_qris">QRIS</option><option value="cash">Tunai</option></select></label><div id="payment-bank-fields"><label>Nama bank<input name="bank_name" id="payment-method-bank" autocomplete="organization"></label><label>Nomor rekening<input name="account_number" id="payment-method-number" inputmode="numeric"></label><label>Nama pemilik / a.n.<input name="account_name" id="payment-method-owner" autocomplete="name"></label></div><div id="payment-qris-fields" hidden><label>Payload QRIS<textarea name="qris_payload" id="payment-method-qris" rows="5" placeholder="000201..."></textarea></label><a id="payment-qris-preview" target="_blank" rel="noreferrer" hidden>Lihat preview QRIS</a></div><label>Instruksi<textarea name="instructions" id="payment-method-instructions" rows="4"></textarea></label><div class="app-dialog-actions"><button class="secondary" type="button" data-dialog-close>Batal</button><button type="submit" id="payment-method-submit">Tambah metode</button></div></form></div></dialog><script src="/payment-methods.js" defer></script>`,
    user,
    "event",
  );
}

export function adminGalleryPage(
  user: SessionUser,
  editions: Edition[],
  gallery: Gallery[],
  message = "",
): string {
  const csrf = `<input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}">`;
  const options = editions
    .map(
      (edition) =>
        `<option value="${edition.id}">${edition.year} - ${escapeHtml(edition.title)}</option>`,
    )
    .join("");
  return dashboardLayout(
    "Galeri",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="page-head"><div><h2>Arsip visual.</h2><p>Upload foto akan otomatis dikonversi ke WebP, diperkecil maksimal 1920 px, dan dikompresi untuk landing.</p></div></div><div class="app-grid"><section class="app-card third"><h3>Upload foto</h3><form class="stack" method="post" action="/dashboard/gallery" enctype="multipart/form-data">${csrf}<label>Tahun arsip<select name="edition_id" required>${options}</select></label><label>Foto<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required></label><label>Alt text<input name="alt_text" required minlength="8" maxlength="180" placeholder="Jelaskan momen pada foto"></label><label>Caption<input name="caption" maxlength="300" placeholder="Opsional"></label><small>JPG, PNG, atau WebP; maksimal 12 MB. Output selalu WebP quality 78 tanpa metadata sumber.</small><button type="submit" ${editions.length ? "" : "disabled"}>Optimalkan & upload</button></form></section><section class="app-card" style="grid-column:span 9"><h3>Foto terkelola</h3><div class="app-table"><table><thead><tr><th>Preview</th><th>Arsip</th><th>Deskripsi</th><th>Output</th><th>Tindakan</th></tr></thead><tbody>${gallery.map((item) => `<tr><td><img src="${escapeHtml(item.image_url)}" alt="" width="96" height="72" style="width:96px;height:72px;object-fit:cover"></td><td>${escapeHtml(item.year)}</td><td><b>${escapeHtml(item.alt_text)}</b>${item.caption ? `<br><small>${escapeHtml(item.caption)}</small>` : ""}</td><td>${item.object_key ? `WebP<br><small>${Math.max(1, Math.round(Number(item.size_bytes || 0) / 1024))} KB</small>` : "<small>Static asset</small>"}</td><td>${item.object_key ? `<form method="post" action="/dashboard/gallery/${item.id}/delete">${csrf}<button class="secondary" type="submit">Hapus</button></form>` : "<small>Dikelola via deploy</small>"}</td></tr>`).join("") || '<tr><td colspan="5">Belum ada foto.</td></tr>'}</tbody></table></div></section></div>`,
    user,
    "gallery",
  );
}

export function adminIntegrationsPage(
  user: SessionUser,
  settings: Record<string, string>,
  whatsar: WhatsarOverview,
  message = "",
): string {
  const csrf = `<input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}">`;
  const sessions =
    whatsar.sessions
      .map((session) =>
        whatsarSessionRow(
          session,
          settings.whatsapp_sender_id || "",
          whatsar.senderPool,
          csrf,
        ),
      )
      .join("") || "<p>Belum ada session.</p>";
  return dashboardLayout(
    "Integrasi",
    `${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<div class="page-head"><div><h2>Email & WhatsApp.</h2><p>Konfigurasi provider dan pairing session notifikasi.</p></div></div><div class="app-grid"><section class="app-card half"><h3>Brevo Email</h3><form class="stack" method="post" action="/dashboard/settings/brevo">${csrf}<label>Sender name<input name="sender_name" required value="${escapeHtml(settings.brevo_sender_name || "Collaboration Day 2026")}"></label><label>Sender email<input name="sender_email" type="email" required value="${escapeHtml(settings.brevo_sender_email || "no-reply@collaborationday2026.web.id")}"></label><label>Subject verifikasi<input name="verification_subject" required value="${escapeHtml(settings.brevo_verification_subject || "Verifikasi akun Collaboration Day")}"></label><label>Subject reset<input name="reset_subject" required value="${escapeHtml(settings.brevo_reset_subject || "Reset password Collaboration Day")}"></label><label>API key baru<input name="api_key" type="password" placeholder="${settings.brevo_api_key_configured === "1" ? "Tersimpan" : "Masukkan API key"}"></label><label class="inline"><input type="checkbox" name="active" value="yes" ${settings.brevo_active !== "0" ? "checked" : ""} style="width:auto"> Aktif</label><button type="submit">Simpan Brevo</button></form></section><section class="app-card half"><h3>Whatsar</h3><div class="notice">Server: <b>${whatsar.health?.status === "ok" ? "Online" : "Offline"}</b><br>${escapeHtml(whatsar.health?.sessions_connected ?? 0)} connected / ${escapeHtml(whatsar.health?.sessions_total ?? 0)} session</div><form class="stack" method="post" action="/dashboard/settings/whatsapp">${csrf}<label>Base URL<input name="base_url" type="url" required value="${escapeHtml(settings.whatsapp_base_url || "https://whatsar.projectar.web.id")}"></label><label>API key baru<input name="api_key" type="password" placeholder="${settings.whatsar_api_key_configured === "1" ? "Tersimpan" : "Masukkan API key"}"></label><label>Template OTP<textarea name="template">${escapeHtml(settings.whatsapp_template || "Kode verifikasi Collaboration Day kamu: {{code}}. Berlaku 10 menit.")}</textarea></label><label class="inline"><input type="checkbox" name="active" value="yes" ${settings.whatsapp_active === "1" ? "checked" : ""} style="width:auto"> Aktif</label><button type="submit">Simpan Whatsar</button></form></section><section class="app-card"><div class="page-head"><div><h3>Session WhatsApp</h3><p>Centang OTP pool pada nomor connected untuk membagi pengiriman kode secara bergilir.</p></div></div>${whatsar.configured ? `<div class="stack">${sessions}</div><form class="app-form" method="post" action="/dashboard/whatsar/sessions">${csrf}<label>Nama session<input name="name" value="Collaboration Day 2026" required></label><label>Device<select name="device_preset"><option value="chrome-linux">Chrome / Linux</option><option value="safari-mac">Safari / Mac</option><option value="chrome-windows">Chrome / Windows</option></select></label><button type="submit">Buat session</button></form>` : "<p>Simpan API key Whatsar untuk mulai pairing.</p>"}</section></div><dialog class="app-dialog" id="delete-session-dialog"><div class="app-dialog-body"><h2>Hapus session WhatsApp?</h2><p id="delete-session-copy">Device akan logout dan session tidak dapat dipulihkan.</p><form id="delete-session-form" method="post">${csrf}<div class="app-dialog-actions"><button class="secondary" type="button" data-dialog-close>Batal</button><button class="danger" type="submit">Hapus session</button></div></form></div></dialog><script src="/dashboard-integrations.js" defer></script>`,
    user,
    "integrations",
  );
}

function whatsarSessionRow(
  session: WhatsarOverview["sessions"][number],
  activeSessionId: string,
  senderPool: string[],
  csrf: string,
): string {
  const id = encodeURIComponent(session.id);
  const connected =
    session.connected === true || session.status === "connected";
  const inPool = senderPool.includes(session.id);
  return `<div class="app-card"><div class="page-head"><div><b>${escapeHtml(session.name || "Session")}</b><br><span class="mono">${escapeHtml(session.id)}</span><br>Status: ${escapeHtml(session.status || "unknown")}${connected ? `<form method="post" action="/dashboard/whatsar/sessions/${id}/pool" style="margin-top:10px">${csrf}<label class="pool-control"><input type="checkbox" name="enabled" value="yes" ${inPool ? "checked" : ""} onchange="this.form.requestSubmit()"><span>OTP pool</span></label></form>` : ""}</div><div class="session-actions">${activeSessionId === session.id ? '<span class="status">Aktif</span>' : `<form method="post" action="/dashboard/whatsar/sessions/${id}/activate">${csrf}<button class="secondary session-action">Gunakan</button></form>`}<a class="app-button secondary session-action" href="/dashboard/whatsar/sessions/${id}/pair">Pairing</a><button class="danger secondary session-action" type="button" data-delete-session="${escapeHtml(session.id)}" data-delete-name="${escapeHtml(session.name || "Session")}">Hapus</button></div></div></div>`;
}

export function whatsarPairingPage(
  user: SessionUser,
  session: { id: string; status?: string; connected?: boolean },
  qrDataUrl = "",
  pairingCode = "",
  message = "",
  autoRefreshQr = false,
  autoRefreshPhone = false,
): string {
  const sessionId = String(session.id);
  const pairCodeActive = session.status === "pair_code_ready";
  const connected =
    session.status === "connected" || session.connected === true;
  const failed = session.status === "failed" || session.status === "stopped";
  const qr = autoRefreshQr
    ? `<div class="method" id="qr-pairing" data-status-url="/dashboard/whatsar/sessions/${encodeURIComponent(sessionId)}/pair/qr/status"><img id="qr-pairing-image" ${qrDataUrl ? `src="${escapeHtml(qrDataUrl)}"` : ""} alt="QR pairing WhatsApp" style="max-width:360px;${qrDataUrl ? "" : "display:none"}"><p id="qr-pairing-status">${qrDataUrl ? "Scan melalui WhatsApp → Perangkat tertaut. QR akan diperbarui otomatis." : "Menunggu QR dari Whatsar…"}</p></div><script src="/whatsar-pairing.js" defer></script>`
    : "";
  return dashboardLayout(
    "Pairing WhatsApp",
    `<div class="page-head"><div><h2>Pairing WhatsApp.</h2><p>Hubungkan nomor panitia ke session Whatsar.</p></div><a class="app-button secondary" href="/dashboard/integrations">Kembali ke integrasi</a></div><div class="app-grid"><section class="app-card half"><h3>Session</h3><p><span class="mono">${escapeHtml(sessionId)}</span><br>Status: <b id="phone-pairing-state">${escapeHtml(session.status || "unknown")}</b></p>${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}${connected ? '<div class="notice"><b>WhatsApp sudah terhubung.</b> Session ini siap digunakan untuk notifikasi.</div>' : ""}${pairingCode ? `<div class="notice" id="phone-pairing" data-status-url="/dashboard/whatsar/sessions/${encodeURIComponent(sessionId)}/pair/phone/status"><b>Kode pairing</b><br><span class="mono" style="font-size:28px">${escapeHtml(pairingCode)}</span><p>WhatsApp → Perangkat tertaut → Tautkan perangkat → Tautkan dengan nomor telepon.</p><p id="phone-pairing-status">Kode aktif. Menunggu konfirmasi WhatsApp…</p></div>` : autoRefreshPhone ? `<div class="notice" id="phone-pairing" data-status-url="/dashboard/whatsar/sessions/${encodeURIComponent(sessionId)}/pair/phone/status"><p id="phone-pairing-status">Memeriksa status pairing code…</p></div>` : ""}${qr}${autoRefreshPhone ? '<script src="/whatsar-phone-pairing.js" defer></script>' : ""}</section><section class="app-card half"><h3>Mulai pairing</h3>${connected ? "<p>Pairing tidak diperlukan lagi untuk session ini.</p>" : failed ? '<div class="notice error"><b>Session gagal.</b><br>Kembali ke Integrasi, hapus session ini, lalu buat session baru sesuai panduan Whatsar.</div>' : `<form class="stack" method="post" action="/dashboard/whatsar/sessions/${encodeURIComponent(sessionId)}/pair/phone"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><label>Nomor WhatsApp<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="08xxx atau 62xxx"></label><small>Nomor akan dikirim ke Whatsar dalam format internasional 62xxx.</small><button type="submit" ${pairCodeActive ? "disabled" : ""}>${pairCodeActive ? "Kode pairing sedang aktif" : "Buat kode pairing"}</button></form><hr>${pairCodeActive ? '<div class="notice">Session ini sedang menggunakan pairing code. Selesaikan pairing di WhatsApp. Jika kode ditolak atau kedaluwarsa, hapus session dan buat yang baru.</div>' : `<form method="post" action="/dashboard/whatsar/sessions/${encodeURIComponent(sessionId)}/pair/qr"><input type="hidden" name="csrf_token" value="${escapeHtml(user.csrf_token)}"><button class="secondary" type="submit">Tampilkan QR pairing</button></form>`}`}</section></div>`,
    user,
    "integrations",
  );
}
