import {busy,services,scheduledSpan,createEvent,TZ} from './_lib/calendar.js';

function validBirthDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day&&date<=new Date();
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).end();
  try{
    const x=req.body||{},cfg=services[x.service?.id];
    if(!cfg||!x.date||!x.time||!x.name||!x.email||!x.phone||!x.cpf)
      return res.status(400).json({error:'Preencha todos os campos obrigatórios.'});
    if(x.service.id==='primeira'&&!validBirthDate(x.birthDate))
      return res.status(400).json({error:'Informe uma data de nascimento válida para a primeira consulta.'});

    const span=scheduledSpan(x.date,x.time,x.service.id);
    if(!span)return res.status(400).json({error:'Esse horário não faz parte dos horários disponíveis.'});
    if(new Date(span.start)<=new Date(Date.now()+12*3600000))
      return res.status(400).json({error:'Escolha um horário com pelo menos 12 horas de antecedência.'});
    if((await busy(span.start,span.end)).length)
      return res.status(409).json({error:'Esse horário acabou de ser ocupado. Escolha outro.'});

    const description=`Paciente: ${x.name}\nCPF: ${x.cpf}\nData de nascimento: ${x.birthDate||'-'}\nWhatsApp: ${x.phone}\nE-mail: ${x.email}\nPlano: ${x.plan}\nModalidade: ${x.mode}\nObservações: ${x.notes||'-'}`;
    const event=await createEvent({
      summary:`${cfg.title} · ${x.name}`,
      description,
      location:x.mode==='Presencial'?'Av. Cândido de Abreu, 526, Curitiba - PR':'Atendimento on-line',
      start:{dateTime:span.start,timeZone:TZ},
      end:{dateTime:span.end,timeZone:TZ},
      attendees:[{email:x.email}],
      reminders:{useDefault:false,overrides:[{method:'email',minutes:1440},{method:'popup',minutes:120}]}
    });

    let profileSynced=false;
    // Stable production endpoint; the shared sync secret is loaded from Vercel at deploy time.
    const dashboardUrl='https://admin-nutri-thales.vercel.app';
    if(process.env.AGENDA_SYNC_SECRET){
      try{
        const syncResponse=await fetch(`${dashboardUrl}/api/agenda/webhook`,{
          method:'POST',
          headers:{'content-type':'application/json',authorization:`Bearer ${process.env.AGENDA_SYNC_SECRET}`},
          body:JSON.stringify({
            eventId:event.id,
            name:x.name,
            cpf:x.cpf,
            email:x.email,
            phone:x.phone,
            birthDate:x.birthDate||undefined,
            plan:x.plan,
            mode:x.mode,
            serviceTitle:cfg.title,
            start:span.start,
            notes:x.notes||''
          })
        });
        profileSynced=syncResponse.ok;
        if(!syncResponse.ok)console.error('Falha ao sincronizar paciente:',await syncResponse.text());
      }catch(syncError){
        console.error('Falha ao sincronizar paciente:',syncError);
      }
    }

    return res.status(201).json({ok:true,id:event.id,profileSynced});
  }catch(e){
    return res.status(503).json({error:e.message});
  }
}
