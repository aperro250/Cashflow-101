const http=require('http'),fs=require('fs'),path=require('path');
const {WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000;
const server=http.createServer((q,res)=>{
  const u=q.url.split('?')[0].replace(/\.\./g,'');
  const f=path.join(__dirname,'public',u==='/'?'index.html':u);
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('404');}
    res.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':'text/plain'});res.end(d);});
});
const wss=new WebSocketServer({server});

const BOARD=['pay','opp','doodad','market','opp','charity','doodad','market','opp','baby','doodad','market','pay','opp','doodad','market','opp','downsized','doodad','market','opp','baby','doodad','charity'];
const COLORS=['#ff5d73','#4dabf7','#51cf66','#ffd43b','#b197fc','#ff922b'];
const PROFS=[
 {n:'Врач',sal:13200,tax:3420,home:1900,school:750,car:380,cc:270,ret:50,oth:2880,sav:400,pc:640},
 {n:'Водитель грузовика',sal:2500,tax:460,home:400,school:0,car:100,cc:60,ret:50,oth:570,sav:750,pc:140},
 {n:'Учитель',sal:3300,tax:630,home:500,school:60,car:100,cc:90,ret:50,oth:760,sav:400,pc:180},
 {n:'Инженер',sal:4900,tax:1050,home:700,school:60,car:140,cc:120,ret:50,oth:1090,sav:400,pc:250},
 {n:'Уборщик',sal:1600,tax:280,home:200,school:0,car:60,cc:60,ret:50,oth:300,sav:560,pc:70},
 {n:'Медсестра',sal:3100,tax:600,home:400,school:50,car:100,cc:90,ret:50,oth:710,sav:480,pc:170}];
const LIAB={'Врач':[202000,150000,19000,9000,1000],'Водитель грузовика':[38000,0,4000,2000,1000],'Учитель':[50000,12000,5000,3000,1000],'Инженер':[75000,12000,7000,4000,1000],'Уборщик':[20000,0,3000,2000,1000],'Медсестра':[40000,12000,5000,3000,1000]};
const SMALL=[
 {k:'stock',sym:'OK4U',name:'Фармацевтика OK4U',price:20,div:0,text:'Рынок на подъёме — акции известного производителя лекарств.'},
 {k:'stock',sym:'ON2U',name:'Игрушки ON2U',price:10,div:0,text:'Акции игрушечной компании. Дивидендов нет.'},
 {k:'stock',sym:'GRO4US',name:'Фонд GRO4US',price:10,div:0.1,text:'Паевой фонд, платит дивиденды $0.10 на акцию в месяц.'},
 {k:'stock',sym:'2BIG',name:'Энергокомпания 2BIG',price:30,div:0.2,text:'Стабильная энергетическая компания, дивиденд $0.20 на акцию в месяц.'},
 {k:'re',key:'house',name:'Дом 3К/2В',cost:65000,down:5000,cf:100,text:'Дом в хорошем районе, срочная продажа.'},
 {k:'re',key:'condo',name:'Кондо 2К/1В',cost:40000,down:4000,cf:140,text:'Уютная квартира, сдаётся студентам.'}];
const BIG=[
 {k:'re',key:'plex',name:'4-плекс',cost:100000,down:20000,cf:400,text:'Четыре квартиры, очередь из арендаторов.'},
 {k:'re',key:'apt',name:'Дом на 12 квартир',cost:350000,down:50000,cf:2400,text:'ROI 58%! Наследники продают срочно.'},
 {k:'re',key:'plex',name:'8-плекс',cost:220000,down:40000,cf:1000,text:'Стабильный денежный поток.'},
 {k:'re',key:'biz',name:'Бизнес: Видео/Пинбол',cost:80000,down:20000,cf:1600,text:'Автоматизированный бизнес — аппараты работают сами.'}];
const MARKET=[
 {t:'re',key:'condo',price:50000,text:'Покупатель ищет кондо! Все владельцы кондо могут продать за $50 000.'},
 {t:'re',key:'house',price:110000,text:'Бум на дома! Цена $110 000 для всех владельцев домов.'},
 {t:'re',key:'plex',price:180000,text:'Инвестор скупает плексы по $180 000.'},
 {t:'re',key:'apt',price:520000,text:'Крупный фонд покупает дома на 12 квартир за $520 000.'},
 {t:'re',key:'biz',price:150000,text:'Корпорация покупает автоматизированные бизнесы за $150 000.'},
 {t:'stock',sym:'OK4U',price:5,text:'Обвал! OK4U стоит $5 — все могут продать.'},
 {t:'stock',sym:'OK4U',price:40,text:'Взлёт OK4U до $40 — продавайте!'},
 {t:'stock',sym:'ON2U',price:30,text:'ON2U выросла до $30.'},
 {t:'stock',sym:'GRO4US',price:30,text:'GRO4US выросла до $30.'},
 {t:'ev',text:'Налоговая вернула вам $2 000!',gain:2000},
 {t:'ev',text:'На рынке штиль. Ничего не происходит.',gain:0}];
const DOO=[['Новый телевизор',1000],['Кофе с друзьями',100],['Новые туфли',200],['Ужин в ресторане',150],['Поездка на выходные',500],['Ремонт машины',400],['Новый смартфон',800],['Спа-день',300]];
const DECKS={small:SMALL,big:BIG,market:MARKET,doodad:DOO.map(([n,c])=>({n,c}))};
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const rooms={};

const calc=p=>{
  const pas=Math.round(Object.values(p.stocks).reduce((a,s)=>a+s.n*s.div,0)+p.re.reduce((a,r)=>a+r.cf,0));
  const q=p.pr,exp=q.tax+q.home+q.school+q.car+q.cc+q.ret+q.oth+p.kids*q.pc+p.loan*0.1;
  return {pas,exp,inc:q.sal+pas,cf:q.sal+pas-exp};
};
const send=(ws,o)=>ws&&ws.readyState===1&&ws.send(JSON.stringify(o));
const view=r=>({code:r.code,started:r.started,turn:r.turn,phase:r.phase,card:r.card,market:r.market,winner:r.winner,roll:r.roll,ev:r.ev,host:r.players[0]&&r.players[0].id,log:r.log.slice(-80),
  players:r.players.map(p=>({id:p.id,name:p.name,color:p.color,pos:p.pos,cash:p.cash,loan:p.loan,kids:p.kids,pr:p.pr,stocks:p.stocks,re:p.re,skip:p.skip,charity:p.charity,out:p.out,online:!!p.ws,...calc(p)}))});
const bc=r=>{const s=view(r);r.players.forEach(p=>send(p.ws,{t:'state',s}))};
const log=(r,m)=>{r.log.push(m);if(r.log.length>300)r.log.splice(0,150);};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cur=r=>r.players[r.turn];
const ev=(r,p,o)=>{r.ev={seq:++r.evseq,pid:p.id,cell:BOARD[p.pos],...o};};

function ensure(r,p,need){ // автокредит, если не хватает денег
  if(p.cash<need){const a=Math.ceil((need-p.cash)/1000)*1000;p.cash+=a;p.loan+=a;log(r,`🏦 ${p.name} берёт кредит $${a} (не хватало денег)`);}
}
function pay(r,p,n){ensure(r,p,n);p.cash-=n;}
function paycheck(r,p){
  const c=calc(p).cf;
  if(c>=0||p.cash>=-c){p.cash+=c;log(r,`💵 ${p.name} получает зарплату: ${c>=0?'+':''}$${Math.round(c)}`);return;}
  let g=0;p.re.forEach(a=>g+=a.down/2);Object.values(p.stocks).forEach(s=>g+=s.n*s.cost/2);
  p.re=[];p.stocks={};p.cash+=g;p.skip=3;log(r,`💥 ${p.name} банкрот! Активы проданы за половину, пропуск 3 ходов`);
  if(calc(p).cf<0&&p.cash+calc(p).cf<0){p.out=true;log(r,`☠️ ${p.name} выбывает из игры`);}else p.cash+=calc(p).cf;
}
function next(r){
  r.market=null;r.card=null;
  for(let i=0;i<r.players.length*4;i++){
    r.turn=(r.turn+1)%r.players.length;const p=cur(r);
    if(p.out)continue;
    if(p.skip>0){p.skip--;log(r,`⏭ ${p.name} пропускает ход`);continue;}
    break;
  }
  r.phase='roll';
}
function checkWin(r,p){const c=calc(p);if(c.pas>0&&c.pas>c.exp){r.winner=p.id;log(r,`🏆 ${p.name} вышел из Крысиных бегов! Пассивный доход $${c.pas} > расходов $${Math.round(c.exp)}`);return true;}}

function land(r,p){
  const t=BOARD[p.pos];r.phase='end';
  if(t==='opp'){r.phase='opp';ev(r,p,{});log(r,`💼 ${p.name} попадает на «Возможность»`);}
  else if(t==='pay'){ev(r,p,{});}
  else if(t==='market'){const c=rnd(MARKET);r.market=c;ev(r,p,{deck:'market',title:'Рынок',text:c.text});log(r,'📈 Рынок: '+c.text);if(c.gain)p.cash+=c.gain;}
  else if(t==='doodad'){const [n,c]=rnd(DOO);pay(r,p,c);ev(r,p,{deck:'doodad',title:n,text:'Импульсивная трата: −$'+c});log(r,`🛍️ ${p.name}: ${n} — $${c}`);}
  else if(t==='baby'){const ok=p.kids<3;if(ok)p.kids++;
    ev(r,p,{deck:'baby',title:ok?'Пополнение в семье!':'Детей уже трое',text:ok?`Расходы растут на $${p.pr.pc}/мес`:'Больше детей не будет'});
    log(r,ok?`👶 У ${p.name} родился ребёнок! (${p.kids})`:`👶 У ${p.name} уже 3 детей`);}
  else if(t==='charity'){r.phase='charityq';ev(r,p,{deck:'charity',title:'Благотворительность',text:'Пожертвуйте 10% дохода и получите 2 кубика на 3 хода'});}
  else if(t==='downsized'){const e=Math.round(calc(p).exp);pay(r,p,e);p.skip=2;p.charity=0;
    ev(r,p,{deck:'downsized',title:'Вас уволили!',text:`Заплатите $${e} и пропустите 2 хода`});log(r,`📉 ${p.name} уволен! Платит $${e} и пропускает 2 хода`);}
}

const ACT={
  start(r,p){if(p.id!==r.players[0].id||r.started)return;
    const pool=[...PROFS].sort(()=>Math.random()-.5);
    r.players.forEach((q,i)=>{q.pr={...pool[i%pool.length],L:LIAB[pool[i%pool.length].n]};q.cash=calc(q).cf+q.pr.sav;});
    r.started=true;r.turn=0;r.phase='roll';log(r,'🎲 Игра началась! Выберитесь из Крысиных бегов!');},
  roll(r,p){if(r.phase!=='roll'||cur(r)!==p)return;
    const n=p.charity>0?2:1;if(p.charity>0)p.charity--;
    const fd=r.forced;r.forced=0;const dice=Array.from({length:n},()=>fd||1+Math.floor(Math.random()*6));
    const from=p.pos;let pos=from;
    for(let i=0;i<dice.reduce((a,b)=>a+b);i++){pos=(pos+1)%24;p.pos=pos;if(BOARD[pos]==='pay')paycheck(r,p);}
    r.roll={seq:(r.roll?r.roll.seq:0)+1,pid:p.id,dice,from,to:pos};
    log(r,`🎲 ${p.name} выбрасывает ${dice.join('+')}`);land(r,p);},
  draw(r,p,m){if(r.phase!=='opp'||cur(r)!==p)return;
    r.card={...rnd(m.big?BIG:SMALL),big:!!m.big};r.phase='decide';
    ev(r,p,{deck:m.big?'big':'small',title:r.card.name,text:r.card.text,noland:1});},
  buy(r,p,m,ws){if(r.phase!=='decide'||cur(r)!==p||!r.card)return;const c=r.card;
    if(c.k==='stock'){const n=Math.floor(+m.n);if(!(n>0))return send(ws,{t:'err',m:'Укажите количество акций'});const cost=n*c.price;
      if(p.cash<cost)return send(ws,{t:'err',m:`⚠️ Не хватает $${cost-p.cash}: нужно $${cost}, у вас $${p.cash}. Уменьшите количество или возьмите кредит`});
      p.cash-=cost;const s=p.stocks[c.sym]||(p.stocks[c.sym]={n:0,cost:c.price,div:c.div});
      s.cost=(s.cost*s.n+cost)/(s.n+n);s.n+=n;s.div=c.div;log(r,`📊 ${p.name} покупает ${n} × ${c.sym} по $${c.price}`);}
    else{if(p.cash<c.down)return send(ws,{t:'err',m:`⚠️ Не хватает $${c.down-p.cash} на первоначальный взнос ($${c.down}). Возьмите кредит`});
      p.cash-=c.down;p.re.push({key:c.key,name:c.name,cost:c.cost,down:c.down,cf:c.cf});
      log(r,`🏠 ${p.name} покупает «${c.name}» (+$${c.cf}/мес)`);}
    r.card=null;r.phase='end';checkWin(r,p);},
  pass(r,p){if(cur(r)!==p||r.phase!=='decide')return;r.card=null;r.phase='end';log(r,`${p.name} отказывается от сделки`);},
  charity(r,p,m,ws){if(r.phase!=='charityq'||cur(r)!==p)return;
    if(m.yes){const c=Math.round(calc(p).inc*.1);if(p.cash<c)return send(ws,{t:'err',m:'Не хватает на пожертвование'});
      p.cash-=c;p.charity=3;log(r,`❤️ ${p.name} жертвует $${c}: 2 кубика на 3 хода`);}
    r.phase='end';},
  sell(r,p,m){const mk=r.market;if(!mk||p.out)return;const n=Math.max(1,Math.floor(+m.n)||1);
    if(mk.t==='stock'&&p.stocks[mk.sym]){const s=p.stocks[mk.sym],k=Math.min(n,s.n);p.cash+=k*mk.price;s.n-=k;if(!s.n)delete p.stocks[mk.sym];
      log(r,`💰 ${p.name} продаёт ${k} × ${mk.sym} по $${mk.price}`);checkWin(r,p);}
    else if(mk.t==='re'){let k=0;for(;k<n;k++){const i=p.re.findIndex(a=>a.key===mk.key);if(i<0)break;const a=p.re.splice(i,1)[0];p.cash+=mk.price-(a.cost-a.down);}
      if(k)log(r,`💰 ${p.name} продаёт недвижимость (${k} шт.) по $${mk.price}`);}},
  loan(r,p,m){const a=Math.floor(+m.amt/1000)*1000;if(cur(r)!==p||a<=0)return;p.cash+=a;p.loan+=a;log(r,`🏦 ${p.name} берёт кредит $${a}`);},
  repay(r,p,m,ws){const a=Math.floor(+m.amt/1000)*1000;if(cur(r)!==p||a<=0||a>p.loan||a>p.cash)return send(ws,{t:'err',m:'Нельзя погасить столько'});
    p.cash-=a;p.loan-=a;log(r,`🏦 ${p.name} гасит кредит $${a}`);},
  end(r,p){if(r.phase!=='end'||cur(r)!==p)return;if(!checkWin(r,p))next(r);}
};

const HELP=['👑 Команды создателя комнаты:','/give Имя 1000 — выдать деньги (минус — забрать)','/income Имя 500 — добавить пассивный доход','/kids Имя 2 — число детей (0–3)','/goto Имя 12 — переместить на клетку 1–24','/dice 6 — следующий бросок выдаст это число','/next — передать ход следующему','/win Имя — объявить победителем','/kick Имя — исключить игрока','/end — завершить игру'];
function findP(r,q){q=esc(q.trim()).toLowerCase();if(!q)throw'Укажите имя игрока';const a=r.players.filter(x=>x.name.toLowerCase()===q),b=a.length?a:r.players.filter(x=>x.name.toLowerCase().startsWith(q));
  if(b.length!==1)throw b.length?'Несколько игроков с таким именем — уточните':`Игрок «${q}» не найден`;return b[0];}
function lastNum(a){const t=a.trim().split(/\s+/),n=Number(t.pop());if(!t.length||!Number.isFinite(n))throw'Формат: /команда Имя число';return[t.join(' '),Math.round(n)];}
const CMD={
  give(r,a){const[q,n]=lastNum(a),x=findP(r,q);x.cash+=n;return n>=0?`выдал $${n} игроку ${x.name}`:`забрал $${-n} у игрока ${x.name}`;},
  income(r,a){const[q,n]=lastNum(a),x=findP(r,q);x.re.push({key:'cheat',name:'Бонус от хоста',cost:0,down:0,cf:n});checkWin(r,x);return `добавил ${x.name} пассивный доход $${n}/мес`;},
  kids(r,a){const[q,n]=lastNum(a),x=findP(r,q);x.kids=Math.max(0,Math.min(3,n));return `у ${x.name} теперь детей: ${x.kids}`;},
  goto(r,a){const[q,n]=lastNum(a),x=findP(r,q);x.pos=((n-1)%24+24)%24;return `переместил ${x.name} на клетку ${x.pos+1}`;},
  dice(r,a){const n=Math.round(Number(a));if(!(n>=1&&n<=6))throw'Формат: /dice 1-6';r.forced=n;return `следующий бросок: ${n}`;},
  next(r){next(r);return 'передал ход дальше';},
  win(r,a){const x=findP(r,a);r.winner=x.id;return `объявил победителем ${x.name}`;},
  kick(r,a){const x=findP(r,a);x.out=true;if(cur(r)===x)next(r);return `исключил ${x.name}`;},
  end(r){r.winner='end';return 'завершил игру';}
};
function chat(r,p,m,ws){const t=String(m.text||'').trim().slice(0,200);if(!t)return;const host=p.id===r.players[0].id;
  if(t[0]==='/'){
    if(!host)return send(ws,{t:'sys',m:'⚠️ Команды доступны только создателю комнаты 👑'});
    const i=t.indexOf(' '),c=(i<0?t:t.slice(0,i)).slice(1).toLowerCase(),a=i<0?'':t.slice(i+1);
    if(c==='help')return send(ws,{t:'sys',m:HELP.join('\n')});
    try{if(!CMD[c])throw'Неизвестная команда. Список: /help';if(!r.started)throw'Игра ещё не началась';if(r.winner)throw'Игра уже завершена';
      log(r,`🛠 ${p.name}: ${CMD[c](r,a)}`);bc(r);}catch(e){send(ws,{t:'sys',m:'⚠️ '+(typeof e==='string'?e:'Ошибка команды')});}
    return;}
  log(r,`💬 ${host?'👑 ':''}<b style="color:${p.color}">${p.name}</b>: ${esc(t)}`);bc(r);}

wss.on('connection',ws=>{
  let r=null,p=null;
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw)}catch{return}
    const name=esc(String(m.name||'Игрок').slice(0,14));
    if(m.a==='create'||m.a==='join'||m.a==='rejoin'){
      if(m.a==='create'){const code=Math.random().toString(36).slice(2,6).toUpperCase();
        r=rooms[code]={code,players:[],started:false,turn:0,phase:'lobby',card:null,market:null,winner:null,roll:null,ev:null,evseq:0,log:['Добро пожаловать в Cashflow!']};}
      else{r=rooms[String(m.room||'').toUpperCase()];if(!r)return send(ws,{t:'err',m:'Комната не найдена'});}
      if(m.a==='rejoin'){p=r.players.find(x=>x.id===m.id);if(!p)return send(ws,{t:'err',m:'Игрок не найден',reset:1});p.ws=ws;}
      else{if(r.started)return send(ws,{t:'err',m:'Игра уже идёт'});if(r.players.length>=6)return send(ws,{t:'err',m:'Комната заполнена'});
        p={id:Math.random().toString(36).slice(2),name,color:COLORS[r.players.length],ws,pos:0,cash:0,loan:0,kids:0,stocks:{},re:[],skip:0,charity:0,out:false,pr:PROFS[0]};
        r.players.push(p);log(r,`👋 ${name} присоединяется`);}
      send(ws,{t:'joined',id:p.id,room:r.code,decks:DECKS});return bc(r);
    }
    if(m.a==='chat'&&r&&p)return chat(r,p,m,ws);
    if(!r||!p||r.winner||!ACT[m.a])return;
    ACT[m.a](r,p,m,ws);bc(r);
  });
  ws.on('close',()=>{if(p){p.ws=null;if(r)bc(r);}});
});
server.listen(PORT,()=>console.log('Cashflow: http://localhost:'+PORT));
