/**
 * newton.js — محاكاة معملية احترافية لقوانين نيوتن
 * فيزياء حقيقية | رسم بياني حي | تأثيرات بصرية عالية الجودة
 * منصة العلوم والتقنية للجميع
 */
'use strict';

// ══════════════════════════════════════════════════
//  الإعداد
// ══════════════════════════════════════════════════
const cv  = document.getElementById('newtonCanvas');
const ctx = cv.getContext('2d');
const gv  = document.getElementById('velocityGraph');
const gctx= gv ? gv.getContext('2d') : null;

function resize(){
  cv.width  = cv.offsetWidth  * devicePixelRatio;
  cv.height = cv.offsetHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  if(gv){ gv.width=gv.offsetWidth*devicePixelRatio; gv.height=gv.offsetHeight*devicePixelRatio; if(gctx)gctx.scale(devicePixelRatio,devicePixelRatio); }
}
window.addEventListener('resize',()=>{ resize(); });
resize();

// ══════════════════════════════════════════════════
//  حالة التجربة
// ══════════════════════════════════════════════════
const S={
  law:1,
  mass:2.0,
  force:10,
  friction:0,
  running:false,
  tick:0,
  px:0,
  vx:0,
  ax:0,
  time:0,
  graphData:{ t:[], v:[], a:[], x:[] },
  sparks:[],
  wallHit:false, wallHitTime:0,
  reactionForce:0,
  SCALE:0,
  MAX_DIST:10, // متر
};

// ══════════════════════════════════════════════════
//  حسابات فيزيائية
// ══════════════════════════════════════════════════
function calcAccel(){
  if(S.law===1){ S.ax=0; return; }
  const f_net = S.force - S.friction*S.mass*9.8;
  S.ax = Math.max(0, f_net/S.mass);
}

function getTrackPx(){
  const W=cv.offsetWidth;
  return { start:W*0.06, end:W*0.94, len:W*0.88 };
}

function metersToWorld(m){
  const t=getTrackPx();
  return t.start + (m/S.MAX_DIST)*t.len;
}

// ══════════════════════════════════════════════════
//  تشغيل / إيقاف
// ══════════════════════════════════════════════════
function launch(){
  S.running=true;
  S.tick=0; S.time=0;
  S.px=0; S.vx=0;
  S.graphData={t:[],v:[],a:[],x:[]};
  S.sparks=[];
  S.wallHit=false;
  calcAccel();

  if(S.law===1){
    S.vx = 4.0;  // سرعة ثابتة
    S.ax = 0;
  } else if(S.law===2){
    S.vx = 0;
  } else {
    S.vx = 5.0;
  }

  updateStatus('running');
  updateDOM();
}

function resetSim(){
  S.running=false;
  S.px=0; S.vx=0; S.ax=0; S.time=0;
  S.graphData={t:[],v:[],a:[],x:[]};
  S.sparks=[];
  S.wallHit=false;
  updateStatus('ready');
  updateDOM();
}

// ══════════════════════════════════════════════════
//  حلقة الفيزياء
// ══════════════════════════════════════════════════
const DT=1/60;

function physicsStep(){
  if(!S.running) return;
  S.time+=DT; S.tick++;

  if(S.law===1){
    S.px+=S.vx*DT;
    if(S.px>=S.MAX_DIST){ S.px=S.MAX_DIST; S.running=false; updateStatus('done'); }
  } else if(S.law===2){
    S.vx+=S.ax*DT;
    S.px+=S.vx*DT;
    if(S.px>=S.MAX_DIST){ S.px=S.MAX_DIST; S.vx=0; S.running=false; updateStatus('done'); }
  } else {
    S.vx+=S.ax*DT;
    S.px+=S.vx*DT;
    if(S.px>=S.MAX_DIST){
      S.px=S.MAX_DIST;
      S.vx=-S.vx*0.78;
      spawnSparks(metersToWorld(S.MAX_DIST), cv.offsetHeight*0.52);
      S.wallHit=true; S.wallHitTime=S.time;
      S.reactionForce=Math.abs(S.vx)*S.mass/DT;
      updateStatus('collision');
    }
    if(S.px<=0){ S.px=0; S.vx=-S.vx*0.78; }
    if(Math.abs(S.vx)<0.05 && Math.abs(S.ax)<0.01){ S.running=false; updateStatus('done'); }
  }

  if(S.tick%2===0){
    const gd=S.graphData;
    gd.t.push(+S.time.toFixed(2));
    gd.v.push(+Math.abs(S.vx).toFixed(3));
    gd.a.push(+S.ax.toFixed(3));
    gd.x.push(+S.px.toFixed(3));
    if(gd.t.length>160){ gd.t.shift(); gd.v.shift(); gd.a.shift(); gd.x.shift(); }
  }

  if(S.wallHit && S.time-S.wallHitTime>0.5) S.wallHit=false;
  updateDOM();
}

function spawnSparks(x,y){
  for(let i=0;i<24;i++){
    const a=Math.random()*Math.PI*2, sp=1+Math.random()*4;
    S.sparks.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,r:2+Math.random()*3});
  }
}
function updateSparks(){
  S.sparks=S.sparks.filter(s=>{
    s.x+=s.vx; s.y+=s.vy; s.vy+=0.18; s.life-=0.035;
    return s.life>0;
  });
}

// ══════════════════════════════════════════════════
//  الرسم الرئيسي
// ══════════════════════════════════════════════════
function draw(){
  const W=cv.offsetWidth, H=cv.offsetHeight;
  ctx.clearRect(0,0,W,H);
  drawBackground(W,H);
  drawTrack(W,H);
  drawWalls(W,H);
  drawBody(W,H);
  drawForceArrows(W,H);
  drawSparks();
  drawLabels(W,H);
  drawMiniInstruments(W,H);
}

function drawBackground(W,H){
  ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(0,78,102,0.04)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=36){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  const ty=H*0.82;
  const tg=ctx.createLinearGradient(0,ty,0,H);
  tg.addColorStop(0,'#e8f4f8'); tg.addColorStop(1,'#dce8ee');
  ctx.fillStyle=tg; ctx.fillRect(0,ty,W,H-ty);
  ctx.strokeStyle='rgba(0,78,102,0.15)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,ty); ctx.lineTo(W,ty); ctx.stroke();
}

function drawTrack(W,H){
  const tk=getTrackPx(), ty=H*0.65;
  ctx.shadowColor='rgba(0,78,102,0.12)'; ctx.shadowBlur=8; ctx.shadowOffsetY=4;
  ctx.fillStyle='#dde8f0';
  ctx.beginPath(); ctx.roundRect(tk.start-4,ty+18,tk.len+8,14,4); ctx.fill();
  ctx.shadowBlur=0; ctx.shadowOffsetY=0;
  const tkg=ctx.createLinearGradient(0,ty,0,ty+18);
  tkg.addColorStop(0,'#e2eef5'); tkg.addColorStop(1,'#c8dde8');
  ctx.fillStyle=tkg;
  ctx.beginPath(); ctx.roundRect(tk.start-4,ty,tk.len+8,20,4); ctx.fill();
  ctx.strokeStyle='rgba(0,78,102,0.15)'; ctx.lineWidth=1; ctx.setLineDash([8,6]);
  ctx.beginPath(); ctx.moveTo(tk.start,ty+10); ctx.lineTo(tk.end,ty+10); ctx.stroke();
  ctx.setLineDash([]);
  for(let m=0;m<=S.MAX_DIST;m+=2){
    const x=tk.start+(m/S.MAX_DIST)*tk.len;
    ctx.strokeStyle='rgba(0,78,102,0.3)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x,ty+18); ctx.lineTo(x,ty+26); ctx.stroke();
    ctx.fillStyle='rgba(0,78,102,0.45)'; ctx.font=`${Math.max(9,W/90)}px Cairo,sans-serif`;
    ctx.textAlign='center'; ctx.fillText(m+'م',x,ty+38);
  }
  ctx.textAlign='start';
  ctx.fillStyle='#10b981';
  ctx.beginPath(); ctx.roundRect(tk.start-3,ty-12,6,32,3); ctx.fill();
  ctx.fillStyle='#10b981'; ctx.font='bold 10px Cairo'; ctx.textAlign='center';
  ctx.fillText('بداية',tk.start,ty-16); ctx.textAlign='start';
}

function drawWalls(W,H){
  const tk=getTrackPx(), ty=H*0.65;
  const wallGlow = S.wallHit ? Math.max(0,(0.5-(S.time-S.wallHitTime))/0.5) : 0;
  ctx.shadowColor=`rgba(239,68,68,${wallGlow*0.8})`; ctx.shadowBlur=wallGlow*30;
  const wg=ctx.createLinearGradient(tk.end,0,tk.end+16,0);
  wg.addColorStop(0,'#64748b'); wg.addColorStop(1,'#94a3b8');
  ctx.fillStyle=wg;
  ctx.beginPath(); ctx.roundRect(tk.end-4,ty-28,18,62,4); ctx.fill();
  for(let i=0;i<5;i++){
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(tk.end+2,ty-20+i*12); ctx.lineTo(tk.end+10,ty-20+i*12); ctx.stroke();
  }
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(100,116,139,0.6)'; ctx.font='bold 10px Cairo'; ctx.textAlign='center';
  ctx.fillText('جدار',tk.end+6,ty-34); ctx.textAlign='start';

  if(S.law===3 && S.wallHit && wallGlow>0.1){
    const ax=tk.end-4, ay=ty-6;
    const len=Math.min(60, S.reactionForce/500*60)*wallGlow;
    drawArrow3(ax-len,ay,-1,len,'#ef4444',3,`رد فعل\n${(S.reactionForce/1000).toFixed(1)}كN`);
  }
}

function drawBody(W,H){
  const tk=getTrackPx(), ty=H*0.65;
  const bx=metersToWorld(S.px), by=ty-8;
  const bW=Math.max(44,W*0.055), bH=bW*0.7;

  ctx.shadowColor='rgba(0,78,102,0.15)'; ctx.shadowBlur=10; ctx.shadowOffsetY=5;
  const bg=ctx.createLinearGradient(bx-bW/2,by-bH,bx+bW/2,by);
  bg.addColorStop(0,'#2ec4e8'); bg.addColorStop(0.4,'#0089ae'); bg.addColorStop(1,'#004e66');
  ctx.fillStyle=bg;
  ctx.beginPath(); ctx.roundRect(bx-bW/2,by-bH,bW,bH,6); ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(bx-bW/2+6,by-bH+2); ctx.lineTo(bx+bW/2-6,by-bH+2); ctx.stroke();

  [[bx-bW/3,by],[bx+bW/3,by]].forEach(([wx,wy])=>{
    const wg2=ctx.createRadialGradient(wx,wy,0,wx,wy,8);
    wg2.addColorStop(0,'#94a3b8'); wg2.addColorStop(1,'#475569');
    ctx.beginPath(); ctx.arc(wx,wy,8,0,Math.PI*2);
    ctx.fillStyle=wg2; ctx.fill();
    ctx.strokeStyle='#cbd5e1'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(wx,wy,5,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(wx,wy,2,0,Math.PI*2);
    ctx.fillStyle='#e2e8f0'; ctx.fill();
  });
  ctx.shadowOffsetY=0; ctx.shadowBlur=0;

  ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.font=`bold ${Math.max(10,bW/4.5)}px Cairo`;
  ctx.textAlign='center';
  ctx.fillText(S.mass.toFixed(1)+'kg',bx,by-bH/2+4);
  ctx.textAlign='start';

  if(S.running && Math.abs(S.vx)>0.1){
    ctx.fillStyle='rgba(0,78,102,0.5)'; ctx.font='10px JetBrains Mono,monospace';
    ctx.textAlign='center';
    ctx.fillText(Math.abs(S.vx).toFixed(2)+' م/ث',bx,by-bH-12);
    ctx.textAlign='start';
  }
}

function drawArrow3(x,y,dir,len,color,lw,label){
  if(len<2) return;
  const headLen=Math.min(16,len*0.35);
  ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.fillStyle=color;
  ctx.beginPath(); ctx.moveTo(x+len*dir,y); ctx.lineTo(x,y); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x+headLen*dir,y-6);
  ctx.lineTo(x+headLen*dir,y+6);
  ctx.closePath(); ctx.fill();
  if(label){
    ctx.fillStyle=color; ctx.font='bold 10px Cairo'; ctx.textAlign='center';
    label.split('\n').forEach((l,i)=>ctx.fillText(l,x+len*dir/2,y-18+i*13));
    ctx.textAlign='start';
  }
}

function drawForceArrows(W,H){
  const tk=getTrackPx(), ty=H*0.65;
  const bx=metersToWorld(S.px), by=ty-8;
  const bH=Math.max(31,W*0.055)*0.7;
  const ay=by-bH/2;

  if(!S.running && S.px===0) return;

  if(S.law===1 && S.running){
    const len=Math.min(70,S.vx*14);
    drawArrow3(bx+Math.max(22,W*0.028)+2,ay,1,len,'#3b82f6',2.5,'');
    ctx.fillStyle='#3b82f6'; ctx.font='bold 10px Cairo'; ctx.textAlign='center';
    ctx.fillText('v = '+S.vx.toFixed(1)+' م/ث',bx+Math.max(22,W*0.028)+len/2+2,ay-14);
    ctx.textAlign='start';
    ctx.fillStyle='rgba(0,78,102,0.4)'; ctx.font='11px Cairo'; ctx.textAlign='center';
    ctx.fillText('ΣF = 0',bx,ay-32); ctx.textAlign='start';
  } else if(S.law===2 && S.running){
    const len=Math.min(80,S.force*2.2);
    drawArrow3(bx+Math.max(22,W*0.028)+2,ay,1,len,'#10b981',3,`F=${S.force}N`);
    const alen=Math.min(50,S.ax*14);
    if(alen>2) drawArrow3(bx+Math.max(22,W*0.028)+len+8,ay,1,alen,'#f59e0b',2,`a=${S.ax.toFixed(2)}`);
  } else if(S.law===3){
    const len=Math.min(70,S.vx*14);
    if(S.vx>0.1){
      drawArrow3(bx+Math.max(22,W*0.028)+2,ay,1,len,'#f59e0b',2.5,'فعل →');
    } else if(S.vx<-0.1){
      drawArrow3(bx-Math.max(22,W*0.028)-2,ay,-1,Math.min(70,Math.abs(S.vx)*14),'#ef4444',2.5,'← رد فعل');
    }
  }
}

function drawSparks(){
  S.sparks.forEach(s=>{
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(245,158,11,${s.life*0.9})`;
    ctx.shadowBlur=8; ctx.shadowColor='#f59e0b';
    ctx.fill(); ctx.shadowBlur=0;
  });
}

function drawLabels(W,H){
  const lawNames=['القانون الأول: القصور الذاتي','القانون الثاني: F = m × a','القانون الثالث: الفعل ورد الفعل'];
  ctx.fillStyle='rgba(0,78,102,0.35)'; ctx.font=`bold ${Math.max(11,W/65)}px Cairo`;
  ctx.textAlign='center'; ctx.fillText(lawNames[S.law-1],W/2,H*0.1); ctx.textAlign='start';
}

function drawMiniInstruments(W,H){
  const ix=W*0.04, iy=H*0.86;
  ctx.fillStyle='rgba(248,250,252,0.88)';
  ctx.beginPath(); ctx.roundRect(ix,iy,W*0.13,H*0.11,8); ctx.fill();
  ctx.strokeStyle='rgba(0,78,102,0.12)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.roundRect(ix,iy,W*0.13,H*0.11,8); ctx.stroke();
  ctx.fillStyle='#004e66';
  ctx.beginPath(); ctx.roundRect(ix+5,iy+5,W*0.13-10,H*0.05,4); ctx.fill();
  ctx.fillStyle='#00e5b0'; ctx.font=`bold ${Math.max(10,W/78)}px JetBrains Mono,monospace`;
  ctx.textAlign='center'; ctx.fillText(Math.abs(S.vx).toFixed(2)+' م/ث',ix+W*0.065,iy+H*0.038);
  ctx.fillStyle='#64748b'; ctx.font=`${Math.max(8,W/95)}px Cairo`;
  ctx.fillText('السرعة',ix+W*0.065,iy+H*0.1); ctx.textAlign='start';

  const ix2=W*0.04+W*0.145, iy2=H*0.86;
  ctx.fillStyle='rgba(248,250,252,0.88)';
  ctx.beginPath(); ctx.roundRect(ix2,iy2,W*0.13,H*0.11,8); ctx.fill();
  ctx.strokeStyle='rgba(0,78,102,0.12)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.roundRect(ix2,iy2,W*0.13,H*0.11,8); ctx.stroke();
  ctx.fillStyle='#004e66';
  ctx.beginPath(); ctx.roundRect(ix2+5,iy2+5,W*0.13-10,H*0.05,4); ctx.fill();
  ctx.fillStyle='#7ddcf0'; ctx.font=`bold ${Math.max(10,W/78)}px JetBrains Mono,monospace`;
  ctx.textAlign='center'; ctx.fillText(S.px.toFixed(1)+' م',ix2+W*0.065,iy2+H*0.038);
  ctx.fillStyle='#64748b'; ctx.font=`${Math.max(8,W/95)}px Cairo`;
  ctx.fillText('الإزاحة',ix2+W*0.065,iy2+H*0.1); ctx.textAlign='start';
}

// ══════════════════════════════════════════════════
//  رسم الرسم البياني
// ══════════════════════════════════════════════════
function drawGraph(){
  if(!gctx||!gv) return;
  const W=gv.offsetWidth, H=gv.offsetHeight;
  gctx.clearRect(0,0,W,H);
  gctx.fillStyle='#ffffff'; gctx.fillRect(0,0,W,H);

  const gd=S.graphData;
  if(gd.t.length<2){
    gctx.fillStyle='#94a3b8'; gctx.font='12px Cairo'; gctx.textAlign='center';
    gctx.fillText('شغّل التجربة لرسم المنحنى',W/2,H/2);
    gctx.textAlign='start'; return;
  }

  const pad={l:42,r:16,t:16,b:28};
  const gW=W-pad.l-pad.r, gH=H-pad.t-pad.b;

  // شبكة
  gctx.strokeStyle='rgba(0,78,102,0.06)'; gctx.lineWidth=1;
  for(let i=0;i<=4;i++){
    const y=pad.t+(i/4)*gH;
    gctx.beginPath(); gctx.moveTo(pad.l,y); gctx.lineTo(W-pad.r,y); gctx.stroke();
  }
  for(let i=0;i<=5;i++){
    const x=pad.l+(i/5)*gW;
    gctx.beginPath(); gctx.moveTo(x,pad.t); gctx.lineTo(x,pad.t+gH); gctx.stroke();
  }

  gctx.strokeStyle='rgba(0,78,102,0.25)'; gctx.lineWidth=1.5;
  gctx.beginPath(); gctx.moveTo(pad.l,pad.t); gctx.lineTo(pad.l,pad.t+gH); gctx.stroke();
  gctx.beginPath(); gctx.moveTo(pad.l,pad.t+gH); gctx.lineTo(W-pad.r,pad.t+gH); gctx.stroke();

  const maxT=Math.max(...gd.t,0.1);
  const maxV=Math.max(...gd.v,0.5);
  const maxA=Math.max(...gd.a,0.5);
  const maxY=Math.max(maxV, maxA)*1.2;

  gctx.fillStyle='#475569'; gctx.font='9px Cairo';
  for(let i=0;i<=4;i++){
    const v=(maxY/4)*(4-i);
    const y=pad.t+(i/4)*gH;
    gctx.textAlign='left'; gctx.fillText(v.toFixed(1),2,y+4);
    gctx.beginPath(); gctx.moveTo(pad.l-3,y); gctx.lineTo(pad.l,y); gctx.stroke();
  }
  for(let i=0;i<=4;i++){
    const t=(maxT/4)*i;
    const x=pad.l+(i/4)*gW;
    gctx.textAlign='center'; gctx.fillText(t.toFixed(1)+'ث',x,pad.t+gH+16);
  }
  gctx.textAlign='start';

  // منحنى السرعة
  gctx.beginPath();
  gd.t.forEach((t,i)=>{
    const x=pad.l+(t/maxT)*gW;
    const y=pad.t+gH-(gd.v[i]/maxY)*gH;
    i===0?gctx.moveTo(x,y):gctx.lineTo(x,y);
  });
  gctx.strokeStyle='#0089ae'; gctx.lineWidth=2.5; gctx.stroke();

  // منحنى التسارع
  gctx.beginPath();
  gd.t.forEach((t,i)=>{
    const x=pad.l+(t/maxT)*gW;
    const y=pad.t+gH-(gd.a[i]/maxY)*gH;
    i===0?gctx.moveTo(x,y):gctx.lineTo(x,y);
  });
  gctx.strokeStyle='#10b981'; gctx.lineWidth=2; gctx.setLineDash([4,4]); gctx.stroke();
  gctx.setLineDash([]);

  // تسمية
  gctx.fillStyle='#0089ae'; gctx.font='bold 10px Cairo';
  gctx.fillText('السرعة',pad.l+4,pad.t-4);
  gctx.fillStyle='#10b981';
  gctx.fillText('التسارع',pad.l+4,pad.t+10);
}

// ══════════════════════════════════════════════════
//  تحديث DOM
// ══════════════════════════════════════════════════
function updateDOM(){
  const set=(id,v)=>{ const e=document.getElementById(id); if(e)e.textContent=v; };
  const setHTML=(id,v)=>{ const e=document.getElementById(id); if(e)e.innerHTML=v; };

  set('accelDisplay', S.ax.toFixed(2));
  set('velocityDisplay', Math.abs(S.vx).toFixed(2));
  set('positionDisplay', S.px.toFixed(2));

  const ab=document.getElementById('accelBar');
  if(ab) ab.style.width=Math.min(100,S.ax/10*100)+'%';

  const fr=document.getElementById('formulaResult');
  if(fr){
    if(S.law===1) fr.innerHTML='ΣF = 0 → v = '+S.vx.toFixed(2)+' م/ث';
    else if(S.law===2) fr.innerHTML=`${S.force} = ${S.mass.toFixed(1)} × ${S.ax.toFixed(2)}`;
    else fr.innerHTML=`F₁₂ = -F₂₁ = ${S.force} N`;
  }

  const si=document.getElementById('scientificInfo');
  if(si){
    if(S.law===1) si.innerHTML=`<strong>⚖️ القانون الأول — القصور الذاتي:</strong><br>الجسم يتحرك بسرعة ثابتة <strong>${S.vx.toFixed(2)} م/ث</strong> بدون أي قوة خارجية.<br>ΣF = 0 → التسارع = صفر.`;
    else if(S.law===2) si.innerHTML=`<strong>📐 القانون الثاني — F = m × a:</strong><br>القوة = <strong>${S.force}N</strong>، الكتلة = <strong>${S.mass.toFixed(1)}kg</strong><br>التسارع = <strong>${S.ax.toFixed(2)} م/ث²</strong>، السرعة الحالية = <strong>${S.vx.toFixed(2)} م/ث</strong>`;
    else si.innerHTML=`<strong>🔄 القانون الثالث — الفعل ورد الفعل:</strong><br>عند الاصطدام: قوة الفعل تساوي قوة رد الفعل في المقدار وتعاكسها في الاتجاه.<br>F₁₂ = −F₂₁ = <strong>${S.force}N</strong>`;
  }

  if(S.running||S.px>0){
    const map={compLaw1:'',compLaw2:'',compLaw3:''};
    if(S.law===1) map.compLaw1=`🟢 v = ${S.vx.toFixed(2)} م/ث (ثابتة)`;
    if(S.law===2) map.compLaw2=`🟢 a = ${S.ax.toFixed(2)} م/ث²، v = ${S.vx.toFixed(2)} م/ث`;
    if(S.law===3) map.compLaw3=`🟢 F = ${S.force}N ↔ رد الفعل = ${S.force}N`;
    Object.entries(map).forEach(([id,v])=>{ const e=document.getElementById(id); if(e&&v)e.innerHTML=v; });
  }

  const gs=document.getElementById('graphStatus');
  if(gs) gs.textContent=S.running?'📈 تسجيل الحركة...':'✅ جاهز';
}

function updateStatus(state){
  const el=document.getElementById('simulationStatus');
  if(!el) return;
  const msgs={
    ready:'⚙️ جاهز للتشغيل',
    running:'🚀 الجسم في حركة...',
    done:'✅ اكتملت التجربة',
    collision:'💥 ارتداد! (الفعل ورد الفعل)',
  };
  el.textContent=msgs[state]||msgs.ready;
  el.className='live-indicator'+(state==='running'||state==='collision'?' active':'');
}

// ══════════════════════════════════════════════════
//  ربط الأحداث
// ══════════════════════════════════════════════════
function bindEvents(){
  const ms=document.getElementById('massSlider');
  const fs=document.getElementById('forceSlider');
  const mv=document.getElementById('massValue');
  const fv=document.getElementById('forceValue');
  if(ms) ms.addEventListener('input',e=>{ S.mass=+e.target.value; if(mv)mv.textContent=S.mass.toFixed(1); calcAccel(); updateDOM(); });
  if(fs) fs.addEventListener('input',e=>{ S.force=+e.target.value; if(fv)fv.textContent=S.force; calcAccel(); updateDOM(); });
  document.getElementById('launchBtn')?.addEventListener('click',launch);
  document.getElementById('resetSimBtn')?.addEventListener('click',resetSim);
  document.querySelectorAll('.law-btn').forEach(b=>b.addEventListener('click',()=>{
    S.law=+b.dataset.law; resetSim();
    document.querySelectorAll('.law-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const vc=document.getElementById('variablesCard');
    if(vc) vc.style.opacity=S.law===1?'0.55':'1';
    if(document.getElementById('massSlider')) document.getElementById('massSlider').disabled=S.law===1;
    if(document.getElementById('forceSlider')) document.getElementById('forceSlider').disabled=S.law===1;
    calcAccel(); updateDOM();
  }));
}

// ══════════════════════════════════════════════════
//  حلقة الرسم الرئيسية
// ══════════════════════════════════════════════════
function loop(){
  physicsStep();
  updateSparks();
  draw();
  drawGraph();
  requestAnimationFrame(loop);
}

function init(){
  bindEvents();
  calcAccel();
  updateDOM();
  updateStatus('ready');
  loop();
}
init();