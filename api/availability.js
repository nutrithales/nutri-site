import {busy,services,scheduleWindows,scheduledSpan} from './_lib/calendar.js';

export default async function handler(req,res){
  try{
    const {date,service}=req.query;
    const cfg=services[service];
    if(!date||!cfg)return res.status(400).json({error:'Parâmetros inválidos'});
    const windows=scheduleWindows(date);
    if(!windows.length)return res.json({slots:[]});

    const dayStart=new Date(`${date}T00:00:00-03:00`).toISOString();
    const dayEnd=new Date(`${date}T23:59:59-03:00`).toISOString();
    const blocks=await busy(dayStart,dayEnd);
    const slots=[];

    for(const [a,z] of windows){
      let cur=new Date(`${date}T${a}:00-03:00`);
      const windowEnd=new Date(`${date}T${z}:00-03:00`);
      while(cur<=windowEnd){
        const time=cur.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});
        const span=scheduledSpan(date,time,service);
        if(span){
          const start=new Date(span.start),finish=new Date(span.end);
          const occupied=blocks.some(b=>new Date(b.start)<finish&&new Date(b.end)>start);
          if(start>Date.now()+12*3600000&&!occupied)slots.push(time);
        }
        cur=new Date(cur.getTime()+30*60000);
      }
    }
    return res.json({slots});
  }catch(e){
    return res.status(503).json({error:e.message});
  }
}
