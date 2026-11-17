import { BOOKING_SERVICES } from '../src/bookingSchedule.js';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
const source=readFileSync(new URL('../apps-script/Code.gs', import.meta.url),'utf8');
function fixture(){
 const clock={ms:Date.parse('2026-11-16T09:00:00Z')};
 class ClockDate extends Date{constructor(...a){super(...(a.length?a:[clock.ms]));}static now(){return clock.ms;}}
 const records=new Map([['CALENDAR_ID','test']]);
 const events=[];let locked=false,saveFail=false,createFail='';
 const props={getProperty:k=>records.get(k)||null,setProperty(k,v){if(saveFail&&/^BOOKING_[a-f0-9-]{36}$/.test(k)&&JSON.parse(v).eventId){saveFail=false;throw Error('lost save');}records.set(k,v);},getProperties:()=>Object.fromEntries(records),deleteProperty:k=>records.delete(k)};
 const cal={getEventById:id=>events.find(e=>e.getId()===id)||null,getEvents:(s,e)=>events.filter(x=>x.getStartTime()<e&&x.getEndTime()>s),createEvent(title,s,e,o){if(createFail==='before')throw Error('create failed');const event={getId:()=>String(events.length+1),getTitle:()=>title,getDescription:()=>o.description,getStartTime:()=>s,getEndTime:()=>e,getTransparency:()=> 'opaque'};events.push(event);if(createFail==='after'){createFail='';throw Error('lost response');}return event;}};
 const Utilities={DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(alg,s)=>[...createHash('sha256').update(s).digest()],formatDate(d,tz){const p=new Intl.DateTimeFormat('en',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d),get=k=>p.find(x=>x.type===k).value;return get('year')+'-'+get('month')+'-'+get('day');}};
 const ctx=vm.createContext({Date:ClockDate,console,Utilities,PropertiesService:{getScriptProperties:()=>props},CalendarApp:{getCalendarById:()=>cal,EventTransparency:{TRANSPARENT:'transparent'}},LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true;},releaseLock:()=>{locked=false;}})},ContentService:{MimeType:{JSON:'json'},createTextOutput(text){return {setMimeType(){return this;},getContent:()=>text};}}});
 vm.runInContext(source,ctx);
 const data={action:'book',serviceId:'haircut',name:'Тест',phone:'70000000000',date:'2026-11-17',time:'10:00',requestId:randomUUID(),website:''};
 const post=(d=data)=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(d)}}).getContent());
 return{ctx,post,data,records,events,clock,cal,properties:props,setSaveFail:()=>saveFail=true,setCreateFail:v=>createFail=v};
}
let f=fixture();assert.equal(f.post().ok,true);assert.equal(f.events.length,1);assert.equal(f.events[0].getEndTime()-f.events[0].getStartTime(),3600000);
const replay=f.post({...f.data});assert.equal(replay.replayed,true);assert.equal(f.events.length,1);
assert.equal(f.post({...f.data,name:'Другой'}).code,'REQUEST_MISMATCH');
f.clock.ms=Date.parse('2026-11-17T08:01:00Z');assert.equal(f.post().replayed,true);
f=fixture();assert.equal(f.post().ok,true);assert.equal(f.post({...f.data,requestId:randomUUID()}).code,'SLOT_UNAVAILABLE');
for(const patch of [{website:'spam'},{date:'2026-02-30'},{date:'2027-02-01'},{time:'19:00'},{requestId:'bad'},{serviceId:'__proto__'},{name:''},{phone:'abc'}]){f=fixture();assert.equal(f.post({...f.data,...patch}).ok,false);assert.equal(f.events.length,0);}
f=fixture();for(let i=0;i<3;i++){const r=f.post({...f.data,time:String(10+i)+':00',requestId:randomUUID()});assert.equal(r.code||'OK',i===2?'RATE_LIMITED':'OK');}assert.equal(f.events.length,2);
f=fixture();for(let i=0;i<6;i++){const r=f.post({...f.data,time:String(10+i)+':00',phone:'7000000000'+i,requestId:randomUUID()});assert.equal(r.code||'OK',i===5?'RATE_LIMITED':'OK');}assert.equal(f.events.length,5);
for(const fail of ['after','save']){f=fixture();if(fail==='after')f.setCreateFail('after');else f.setSaveFail();assert.equal(f.post().ok,false);assert.equal(f.events.length,1);assert.equal(f.post({...f.data}).replayed,true);assert.equal(f.events.length,1);}
f=fixture();f.setCreateFail('before');assert.equal(f.post().ok,false);f.setCreateFail('');assert.equal(f.post().code,'BOOKING_UNCERTAIN');assert.equal(f.events.length,0);
f=fixture();f.records.set('BOOKING_'+randomUUID(),JSON.stringify({createdAt:f.clock.ms-121*86400000}));f.records.set('OTHER_SETTING','keep');assert.equal(f.post().ok,true);assert.equal(f.records.get('OTHER_SETTING'),'keep');assert.equal([...f.records.values()].some(v=>v.includes(''+(f.clock.ms-121*86400000))),false);
assert.equal(f.post({action:'ping'}).ok,true);
console.log('PASS: full Apps Script mock suite — no CAPTCHA configuration, honeypot, limits, cleanup, validation, conflict, retries including past start, uncertain failures. No live calendar writes.');


// Проверки расписания отдельно от маршрута записи: границы интервалов и длительности.
for (const { id: serviceId, duration: minutes, label } of BOOKING_SERVICES) {
  const f = fixture();
  const result = f.post({...f.data, serviceId});
  assert.equal(result.ok,true);
  assert.equal(f.events[0].getTitle(), label + ' — Тест');
  assert.equal(f.events[0].getEndTime() - f.events[0].getStartTime(), minutes * 60000);
}
{
  const f = fixture();
  const start = new Date('2026-11-17T12:30:00+03:00'), end = new Date('2026-11-17T13:00:00+03:00');
  f.events.push({getStartTime:()=>start,getEndTime:()=>end,getTransparency:()=> 'opaque'});
  assert.equal(f.ctx.getAvailableSlots('2026-11-17','haircut').includes('12:00'),false);
  assert.equal(f.ctx.getAvailableSlots('2026-11-17','edging').includes('12:00'),true);
  assert.equal(f.ctx.getAvailableSlots('2026-11-17','camouflage').includes('12:00'),false);
  assert.equal(f.ctx.getAvailableSlots('2026-11-17','haircut').includes('13:00'),true);
}
{
  const f = fixture();
  f.events.push({getStartTime:()=>new Date('2026-11-17T00:00:00+03:00'),getEndTime:()=>new Date('2026-11-18T00:00:00+03:00'),getTransparency:()=> 'opaque'});
  assert.equal(f.ctx.getAvailableSlots('2026-11-17','haircut').length,0);
  f.events[0].getTransparency=()=> 'transparent';
  assert.equal(f.ctx.getAvailableSlots('2026-11-17','haircut').length,9);
}
{
  const f = fixture();
  for(let i=0;i<31;i++) {
    f.clock.ms += 61000;
    const result = f.post({...f.data,phone:'7000000'+String(i).padStart(4,'0'),requestId:randomUUID()});
    if(i===30) assert.equal(result.code,'RATE_LIMITED');
    else assert.notEqual(result.code,'RATE_LIMITED');
  }
}

// Комплекс длится 90 минут: не помещается в 18:00 и пересекает следующий час.
{
  const f = fixture();
  assert.equal(f.ctx.getAvailableSlots('2026-11-17', 'fullService').includes('18:00'), false);
  assert.equal(f.post({...f.data, serviceId: 'fullService'}).ok, true);
  assert.equal(f.ctx.getAvailableSlots('2026-11-17', 'haircut').includes('11:00'), false);
  assert.equal(f.ctx.getAvailableSlots('2026-11-17', 'haircut').includes('12:00'), true);
}
