import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(root, out, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(root, src);
    if (!rel) return true;
    const first = rel.split(path.sep)[0];
    return !['.git', '.github', '.vercel', 'dist', 'node_modules', 'build-patient-site.mjs', 'vercel.json'].includes(first);
  }
});

const indexPath = path.join(out, 'index.html');
let s = fs.readFileSync(indexPath, 'utf8');

const css = `
/* Patient area dashboard */
.patient-dashboard{max-width:880px;margin:0 auto;padding:0 24px;box-sizing:border-box;text-align:left;}
.patient-eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:.78rem;font-weight:700;color:#0fae62;margin-bottom:12px;display:block;}
.patient-title{font-family:'Galano Grotesque Alt',sans-serif;letter-spacing:-.055em;font-size:clamp(2rem,5vw,3.3rem);line-height:1.02;margin:0;color:#14181a;}
.patient-subtitle{font-size:1.02rem;color:#66706b;margin:10px 0 0;}
.patient-section{margin-top:30px;}
.patient-section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:12px;}
.patient-section-title{font-size:.78rem;letter-spacing:.11em;text-transform:uppercase;font-weight:700;color:#66706b;margin:0;}
.patient-card{background:#fff;border:1px solid #e5e9e6;border-radius:22px;box-shadow:0 14px 34px -28px rgba(20,24,26,.45);}
.patient-next{padding:24px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
.patient-next-label{font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:#0fae62;margin-bottom:8px;}
.patient-next-date{font-size:1.48rem;font-weight:700;letter-spacing:-.03em;color:#14181a;}
.patient-next-meta{font-size:.92rem;color:#66706b;margin-top:5px;}
.patient-link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border:1.5px solid #14181a;border-radius:999px;font-size:.88rem;font-weight:700;color:#14181a;white-space:nowrap;transition:.2s ease;}
.patient-link:hover{background:#14181a;color:#fff;transform:translateY(-1px);}
.patient-plan{padding:22px 24px;}
.patient-plan-top{display:flex;align-items:center;justify-content:space-between;gap:16px;}
.patient-plan-name{font-size:1.15rem;font-weight:700;color:#14181a;}
.patient-plan-count{font-size:.88rem;color:#66706b;}
.patient-progress{height:8px;border-radius:999px;background:#edf1ee;overflow:hidden;margin-top:16px;}
.patient-progress-bar{height:100%;border-radius:999px;background:#1adc7f;transition:width .35s ease;}
.patient-pages{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
.patient-page-card{display:flex;align-items:center;gap:14px;min-height:86px;padding:18px;border:1px solid #e5e9e6;border-radius:18px;background:#fff;color:#14181a;box-sizing:border-box;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;}
.patient-page-card:hover{color:#14181a;transform:translateY(-2px);border-color:#b9c3bd;box-shadow:0 14px 28px -22px rgba(20,24,26,.55);}
.patient-page-icon{width:42px;height:42px;border-radius:13px;background:#e9fbf3;display:flex;align-items:center;justify-content:center;flex:0 0 42px;color:#0fae62;}
.patient-page-title{font-size:.98rem;font-weight:700;line-height:1.2;display:block;}
.patient-page-caption{font-size:.78rem;color:#78827d;margin-top:4px;display:block;}
.patient-checkin{padding:22px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px;}
.patient-checkin-title{font-size:1rem;font-weight:700;color:#14181a;}
.patient-checkin-copy{font-size:.88rem;color:#66706b;margin-top:5px;}
.patient-support{margin-top:30px;padding:20px 22px;border-radius:20px;background:#14181a;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:18px;}
.patient-support strong{font-size:.98rem;display:block;}
.patient-support span{font-size:.82rem;color:#bac2be;display:block;margin-top:3px;}
.patient-support a{color:#1adc7f;font-weight:700;font-size:.9rem;white-space:nowrap;}
.patient-logout{display:inline-flex;margin-top:24px;color:#66706b;font-weight:600;font-size:.86rem;}
.patient-empty{padding:20px;border:1px dashed #ccd3cf;border-radius:18px;color:#66706b;font-size:.9rem;text-align:center;}
@media(max-width:640px){
  .patient-dashboard{padding:0 18px;}
  .patient-title{font-size:2.15rem !important;}
  .patient-next,.patient-checkin,.patient-support{align-items:flex-start;flex-direction:column;}
  .patient-link{width:100%;box-sizing:border-box;}
  .patient-pages{grid-template-columns:1fr 1fr;gap:10px;}
  .patient-page-card{min-height:112px;padding:15px;align-items:flex-start;flex-direction:column;gap:10px;}
  .patient-page-icon{width:38px;height:38px;flex-basis:38px;}
  .patient-page-title{font-size:.9rem;}
  .patient-page-caption{display:none;}
}
`;
if (!s.includes('/* Patient area dashboard */')) s = s.replace('</style>', `${css}\n</style>`);

const oldState = "    patientPages: [], patientPageLoading: false\n";
const newState = "    patientPages: [], patientPageLoading: false,\n    patientProfile: null, patientNextConsult: null, patientConsultasRealizadas: 0, patientLastCheckin: null\n";
if (!s.includes(oldState)) throw new Error('patient state anchor not found');
s = s.replace(oldState, newState);

const fetchStart = s.indexOf('  // Tabela esperada no Supabase: "paginas_paciente"');
const fetchEnd = s.indexOf('  async patientLogoutHandler()', fetchStart);
if (fetchStart < 0 || fetchEnd < 0) throw new Error('patient fetch anchors not found');
const newFetch = `  // Dados exibidos na home do paciente. Todas as consultas respeitam as RLS existentes.\n  async fetchPatientPage(userId) {\n    const sb = this.getSupabase();\n    if (!sb) return;\n    this.setState({ patientPageLoading: true });\n\n    const nowIso = new Date().toISOString();\n    const [pagesResult, profileResult, nextConsultResult, realizadasResult, checkinResult] = await Promise.all([\n      sb.from('paginas_paciente').select('titulo, url_pagina, icone, ordem').eq('user_id', userId).eq('ativo', true).order('ordem', { ascending: true }),\n      sb.from('pacientes').select('nome, plano, consultas_incluidas, consultas_realizadas_iniciais').eq('auth_id', userId).maybeSingle(),\n      sb.from('consultas').select('data, tipo, status, modalidade').eq('auth_id', userId).in('status', ['agendada', 'confirmada']).gte('data', nowIso).order('data', { ascending: true }).limit(1).maybeSingle(),\n      sb.from('consultas').select('id', { count: 'exact', head: true }).eq('auth_id', userId).eq('status', 'realizada'),\n      sb.from('checkins').select('semana, status, respondido_em').eq('auth_id', userId).order('semana', { ascending: false }).limit(1).maybeSingle()\n    ]);\n\n    const profile = profileResult.data || null;\n    const initialDone = profile?.consultas_realizadas_iniciais || 0;\n    const countedDone = realizadasResult.count || 0;\n\n    this.setState({\n      patientPageLoading: false,\n      patientPages: pagesResult.error ? [] : (pagesResult.data || []),\n      patientProfile: profile,\n      patientNextConsult: nextConsultResult.data || null,\n      patientConsultasRealizadas: Math.max(initialDone, countedDone),\n      patientLastCheckin: checkinResult.data || null\n    });\n  }\n\n`;
s = s.slice(0, fetchStart) + newFetch + s.slice(fetchEnd);

const oldCtx = "      patientPages: this.state.patientPages, patientPageLoading: this.state.patientPageLoading,\n      hasPatientPages: this.state.patientPages.length > 0,\n";
const newCtx = "      patientPages: this.state.patientPages, patientPageLoading: this.state.patientPageLoading,\n      hasPatientPages: this.state.patientPages.length > 0,\n      patientFirstName: ((this.state.patientProfile?.nome || '').trim().split(/\\s+/)[0] || 'Paciente'),\n      patientPlan: this.state.patientProfile?.plano || 'Acompanhamento',\n      patientProgressText: (() => { const total = this.state.patientProfile?.consultas_incluidas || 0; const done = this.state.patientConsultasRealizadas || 0; return total > 0 ? (Math.min(done,total) + ' de ' + total + ' consultas realizadas') : 'Acompanhamento ativo'; })(),\n      patientProgressPct: (() => { const total = this.state.patientProfile?.consultas_incluidas || 0; const done = this.state.patientConsultasRealizadas || 0; return total > 0 ? Math.min(100, Math.round((done/total)*100)) : 0; })(),\n      hasPatientNextConsult: !!this.state.patientNextConsult,\n      patientNextConsultDate: this.state.patientNextConsult?.data ? new Date(this.state.patientNextConsult.data).toLocaleDateString('pt-BR', { day:'2-digit', month:'long' }) : '',\n      patientNextConsultTime: this.state.patientNextConsult?.data ? new Date(this.state.patientNextConsult.data).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : '',\n      patientNextConsultType: this.state.patientNextConsult?.tipo || 'Consulta',\n      patientNextConsultMode: this.state.patientNextConsult?.modalidade || 'Consultório',\n      patientCheckinText: this.state.patientLastCheckin?.semana ? ('Último check-in em ' + new Date(this.state.patientLastCheckin.semana + 'T12:00:00').toLocaleDateString('pt-BR')) : 'Seu check-in aparece aqui quando estiver disponível.',\n";
if (!s.includes(oldCtx)) throw new Error('render context anchor not found');
s = s.replace(oldCtx, newCtx);

const loggedStart = s.indexOf('    <sc-if value="{{ patientSession }}" hint-placeholder-val="{{ false }}">');
const loggedEnd = s.indexOf('    <sc-if value="{{ !patientSession }}" hint-placeholder-val="{{ true }}">', loggedStart);
if (loggedStart < 0 || loggedEnd < 0) throw new Error('patient markup anchors not found');
const newLogged = `    <sc-if value="{{ patientSession }}" hint-placeholder-val="{{ false }}">\n      <div class="patient-dashboard">\n        <span class="patient-eyebrow">Área do paciente</span>\n        <h1 class="patient-title">Olá, {{ patientFirstName }}</h1>\n        <p class="patient-subtitle">Seu acompanhamento, organizado em um só lugar.</p>\n\n        <sc-if value="{{ patientPageLoading }}" hint-placeholder-val="{{ false }}">\n          <div class="patient-section patient-empty">Carregando seu acompanhamento…</div>\n        </sc-if>\n\n        <sc-if value="{{ !patientPageLoading }}" hint-placeholder-val="{{ true }}">\n          <div class="patient-section">\n            <div class="patient-section-head"><p class="patient-section-title">Próxima consulta</p></div>\n            <sc-if value="{{ hasPatientNextConsult }}" hint-placeholder-val="{{ false }}">\n              <div class="patient-card patient-next">\n                <div><div class="patient-next-label">{{ patientNextConsultType }}</div><div class="patient-next-date">{{ patientNextConsultDate }} · {{ patientNextConsultTime }}</div><div class="patient-next-meta">{{ patientNextConsultMode }}</div></div>\n                <a href="#" onClick="{{ goAgendamento }}" class="patient-link">Ver agenda</a>\n              </div>\n            </sc-if>\n            <sc-if value="{{ !hasPatientNextConsult }}" hint-placeholder-val="{{ true }}">\n              <div class="patient-card patient-next">\n                <div><div class="patient-next-label">Agenda</div><div class="patient-next-date">Nenhuma consulta futura</div><div class="patient-next-meta">Quando quiser, você pode escolher um novo horário.</div></div>\n                <a href="#" onClick="{{ goAgendamento }}" class="patient-link">Agendar</a>\n              </div>\n            </sc-if>\n          </div>\n\n          <div class="patient-section">\n            <div class="patient-section-head"><p class="patient-section-title">Seu acompanhamento</p></div>\n            <div class="patient-card patient-plan">\n              <div class="patient-plan-top"><div class="patient-plan-name">{{ patientPlan }}</div><div class="patient-plan-count">{{ patientProgressText }}</div></div>\n              <div class="patient-progress"><div class="patient-progress-bar" style="width:{{ patientProgressPct }}%;"></div></div>\n            </div>\n          </div>\n\n          <div class="patient-section">\n            <div class="patient-section-head"><p class="patient-section-title">Acesso rápido</p></div>\n            <sc-if value="{{ hasPatientPages }}" hint-placeholder-val="{{ false }}">\n              <div class="patient-pages">\n                <sc-for list="{{ patientPages }}" as="pg" hint-placeholder-count="2">\n                  <a href="{{ pg.url_pagina }}" target="_blank" rel="noopener" class="patient-page-card">\n                    <span class="patient-page-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5V5a2 2 0 0 1 2-2h10.5A1.5 1.5 0 0 1 18 4.5V19"/><path d="M6 17h14v4H6a2 2 0 1 1 0-4Z"/></svg></span>\n                    <span><span class="patient-page-title">{{ pg.titulo }}</span><span class="patient-page-caption">Abrir acompanhamento</span></span>\n                  </a>\n                </sc-for>\n              </div>\n            </sc-if>\n            <sc-if value="{{ !hasPatientPages }}" hint-placeholder-val="{{ true }}"><div class="patient-empty">Seus materiais ainda estão sendo preparados.</div></sc-if>\n          </div>\n\n          <div class="patient-section">\n            <div class="patient-section-head"><p class="patient-section-title">Check-in</p></div>\n            <div class="patient-card patient-checkin"><div><div class="patient-checkin-title">Acompanhamento contínuo</div><div class="patient-checkin-copy">{{ patientCheckinText }}</div></div></div>\n          </div>\n\n          <div class="patient-support"><div><strong>Precisa falar comigo?</strong><span>Use o WhatsApp para dúvidas sobre seu acompanhamento.</span></div><a href="https://wa.me/5541987347625" target="_blank" rel="noopener">Chamar no WhatsApp →</a></div>\n          <a href="#" onClick="{{ patientLogout }}" class="patient-logout">Sair da minha conta</a>\n        </sc-if>\n      </div>\n    </sc-if>\n\n`;
s = s.slice(0, loggedStart) + newLogged + s.slice(loggedEnd);

fs.writeFileSync(indexPath, s);
console.log('Patient dashboard overlay generated successfully.');