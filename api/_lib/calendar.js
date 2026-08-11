const TZ='America/Sao_Paulo';
export const services={primeira:{title:'Primeira consulta',duration:90},retorno:{title:'Consulta de retorno',duration:90},avaliacao:{title:'Avaliação física',duration:45}};
export const weeklyWindows={
  1:[['08:00','12:00'],['16:00','18:00']],
  3:[['16:00','18:00']],
  5:[['08:00','12:00'],['16:00','18:00']],
  6:[['09:00','12:00']]
};
export function scheduleWindows(date){
  const day=new Date(`${date}T12:00:00-03:00`).getDay();
  return weeklyWindows[day]||[];
}
export function scheduledSpan(date,time,service){
  const cfg=services[service];
  if(!cfg||!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!/^\d{2}:00$/.test(time||''))return null;
  const start=new Date(`${date}T${time}:00-03:00`);
  const end=new Date(start.getTime()+cfg.duration*60000);
  const inside=scheduleWindows(date).some(([a,z])=>{
    const windowStart=new Date(`${date}T${a}:00-03:00`);
    const windowEnd=new Date(`${date}T${z}:00-03:00`);
    return start>=windowStart&&end<=windowEnd;
  });
  return inside?{start:start.toISOString(),end:end.toISOString()}:null;
}
export async function token(){const body=new URLSearchParams({client_id:'784975224517-6gl9286vpl9n20j5l8jhhea9s519dm1n.apps.googleusercontent.com',client_secret:process.env.GOOGLE_CLIENT_SECRET?.replace(/[\s"']/g,''),refresh_token:process.env.GOOGLE_REFRESH_TOKEN,grant_type:'refresh_token'});const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});if(!r.ok)throw new Error('Google Agenda não configurado');return (await r.json()).access_token}
export async function busy(start,end){const t=await token();const r=await fetch('https://www.googleapis.com/calendar/v3/freeBusy',{method:'POST',headers:{authorization:`Bearer ${t}`,'content-type':'application/json'},body:JSON.stringify({timeMin:start,timeMax:end,timeZone:TZ,items:[{id:process.env.GOOGLE_CALENDAR_ID||'primary'}]})});if(!r.ok)throw new Error('Falha ao consultar agenda');const j=await r.json();return j.calendars[process.env.GOOGLE_CALENDAR_ID||'primary'].busy||[]}
export async function createEvent(payload){const t=await token();const cal=encodeURIComponent(process.env.GOOGLE_CALENDAR_ID||'primary');const r=await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events?sendUpdates=all`,{method:'POST',headers:{authorization:`Bearer ${t}`,'content-type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error('Falha ao criar evento');return r.json()}
export async function listEvents(){const t=await token(),cal=encodeURIComponent(process.env.GOOGLE_CALENDAR_ID||'primary'),min=new Date().toISOString(),max=new Date(Date.now()+60*86400000).toISOString();const r=await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}`,{headers:{authorization:`Bearer ${t}`}});if(!r.ok)throw new Error('Falha ao listar agenda');return (await r.json()).items||[]}
export async function deleteEvent(id){const t=await token(),cal=encodeURIComponent(process.env.GOOGLE_CALENDAR_ID||'primary');const r=await fetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events/${encodeURIComponent(id)}?sendUpdates=all`,{method:'DELETE',headers:{authorization:`Bearer ${t}`}});if(!r.ok&&r.status!==410)throw new Error('Falha ao cancelar evento')}
export function localIso(date,time,duration){const start=new Date(`${date}T${time}:00-03:00`);return {start:start.toISOString(),end:new Date(start.getTime()+duration*60000).toISOString()}}
export {TZ};
