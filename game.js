(() => {
'use strict';
const canvas=document.getElementById('game');
if(!canvas){throw new Error('Canvas do labirinto #game não encontrado no HTML.');}
const ctx=canvas.getContext('2d');
if(!ctx){throw new Error('Não foi possível criar o contexto 2D do labirinto.');}
const N=31,T=30, map=Array.from({length:N},()=>Array(N).fill(1));
const player={x:15.5,y:29.5,r:.23,speed:3.5};
let levers=[],iceCoins=[],freezeFlakes=[],mysteryBoxes=[],spiders=[],vortexStarted=0,jarCollected=false,vortexSoundTimer=0,frozenUntil=0,phaseRemaining=180,speedBoostUntil=0,speedBoots=[],specialPowers=[],magnetUntil=0,doublePointsUntil=0,shieldCharges=0,revealUntil=0,stunUntil=0;
const portal={x:15.5,y:15.5};let phase=1,activated=[false,false,false,false],keys={},elapsed=0,lastTime=0,won=false,startedAt=performance.now(),toastTimer=0,gameStarted=false,lastSavedSecond=-1,lives=3,coins=0,spawnBeamUntil=0;
const SAVE_KEY='luanVersoEspelhoRoxoSaveV1';
const titleScreen=document.getElementById('titleScreen'),continueButton=document.getElementById('continueAdventure');
let soundEnabled=true,audioCtx=null;
const heroPortrait=new Image();heroPortrait.src='assets/luan_retrato.png';

let suspenseNodes=[],musicOscillators=[],musicMaster=null,musicBoosted=false;
let playerName='',totalScore=0,totalItems=0,runStartedAt=0,phaseItems=0,phaseSeconds=0,unlockedAchievements=[],lastPowerName='',lastPowerAt=0,secretPortalWarp=false;
const PLAYER_KEY='luanVersoPlayerNameV1',RANK_KEY='luanVersoRankingV1';
const musicTracks={
 menu:new Audio('assets/audio/menu.mp3'),
 phase13:new Audio('assets/audio/fase_1_3.mp3'),
 phase46:new Audio('assets/audio/fase_4_6.mp3'),
 phase79:new Audio('assets/audio/fase_7_9.mp3'),
 phase1012:new Audio('assets/audio/fase_10_12.mp3'),
 phase1315:new Audio('assets/audio/fase_13_15.mp3'),
 phase1618:new Audio('assets/audio/fase_16_18.mp3'),
 phase1920:new Audio('assets/audio/fase_19_20.mp3'),
 gameover:new Audio('assets/audio/game_over.mp3')
};
let currentMusic=null;
Object.values(musicTracks).forEach(a=>{a.preload='auto';a.loop=true;a.volume=.38;});
musicTracks.menu.volume=.42;
musicTracks.gameover.loop=false;musicTracks.gameover.volume=.75;
function stopTrack(){
 if(currentMusic){try{currentMusic.pause();currentMusic.currentTime=0;currentMusic.playbackRate=1;}catch(e){}}
 currentMusic=null;
}
function playTrack(track,loop=true){
 if(!soundEnabled||!track)return;
 if(currentMusic===track&&!track.paused)return;
 stopTrack();track.loop=loop;track.currentTime=0;track.playbackRate=1;currentMusic=track;
 const p=track.play();if(p&&p.catch)p.catch(()=>{});
}
function phaseTrack(){
 if(phase<=3)return musicTracks.phase13;
 if(phase<=6)return musicTracks.phase46;
 if(phase<=9)return musicTracks.phase79;
 if(phase<=12)return musicTracks.phase1012;
 if(phase<=15)return musicTracks.phase1315;
 if(phase<=18)return musicTracks.phase1618;
 return musicTracks.phase1920;
}
function stopSuspenseMusic(){stopTrack();for(const n of suspenseNodes){try{n.stop?.();n.disconnect?.()}catch(e){}}suspenseNodes=[];musicOscillators=[];musicMaster=null;musicBoosted=false;}
function setMusicBoost(active){
 musicBoosted=active;
 if(currentMusic&&currentMusic!==musicTracks.menu&&currentMusic!==musicTracks.gameover){
  currentMusic.playbackRate=active?1.22:1;
  currentMusic.volume=active?.48:.38;
 }
}
function startSuspenseMusic(){if(!soundEnabled||!gameStarted)return;playTrack(phaseTrack(),true);setMusicBoost(speedBoostUntil>performance.now());}
function startMenuMusic(){if(!gameStarted&&soundEnabled)playTrack(musicTracks.menu,true);}
// Inicia a trilha do menu na primeira interação do usuário, respeitando o bloqueio de autoplay do navegador.
let menuMusicGestureBound=false;function bindMenuMusicGesture(){if(menuMusicGestureBound)return;menuMusicGestureBound=true;const beginMenuMusic=()=>{if(!gameStarted&&soundEnabled)startMenuMusic();};document.addEventListener('pointerdown',beginMenuMusic,{passive:true});document.addEventListener('keydown',beginMenuMusic);document.addEventListener('touchstart',beginMenuMusic,{passive:true});}
bindMenuMusicGesture();
function playGameOverMusic(){stopSuspenseMusic();if(soundEnabled){musicTracks.gameover.currentTime=0;playTrack(musicTracks.gameover,false);}}
function playSound(kind='tap'){if(!soundEnabled)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime;
 if(kind==='suction'){
  // Ruído filtrado + tom descendente e modulação: vento de vórtice mais natural que um bip.
  const dur=2.0,buffer=audioCtx.createBuffer(1,Math.floor(audioCtx.sampleRate*dur),audioCtx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(.65+Math.random()*.35);
  const noise=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),ng=audioCtx.createGain(),osc=audioCtx.createOscillator(),og=audioCtx.createGain(),lfo=audioCtx.createOscillator(),lfoGain=audioCtx.createGain(),mix=audioCtx.createGain();
  noise.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(950,now);filter.frequency.exponentialRampToValueAtTime(180,now+dur);filter.Q.value=5;
  ng.gain.setValueAtTime(.0001,now);ng.gain.linearRampToValueAtTime(.10,now+.35);ng.gain.exponentialRampToValueAtTime(.0001,now+dur);
  osc.type='sine';osc.frequency.setValueAtTime(115,now);osc.frequency.exponentialRampToValueAtTime(42,now+dur);og.gain.setValueAtTime(.0001,now);og.gain.linearRampToValueAtTime(.09,now+.25);og.gain.exponentialRampToValueAtTime(.0001,now+dur);
  lfo.type='sine';lfo.frequency.value=6.5;lfoGain.gain.value=230;lfo.connect(lfoGain);lfoGain.connect(filter.frequency);
  noise.connect(filter);filter.connect(ng);ng.connect(mix);osc.connect(og);og.connect(mix);mix.gain.value=.8;mix.connect(audioCtx.destination);noise.start(now);osc.start(now);lfo.start(now);noise.stop(now+dur);osc.stop(now+dur);lfo.stop(now+dur);return;
 }
 const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();const tones={tap:[420,.07,'sine'],start:[520,.16,'triangle'],lever:[660,.22,'triangle'],portal:[180,.45,'sine'],win:[740,.55,'sine'],back:[360,.12,'sine'],coin:[920,.08,'sine'],life:[1040,.38,'triangle'],hurt:[130,.3,'sawtooth'],freeze:[880,.7,'sine']};const [freq,dur,wave]=tones[kind]||tones.tap;osc.type=wave;osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(Math.max(70,freq*.62),now+dur);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(kind==='win'?.14:.07,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+dur);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+dur+.02)}catch(e){}}

function returnToMenu(){saveGame();gameStarted=false;keys={};stopSuspenseMusic();titleScreen.classList.remove('hidden');refreshContinueButton();playSound('back');startMenuMusic()}

function hasSave(){try{return !!localStorage.getItem(SAVE_KEY)}catch(e){return false}}
function refreshContinueButton(){if(continueButton)continueButton.disabled=!hasSave()}
const menuNotice=document.getElementById('menuNotice');
const menuExit=document.getElementById('menuExit');
// Passwords de checkpoint: cada código libera a fase seguinte após um bloco de três.
const PASSWORD_KEY='luanVersoCheckpointPasswordsV2';
const checkpointPhases=[3,6,9,12,15,18];
function makeRandomPassword(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ';let out='';for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out;}
function loadCheckpointPasswords(){let saved={};try{saved=JSON.parse(localStorage.getItem(PASSWORD_KEY)||'{}')||{};}catch(e){};const result={};const used=new Set();for(const p of checkpointPhases){let code=String(saved[p]||'').toUpperCase();if(!/^[A-Z]{6}$/.test(code)||used.has(code)){do{code=makeRandomPassword()}while(used.has(code));}result[p]=code;used.add(code);}try{localStorage.setItem(PASSWORD_KEY,JSON.stringify(result));}catch(e){}return result;}
let checkpointPasswords=loadCheckpointPasswords();
function buildPhasePasswords(){const out={};for(const [p,code] of Object.entries(checkpointPasswords))out[code]=Number(p)+1;return out;}
let phasePasswords=buildPhasePasswords();
const phasePasswordInput=document.getElementById('phasePassword');
const unlockPhaseButton=document.getElementById('unlockPhase');
function unlockPhaseByPassword(){
 checkpointPasswords=loadCheckpointPasswords();phasePasswords=buildPhasePasswords();
 const code=(phasePasswordInput?.value||'').trim().toUpperCase().replace(/\s+/g,'');
 const target=phasePasswords[code];
 if(!target){if(menuNotice){menuNotice.textContent='Password inválido. Conclua um bloco de 3 fases para receber o código.';menuNotice.classList.add('visible');}playSound('hurt');return;}
 playSound('start');phase=target;elapsed=0;lives=3;coins=0;generatePhase();gameStarted=true;won=false;titleScreen.classList.add('hidden');if(menuNotice){menuNotice.classList.remove('visible');menuNotice.textContent='';}startSuspenseMusic();startedAt=performance.now();showToast('PASSWORD ACEITO — FASE '+phase+' DE 20');saveGame();phasePasswordInput.value='';
}
if(unlockPhaseButton)unlockPhaseButton.addEventListener('click',unlockPhaseByPassword);
if(phasePasswordInput)phasePasswordInput.addEventListener('keydown',e=>{if(e.key==='Enter')unlockPhaseByPassword();});
if(menuExit)menuExit.addEventListener('click',()=>{if(menuNotice){menuNotice.textContent='Para sair, feche esta aba do navegador.';menuNotice.classList.add('visible');}playSound('back');});

function saveGame(){if(!gameStarted||won)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({phase,map,levers,iceCoins,player:{x:player.x,y:player.y},activated,elapsed,lives,coins,totalScore,totalItems,playerName,runStartedAt,phaseItems,phaseSeconds,unlockedAchievements,speedBoostUntil,magnetUntil,doublePointsUntil,shieldCharges,revealUntil,stunUntil,frozenUntil,won:false}))}catch(e){}}
function startFreshCore(){const nameInput=document.getElementById('playerNameInput');if(!playerName){const entered=(nameInput?.value||'').trim();if(!entered){const box=document.getElementById('playerNamePrompt');box?.classList.remove('hidden');nameInput?.focus();return;}playerName=entered.slice(0,24);try{localStorage.setItem(PLAYER_KEY,playerName)}catch(e){}document.getElementById('playerNamePrompt')?.classList.add('hidden');}playSound('start');phase=1;elapsed=0;lives=3;coins=0;totalScore=0;totalItems=0;phaseItems=0;phaseSeconds=0;unlockedAchievements=[];runStartedAt=performance.now();speedBoostUntil=0;magnetUntil=0;doublePointsUntil=0;shieldCharges=0;revealUntil=0;stunUntil=0;frozenUntil=0;generatePhase();gameStarted=true;titleScreen.classList.add('hidden');startSuspenseMusic();startedAt=performance.now();showToast('Boa sorte, '+playerName+'! FASE 1 — Ative as quatro alavancas e alcance o Portal.');saveGame()}
function startFresh(){
 const nameInput=document.getElementById('playerNameInput');
 if(!playerName){const entered=(nameInput?.value||'').trim();if(!entered){const box=document.getElementById('playerNamePrompt');box?.classList.remove('hidden');nameInput?.focus();return;}playerName=entered.slice(0,24);try{localStorage.setItem(PLAYER_KEY,playerName)}catch(e){}document.getElementById('playerNamePrompt')?.classList.add('hidden');}
 const intro=document.getElementById('comicIntro');if(intro){intro.classList.remove('hidden');playSound('start');}else startFreshCore();
}
function finishComicIntro(){const intro=document.getElementById('comicIntro');if(intro)intro.classList.add('hidden');startFreshCore();}
function continueGame(){playSound('start');let data;try{data=JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch(e){}if(!data||!Array.isArray(data.map)){refreshContinueButton();showToast('Não há aventura salva para continuar.');return}phase=Math.min(20,Math.max(1,Number(data.phase)||1));playerName=data.playerName||playerName||'Jogador';totalScore=Number(data.totalScore)||0;totalItems=Number(data.totalItems)||0;runStartedAt=Number(data.runStartedAt)||performance.now();phaseItems=Number(data.phaseItems)||0;phaseSeconds=Number(data.phaseSeconds)||0;unlockedAchievements=Array.isArray(data.unlockedAchievements)?data.unlockedAchievements:[];speedBoostUntil=Number(data.speedBoostUntil)||0;magnetUntil=Number(data.magnetUntil)||0;doublePointsUntil=Number(data.doublePointsUntil)||0;shieldCharges=Math.max(0,Number(data.shieldCharges)||0);revealUntil=Number(data.revealUntil)||0;stunUntil=Number(data.stunUntil)||0;frozenUntil=Number(data.frozenUntil)||0;for(let y=0;y<N;y++)for(let x=0;x<N;x++)map[y][x]=Number(data.map[y]?.[x]||0);levers=Array.isArray(data.levers)&&data.levers.length===4?data.levers:[];iceCoins=Array.isArray(data.iceCoins)?data.iceCoins:[];lives=Math.max(1,Number(data.lives)||3);coins=Math.max(0,Number(data.coins)||0);if(levers.length!==4)placeRandomLevers();player.x=Number(data.player?.x??15.5);player.y=Number(data.player?.y??29.5);activated=Array.isArray(data.activated)?data.activated.slice(0,4).map(Boolean):[false,false,false,false];while(activated.length<4)activated.push(false);elapsed=Number(data.elapsed)||0;won=false;gameStarted=true;startedAt=performance.now()-elapsed*1000;titleScreen.classList.add('hidden');startSuspenseMusic();updateUI();showToast('Fase '+phase+' de 20 retomada!')}

function carveMaze(){
  // Fase 1: labirinto-base fixo para que a primeira aventura tenha sempre o mesmo desenho.
  // As fases seguintes continuam a variar.
  let seed = phase===1 ? 20261020 : (20261020 + phase*7919 + Math.floor(Math.random()*100000));
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)map[y][x]=1;
  for(let y=1;y<N-1;y+=2)for(let x=1;x<N-1;x+=2)map[y][x]=0;
  let stack=[[15,29]],seen=new Set(['15,29']);map[29][15]=0;
  // DFS com semente fixa na Fase 1: corredores consistentes e navegáveis.
  while(stack.length){
    const [x,y]=stack[stack.length-1],opts=[];
    for(const [dx,dy] of [[0,-2],[2,0],[0,2],[-2,0]]){
      const nx=x+dx,ny=y+dy,k=nx+','+ny;
      if(nx>0&&nx<N-1&&ny>0&&ny<N-1&&!seen.has(k))opts.push([nx,ny,dx,dy]);
    }
    if(!opts.length){stack.pop();continue}
    const [nx,ny,dx,dy]=opts[Math.floor(rand()*opts.length)];
    map[y+dy/2][x+dx/2]=0;map[ny][nx]=0;seen.add(nx+','+ny);stack.push([nx,ny]);
  }
  // Praça central do espelho e entrada sul.
  for(const [cx,cy] of [[15,15],[15,29],[5,5],[25,5],[5,25],[25,25]])
    for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)
      if(x>0&&x<N-1&&y>0&&y<N-1)map[y][x]=0;
  for(let y=28;y<N-1;y++)map[y][15]=0;
  for(let y=14;y<=16;y++)for(let x=14;x<=16;x++)map[y][x]=0;
  // Aberturas adicionais controladas; na Fase 1 são sempre iguais.
  for(let i=0;i<phase+5;i++){
    const x=1+Math.floor(rand()*(N-2)),y=1+Math.floor(rand()*(N-2));
    if(map[y][x]===1&&((x%2===0)||(y%2===0)))map[y][x]=0;
  }
  // Nas três primeiras fases, criar rotas amplas e diretas entre a entrada,
  // a praça central e as quatro alavancas, para facilitar a aprendizagem.
  if(phase<=3){
    const carve=(x,y)=>{if(x>0&&x<N-1&&y>0&&y<N-1)map[y][x]=0;};
    // Corredor principal até ao portal e cruzamento central.
    for(let y=14;y<=29;y++)for(let dx=-1;dx<=1;dx++)carve(15+dx,y);
    for(let x=5;x<=25;x++)for(let dy=-1;dy<=1;dy++)carve(x,15+dy);
    // Rotas simples para cada alavanca, com pequenos corredores de três células.
    for(let x=5;x<=25;x++)for(let dy=-1;dy<=1;dy++){carve(x,5+dy);carve(x,25+dy);}
    for(let y=5;y<=25;y++)for(let dx=-1;dx<=1;dx++){carve(5+dx,y);carve(25+dx,y);}
    // Conectar cada alavanca à rota central com caminhos sem becos estreitos.
    for(let y=5;y<=15;y++)for(let dx=-1;dx<=1;dx++){carve(5+dx,y);carve(25+dx,y);}
    for(let x=5;x<=15;x++)for(let dy=-1;dy<=1;dy++){carve(x,5+dy);carve(x,25+dy);}
    for(let x=15;x<=25;x++)for(let dy=-1;dy<=1;dy++){carve(x,5+dy);carve(x,25+dy);}
  }
}
function placeRandomLevers(){
  // Quatro posições garantidas e bem separadas do portal, com chão livre ao redor.
  const anchors=[[5,5],[25,5],[5,25],[25,25]];
  levers=anchors.map(([cx,cy],i)=>{
    for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)if(x>0&&x<N-1&&y>0&&y<N-1)map[y][x]=0;
    return {x:cx+.5,y:cy+.5,label:'alavanca '+(i+1)};
  });
}
function placeSpeedBoots(){
 speedBoots=[];specialPowers=[];magnetUntil=0;doublePointsUntil=0;shieldCharges=0;revealUntil=0;stunUntil=0;if(phase===1)return;
 // Na fase 2, o pé mágico aparece sempre perto da entrada para tornar a trapaça secreta alcançável.
 if(phase===2){const candidates=[[15,27],[14,28],[16,28],[13,29],[17,29],[15,26],[14,27],[16,27]];for(const [x,y] of candidates){if(map[y]?.[x]===0&&!levers.some(l=>Math.hypot(x+.5-l.x,y+.5-l.y)<1.2)){speedBoots.push({x:x+.5,y:y+.5,taken:false});break;}}}
 if(!speedBoots.length){const spots=[];for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++)if(map[y][x]===0&&Math.hypot(x+.5-portal.x,y+.5-portal.y)>3&&Math.hypot(x+.5-player.x,y+.5-player.y)>3&&!levers.some(l=>Math.hypot(x+.5-l.x,y+.5-l.y)<1.5))spots.push({x:x+.5,y:y+.5});if(spots.length){const i=Math.floor(Math.random()*spots.length);speedBoots.push({...spots[i],taken:false});}}
}
function awardItem(points,label){if(performance.now()<doublePointsUntil)points*=2;totalScore+=points;totalItems++;phaseItems++;showToast(label+' +'+points+' pontos! Total: '+totalScore);checkAchievements();updateUI();saveGame();}
function showAchievement(id,desc){let el=document.getElementById('achievementPopup');if(!el){el=document.createElement('div');el.id='achievementPopup';el.className='achievement-popup';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el);}el.innerHTML='<span class="achievement-medal">🏆</span><div><small>CONQUISTA DESBLOQUEADA</small><strong>'+escapeHtml(id)+'</strong><span>'+escapeHtml(desc)+'</span></div>';el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(window.achievementPopupTimer);window.achievementPopupTimer=setTimeout(()=>el.classList.remove('show'),4200);playSound('win');}
function checkAchievements(){const secs=(performance.now()-runStartedAt)/1000;const candidates=[];if(totalItems>=1)candidates.push(['PRIMEIRO ACHADO','Coletou seu primeiro item']);if(totalItems>=10)candidates.push(['COLETOR','Coletou 10 itens']);if(totalItems>=25)candidates.push(['MÃO DE OURO','Coletou 25 itens']);if(totalItems>=50)candidates.push(['CAÇADOR DE RELÍQUIAS','Coletou 50 itens']);if(totalItems>=100)candidates.push(['LENDÁRIO COLETOR','Coletou 100 itens']);if(totalScore>=500)candidates.push(['TESOURO DO LABIRINTO','Alcançou 500 pontos']);if(totalScore>=1500)candidates.push(['MESTRE DOS PONTOS','Alcançou 1.500 pontos']);if(phase>=3)candidates.push(['SOBREVIVENTE','Concluiu as três primeiras fases']);if(phase>=10)candidates.push(['MEIO CAMINHO','Alcançou a fase 10']);if(phase>=20)candidates.push(['DOMINADOR DO PORTAL','Concluiu as 20 fases']);if(secs<=600&&phase>=5)candidates.push(['VELOZ','Chegou à fase 5 em até 10 minutos']);if(secs<=1800&&phase>=10)candidates.push(['MESTRE DO TEMPO','Chegou à fase 10 em até 30 minutos']);if(secs<=3600&&phase>=20)candidates.push(['CORREDOR DIMENSIONAL','Concluiu as 20 fases em até 60 minutos']);for(const [id,desc] of candidates){if(!unlockedAchievements.includes(id)){unlockedAchievements.push(id);showAchievement(id,desc);saveGame();}}}
function finishRanking(){const seconds=Math.round((performance.now()-runStartedAt)/1000);const entry={name:playerName||'Jogador',score:totalScore,items:totalItems,seconds,achievements:unlockedAchievements.slice(),date:new Date().toISOString()};let ranking=[];try{ranking=JSON.parse(localStorage.getItem(RANK_KEY)||'[]')}catch(e){}ranking.push(entry);ranking.sort((a,b)=>b.score-a.score||a.seconds-b.seconds);ranking=ranking.slice(0,10);try{localStorage.setItem(RANK_KEY,JSON.stringify(ranking))}catch(e){}const box=document.getElementById('finalRanking');if(box){box.classList.remove('hidden');document.getElementById('rankingSummary').textContent=entry.name+' — '+entry.score+' pontos · '+entry.items+' itens · '+Math.floor(seconds/60)+' min '+(seconds%60)+' s';document.getElementById('rankingAchievements').textContent=unlockedAchievements.length?unlockedAchievements.join(' • '):'Nenhuma conquista desbloqueada nesta partida.';document.getElementById('rankingList').innerHTML=ranking.map((r,i)=>'<li><b>#'+(i+1)+' '+escapeHtml(r.name)+'</b><span>'+r.score+' pts · '+r.items+' itens</span></li>').join('');}}
function escapeHtml(value){return String(value).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
function collectSpeedBoots(){for(const b of speedBoots){if(!b.taken&&Math.hypot(player.x-b.x,player.y-b.y)<.62){b.taken=true;awardItem(25,'Pé mágico');speedBoostUntil=performance.now()+10000;setMusicBoost(true);playSound('coin');showToast('PÉ MÁGICO! Traje dourado e velocidade musical por 10 segundos!');updateUI();if(phase===2&&phaseRemaining>0&&phaseRemaining<=7.25&&!secretPortalWarp){secretPortalWarp=true;activated=[true,true,true,true];vortexStarted=performance.now();vortexSoundTimer=0;playSound('suction');showToast('TRAPAÇA SECRETA ATIVADA! O Portal vai transportar você para a FASE 20!');}}}}
const POWER_TYPES=[
 {id:'time',name:'Relógio do Tempo',symbol:'◷',color:'#70eaff',desc:'+30 segundos no cronômetro'},
 {id:'magnet',name:'Ímã Arcano',symbol:'✥',color:'#ff6b9d',desc:'Atrai cristais por 12 segundos'},
 {id:'double',name:'Dobrador de Pontos',symbol:'×2',color:'#ffe36b',desc:'Pontos em dobro por 15 segundos'},
 {id:'shield',name:'Escudo Guardião',symbol:'◆',color:'#79ffb2',desc:'Protege contra uma colisão com monstro'},
 {id:'reveal',name:'Visão Mística',symbol:'◎',color:'#c8a0ff',desc:'Revela as alavancas por 12 segundos'},
 {id:'stun',name:'Pulso Elétrico',symbol:'ϟ',color:'#ffb45c',desc:'Paralisa os monstros por 8 segundos'},
 {id:'life',name:'Coração Extra',symbol:'♥',color:'#ff6685',desc:'Recupera uma vida, até o limite de 5'}
];
function placeSpecialPowers(){specialPowers=[];if(phase===1)return;const spots=[];for(let y=2;y<N-2;y++)for(let x=2;x<N-2;x++){const px=x+.5,py=y+.5;if(map[y][x]===0&&Math.hypot(px-portal.x,py-portal.y)>3&&Math.hypot(px-player.x,py-player.y)>3&&!levers.some(l=>Math.hypot(px-l.x,py-l.y)<1.8)&&!mysteryBoxes.some(b=>Math.hypot(px-b.x,py-b.y)<1.6))spots.push({x:px,y:py});}const count=Math.min(3,1+Math.floor(phase/6));for(let i=0;i<count&&spots.length;i++){const si=Math.floor(Math.random()*spots.length),pos=spots.splice(si,1)[0];const power=POWER_TYPES[Math.floor(Math.random()*POWER_TYPES.length)];specialPowers.push({...pos,...power,taken:false});}}
function collectSpecialPowers(){for(const p of specialPowers){if(p.taken||Math.hypot(player.x-p.x,player.y-p.y)>.58)continue;p.taken=true;awardItem(30,p.name);const now=performance.now();switch(p.id){case'time':phaseRemaining=Math.min(240,phaseRemaining+30);lastPowerName='Relógio do Tempo: +30s';lastPowerAt=now;showToast('RELÓGIO DO TEMPO! +30 segundos');break;case'magnet':magnetUntil=now+12000;showToast('ÍMÃ ARCANO! Cristais atraídos por 12 segundos');break;case'double':doublePointsUntil=now+15000;showToast('DOBRADOR DE PONTOS! Pontos em dobro por 15 segundos');break;case'shield':shieldCharges=Math.min(2,shieldCharges+1);showToast('ESCUDO GUARDIÃO! Proteção contra um monstro');break;case'reveal':revealUntil=now+12000;showToast('VISÃO MÍSTICA! Alavancas reveladas por 12 segundos');break;case'stun':stunUntil=now+8000;showToast('PULSO ELÉTRICO! Monstros paralisados por 8 segundos');break;case'life':lives=Math.min(5,lives+1);lastPowerName='Coração Extra';lastPowerAt=now;showToast('CORAÇÃO EXTRA! Vida recuperada');updateUI();break;}playSound('coin');saveGame();}}
function drawSpecialPower(p,t){if(p.taken)return;const x=p.x*T,y=p.y*T;glow(x,y,30,p.color+'ALPHA',.85);ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2.5+p.x)*.09);ctx.fillStyle='rgba(15,10,30,.9)';ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.shadowColor=p.color;ctx.shadowBlur=13;ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=p.color;ctx.font='bold 15px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.symbol,0,1);ctx.restore();}
function placeIceCoins(){const spots=[];for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++)if(map[y][x]===0&&Math.hypot(x+.5-portal.x,y+.5-portal.y)>2.2&&Math.hypot(x+.5-15.5,y+.5-29.5)>1.8)spots.push({x:x+.5,y:y+.5});iceCoins=[];const count=Math.min(45,22+phase);while(iceCoins.length<count&&spots.length){const i=Math.floor(Math.random()*spots.length);iceCoins.push({...spots.splice(i,1)[0],taken:false});}}
function collectIceCoins(){for(const c of iceCoins){if(!c.taken&&Math.hypot(player.x-c.x,player.y-c.y)<(performance.now()<magnetUntil?3.2:.52)){c.taken=true;coins++;awardItem(10,'Cristal de gelo');const iceHud=document.getElementById('iceCountHud');if(iceHud)iceHud.textContent=iceCoins.filter(q=>q.taken).length;playSound('coin');showToast('Gelo coletado! '+iceCoins.filter(q=>q.taken).length+' gelos encontrados.');if(coins>0&&coins%100===0){lives++;playSound('life');showToast('100 blocos coletados! Você ganhou uma vida extra.');}updateUI();saveGame();}}}
function placeFreezeFlakes(){freezeFlakes=[];if(phase===1)return;const spots=[];for(let y=2;y<N-2;y++)for(let x=2;x<N-2;x++){const px=x+.5,py=y+.5;if(map[y][x]===0&&Math.hypot(px-portal.x,py-portal.y)>3&&Math.hypot(px-player.x,py-player.y)>3&&!levers.some(l=>Math.hypot(px-l.x,py-l.y)<1.8)&&!mysteryBoxes.some(b=>Math.hypot(px-b.x,py-b.y)<1.8))spots.push({x:px,y:py});}while(freezeFlakes.length<2&&spots.length){const i=Math.floor(Math.random()*spots.length);freezeFlakes.push({...spots.splice(i,1)[0],taken:false});}}
function collectFreezeFlakes(){for(const f of freezeFlakes){if(!f.taken&&Math.hypot(player.x-f.x,player.y-f.y)<.55){f.taken=true;awardItem(15,'Floco congelante');frozenUntil=performance.now()+20000;playSound('freeze');showToast('FLOCO DE GELO! Labirinto e aranhas congelados por 20 segundos. Você continua livre!');}}}
function drawFreezeFlake(f,t){if(f.taken)return;const x=f.x*T,y=f.y*T;ctx.save();glow(x,y,34,'#6eeeffALPHA',.95);ctx.translate(x,y);ctx.rotate(t*.7);ctx.strokeStyle='#d9fbff';ctx.lineWidth=3;ctx.lineCap='round';ctx.shadowColor='#55dfff';ctx.shadowBlur=16;for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(0,13);ctx.moveTo(0,-8);ctx.lineTo(-4,-4);ctx.moveTo(0,-8);ctx.lineTo(4,-4);ctx.moveTo(0,8);ctx.lineTo(-4,4);ctx.moveTo(0,8);ctx.lineTo(4,4);ctx.stroke();ctx.restore()}ctx.restore();}
function frozenNow(){return performance.now()<frozenUntil;}
function loseLife(){if(shieldCharges>0){shieldCharges--;playSound('freeze');showToast('ESCUDO GUARDIÃO bloqueou o golpe!');return;}lives--;playSound('hurt');if(lives<=0){lives=0;gameStarted=false;playGameOverMusic();showToast('Você perdeu todas as vidas. Reinicie a aventura.');document.getElementById('winTitle').textContent='FIM DE JOGO';document.getElementById('winMessage').textContent='Suas vidas acabaram. Reinicie a aventura para tentar novamente.';document.getElementById('restartWin').textContent='Tentar novamente';document.getElementById('winOverlay').classList.remove('hidden');}else{player.x=15.5;player.y=29.5;spawnBeamUntil=performance.now()+2600;showToast('Você perdeu uma vida! Vidas restantes: '+lives);}updateUI();saveGame();}
function generatePhase(){stopSuspenseMusic();carveMaze();placeRandomLevers();placeIceCoins();placeMysteryBoxes();player.x=(phase===1?portal.x:15.5);player.y=(phase===1?portal.y:29.5);spawnBeamUntil=performance.now()+4200;activated=[false,false,false,false];won=false;vortexStarted=0;jarCollected=false;vortexSoundTimer=0;frozenUntil=0;phaseRemaining=180;/* Poderes ativos e cargas não usadas atravessam para a próxima fase. */placeFreezeFlakes();placeSpeedBoots();placeSpecialPowers();if(gameStarted)startSuspenseMusic();document.getElementById('winOverlay').classList.add('hidden');updateUI();}
function monsterKindForPhase(){if(phase<=3)return 'spider';const set=Math.floor((phase-1)/3)%5;return ['spider','skeleton','slime','wisp','shadow'][set];}
function placeMysteryBoxes(){
 // Apenas um baú surpresa por fase, em uma célula navegável aleatória.
 const candidates=[];
 for(let y=2;y<N-2;y++)for(let x=2;x<N-2;x++){
  const px=x+.5,py=y+.5;
  if(map[y][x]!==0)continue;
  if(Math.hypot(px-portal.x,py-portal.y)<4||Math.hypot(px-15.5,py-29.5)<4)continue;
  if(levers.some(l=>Math.hypot(px-l.x,py-l.y)<2.2))continue;
  candidates.push({x,y});
 }
 if(!candidates.length){mysteryBoxes=[];spiders=[];return;}
 const pos=candidates[Math.floor(Math.random()*candidates.length)];
 for(let yy=pos.y-1;yy<=pos.y+1;yy++)for(let xx=pos.x-1;xx<=pos.x+1;xx++)if(xx>0&&xx<N-1&&yy>0&&yy<N-1)map[yy][xx]=0;
 mysteryBoxes=[{x:pos.x+.5,y:pos.y+.5,kind:'surprise',opened:false,resolved:false,openAt:0,content:null}];
 spiders=[];
}
function resolveSurpriseChest(box){
 if(!box||box.resolved)return;
 box.opened=true;box.resolved=true;box.openAt=performance.now();
 const roll=Math.random();
 if(roll<.34){
  const kind=monsterKindForPhase();
  box.content='monster';
  spiders.push({x:box.x,y:box.y,homeX:box.x,homeY:box.y,kind,active:true,delay:0,angle:0,sucked:false});
  playSound('hurt');showToast('⚠️ EMBOSCADA! Um monstro saiu do baú!');
 }else if(roll<.58){
  box.content='life';const before=lives;lives=Math.min(5,lives+1);
  if(lives>before){playSound('life');showToast('♥ VIDA EXTRA! Você encontrou um coração no baú!');}
  else{coins+=50;awardItem(20,'Tesouro do baú');playSound('coin');showToast('♥ Suas vidas estão cheias! Baú convertido em +50 moedas.');}
  updateUI();saveGame();
 }else{
  const power=POWER_TYPES[Math.floor(Math.random()*POWER_TYPES.length)];box.content='power';
  awardItem(30,power.name);const now=performance.now();
  switch(power.id){
   case'time':phaseRemaining=Math.min(240,phaseRemaining+30);break;
   case'magnet':magnetUntil=now+12000;break;
   case'double':doublePointsUntil=now+15000;break;
   case'shield':shieldCharges=Math.min(2,shieldCharges+1);break;
   case'reveal':revealUntil=now+12000;break;
   case'stun':stunUntil=now+8000;break;
   case'life':lives=Math.min(5,lives+1);break;
  }
  lastPowerName=power.name;lastPowerAt=now;playSound('coin');showToast('✨ PODER SURPRESA: '+power.name+' — '+power.desc+'!');updateUI();saveGame();
 }
}

generatePhase();
function wallAt(x,y){const tx=Math.floor(x),ty=Math.floor(y);return tx<0||ty<0||tx>=N||ty>=N||map[ty][tx]===1}
function showToast(msg){const el=document.getElementById('toast');el.textContent=msg;el.style.opacity='1';clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.opacity='.65',2600)}
function updatePowerStatus(){const now=performance.now(),items=[];const state=(active,label)=>items.push('<span class="power-pill '+(active?'power-active':'power-inactive')+'">'+label+'</span>');state(speedBoostUntil>now,'👟 Pé mágico — '+(speedBoostUntil>now?'ATIVO '+Math.ceil((speedBoostUntil-now)/1000)+'s':'não ativo'));state(magnetUntil>now,'🧲 Ímã Arcano — '+(magnetUntil>now?'ATIVO '+Math.ceil((magnetUntil-now)/1000)+'s':'não ativo'));state(doublePointsUntil>now,'★ Dobrador de Pontos — '+(doublePointsUntil>now?'ATIVO '+Math.ceil((doublePointsUntil-now)/1000)+'s':'não ativo'));state(shieldCharges>0,'🛡️ Escudo Guardião — '+(shieldCharges>0?shieldCharges+' carga(s)':'sem carga'));state(revealUntil>now,'👁️ Visão Mística — '+(revealUntil>now?'ATIVA '+Math.ceil((revealUntil-now)/1000)+'s':'não ativa'));state(stunUntil>now,'⚡ Pulso Elétrico — '+(stunUntil>now?'ATIVO '+Math.ceil((stunUntil-now)/1000)+'s':'não ativo'));state(frozenUntil>now,'❄️ Floco congelante — '+(frozenUntil>now?'ATIVO '+Math.ceil((frozenUntil-now)/1000)+'s':'não ativo'));state(lastPowerName&&now-lastPowerAt<4500,'✨ Último coletado — '+(lastPowerName&&now-lastPowerAt<4500?escapeHtml(lastPowerName):'nenhum recentemente'));const node=document.getElementById('powerStatusList');if(node)node.innerHTML=items.join('');} 
function updateUI(){const outsideLives=document.getElementById('outsideLives');if(outsideLives)outsideLives.textContent=('♥ '.repeat(Math.max(0,lives))).trim()||'♡';const outsideScore=document.getElementById('outsideScore');if(outsideScore)outsideScore.textContent=String(totalScore); const iceHud=document.getElementById('iceCountHud');if(iceHud)iceHud.textContent=iceCoins.filter(q=>q.taken).length;const phaseNode=document.getElementById('phaseNumber');if(phaseNode)phaseNode.textContent=phase;const hearts=document.getElementById('hudHearts');if(hearts)hearts.textContent=('♥ '.repeat(Math.max(0,lives))).trim()||'♡';const count=activated.filter(Boolean).length;document.getElementById('progressLabel').textContent=count+' / 4';document.getElementById('leverCount').textContent=count+'/4';document.getElementById('lifeCount').textContent='♥ '.repeat(lives).trim()||'0';document.getElementById('coinCount').textContent=coins;document.getElementById('progressFill').style.width=(count*25)+'%';activated.forEach((v,i)=>{document.getElementById('obj'+i).classList.toggle('done',v);document.getElementById('icon'+i).classList.toggle('active',v)});document.getElementById('obj4').classList.toggle('done',won);updatePowerStatus();document.getElementById('statusText').textContent=won?'Fase concluída!':count===4?'FASE '+phase+'/20 · O portal foi desbloqueado!':'FASE '+phase+'/20 · Encontre as quatro alavancas'}
function interact(){if(won)return;let nearest=-1,dist=1.45;levers.forEach((l,i)=>{const d=Math.hypot(player.x-l.x,player.y-l.y);if(d<dist){nearest=i;dist=d}});if(nearest>=0){if(!activated[nearest]){playSound('lever');activated[nearest]=true;showToast('Alavanca '+(nearest+1)+' ativada! O selo enfraqueceu.');updateUI();saveGame()}else showToast('Esta alavanca já está ativada.');return}const pd=Math.hypot(player.x-portal.x,player.y-portal.y);if(pd<2.1){if(activated.every(Boolean)){playSound('win');won=true;document.getElementById('winTitle').textContent=phase===20?'CAPÍTULO CONCLUÍDO!':'FASE '+phase+' CONCLUÍDA!';document.getElementById('winMessage').textContent=phase===20?'Você venceu as 20 fases de O Labirinto!':(checkpointPasswords[phase]?'Você concluiu um checkpoint! Anote o password abaixo antes de continuar.':'As quatro alavancas romperam o selo. O feixe roxo vai sugar você para a próxima fase.');const checkpointBox=document.getElementById('checkpointPassword');if(checkpointBox){if(checkpointPasswords[phase]){checkpointBox.classList.remove('hidden');document.getElementById('checkpointCode').textContent=checkpointPasswords[phase];const passLabel=checkpointBox.querySelector('small');if(passLabel)passLabel.textContent=phase===3?'FASE 3 CONCLUÍDA — ANOTE SEU PASSWORD':'CHECKPOINT CONCLUÍDO — ANOTE SEU PASSWORD';}else{checkpointBox.classList.add('hidden');}}document.getElementById('restartWin').textContent=phase===20?'Voltar ao menu':'Entrar no portal → Próxima fase';document.getElementById('winOverlay').classList.remove('hidden');showToast('O Portal reconheceu você.');updateUI()}else{playSound('portal');showToast('O Portal está selado. Ative as quatro alavancas primeiro.')}return}showToast('Chegue perto de uma alavanca ou do Portal e pressione E.');}
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(!gameStarted){if(k==='enter')startFresh();return}if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys[k]=true;if(k==='e'||k==='enter'){playSound('tap');interact();}if(k==='r')reset()});window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);window.addEventListener('blur',()=>keys={});
document.querySelectorAll('[data-move]').forEach(b=>{const k={up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'}[b.dataset.move];const on=e=>{e.preventDefault();playSound('tap');keys[k]=true},off=e=>{e.preventDefault();keys[k]=false};b.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,off))});document.getElementById('mobileInteract').addEventListener('click',()=>{if(gameStarted){playSound('tap');interact()}});document.getElementById('resetBtn').addEventListener('click',()=>{playSound('tap');reset()});document.getElementById('restartWin').addEventListener('click',()=>{playSound('tap');if(lives<=0){document.getElementById('winOverlay').classList.add('hidden');startFresh();return}if(phase>=20){try{localStorage.removeItem(SAVE_KEY)}catch(e){}document.getElementById('winOverlay').classList.add('hidden');document.getElementById('comicEnding')?.classList.remove('hidden');return}else{phase++;elapsed=0;generatePhase();startedAt=performance.now();won=false;document.getElementById('winOverlay').classList.add('hidden');showToast('Fase '+phase+' de 20. Novo labirinto!');saveGame()}});document.getElementById('menuReturnBtn').addEventListener('click',returnToMenu);const returnHome=document.getElementById('returnHome');if(returnHome)returnHome.addEventListener('click',returnToMenu);document.getElementById('soundToggle').addEventListener('click',()=>{soundEnabled=!soundEnabled;document.getElementById('soundToggle').textContent=soundEnabled?'🔊 Som: ligado':'🔇 Som: desligado';if(soundEnabled){playSound('tap');if(gameStarted)startSuspenseMusic();else startMenuMusic()}else stopSuspenseMusic()});try{playerName=localStorage.getItem(PLAYER_KEY)||''}catch(e){}const playerPrompt=document.getElementById('playerNamePrompt');if(playerName&&playerPrompt)playerPrompt.classList.add('hidden');const nameSubmit=document.getElementById('confirmPlayerName');if(nameSubmit)nameSubmit.addEventListener('click',startFresh);const nameInput=document.getElementById('playerNameInput');if(nameInput)nameInput.addEventListener('keydown',e=>{if(e.key==='Enter')startFresh()});document.getElementById('startAdventure').addEventListener('click',startFresh);const comicContinue=document.getElementById('comicIntroContinue');if(comicContinue)comicContinue.addEventListener('click',finishComicIntro);const comicClose=document.getElementById('comicIntroClose');if(comicClose)comicClose.addEventListener('click',finishComicIntro);if(continueButton)continueButton.addEventListener('click',continueGame);const endingContinue=document.getElementById('comicEndingContinue');if(endingContinue)endingContinue.addEventListener('click',()=>{document.getElementById('comicEnding')?.classList.add('hidden');phase=1;elapsed=0;gameStarted=false;titleScreen.classList.remove('hidden');refreshContinueButton();returnToMenu()});
function reset(){elapsed=0;startedAt=performance.now();gameStarted=true;generatePhase();document.getElementById('winOverlay').classList.add('hidden');updateUI();showToast('Fase '+phase+' reiniciada. Encontre as quatro alavancas.');saveGame();}
function move(dt){if(won||vortexStarted)return;let dx=0,dy=0;if(keys.w||keys.arrowup)dy--;if(keys.s||keys.arrowdown)dy++;if(keys.a||keys.arrowleft)dx--;if(keys.d||keys.arrowright)dx++;if(dx&&dy){dx*=.7071;dy*=.7071}const speed=player.speed*(performance.now()<speedBoostUntil?2:1)*dt;const nx=player.x+dx*speed,ny=player.y+dy*speed;const r=player.r;if(!wallAt(nx-r,player.y-r)&&!wallAt(nx+r,player.y-r)&&!wallAt(nx-r,player.y+r)&&!wallAt(nx+r,player.y+r))player.x=nx;if(!wallAt(player.x-r,ny-r)&&!wallAt(player.x+r,ny-r)&&!wallAt(player.x-r,ny+r)&&!wallAt(player.x+r,ny+r))player.y=ny;}
function glow(x,y,r,color,a=1){const g=ctx.createRadialGradient(x,y,1,x,y,r);const m=/^#([0-9a-f]{6})ALPHA$/i.exec(color);if(m){const n=parseInt(m[1],16),rr=(n>>16)&255,gg=(n>>8)&255,bb=n&255;g.addColorStop(0,`rgba(${rr},${gg},${bb},${.38*a})`);g.addColorStop(1,`rgba(${rr},${gg},${bb},0)`)}else{g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)')}ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
function drawFloor(x,y){
 const px=x*T,py=y*T,seed=Math.abs((x*73856093)^(y*19349663));
 const base=(x+y)%2?['#20252e','#29303a','#1b202b'][seed%3]:['#30323a','#252a34','#292c35'][seed%3];
 const g=ctx.createLinearGradient(px,py,px+T,py+T);g.addColorStop(0,base);g.addColorStop(.48,'#20232d');g.addColorStop(1,'#111722');ctx.fillStyle=g;ctx.fillRect(px,py,T,T);
 // Wet, individually cut flagstones with bevels and subtle blue-violet reflections.
 ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(px+1,py+T-4,T-1,4);
 ctx.strokeStyle='rgba(102,115,139,.42)';ctx.lineWidth=1;ctx.strokeRect(px+1.5,py+1.5,T-3,T-3);
 ctx.strokeStyle='rgba(193,205,219,.16)';ctx.beginPath();ctx.moveTo(px+3,py+3);ctx.lineTo(px+T-5,py+3);ctx.lineTo(px+T-3,py+T-5);ctx.stroke();
 if(seed%4===0){ctx.fillStyle='rgba(64,100,57,.48)';ctx.beginPath();ctx.ellipse(px+7+seed%13,py+8+(seed>>3)%12,5,2,.4,0,Math.PI*2);ctx.fill()}
 if(seed%3===0){ctx.fillStyle='rgba(200,213,230,.22)';ctx.fillRect(px+5+(seed%11),py+6+(seed%13),3,1);ctx.fillRect(px+T-7,py+T-9,2,2)}
 if(seed%5===0){ctx.strokeStyle='rgba(5,6,12,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px+T*.25,py+T*.22);ctx.lineTo(px+T*.39,py+T*.38);ctx.lineTo(px+T*.32,py+T*.61);ctx.stroke()}
 if(seed%7===0){ctx.fillStyle='rgba(139,74,190,.12)';ctx.fillRect(px+4,py+T-7,T-8,3)}
}
function drawWall(x,y){
 const px=x*T,py=y*T,seed=Math.abs((x*92821)^(y*68917));
 // Deep shadow and chunky masonry with a raised, cool moonlit cap.
 ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(px+2,py+7,T,T);
 ctx.fillStyle='#11151e';ctx.fillRect(px,py,T,T);
 ctx.beginPath();ctx.moveTo(px+1,py+2);ctx.lineTo(px+T-4,py+1);ctx.lineTo(px+T-1,py+7);ctx.lineTo(px+T-5,py+11);ctx.lineTo(px+4,py+11);ctx.closePath();
 const top=ctx.createLinearGradient(px,py,px,py+12);top.addColorStop(0,seed%3===0?'#a4a6ad':'#7f8794');top.addColorStop(.45,seed%4===0?'#717c8d':'#626d7d');top.addColorStop(1,'#343b4b');ctx.fillStyle=top;ctx.fill();
 // Individual front masonry blocks, alternating seams for a more believable stone wall.
 const face=ctx.createLinearGradient(px+2,py+10,px+T,py+T);face.addColorStop(0,seed%4===0?'#666878':'#4c5361');face.addColorStop(.55,'#343b49');face.addColorStop(1,'#1c2330');ctx.fillStyle=face;ctx.fillRect(px+3,py+10,T-6,T-12);
 ctx.strokeStyle='rgba(12,14,22,.9)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(px+3,py+19);ctx.lineTo(px+T-3,py+19);ctx.moveTo(px+T*.48,py+10);ctx.lineTo(px+T*.48,py+19);ctx.moveTo(px+T*.27,py+20);ctx.lineTo(px+T*.27,py+T-3);ctx.stroke();
 ctx.strokeStyle='rgba(198,207,220,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px+4,py+11);ctx.lineTo(px+T-5,py+11);ctx.moveTo(px+4,py+12);ctx.lineTo(px+4,py+T-4);ctx.stroke();
 if(seed%3===0){ctx.fillStyle='rgba(13,15,22,.65)';ctx.fillRect(px+8,py+14,3,2);ctx.fillRect(px+T-10,py+T-12,2,2)}
 if(seed%7===0){ctx.fillStyle='rgba(69,117,57,.9)';ctx.fillRect(px+4,py+10,8,3);ctx.fillRect(px+T-9,py+T-9,5,3)}
 if(seed%4===0){ctx.strokeStyle='rgba(12,13,20,.9)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(px+T*.28,py+12);ctx.lineTo(px+T*.42,py+T*.43);ctx.lineTo(px+T*.34,py+T*.68);ctx.stroke();ctx.strokeStyle='rgba(190,199,210,.22)';ctx.beginPath();ctx.moveTo(px+T*.29,py+13);ctx.lineTo(px+T*.41,py+T*.43);ctx.stroke()}
}
function drawLever(l,i,t){const x=l.x*T,y=l.y*T,on=activated[i];glow(x,y,performance.now()<revealUntil?150:105,on?'#e6a0ffALPHA':(performance.now()<revealUntil?'#ffe66dALPHA':'#a84dffALPHA'),on?1:.95);ctx.save();ctx.translate(x,y);
 // Raised square rune pedestal.
 ctx.fillStyle='rgba(0,0,0,.7)';ctx.beginPath();ctx.ellipse(2,15,31,15,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#17172a';ctx.beginPath();ctx.moveTo(-25,-5);ctx.lineTo(-18,-19);ctx.lineTo(18,-19);ctx.lineTo(26,-5);ctx.lineTo(21,13);ctx.lineTo(-21,13);ctx.closePath();ctx.fill();ctx.strokeStyle='#8e6bd0';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=on?'#a735ff':'#3e236b';ctx.shadowColor='#a83cff';ctx.shadowBlur=17;ctx.fillRect(-19,-8,38,20);ctx.shadowBlur=0;ctx.strokeStyle='#e5b5ff';ctx.lineWidth=1.5;ctx.strokeRect(-15,-4,30,13);ctx.fillStyle='#0a0b15';ctx.fillRect(-7,-18,14,27);ctx.strokeStyle='#b4a0d8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(on?-5:-1,-25);ctx.stroke();ctx.strokeStyle='#30213e';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(on?-5:-1,-25);ctx.stroke();ctx.strokeStyle=on?'#ffd9ff':'#b4b7c8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(on?-5:-1,-25);ctx.stroke();ctx.fillStyle=on?'#fff0ff':'#f23562';ctx.shadowColor=on?'#e5a4ff':'#ff234f';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(on?-5:-1,-27,6,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore();ctx.save();ctx.font='bold 13px Segoe UI, Arial';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#080510';ctx.strokeText('ALAVANCA '+(i+1),x,y+35);ctx.fillStyle=on?'#f2caff':'#e7c8ff';ctx.fillText('ALAVANCA '+(i+1),x,y+35);ctx.restore()}
function drawPortal(t){const x=portal.x*T,y=portal.y*T,open=activated.every(Boolean);glow(x,y,open?215:175,'#9a20ffALPHA',open?1:.88);ctx.save();ctx.translate(x,y);
 // Ancient engraved stone ring surrounding a deep, animated violet vortex.
 ctx.fillStyle='#080713';ctx.beginPath();ctx.ellipse(0,0,65,57,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#252337';ctx.lineWidth=17;ctx.beginPath();ctx.ellipse(0,0,59,50,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#8d5ba8';ctx.lineWidth=3;ctx.shadowColor='#a32cff';ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(0,0,58,49,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
 for(let i=0;i<12;i++){ctx.save();ctx.rotate(i*Math.PI/6);ctx.fillStyle=i%2?'#4b2c68':'#a47ab8';ctx.beginPath();ctx.moveTo(-5,-47);ctx.lineTo(0,-65);ctx.lineTo(5,-47);ctx.lineTo(0,-40);ctx.closePath();ctx.fill();ctx.strokeStyle='#d8b4f2';ctx.lineWidth=1;ctx.stroke();ctx.restore()}
 const core=ctx.createRadialGradient(-9,-11,2,0,0,56);core.addColorStop(0,open?'#e9c5ff':'#8e42cb');core.addColorStop(.25,'#8b1bdb');core.addColorStop(.63,'#3b087d');core.addColorStop(1,'#07030f');ctx.fillStyle=core;ctx.beginPath();ctx.ellipse(0,0,47,39,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.beginPath();ctx.ellipse(0,0,46,38,0,0,Math.PI*2);ctx.clip();
 // Redemoinho em espiral: o centro pulsa e as correntes roxas giram para dentro.
 const pulse=1+Math.sin(t*4.2)*.055;ctx.save();ctx.scale(pulse,pulse);
 for(let j=0;j<9;j++){const phaseAngle=t*(1.25+j*.035)+j*.72;const radius=8+j*4.1;ctx.beginPath();ctx.ellipse(Math.cos(phaseAngle)*4,Math.sin(phaseAngle)*3,Math.max(2,radius),Math.max(2,radius*.72),-phaseAngle*.55,0,Math.PI*1.62);ctx.strokeStyle=`rgba(${j%2?220:151},${j%2?143:55},255,${.32+j*.055})`;ctx.lineWidth=1.8+j*.2;ctx.shadowColor='#b12cff';ctx.shadowBlur=10;ctx.stroke()}ctx.restore();ctx.shadowBlur=0;
 for(let i=0;i<24;i++){const a=-t*1.4+i*Math.PI*2/24;const outer=12+(i%5)*6;const inward=(t*32+i*9)%outer;const r=Math.max(2,outer-inward);ctx.fillStyle=i%3?'rgba(240,190,255,.82)':'rgba(118,225,255,.9)';ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a*1.15)*r*.72,1+(i%3)*.45,0,Math.PI*2);ctx.fill()}ctx.restore();
 ctx.strokeStyle=open?'#f0b5ff':'#bd7cff';ctx.lineWidth=3;ctx.shadowColor='#c03cff';ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(0,0,48,40,0,0,Math.PI*2);ctx.stroke();ctx.restore();ctx.save();ctx.font='bold 13px Segoe UI, Arial';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#080510';ctx.strokeText(open?'PORTAL DESBLOQUEADO':'PORTAL',x,y+78);ctx.fillStyle='#f1d4ff';ctx.fillText(open?'PORTAL DESBLOQUEADO':'PORTAL',x,y+78);ctx.restore()}
function drawSpeedBoot(b,t){
 if(b.taken)return;const x=b.x*T,y=b.y*T;glow(x,y,34,'#ffe45eALPHA',.95);ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*3)*.08);
 ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.ellipse(0,12,15,5,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#3b174f';ctx.strokeStyle='#ffe88b';ctx.lineWidth=2;ctx.shadowColor='#ffd84d';ctx.shadowBlur=14;
 ctx.beginPath();ctx.moveTo(-10,-10);ctx.lineTo(1,-10);ctx.lineTo(5,-2);ctx.lineTo(13,2);ctx.lineTo(14,8);ctx.lineTo(-9,8);ctx.lineTo(-12,3);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#fff1a6';ctx.fillRect(-8,-7,9,2);ctx.fillRect(-5,-3,8,2);ctx.restore();
}
function drawIceCoin(c,t){if(c.taken)return;const x=c.x*T,y=c.y*T;glow(x,y,28,'#6deaffALPHA',.8);ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2+c.x)*.12);ctx.fillStyle='#5ddff5';ctx.strokeStyle='#d7fbff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-10);ctx.lineTo(5,-12);ctx.lineTo(10,-3);ctx.lineTo(7,10);ctx.lineTo(-7,9);ctx.lineTo(-11,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#efffff';ctx.beginPath();ctx.moveTo(-5,-7);ctx.lineTo(2,-8);ctx.lineTo(-1,1);ctx.closePath();ctx.fill();ctx.restore()}
function drawSpawnBeam(){if(performance.now()>spawnBeamUntil)return;const x=player.x*T,y=player.y*T;const fade=Math.min(1,(spawnBeamUntil-performance.now())/900);ctx.save();ctx.globalAlpha=.98*fade;const g=ctx.createLinearGradient(x,y-310,x,y+15);g.addColorStop(0,'rgba(190,145,255,0)');g.addColorStop(.65,'rgba(171,104,255,.3)');g.addColorStop(1,'rgba(236,207,255,.95)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-5,y-300);ctx.lineTo(x+5,y-300);ctx.lineTo(x+42,y+8);ctx.lineTo(x-42,y+8);ctx.closePath();ctx.fill();ctx.strokeStyle='#e7c7ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-295);ctx.lineTo(x,y-2);ctx.stroke();ctx.restore()}
function drawPlayer(){
 const now=performance.now();const flash=now<speedBoostUntil;let x=player.x*T,y=player.y*T;let suck=0;
 if(vortexStarted && now-vortexStarted>900){suck=Math.min(1,(now-vortexStarted-900)/3300);const cx=portal.x*T,cy=portal.y*T;const dx=cx-x,dy=cy-y;const angle=(now-vortexStarted)*.009;const orbit=(1-suck)*Math.min(42,Math.hypot(dx,dy)*.24);x=cx-dx*(1-suck)+Math.cos(angle)*orbit;y=cy-dy*(1-suck)+Math.sin(angle)*orbit;}
 const scale=1-suck*.9;glow(x,y,flash?82*scale:66*scale,flash?'#ff3b28ALPHA':'#168cffALPHA',1);ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 ctx.fillStyle='rgba(0,0,0,.65)';ctx.beginPath();ctx.ellipse(0,20,13,5,0,0,Math.PI*2);ctx.fill();
 // Full-body Luan-inspired adventurer: head, torso, two arms, two legs and boots.
 const walk=gameStarted&&!vortexStarted?Math.sin(now/95)*2:0;
 ctx.lineCap='round';ctx.lineJoin='round';
 // legs and boots
 ctx.strokeStyle=flash?'#d99b08':'#18253c';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-4,7);ctx.lineTo(-6+walk,17);ctx.lineTo(-7+walk,23);ctx.moveTo(4,7);ctx.lineTo(6-walk,16);ctx.lineTo(8-walk,22);ctx.stroke();
 ctx.fillStyle=flash?'#ffd84a':'#111522';ctx.beginPath();ctx.ellipse(-8+walk,24,6,3,0,0,Math.PI*2);ctx.ellipse(9-walk,23,6,3,0,0,Math.PI*2);ctx.fill();
 // dark shirt and shoulders
 ctx.fillStyle=flash?'#f2bd25':'#111923';ctx.beginPath();ctx.moveTo(-7,-9);ctx.lineTo(7,-9);ctx.lineTo(10,7);ctx.lineTo(5,11);ctx.lineTo(-6,10);ctx.lineTo(-10,5);ctx.closePath();ctx.fill();
 ctx.strokeStyle=flash?'#fff0a0':'#3d5267';ctx.lineWidth=flash?2.5:1.5;ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(4,6);ctx.stroke();
 // Marca LV no peito da camiseta
 ctx.save();ctx.font='bold 6px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=flash?'#fff4b0':'#f4f0ff';ctx.shadowColor=flash?'#ffdc38':'#b78aff';ctx.shadowBlur=flash?8:3;ctx.fillText(flash?'⚡':'LV',0,1);ctx.restore();
 // Camiseta com mangas curtas que chegam até a metade dos braços.
 // As mangas ficam sobre os ombros; a pele aparece apenas da metade do braço até as mãos.
 ctx.strokeStyle=flash?'#e8b82a':'#26384d';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-7,-6);ctx.lineTo(-10.5,-3);ctx.moveTo(7,-6);ctx.lineTo(10.5,-3);ctx.stroke();
 ctx.strokeStyle=flash?'#e6ad17':'#c58b6c';ctx.lineWidth=4.2;ctx.beginPath();ctx.moveTo(-10.5,-3);ctx.lineTo(-12+walk,1);ctx.lineTo(-13+walk,5);ctx.moveTo(10.5,-3);ctx.lineTo(12-walk,1);ctx.lineTo(13-walk,5);ctx.stroke();
 ctx.fillStyle=flash?'#ffe16a':'#d6a184';ctx.beginPath();ctx.arc(-13+walk,6,2.5,0,Math.PI*2);ctx.arc(13-walk,6,2.5,0,Math.PI*2);ctx.fill();
 // neck and face
 ctx.fillStyle='#c98f70';ctx.fillRect(-3,-12,6,5);ctx.fillStyle='#d9a181';ctx.beginPath();ctx.ellipse(0,-17,7.5,9,0,0,Math.PI*2);ctx.fill();
 // tousled brown hair
 ctx.fillStyle='#39251d';ctx.beginPath();ctx.moveTo(-9,-15);ctx.lineTo(-9,-21);ctx.lineTo(-8,-25);ctx.lineTo(-5,-27);ctx.lineTo(-2,-25);ctx.lineTo(1,-28);ctx.lineTo(4,-26);ctx.lineTo(7,-27);ctx.lineTo(9,-23);ctx.lineTo(10,-18);ctx.lineTo(7,-17);ctx.lineTo(5,-20);ctx.lineTo(3,-18);ctx.lineTo(1,-20);ctx.lineTo(-2,-18);ctx.lineTo(-4,-20);ctx.lineTo(-7,-17);ctx.closePath();ctx.fill();
 // Reflexos e mechas extras para deixar o topo do cabelo mais cheio.
 ctx.strokeStyle='#63402c';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-6,-24);ctx.lineTo(-3,-26);ctx.moveTo(1,-25);ctx.lineTo(4,-24);ctx.moveTo(6,-23);ctx.lineTo(7,-20);ctx.stroke();
 ctx.fillStyle='#241a17';ctx.beginPath();ctx.ellipse(-3,-17,1.3,1.8,0,0,Math.PI*2);ctx.ellipse(3,-17,1.3,1.8,0,0,Math.PI*2);ctx.fill();
 if(flash){ctx.strokeStyle='#fff1a0';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-7,-19);ctx.lineTo(-2,-22);ctx.lineTo(2,-19);ctx.lineTo(7,-22);ctx.stroke();ctx.fillStyle='#f2bd25';ctx.beginPath();ctx.moveTo(-8,-15);ctx.lineTo(8,-15);ctx.lineTo(6,-12);ctx.lineTo(-6,-12);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff0a0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-4,-6);ctx.lineTo(0,-2);ctx.lineTo(4,-6);ctx.stroke();
 // Faiscas elétricas animadas ao redor do personagem durante o pé mágico.
 ctx.save();ctx.globalCompositeOperation='lighter';const pulse=now/65;for(let k=0;k<3;k++){const a=pulse*0.7+k*Math.PI*2/3;const r=19+Math.sin(pulse*1.1+k)*2.5;const sx=Math.cos(a)*r,sy=Math.sin(a)*r-3;ctx.strokeStyle=k%2?'#fff7b5':'#ffe02e';ctx.shadowColor='#ffd21c';ctx.shadowBlur=5;ctx.lineWidth=1+(k%2)*.35;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(a+.45)*3,sy+Math.sin(a+.45)*3);ctx.lineTo(sx+Math.cos(a-.35)*5,sy+Math.sin(a-.35)*5);ctx.stroke();}ctx.restore();}else{ctx.strokeStyle='#6de5ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-4,-6);ctx.lineTo(0,-2);ctx.lineTo(4,-6);ctx.stroke();}
 ctx.restore();
}
function drawTorches(t){for(let i=2;i<N-2;i+=6){for(const [x,y] of [[i,1],[i,N-2],[1,i],[N-2,i]]){const px=x*T+T/2,py=y*T+T/2;glow(px,py,65,'#ff9b2fALPHA',.7);ctx.fillStyle='#453044';ctx.fillRect(px-3,py-7,6,13);ctx.fillStyle='#ffbd52';ctx.beginPath();ctx.ellipse(px,py-9,3,6+Math.sin(t*8+x)*2,0,0,Math.PI*2);ctx.fill()}}}
function drawForestAmbience(t){
 // Dark forest floor, moss, scattered rocks and tiny fireflies beyond the masonry.
 for(let i=0;i<180;i++){const x=(i*173+Math.sin(i*4.2)*31+930)%930,y=(i*97+Math.cos(i*2.3)*27+930)%930;const r=2+(i%5)*1.5;ctx.fillStyle=i%3===0?'rgba(34,75,43,.38)':i%3===1?'rgba(21,49,39,.52)':'rgba(20,28,39,.7)';ctx.beginPath();ctx.ellipse(x,y,r*1.6,r,.3,0,Math.PI*2);ctx.fill();if(i%13===0){ctx.fillStyle='rgba(89,137,68,.4)';ctx.beginPath();ctx.ellipse(x+4,y-3,r*1.2,r*.45,-.5,0,Math.PI*2);ctx.fill()}}
 for(let i=0;i<22;i++){const x=(i*211+31)%930,y=(i*157+63)%930;if(i%2===0){ctx.fillStyle='#18212b';ctx.beginPath();ctx.moveTo(x-12,y+7);ctx.lineTo(x-5,y-9);ctx.lineTo(x+7,y-14);ctx.lineTo(x+14,y+1);ctx.lineTo(x+8,y+12);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(92,115,139,.35)';ctx.lineWidth=2;ctx.stroke()}}
 for(let i=0;i<16;i++){const x=(i*179+Math.sin(t+i)*18+930)%930,y=(i*113+Math.cos(t*.8+i)*15+930)%930;ctx.fillStyle='rgba(149,255,150,.65)';ctx.shadowColor='#80ff9d';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;
 const v=ctx.createRadialGradient(465,465,200,465,465,670);v.addColorStop(0,'rgba(3,5,12,0)');v.addColorStop(1,'rgba(0,0,4,.6)');ctx.fillStyle=v;ctx.fillRect(0,0,930,930);
}
function render(t){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#050a0b';ctx.fillRect(0,0,canvas.width,canvas.height);drawForestAmbience(t);for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(map[y][x])drawWall(x,y);else drawFloor(x,y)}drawTorches(t);iceCoins.forEach(c=>drawIceCoin(c,t));speedBoots.forEach(b=>drawSpeedBoot(b,t));specialPowers.forEach(p=>drawSpecialPower(p,t));freezeFlakes.forEach(f=>drawFreezeFlake(f,t));mysteryBoxes.forEach(b=>drawMysteryBox(b,t));drawPortal(t);levers.forEach((l,i)=>drawLever(l,i,t));spiders.forEach(s=>drawSpider(s,t));drawSpawnBeam();if(frozenNow()){ctx.save();ctx.fillStyle='rgba(74,190,255,.25)';ctx.fillRect(0,0,canvas.width,canvas.height);for(let i=0;i<34;i++){const sx=((i*137+Math.sin(t*1.4+i)*22)%canvas.width+canvas.width)%canvas.width;const sy=((i*83+t*45)%canvas.height);ctx.fillStyle='rgba(226,250,255,.8)';ctx.beginPath();ctx.arc(sx,sy,1.5+(i%3),0,Math.PI*2);ctx.fill();}ctx.strokeStyle='rgba(190,242,255,.7)';ctx.lineWidth=2;ctx.strokeRect(4,4,canvas.width-8,canvas.height-8);ctx.restore();}drawPlayer();
 // A cada três fases muda a atmosfera cromática do cenário.
 const theme=Math.floor((phase-1)/3)%6;
 const tints=['rgba(0,0,0,0)','rgba(12,35,95,.19)','rgba(0,105,100,.18)','rgba(125,32,8,.20)','rgba(100,20,135,.20)','rgba(120,75,8,.20)'];
 if(theme>0){ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=tints[theme];ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();}
 if(vortexStarted){ctx.save();ctx.translate(portal.x*T,portal.y*T);ctx.rotate(t*11);ctx.strokeStyle='#f1c5ff';ctx.lineWidth=4;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(0,0,24+i*8,16+i*5,t+i,0,Math.PI*1.55);ctx.stroke()}ctx.restore();}}
function autoActivateLevers(){levers.forEach((l,i)=>{if(!activated[i]&&Math.hypot(player.x-l.x,player.y-l.y)<.72){activated[i]=true;playSound('lever');showToast('Alavanca '+(i+1)+' ativada ao passar!');updateUI();saveGame();}});if(activated.every(Boolean)&&!vortexStarted){vortexStarted=performance.now();vortexSoundTimer=0;spiders.forEach(sp=>{sp.active=true;});mysteryBoxes.filter(b=>b.kind!=='jar'&&b.kind!=='mystery').forEach(b=>{b.opened=true;b.openAt=vortexStarted;});playSound('suction');showToast('VÓRTICE ABERTO! Primeiro, todas as aranhas serão sugadas!');}}
function updateSpiders(now,dt){
 const vortexAge=vortexStarted?now-vortexStarted:0;
 for(let i=0;i<spiders.length;i++){
  const s=spiders[i],b=mysteryBoxes.find(q=>q.kind===s.kind&&Math.abs(q.x-s.homeX)<.01&&Math.abs(q.y-s.homeY)<.01);
  if(vortexStarted){
   // The vortex reaches every spider, regardless of its location in the maze.
   if(s.active){const dx=portal.x-s.x,dy=portal.y-s.y,d=Math.hypot(dx,dy)||1;const speed=7+Math.max(0,2-d)*3;s.x+=dx/d*speed*dt;s.y+=dy/d*speed*dt;if(d<.7)s.active=false;}
   continue;
  }
  if(!s.active&&now>=s.delay){s.active=true;if(b){b.opened=true;b.openAt=now;}playSound('hurt');showToast('Uma aranha saiu de uma caixa misteriosa!');}
  if(s.active&&!frozenNow()){const dx=player.x-s.x,dy=player.y-s.y,d=Math.hypot(dx,dy)||1;const speed=phase>8?1.2:.78;s.x+=dx/d*speed*dt;s.y+=dy/d*speed*dt;if(d<.48&&now-(s.lastHit||0)>1800){s.lastHit=now;loseLife();s.x=s.homeX;s.y=s.homeY;}}
 }
 const chest=mysteryBoxes[0];if(chest&&!chest.resolved&&Math.hypot(player.x-chest.x,player.y-chest.y)<.78)resolveSurpriseChest(chest);
}

function drawMysteryBox(b,t){if(b.resolved&&b.content!=='monster')return;const x=b.x*T,y=b.y*T;const opening=b.opened?Math.min(1,Math.max(0,(performance.now()-(b.openAt||performance.now()))/550)):0;glow(x,y,55,b.opened?'#ff6a9dALPHA':'#a84dffALPHA',.72);ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(0,0,0,.7)';ctx.beginPath();ctx.ellipse(2,13,23,10,0,0,Math.PI*2);ctx.fill();const wood=ctx.createLinearGradient(-17,-14,17,15);wood.addColorStop(0,b.opened?'#493040':'#76502e');wood.addColorStop(.45,b.opened?'#261724':'#4b2d24');wood.addColorStop(1,'#17111d');ctx.fillStyle=wood;ctx.fillRect(-17,-12,34,27);ctx.fillStyle='#a97a4e';ctx.fillRect(-17,-15,34,7);ctx.fillStyle='#d0a66b';ctx.fillRect(-15,-14,30,2);ctx.strokeStyle='#d8b77b';ctx.lineWidth=1.5;ctx.strokeRect(-17,-15,34,30);ctx.fillStyle='#b7a0c8';ctx.fillRect(-16,-14,4,5);ctx.fillRect(12,-14,4,5);ctx.fillRect(-16,10,4,5);ctx.fillRect(12,10,4,5);ctx.strokeStyle='#1b1220';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,-5);ctx.lineTo(10,-5);ctx.stroke();if(b.kind==='jar'){ctx.fillStyle='#b7f5ff';ctx.shadowColor='#60dfff';ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(-7,-7);ctx.lineTo(-5,-12);ctx.lineTo(5,-12);ctx.lineTo(7,-7);ctx.lineTo(9,8);ctx.quadraticCurveTo(0,15,-9,8);ctx.closePath();ctx.fill();ctx.fillStyle='#8b5b18';ctx.beginPath();for(let i=0;i<7;i++)ctx.arc(-5+(i%4)*3,2+Math.floor(i/4)*4,1.6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4ffff';ctx.font='bold 8px Segoe UI,Arial';ctx.fillText(b.opened?'70':'70',0,-1);ctx.shadowBlur=0;}else{ctx.fillStyle='#fff0ff';ctx.font='bold 24px Segoe UI, Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#d34cff';ctx.shadowBlur=12;ctx.fillText(b.opened?'!':'?',0,1);}if(b.kind!=='jar'&&b.kind!=='mystery'){ctx.save();ctx.translate(0,12);ctx.rotate(-opening*1.05);ctx.fillStyle='#69432b';ctx.strokeStyle='#d8b77b';ctx.lineWidth=1.5;ctx.fillRect(-17,-2,34,8);ctx.strokeRect(-17,-2,34,8);ctx.strokeStyle='#a97a4e';ctx.beginPath();ctx.moveTo(-11,1);ctx.lineTo(11,1);ctx.stroke();ctx.restore();}ctx.restore()}
function drawSpider(s,t){
 if(!s.active)return;if(performance.now()<stunUntil)return;const box=mysteryBoxes.find(q=>q.kind===s.kind&&Math.abs(q.x-s.homeX)<.01&&Math.abs(q.y-s.homeY)<.01);const emergence=box&&box.opened?Math.min(1,Math.max(0,(performance.now()-(box.openAt||performance.now()))/550)):1;const x=s.x*T,y=s.y*T-(1-emergence)*T*.62,kind=s.kind||monsterKindForPhase();
 const palette={spider:{glow:'#ff3f78ALPHA',body:'#552033',core:'#ff416e',limb:'#ff7b9d'},skeleton:{glow:'#e6e0c4ALPHA',body:'#6d6a5e',core:'#fff0c4',limb:'#d6d0b7'},slime:{glow:'#4dff9aALPHA',body:'#176b4b',core:'#6dffad',limb:'#7cffbd'},wisp:{glow:'#57cfffALPHA',body:'#1c4778',core:'#9cf5ff',limb:'#63dfff'},shadow:{glow:'#bd4cffALPHA',body:'#27123e',core:'#d77cff',limb:'#bd73ff'}};
 const p=palette[kind]||palette.spider;glow(x,y,34,p.glow,.9);ctx.save();ctx.translate(x,y);
 if(kind==='spider'){
  ctx.strokeStyle=p.limb;ctx.lineWidth=3;for(let i=0;i<4;i++){const yy=(i-1.5)*5;ctx.beginPath();ctx.moveTo(-5,yy);ctx.lineTo(-14,yy-5);ctx.lineTo(-18,yy+((i%2)?5:-5));ctx.moveTo(5,yy);ctx.lineTo(14,yy-5);ctx.lineTo(18,yy+((i%2)?5:-5));ctx.stroke()}
  ctx.fillStyle='#120b15';ctx.beginPath();ctx.ellipse(0,3,11,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.body;ctx.beginPath();ctx.ellipse(0,2,8,10,0,0,Math.PI*2);ctx.fill();
 } else if(kind==='skeleton'){
  ctx.strokeStyle=p.limb;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,-2);ctx.lineTo(-14,7);ctx.moveTo(8,-2);ctx.lineTo(14,7);ctx.moveTo(-5,7);ctx.lineTo(-7,14);ctx.moveTo(5,7);ctx.lineTo(7,14);ctx.stroke();
  ctx.fillStyle=p.body;ctx.fillRect(-7,-2,14,14);ctx.fillStyle=p.core;ctx.beginPath();ctx.arc(0,-8,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#25202a';ctx.fillRect(-4,-10,3,4);ctx.fillRect(2,-10,3,4);
 } else if(kind==='slime'){
  ctx.fillStyle=p.body;ctx.beginPath();ctx.moveTo(-14,10);ctx.quadraticCurveTo(-17,-4,-8,-9);ctx.quadraticCurveTo(0,-18,8,-8);ctx.quadraticCurveTo(18,-2,13,10);ctx.closePath();ctx.fill();ctx.fillStyle=p.core;ctx.beginPath();ctx.arc(-4,-3,2.5,0,Math.PI*2);ctx.arc(5,-3,2.5,0,Math.PI*2);ctx.fill();
 } else {
  ctx.fillStyle=p.body;ctx.beginPath();ctx.moveTo(0,-18);ctx.quadraticCurveTo(18,-5,11,8);ctx.lineTo(5,15);ctx.lineTo(0,9);ctx.lineTo(-6,16);ctx.lineTo(-12,7);ctx.quadraticCurveTo(-18,-6,0,-18);ctx.fill();ctx.fillStyle=p.core;ctx.beginPath();ctx.arc(-4,-4,2.5,0,Math.PI*2);ctx.arc(4,-4,2.5,0,Math.PI*2);ctx.fill();
 }
 if(kind==='spider'){ctx.fillStyle=p.core;ctx.beginPath();ctx.arc(0,-5,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-4,-7,2,2);ctx.fillRect(2,-7,2,2);}
 ctx.restore();
}
function frame(now){const dt=Math.min(.04,(now-lastTime)/1000||0);lastTime=now;if(gameStarted&&!won){move(dt);collectIceCoins();collectSpeedBoots();collectFreezeFlakes();collectSpecialPowers();autoActivateLevers();updateSpiders(now,dt);if(vortexStarted){if(now-vortexSoundTimer>720){vortexSoundTimer=now;playSound('suction');}if(now-vortexStarted>4300){if(secretPortalWarp){secretPortalWarp=false;vortexStarted=0;phase=20;elapsed=0;generatePhase();startedAt=performance.now();checkAchievements();showToast('ATALHO SECRETO! TELETRANSPORTE PARA A FASE 20!');saveGame()}else if(checkpointPasswords[phase]){won=true;gameStarted=false;stopSuspenseMusic();document.getElementById('winTitle').textContent='FASE '+phase+' CONCLUÍDA!';document.getElementById('winMessage').textContent='Checkpoint alcançado! Anote o password abaixo para continuar desta fase em outra sessão.';const checkpointBox=document.getElementById('checkpointPassword');if(checkpointBox){checkpointBox.classList.remove('hidden');document.getElementById('checkpointCode').textContent=checkpointPasswords[phase];const passLabel=checkpointBox.querySelector('small');if(passLabel)passLabel.textContent='FASE '+phase+' CONCLUÍDA — ANOTE SEU PASSWORD';}document.getElementById('restartWin').textContent='Continuar para a fase '+(phase+1)+' →';document.getElementById('winOverlay').classList.remove('hidden');updateUI();saveGame()}else if(phase>=20){won=true;gameStarted=false;stopSuspenseMusic();finishRanking();document.getElementById('winTitle').textContent='CAPÍTULO CONCLUÍDO!';document.getElementById('winMessage').textContent='Você venceu as 20 fases!';document.getElementById('restartWin').textContent='Voltar ao menu';document.getElementById('winOverlay').classList.remove('hidden');updateUI()}else{phase++;elapsed=0;generatePhase();startedAt=performance.now();checkAchievements();showToast('Você foi sugado para a fase '+phase+'!');saveGame()}}}const speedLeft=Math.max(0,Math.ceil((speedBoostUntil-now)/1000));if(speedLeft===0&&musicBoosted)setMusicBoost(false);const speedNode=document.getElementById('speedTime');if(speedNode)speedNode.textContent=speedLeft>0?(speedLeft+'s'):'NORMAL';updatePowerStatus();phaseRemaining=Math.max(0,phaseRemaining-dt);const timerText=String(Math.floor(phaseRemaining/60)).padStart(2,'0')+':'+String(Math.floor(phaseRemaining%60)).padStart(2,'0');document.getElementById('timer').textContent=timerText;const sceneTimer=document.getElementById('sceneTimer');if(sceneTimer)sceneTimer.textContent=timerText;elapsed=(now-startedAt)/1000;if(phaseRemaining<=0&&!vortexStarted){loseLife();phaseRemaining=180;showToast('Tempo esgotado! A fase recomeça com 03:00.');}const sec=Math.floor(elapsed);if(sec!==lastSavedSecond){lastSavedSecond=sec;saveGame()}}render(now/1000);requestAnimationFrame(frame)}
// Tenta iniciar a música do menu assim que a tela inicial carrega; navegadores que bloqueiam autoplay iniciam no primeiro toque/clique.
startMenuMusic();
document.addEventListener('pointerdown',()=>{if(!gameStarted&&soundEnabled&&(!currentMusic||currentMusic.paused))startMenuMusic();},{once:true});document.addEventListener('keydown',()=>{if(!gameStarted&&soundEnabled&&(!currentMusic||currentMusic.paused))startMenuMusic();},{once:true});window.addEventListener('beforeunload',saveGame);refreshContinueButton();updateUI();requestAnimationFrame(frame);
})();
