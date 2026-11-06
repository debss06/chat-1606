const API='https://site.api.espn.com/apis/site/v2/sports/basketball/nba';const $=id=>document.getElementById(id);let games=[];
const brDate=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const brTime=s=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}).format(new Date(s));
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function get(url){let r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
function parts(e){let c=e.competitions?.[0],a=c?.competitors||[];return{id:e.id,date:e.date,status:e.status?.type?.shortDetail||'Agendado',state:e.status?.type?.state||'pre',away:a.find(x=>x.homeAway==='away')||a[0],home:a.find(x=>x.homeAway==='home')||a[1],venue:c?.venue?.fullName}}
function team(t){let tm=t?.team||{};return `<span>${tm.logo?`<img src="${safe(tm.logo)}">`:''}${safe(tm.displayName||'Time')} <small>${safe(tm.abbreviation||'')}</small></span>`}
function card(e){let p=parts(e);return `<article class="game"><div class="top"><span>${brTime(p.date)} · ${safe(p.venue||'NBA')}</span><b class="status">${safe(p.status)}</b></div><div class="team">${team(p.away)}<b class="score">${p.away?.score??'—'}</b></div><div class="team">${team(p.home)}<b class="score">${p.home?.score??'—'}</b></div><div class="bottom"><span>${p.state==='in'?'AO VIVO':p.state==='post'?'FINALIZADO':'BRASÍLIA'}</span><button data-game="${safe(p.id)}">Analisar →</button><button data-roster-game="${safe(p.id)}">Jogadores →</button></div></article>`}
function fillSelects(){const options=games.map(e=>{let p=parts(e);return `<option value="${p.id}">${safe(p.away?.team?.abbreviation)} @ ${safe(p.home?.team?.abbreviation)} · ${brTime(p.date)}</option>`}).join('')||'<option value="">Sem partidas carregadas</option>';for(const id of ['gameSelect','lineupSelect','rosterGame']){const el=$(id),previous=el.value;el.innerHTML=options;if(games.some(g=>g.id===previous))el.value=previous;}const live=games.filter(e=>parts(e).state==='in');const livePrevious=$('liveGameSelect').value;$('liveGameSelect').innerHTML=live.map(e=>{let p=parts(e);return `<option value="${p.id}">${safe(p.away?.team?.abbreviation)} @ ${safe(p.home?.team?.abbreviation)}</option>`}).join('')||'<option value="">Nenhuma partida ao vivo</option>';if(live.some(g=>g.id===livePrevious))$('liveGameSelect').value=livePrevious;}
function render(){let p=games.map(parts);$('total').textContent=games.length;$('liveN').textContent=p.filter(x=>x.state==='in').length;$('finalN').textContent=p.filter(x=>x.state==='post').length;$('pendingN').textContent=p.filter(x=>x.state==='pre').length;$('games').innerHTML=games.length?games.map(card).join(''):'<div class="empty">Nenhuma partida para esta data.</div>';let live=games.filter(e=>parts(e).state==='in');$('liveGames').innerHTML=live.length?live.map(card).join(''):'<div class="empty">Nenhuma partida ao vivo no momento.</div>';fillSelects()}
async function load(){let d=$('date').value;$('games').innerHTML='<div class="empty">Buscando jogos...</div>';try{let x=await get(`${API}/scoreboard?dates=${d.replaceAll('-','')}`);games=x.events||[];render();$('connection').textContent='Dados ESPN conectados';if($('players').classList.contains('active'))loadRosters()}catch(e){$('connection').textContent='Fonte indisponível';$('games').innerHTML=`<div class="empty error">Não foi possível carregar a agenda (${safe(e.message)}). A API externa pode estar indisponível.</div>`}}
async function summary(id,target){target.innerHTML='<p>Consultando informações disponíveis...</p>';try{let d=await get(`${API}/summary?event=${id}`);let p=parts(games.find(g=>g.id===id));let injuries=d.injuries||[];target.innerHTML=`<h3>${safe(p.away?.team?.displayName)} @ ${safe(p.home?.team?.displayName)}</h3><p>${brTime(p.date)} · horário de Brasília</p><p><b>Status:</b> ${safe(p.status)}</p><p><b>Ginásio:</b> ${safe(p.venue||'Não informado')}</p><h3>Lesões / disponibilidade</h3>${injuries.length?injuries.map(i=>`<div class="item"><span>${safe(i.athlete?.displayName||'Atleta')}<small>${safe(i.team?.displayName||'Equipe')}</small></span><b>${safe(i.status||i.type?.description||'Status não informado')}</b></div>`).join(''):'<p>A fonte não retornou relatório de lesões. Isso não significa que os times estejam sem desfalques.</p>'}<p class="footnote">A API nem sempre fornece métricas avançadas pré-jogo, titulares ou defesa por posição. Não preencheremos lacunas com suposições.</p>`}catch(e){target.innerHTML=`<p class="error">Resumo indisponível: ${safe(e.message)}</p>`}}
function tab(id){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===id));if(id==='live')loadLivePicks();if(id==='players'&&games.length&&!window.ciRosterLoadedFor)loadRosters()}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));$('load').onclick=load;$('refresh').onclick=load;$('analyze').onclick=()=>summary($('gameSelect').value,$('analysis'));$('lineupLoad').onclick=()=>summary($('lineupSelect').value,$('lineupOutput'));
document.addEventListener('click',e=>{let rg=e.target.closest('[data-roster-game]');if(rg){tab('players');$('rosterGame').value=rg.dataset.rosterGame;loadRosters()}let b=e.target.closest('[data-game]');if(b){tab('pregame');$('gameSelect').value=b.dataset.game;summary(b.dataset.game,$('analysis'))}let a=e.target.closest('[data-athlete]');if(a){$('pName').value=a.dataset.name}});
$('searchPlayer').onclick=async()=>{let q=$('playerQuery').value.trim();$('playerResults').textContent='Buscando...';try{let d=await get(`${API}/athletes?limit=10&search=${encodeURIComponent(q)}`);let a=d.athletes||d.items||[];$('playerResults').innerHTML=a.length?a.slice(0,8).map(x=>`<button class="item" data-athlete="${safe(x.id)}" data-name="${safe(x.displayName||x.fullName)}">${safe(x.displayName||x.fullName)}</button>`).join(''):'<p>Nenhum atleta encontrado. Preencha o nome e insira médias verificadas manualmente.</p>'}catch(e){$('playerResults').innerHTML='<p class="error">Busca indisponível. Insira o nome e as médias verificadas manualmente.</p>'}};
$('calculate').onclick=()=>{let vals=['season','last10','last5','mins','avgmins','factor'].map(id=>$(id).value);if(vals.some(v=>v==='')){$('projection').innerHTML='<p class="error">Preencha todos os campos com dados verificados.</p>';return}let [s,l10,l5,m,a,f]=vals.map(Number);if(a<=0||m<=0){$('projection').textContent='Minutos precisam ser maiores que zero.';return}let base=.5*s+.3*l10+.2*l5,proj=base*(m/a)*f;let rec={id:Date.now(),name:$('pName').value||'Jogador',market:$('market').value,projection:+proj.toFixed(1),actual:null,date:new Date().toISOString(),source:'manual',method:'weighted-baseline'};let h=readHistory();h.unshift(rec);saveHistory(h);$('projection').innerHTML=`<div class="metricgrid"><div class="metric"><b>${proj.toFixed(1)}</b><small>PROJEÇÃO ${safe(rec.market)}</small></div><div class="metric"><b>${base.toFixed(1)}</b><small>MÉDIA PONDERADA</small></div><div class="metric"><b>${(m/a*100).toFixed(0)}%</b><small>AJUSTE DE MINUTOS</small></div></div><p>Estimativa pontual, não probabilidade de over/under. Ainda não considera distribuição individual, variância, faltas, blowout ou defesa por posição.</p>`;renderHistory()};
function readHistory(){try{return JSON.parse(localStorage.getItem('ciHistory')||'[]')}catch{return []}}
function saveHistory(h){localStorage.setItem('ciHistory',JSON.stringify(h.slice(0,500)))}
function renderHistory(){
 const h=readHistory();const evaluated=h.filter(x=>Number.isFinite(Number(x.actual))&&x.actual!==null&&x.actual!=='' );
 const mae=evaluated.length?evaluated.reduce((a,x)=>a+Math.abs(Number(x.projection)-Number(x.actual)),0)/evaluated.length:null;
 $('records').textContent=h.length;$('mae').textContent=mae===null?'—':mae.toFixed(2);
 const decided=evaluated.filter(x=>Number.isFinite(Number(x.line))&&x.side);
 const hits=decided.filter(x=>x.side==='over'?Number(x.actual)>Number(x.line):Number(x.actual)<Number(x.line)).length;
 const summary=document.getElementById('historySummary');
 if(summary)summary.innerHTML=`<div class="stats"><article><b>${evaluated.length}</b><small>RESULTADOS INSERIDOS</small></article><article><b>${decided.length?Math.round(hits/decided.length*100)+'%':'—'}</b><small>ACERTO NAS LINHAS</small></article><article><b>${decided.length?hits+'/'+decided.length:'—'}</b><small>OVER/UNDER AVALIADOS</small></article></div>`;
 $('historyList').innerHTML=h.length?h.map((x,i)=>{const done=x.actual!==null&&x.actual!==undefined&&x.actual!=='';const hit=done&&Number.isFinite(Number(x.line))&&x.side?(x.side==='over'?Number(x.actual)>Number(x.line):Number(x.actual)<Number(x.line)):null;return `<div class="history-record"><div class="item"><span><b>${safe(x.name)}</b> · ${safe(x.market)}${x.opponent?' vs '+safe(x.opponent):''}<small>${new Date(x.date).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · projeção ${Number(x.projection).toFixed(1)}${Number.isFinite(Number(x.line))?' · linha '+x.line+' '+(x.side==='over'?'OVER':'UNDER'):''}</small></span><b class="${done?(hit===null?'':hit?'accuracy-good':'error'):''}">${done?`Real: ${Number(x.actual)}${hit===null?'':hit?' · ACERTO':' · ERRO'}`:'Pendente'}</b></div>${done?'':`<div class="history-update"><label>Resultado real<input type="number" step=".1" data-actual-input="${i}" placeholder="Ex.: 7"></label><button class="primary" data-save-actual="${i}">Avaliar</button></div>`}</div>`}).join(''):'As previsões deste aparelho aparecerão aqui.';
 renderPlayerAccuracy();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-save-actual]');if(!b)return;const i=Number(b.dataset.saveActual),input=document.querySelector(`[data-actual-input="${i}"]`);if(!input||input.value==='')return;const h=readHistory();if(!h[i])return;h[i].actual=Number(input.value);h[i].evaluatedAt=new Date().toISOString();if(Number.isFinite(Number(h[i].line))&&h[i].side)h[i].hit=h[i].side==='over'?h[i].actual>Number(h[i].line):h[i].actual<Number(h[i].line);saveHistory(h);renderHistory()});
$('clear').onclick=()=>{localStorage.removeItem('ciHistory');renderHistory()};
$('loadLivePlayers').onclick=loadLivePicks;
$('liveGameSelect').onchange=loadLivePicks;
let now=new Date();$('today').textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(now);$('date').value=brDate(now);renderHistory();load();setInterval(()=>{load();if($('live').classList.contains('active'))loadLivePicks()},20000);


async function loadRosters(){
 const id=$('rosterGame').value, g=games.find(x=>x.id===id); if(!g)return;
 const p=parts(g); $('rosterTeams').innerHTML='<div class="empty">Carregando os jogadores dos dois times...</div>';
 $('playerDetail').innerHTML='<div class="empty">Selecione um jogador para abrir a análise individual.</div>';
 window.ciRosterLoadedFor=id;
 const extract=(data)=>{const found=new Map();const visit=(node)=>{if(!node)return;if(Array.isArray(node)){node.forEach(visit);return;}if(typeof node!=='object')return;const candidate=node.athlete&&typeof node.athlete==='object'?node.athlete:node.player&&typeof node.player==='object'?node.player:node;if(candidate.id&&(candidate.displayName||candidate.fullName||candidate.name))found.set(String(candidate.id),candidate);for(const [k,v] of Object.entries(node)){if(k!=='team'&&k!=='position')visit(v);}};visit(data.athletes||data.items||data.roster||data);return [...found.values()];};
 const entries=[p.away,p.home].filter(Boolean);
 const results=await Promise.all(entries.map(async comp=>{const tm=comp.team||{},tid=tm.id;let data=null,error=null;for(const url of [`${API}/teams/${tid}/roster?limit=100`,`${API}/teams/${tid}?enable=roster`]){try{data=await get(url);if(extract(data).length)break;}catch(e){error=e;}}const athletes=data?extract(data):[];return {team:{...tm,...(data?.team||{})},athletes,error};}));
 window.ciRosters=results;
 const total=results.reduce((n,t)=>n+t.athletes.length,0);
 renderRosters();
 if(!total){$('rosterTeams').innerHTML='<div class="empty error">A ESPN não entregou os elencos nesta tentativa. Use “Carregar jogadores” para tentar novamente. A agenda continua disponível; não exibimos uma lista fictícia.</div>';window.ciRosterLoadedFor='';}
}
function renderRosters(){
 const q=($('rosterSearch').value||'').trim().toLowerCase();
 const teams=window.ciRosters||[];
 $('rosterTeams').innerHTML=teams.map(t=>{
  const list=t.athletes.filter(a=>(a.displayName||a.fullName||'').toLowerCase().includes(q));
  return `<section class="roster-team"><h3>${t.team.logo?`<img src="${safe(t.team.logo)}">`:''}${safe(t.team.displayName||t.team.name||'Equipe')} <small class="muted">(${list.length})</small></h3><div class="player-grid">${list.map(a=>{
   const head=a.headshot?.href||a.headshot||'';
   return `<button class="player-tile" data-roster-player="${safe(a.id)}" data-player-name="${safe(a.displayName||a.fullName||a.name)}" data-headshot="${safe(head)}" data-position="${safe(a.position?.abbreviation||a.position?.displayName||'NBA')}" data-game-id="${safe($('rosterGame').value)}">${head?`<img src="${safe(head)}" alt="">`:'<span class="avatar">🏀</span>'}<span>${safe(a.displayName||a.fullName||a.name)}<small>${safe(a.position?.abbreviation||a.position?.displayName||'Elenco')}</small></span></button>`;
  }).join('')||'<p class="muted">Nenhum jogador corresponde à busca.</p>'}</div></section>`;
 }).join('');
}
async function openPlayer(id,name,headshot,position,gameId){
 const detail=$('playerDetail');
 const game=games.find(g=>g.id===gameId);
 const gp=game?parts(game):null;
 const myTeam=(window.ciRosters||[]).find(t=>t.athletes.some(a=>String(a.id)===String(id)));
 const opponent=gp?(String(myTeam?.team?.id)===String(gp.away?.team?.id)?gp.home?.team:gp.away?.team):null;
 detail.innerHTML='<p>Carregando estatísticas e contexto da partida...</p>';
 let statValues={points:null,rebounds:null,assists:null,minutes:null};
 let recent=[],h2h=[];
 let sourceNotes=[];
 try{
  const d=await get(`${API}/athletes/${id}/statistics`);
  const cats=d.splits?.categories||d.statistics?.splits?.categories||[];
  const all=cats.flatMap(c=>c.stats||[]);
  const findStat=(terms)=>all.find(s=>terms.test(`${s.name||''} ${s.abbreviation||''} ${s.displayName||''}`));
  const read=s=>s?Number(s.value??s.displayValue):null;
  statValues.points=read(findStat(/points|pts/i));
  statValues.rebounds=read(findStat(/rebounds|reb/i));
  statValues.assists=read(findStat(/assists|ast/i));
  statValues.minutes=read(findStat(/minutes|mins/i));
 }catch(e){sourceNotes.push('Médias da temporada indisponíveis nesta consulta ESPN.')}
 // Game logs are used as observed samples, never fabricated. ESPN response shapes can vary.
 try{
  const gl=await get(`${API}/athletes/${id}/gamelog`);
  const rows=[];
  const walk=(v)=>{
   if(!v||typeof v!=='object')return;
   if(Array.isArray(v)){v.forEach(walk);return;}
   if(v.stats&&Array.isArray(v.stats)){
    const labels=(gl.names||gl.labels||[]);const vals=v.stats;
    const obj={};
    vals.forEach((x,i)=>{const k=String(labels[i]||'').toLowerCase();obj[k]=(x===null||x===undefined||x==='')?NaN:Number(x)});
    if(Object.keys(obj).length)rows.push({obj,opponent:String(v.opponent?.abbreviation||v.opponent?.displayName||v.opponent||'').toLowerCase(),date:v.gameDate||v.date});
   }
   Object.values(v).forEach(walk);
  };
  walk(gl.events||gl.seasonTypes||gl);
  const pick=(o,regex)=>{const k=Object.keys(o).find(x=>regex.test(x));return k?o[k]:null};
  const parsed=rows.map(r=>({points:pick(r.obj,/^(pts|points)$/),rebounds:pick(r.obj,/^(reb|rebounds)$/),assists:pick(r.obj,/^(ast|assists)$/),opponent:r.opponent,date:r.date})).filter(x=>[x.points,x.rebounds,x.assists].some(v=>Number.isFinite(v)));
  recent=parsed.slice(0,10);
  const abbr=String(opponent?.abbreviation||'').toLowerCase();
  h2h=parsed.filter(x=>abbr&&x.opponent.includes(abbr));
 }catch(e){sourceNotes.push('Game logs recentes não foram disponibilizados pela fonte para este atleta.')}
 const mean=(arr,k)=>{const v=arr.map(x=>Number(x[k])).filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
 const proj=(key,season)=>{
  const l10=mean(recent,key),l5=mean(recent.slice(0,5),key),vs=mean(h2h,key);
  // Recent samples are context only; they never force the final projection upward or downward.
  const reference=Number.isFinite(season)?season:(Number.isFinite(l10)?l10:null);
  return {value:reference,l10,l5,vs};
 };
 const metrics=[['Pontos','points'],['Rebotes','rebounds'],['Assistências','assists']].map(([label,key])=>({label,...proj(key,statValues[key])}));
 const fmt=v=>Number.isFinite(v)?v.toFixed(1):'—';
 const sample=recent.length;
 // Faixas dinâmicas: os limites vêm da distribuição observada nos últimos jogos,
 // não de linhas fixas. A taxa é frequência histórica, não probabilidade futura.
 const dynamicMarket=(key,label)=>{
  const values=recent.map(x=>Number(x[key])).filter(Number.isFinite);
  if(values.length<5)return `<article class="threshold-market"><h4>${label}</h4><p class="threshold-empty">Amostra insuficiente: ${values.length} jogos válidos. São necessários pelo menos 5 para classificar as marcas.</p></article>`;
  const sorted=[...values].sort((a,b)=>a-b);
  const quantiles=[.1,.3,.5,.7,.9];
  const lines=[...new Set(quantiles.map(q=>Math.max(1,Math.ceil(sorted[Math.round((sorted.length-1)*q)]))))].sort((a,b)=>a-b);
  const cards=lines.map(line=>{
   const hits=values.filter(v=>v>=line).length, pct=Math.round(hits/values.length*100);
   const grade=pct>=70?'alta':pct>=40?'media':'baixa';
   const labelGrade=grade==='alta'?'Alta':grade==='media'?'Média':'Baixa';
   return `<div class="threshold-item ${grade}"><b>${line}+</b><strong>${labelGrade}</strong><small>${hits}/${values.length} jogos · ${pct}%</small></div>`;
  }).join('');
  return `<article class="threshold-market"><h4>${label}</h4><div class="threshold-grid">${cards}</div></article>`;
 };
 const thresholdSection=`<section class="threshold-section"><h3>Marcas dinâmicas por mercado</h3><p class="muted">O sistema escolhe linhas adequadas ao histórico recente deste jogador. Alta: 70% ou mais dos jogos; média: 40% a 69%; baixa: abaixo de 40%. Isso mede frequência nos jogos observados, não garante o resultado de hoje.</p><div class="threshold-markets">${dynamicMarket('points','Pontos')}${dynamicMarket('rebounds','Rebotes')}${dynamicMarket('assists','Assistências')}</div><p class="footnote">Base: últimos ${sample} jogos recebidos pela fonte. As linhas podem variar de jogador para jogador e de mercado para mercado; não são limitadas a 5, 7 ou 10.</p></section>`;
 detail.innerHTML=`<div class="player-profile">${headshot?`<img src="${safe(headshot)}" alt="">`:'<div class="avatar">🏀</div>'}<div><h2>${safe(name)}</h2><p class="muted">${safe(position)} · ${safe(myTeam?.team?.displayName||'NBA')}</p></div></div>
 ${gp?`<div class="match-context"><b>PARTIDA EM ANÁLISE</b><p>${safe(gp.away?.team?.displayName)} @ ${safe(gp.home?.team?.displayName)}</p><span>Adversário: ${safe(opponent?.displayName||'Não identificado')} · ${brTime(gp.date)}</span></div>`:''}
 <h3>Projeções para esta partida</h3><p class="muted">A projeção final prioriza contexto, minutos e função no jogo. Médias recentes e histórico são apenas referências e podem ser contrariados.</p>
 <div class="match-context"><b>LEITURA DO CONTEXTO DESTA PARTIDA</b><p>Não deixe a sequência recente decidir sozinha. Ajuste o papel e o cenário do jogo; a projeção pode ficar abaixo ou acima dos últimos resultados.</p><div class="formgrid"><label>Minutos esperados<input id="ctxMinutes" type="number" min="1" max="48" step="0.5" value="${Number.isFinite(statValues.minutes)?Math.min(48,statValues.minutes).toFixed(1):'30'}"></label><label>Papel (informativo)<select id="ctxRole"><option value="balanced">Equilibrado</option><option value="scorer">Foco em pontuação</option><option value="rebounder">Foco em rebotes</option><option value="creator">Foco em criação</option></select></label><label>Matchup (sem ajuste automático)<select id="ctxMatchup"><option value="neutral">Neutro / sem dado</option><option value="easy">Favorável</option><option value="hard">Desfavorável</option></select></label><label>Ritmo (sem ajuste automático)<select id="ctxPace"><option value="normal">Normal / sem dado</option><option value="fast">Rápido</option><option value="slow">Lento</option></select></label></div><button class="primary" id="runContextProjection">Recalcular pelo contexto</button></div>
 <div id="contextProjection"><div class="metricgrid">${metrics.map(m=>`<div class="metric"><b>${fmt(m.value)}</b><small>${m.label} · referência inicial</small></div>`).join('')}</div></div>
 ${thresholdSection}
 <div class="table-wrap"><table class="player-stats"><thead><tr><th>Mercado</th><th>Temporada</th><th>Últ. 10</th><th>Últ. 5</th><th>Vs. rival</th></tr></thead><tbody>${metrics.map(m=>`<tr><td>${m.label}</td><td>${fmt(statValues[m.label==='Pontos'?'points':m.label==='Rebotes'?'rebounds':'assists'])}</td><td>${fmt(m.l10)}</td><td>${fmt(m.l5)}</td><td>${h2h.length>=2?fmt(m.vs):'Amostra insuficiente'}</td></tr>`).join('')}</tbody></table></div>
 <p class="footnote">Amostra recente encontrada: ${sample} jogos · confrontos contra o adversário: ${h2h.length}. ${sourceNotes.map(safe).join(' ')}</p>
 <p class="footnote">Importante: esta versão ainda não possui uma métrica validada de defesa adversária por posição, ritmo projetado ou minutos esperados. Portanto, não classifica automaticamente o matchup como fácil/difícil nem aplica bônus inventados. Projeções parciais são exibidas somente com dados recebidos.</p>
 <h3>Registrar previsão desta partida</h3><div class="record-form"><label>Mercado<select id="recMarket"><option>Pontos</option><option>Rebotes</option><option>Assistências</option><option>PRA</option></select></label><label>Direção<select id="recSide"><option value="over">Mais de (over)</option><option value="under">Menos de (under)</option></select></label><label>Linha avaliada<input id="recLine" type="number" step=".5" placeholder="Ex.: 5.5"></label><label>Resultado previsto<input id="recProjection" type="number" step=".1" placeholder="Ex.: 6.2"></label><label>Resultado real<input id="recActual" type="number" step=".1" placeholder="Preencher depois"></label><button class="primary" id="savePlayerPick">Salvar análise</button></div><div id="playerPickMessage" class="output"></div>`;
 $('runContextProjection').onclick=()=>{
  const expected=Number($('ctxMinutes').value);
  if(!Number.isFinite(expected)||expected<=0||expected>48){$('contextProjection').innerHTML='<p class="error">Informe minutos esperados entre 1 e 48.</p>';return;}
  const role=$('ctxRole').value,matchup=$('ctxMatchup').value,pace=$('ctxPace').value;
  // V2: sem multiplicadores subjetivos de papel/ritmo/matchup. Enquanto não houver
  // dados automáticos confiáveis, esses controles não alteram artificialmente a projeção.
  const labels={points:'Pontos',rebounds:'Rebotes',assists:'Assistências'};
  const seasonMinutes=Number.isFinite(statValues.minutes)&&statValues.minutes>0?statValues.minutes:expected;
  const out=['points','rebounds','assists'].map(k=>{
    const season=statValues[k];
    const values=recent.map(x=>Number(x[k])).filter(Number.isFinite);
    const recentMean=mean(recent,k),last5=mean(recent.slice(0,5),k);
    // Recent samples are blended conservatively with season average; if a source is
    // missing, weights are renormalized. No recent streak is allowed to dominate.
    const parts=[];if(Number.isFinite(season))parts.push([season,.50]);if(Number.isFinite(recentMean))parts.push([recentMean,.30]);if(Number.isFinite(last5))parts.push([last5,.20]);
    const weight=parts.reduce((a,x)=>a+x[1],0);const base=weight?parts.reduce((a,x)=>a+x[0]*x[1],0)/weight:null;
    const rawProjection=Number.isFinite(base)&&Number.isFinite(seasonMinutes)&&seasonMinutes>0?base*(expected/seasonMinutes):null;
    // Conservative player/market bias correction, enabled only after 3 settled forecasts.
    const prior=readHistory().filter(x=>String(x.playerId)===String(id)&&x.market===labels[k]&&x.actual!==null&&x.actual!==undefined&&Number.isFinite(Number(x.actual))&&Number.isFinite(Number(x.projection)));
    const bias=prior.length>=3?prior.reduce((a,x)=>a+(Number(x.actual)-Number(x.projection)),0)/prior.length:0;
    const shrink=prior.length>=3?prior.length/(prior.length+8):0;
    const correction=bias*shrink;
    const projection=Number.isFinite(rawProjection)?rawProjection+correction:null;
    const variance=values.length>1?Math.sqrt(values.reduce((a,v)=>a+(v-recentMean)**2,0)/(values.length-1)):null;
    const confidence=values.length>=8?'Amostra razoável':values.length>=5?'Amostra limitada':'Poucos dados';
    return {key:k,label:labels[k],projection,rawProjection,correction,calibrationN:prior.length,base,recentMean,last5,variance,n:values.length,confidence};
  });
  $('contextProjection').innerHTML=`<div class="metricgrid">${out.map(x=>`<div class="metric"><b>${fmt(x.projection)}</b><small>${x.label} projetados</small></div>`).join('')}</div><p><b>Base do cálculo:</b> temporada 50% · últimos 10 30% · últimos 5 20%, com pesos redistribuídos quando faltam dados. Minutos esperados: ${expected.toFixed(1)}.</p><div class="table-wrap"><table class="player-stats"><thead><tr><th>Mercado</th><th>Últ. 10</th><th>Últ. 5</th><th>Volatilidade (DP)</th><th>Amostra</th></tr></thead><tbody>${out.map(x=>`<tr><td>${x.label}</td><td>${fmt(x.recentMean)}</td><td>${fmt(x.last5)}</td><td>${fmt(x.variance)}</td><td>${x.n} · ${x.confidence}</td></tr>`).join('')}</tbody></table></div><p class="footnote">Os controles de papel, matchup e ritmo ficam registrados visualmente, mas não alteram a conta sem métricas verificadas. Isso evita multiplicadores subjetivos que inflavam projeções como assistências.</p>`;
  const defaultMarket=$('recMarket'); if(defaultMarket){const selected=defaultMarket.value;const match=out.find(x=>x.label===selected);if(match&&Number.isFinite(match.projection))$('recProjection').value=match.projection.toFixed(1);}
 };
 $('recMarket').onchange=()=>{const label=$('recMarket').value;const el=[...$('contextProjection').querySelectorAll('.metric')];const idx=['Pontos','Rebotes','Assistências'].indexOf(label);const val=el[idx]?.querySelector('b')?.textContent;if(val&&val!=='—')$('recProjection').value=Number(val).toFixed(1);};
 $('savePlayerPick').onclick=()=>{
  const line=$('recLine').value,projection=$('recProjection').value,actual=$('recActual').value;
  if(line===''||projection===''){ $('playerPickMessage').innerHTML='<span class="error">Informe a linha e a projeção antes de salvar.</span>';return;}
  const h=readHistory();
  h.unshift({id:Date.now(),name,playerId:id,gameId,opponent:opponent?.displayName||'',market:$('recMarket').value,line:Number(line),projection:Number(projection),actual:actual===''?null:Number(actual),side:$('recSide').value,hit:actual===''?null:($('recSide').value==='over'?Number(actual)>Number(line):Number(actual)<Number(line)),date:new Date().toISOString(),source:'player-profile',method:'contextual-v2'});
  saveHistory(h);
  $('playerPickMessage').innerHTML='<span class="good">Análise salva vinculada a esta partida.</span>';renderHistory();
 };
 // Entrega uma leitura inicial assim que o perfil abre, sem exigir clique adicional.
 $('runContextProjection').click();
 renderPlayerAccuracy();
}
function renderPlayerAccuracy(){
 const h=readHistory().filter(x=>x.source==='player-profile');
 const groups={};
 h.forEach(x=>{const k=x.playerId+'|'+x.name;if(!groups[k])groups[k]={name:x.name,total:0,done:0,hits:0};groups[k].total++;if(x.actual!==null&&x.actual!==undefined){groups[k].done++;if(x.hit)groups[k].hits++;}});
 const rows=Object.values(groups);
 $('playerAccuracy').innerHTML=rows.length?rows.map(x=>`<div class="item"><span><b>${safe(x.name)}</b><small>${x.done} análises avaliadas de ${x.total} registradas</small></span><b class="${x.done&&x.hits/x.done>=.6?'accuracy-good':''}">${x.done?`${x.hits} de ${x.done} (${(100*x.hits/x.done).toFixed(0)}%)`:'Aguardando resultados'}</b></div>`).join(''):'Ainda não há análises individuais registradas.';
}

$('loadRosters').onclick=loadRosters;
$('rosterGame').addEventListener('change',()=>{window.ciRosterLoadedFor='';loadRosters()});
$('rosterSearch').addEventListener('input',renderRosters);
document.addEventListener('click',e=>{const b=e.target.closest('[data-roster-player]');if(b)openPlayer(b.dataset.rosterPlayer,b.dataset.playerName,b.dataset.headshot,b.dataset.position,b.dataset.gameId)});


// LIVE PLAYER ENGINE — estimates the final box score from current in-game production.
function liveLabels(group){
 const stats=group.statistics||[];
 return stats[0]?.labels||stats[0]?.keys||group.labels||[];
}
function parseLiveNumber(v){
 if(v===null||v===undefined||v==='--'||v==='')return null;
 if(typeof v==='number')return v;
 const n=Number(String(v).replace(':','.'));return Number.isFinite(n)?n:null;
}
function liveClock(summary){
 const h=summary.header||{};const comp=h.competitions?.[0]||{};const status=comp.status||h.status||{};
 const period=Number(status.period||status.periodNumber||1);
 const display=status.displayClock||status.clock||'12:00';
 const mmss=String(display).match(/(\d+):(\d+)/);
 const remaining=mmss?Number(mmss[1])+Number(mmss[2])/60:12;
 const regulationElapsed=Math.max(0,(Math.min(period,4)-1)*12+(12-Math.min(12,remaining)));
 const elapsed=period<=4?regulationElapsed:48+(period-5)*5+(5-Math.min(5,remaining));
 const total=period<=4?48+(period-4)*5:48+(period-4)*5;
 return {period,display,elapsed:Math.min(total,elapsed),remaining:Math.max(0,total-Math.min(total,elapsed)),label:status.type?.shortDetail||status.displayValue||`Q${period}`};
}
function extractLiveRows(summary){
 const groups=summary.boxscore?.players||summary.boxscore?.teams||[];const out=[];
 for(const group of groups){
  const team=group.team||{};
  for(const statGroup of (group.statistics||[])){
   const labels=statGroup.labels||statGroup.keys||[];
   for(const row of (statGroup.athletes||[])){
    const vals=row.stats||[];const obj={};
    labels.forEach((label,i)=>obj[String(label).toLowerCase()]=vals[i]);
    const getStat=(rx)=>{const k=Object.keys(obj).find(k=>rx.test(k));return parseLiveNumber(k?obj[k]:null)};
    const minRaw=obj.min??obj.minutes??obj.minutos;
    const min=typeof minRaw==='string'&&minRaw.includes(':')?(()=>{let a=minRaw.split(':');return Number(a[0])+Number(a[1])/60})():parseLiveNumber(minRaw);
    const athlete=row.athlete||row.player||{};
    const id=athlete.id||row.id;
    if(!id||(!Number.isFinite(getStat(/^(pts|points)$/))&&!Number.isFinite(getStat(/^(reb|rebounds)$/))))continue;
    out.push({id:String(id),name:athlete.displayName||athlete.fullName||row.displayName||'Jogador',team:team.displayName||team.name||'',teamId:team.id,headshot:athlete.headshot?.href||athlete.headshot||'',starter:!!row.starter,active:row.active!==false,minutes:Number.isFinite(min)?min:0,points:getStat(/^(pts|points)$/)||0,rebounds:getStat(/^(reb|rebounds)$/)||0,assists:getStat(/^(ast|assists)$/)||0,fouls:getStat(/^(pf|fouls)$/)||0});
   }
  }
 }
 return out;
}
function renderLivePicks(rows,clock){
 if(!rows.length){$('livePlayerPicks').innerHTML='<p class="muted">A fonte ESPN não retornou estatísticas individuais ao vivo para esta partida.</p>';return;}
 $('livePlayerPicks').innerHTML=`<div class="match-context"><b>${safe(clock.label)} · RELÓGIO ${safe(clock.display)}</b><p>Tempo estimado restante: ${clock.remaining.toFixed(1)} min de jogo</p><span>Projeções recalculadas com o ritmo estatístico observado até agora.</span></div><div class="live-picks">${rows.sort((a,b)=>(b.minutes-a.minutes)).map(r=>{const defaultMins=Math.max(r.minutes,Math.min(38,r.starter?33:22));return `<article class="live-pick" data-live-pick="${safe(r.id)}" data-points="${r.points}" data-rebounds="${r.rebounds}" data-assists="${r.assists}" data-minutes="${r.minutes}"><span class="live-tag">${r.starter?'Titular':'Rotação'} · ${safe(r.team)}</span><h4>${safe(r.name)}</h4><div class="live-values"><div><b>${r.points}</b><small>PTS agora</small></div><div><b>${r.rebounds}</b><small>REB agora</small></div><div><b>${r.assists}</b><small>AST agora</small></div></div><label>Minutos totais esperados<input class="liveExpectedMinutes" type="number" min="${Math.max(1,r.minutes).toFixed(1)}" max="48" step="0.5" value="${defaultMins.toFixed(1)}"></label><button class="primary liveRecalc">Projetar até o fim</button><div class="liveForecast"><p class="muted">Minutos em quadra: ${r.minutes.toFixed(1)} · faltas: ${r.fouls}</p></div></article>`}).join('')}</div><p class="footnote">Minutos esperados são uma estimativa inicial (titular/rotação) e podem ser ajustados em cada card. A extrapolação por minuto pode oscilar bastante, especialmente no primeiro quarto; faltas, lesões, substituições e blowout podem mudar o ritmo.</p>`;
}
async function loadLivePicks(){
 const id=$('liveGameSelect')?.value;if(!id){$('livePlayerPicks').innerHTML='<p class="muted">Nenhuma partida ao vivo selecionada.</p>';return;}
 $('livePlayerPicks').innerHTML='<p>Atualizando box score ao vivo...</p>';
 try{const summary=await get(`${API}/summary?event=${id}`);const clock=liveClock(summary);const rows=extractLiveRows(summary);window.ciLiveClock=clock;renderLivePicks(rows,clock);}
 catch(e){$('livePlayerPicks').innerHTML=`<p class="error">Não foi possível consultar o box score ao vivo: ${safe(e.message)}</p>`;}
}
document.addEventListener('click',e=>{
 const b=e.target.closest('.liveRecalc');if(!b)return;
 const card=b.closest('.live-pick');const mins=Number(card.querySelector('.liveExpectedMinutes').value);const current=Number(card.dataset.minutes);
 if(!Number.isFinite(mins)||mins<current||mins>48){card.querySelector('.liveForecast').innerHTML='<p class="error">Minutos totais devem ser maiores ou iguais aos minutos já jogados e no máximo 48.</p>';return;}
 const remaining=Math.max(0,mins-current);const rate=k=>current>0?Number(card.dataset[k])/current:0;
 const estimate=k=>Number(card.dataset[k])+rate(k)*remaining;
 const clock=window.ciLiveClock||{remaining:0,label:'Ao vivo'};
 card.querySelector('.liveForecast').innerHTML=`<div class="metricgrid"><div class="metric"><b>${estimate('points').toFixed(1)}</b><small>PTS finais estimados</small></div><div class="metric"><b>${estimate('rebounds').toFixed(1)}</b><small>REB finais estimados</small></div><div class="metric"><b>${estimate('assists').toFixed(1)}</b><small>AST finais estimados</small></div></div><p class="footnote">Palpite situacional: produção atual por minuto × ${remaining.toFixed(1)} minutos adicionais. ${safe(clock.label)}. A estimativa pode contrariar a média pré-jogo porque parte do que está acontecendo nesta partida.</p>`;
});
