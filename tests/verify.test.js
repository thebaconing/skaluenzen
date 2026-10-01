// Prüft alle Kombinationen aus Stimmung, Leiter, Tongeschlecht, Grundton, Fingersatz, Lage und Umfang.
// Aufruf: npm test  (oder: node tests/verify.test.js)
const c=require('../js/core.js');
let errs=[],checks=0;const add=e=>{errs.push(e)};
for(const tuning of Object.keys(c.TUNINGS))for(const type of ['scale','penta','blues'])for(const mode of ['major','minor'])for(const [root] of c.ROOTS[mode])for(const system of ['pos','nps'])for(const range of ['root','full']){
 const sc=c.buildScale(root,mode,type);const K=sc.length;
 if(type!=='blues'&&new Set(sc.map(d=>d.letter)).size!==K) add('spelling '+root+mode);
 for(const sh0 of c.listShapes(sc,system,c.tuningOpen(tuning))){
  const ex=c.buildExercise({tuning,type,root,mode,system,fret:sh0.f,range,sections:c.SECTIONS.map(s=>s.id)});
  const sh=ex.shape,N=sh.notes,tag=[tuning,type,root,mode,system,range,'f'+sh.f].join(' ');
  {const fr=N.map(n=>n.f).filter(f=>f>0);if(fr.length&&Math.max(...fr)-Math.min(...fr)>(type==='scale'&&system==='nps'?6:5)+Math.max(...c.OPEN.map((m,i)=>m-ex.open[i])))add(tag+' Spanne '+Math.min(...fr)+'-'+Math.max(...fr));}
  if(system==='nps'&&type==='penta'){for(let s=0;s<6;s++)if(N.filter(n=>n.s===s).length!==2)add(tag+' nicht 2 pro Saite');}
  if(new Set(N.map(n=>n.s+'/'+n.f)).size!==N.length)add(tag+' doppelte Position');
  N.forEach((n,i)=>{ if(ex.open[n.s]+n.f!==n.m) add(tag+' fret/midi '+i);
    if(i){const d0=c.degreeOf(sc,N[i-1].m),d1=c.degreeOf(sc,n.m); checks++;
      if(n.m<=N[i-1].m||(d0+1)%K!==d1) add(tag+' Lücke in Lage bei Ton '+i);}});
  if(system==='nps'&&type==='scale'){for(let s=0;s<6;s++)if(N.filter(n=>n.s===s).length!==3)add(tag+' nicht 3 pro Saite');}
  if(range==='root'&&c.degreeOf(sc,N[sh.rootIdx].m)!==0) add(tag+' rootIdx');
  ex.sections.forEach(S=>{
   const pat=S.sec.pat,L=pat.length,id=S.sec.id;
   const notes=S.measures.flat().filter(e=>e.kind==='note').map(e=>N.indexOf(e.n));
   const lo=range==='full'?0:sh.rootIdx;
   if(notes.includes(-1)) add(tag+id+' fremder Ton');
   if(notes[0]!==lo) add(tag+' '+id+' beginnt nicht am Start');
   if(notes[notes.length-1]!==lo) add(tag+' '+id+' endet nicht am Start');
   const body=notes.slice(0,notes.length-(notes.length%L));
   let up=true;
   for(let g=0;g<body.length;g+=L){const grp=body.slice(g,g+L);checks++;
     const a=grp.map(x=>x-grp[0]),b=grp.map(x=>grp[0]-x);
     if(a.join()===pat.join()){ if(!up) add(tag+' '+id+' wieder aufwärts');}
     else if(b.join()===pat.join()) up=false;
     else add(tag+' '+id+' Gruppe falsch: '+grp);
     const degs=grp.map(i=>c.degreeOf(sc,N[i].m));
     const steps=degs.map(d=>((d-degs[0])%K+K)%K), exp=pat.map(p=>up?p%K:((K-p)%K+K)%K);
     if(steps.join()!==exp.join()) add(tag+' '+id+' Stufen '+degs);
     if(g+L<body.length){const nxt=body.slice(g+L,g+2*L);const turn=up&&nxt.length===L&&nxt.map(x=>nxt[0]-x).join()===pat.join();const d=body[g+L]-grp[0];if(!turn&&Math.abs(d)>1) add(tag+' '+id+' Sprung '+grp[0]+'->'+body[g+L]);}
   }
   if(Math.max(...notes)!==N.length-1) add(tag+' '+id+' erreicht oberen Ton nicht ('+Math.max(...notes)+'/'+(N.length-1)+')');
   S.measures.forEach((m,mi)=>{const t=m.reduce((a,e)=>a+e.dur,0);if(t!==48)add(tag+' Takt '+mi+' Länge '+t)});
  });
  const x=c.toMusicXML(ex,{type,root,mode,bpm:90});
  const LET={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  [...x.matchAll(/<pitch><step>(\w)<\/step>(?:<alter>(-?\d)<\/alter>)?<octave>(-?\d)<\/octave><\/pitch>.*?<string>(\d)<\/string><fret>(\d+)<\/fret>/g)].forEach(p=>{
    const w=(+p[3]+1)*12+LET[p[1]]+(+p[2]||0);checks++;if(w-12!==ex.open[6-p[4]]+(+p[5]))add(tag+' XML Tonhöhe');});
 
  // Stimmung im MusicXML muss zu den Leersaiten passen
  [...x.matchAll(/<staff-tuning line="(\d)"><tuning-step>(\w)<\/tuning-step>(?:<tuning-alter>(-?\d)<\/tuning-alter>)?<tuning-octave>(\d)<\/tuning-octave>/g)].forEach(p=>{
    checks++;if((+p[4]+1)*12+LET[p[2]]+(+p[3]||0)!==ex.open[p[1]-1])add(tag+' XML Stimmung');});
 }}
const uniq=[...new Set(errs.map(e=>e.replace(/^\S+ \S+ /,'').replace(/f\d+ /,'')))];
console.log('Prüfungen:',checks,'Fehler:',errs.length);if(errs.length){console.log(errs.slice(0,40).join('\n'));process.exit(1);}
