// Run: node tests/media.test.cjs. Node built-ins only; executes the real inline controller.
// Native autoplay is asserted in HTML and left to the browser; this is not a Safari decoder test.
// Intentionally removed expectations: JS hero initialization, source unload/reset cycles,
// play-promise priority gates, gesture recovery and automatic retry budgets.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const media=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('// Media starts independently'))[1];
assert(!/setTimeout|setInterval/.test(media),'No media timers or polling');
function eventTarget(){return {listeners:{},addEventListener(type,fn){(this.listeners[type] ||= []).push(fn)},emit(type,event={}){for(const fn of this.listeners[type]||[])fn(event)}};}
function setup({reduced=false,heroTop=0,aboutTop=5000,io=true,complete=false}={}){
 const events=[],observers=[],raf=[];
 function video(kind,top,height){
  const tag=html.match(new RegExp('<video\\b[^>]*data-video="'+kind+'"[^>]*>'))[0];
  const dataSrc=tag.match(/data-src="([^"]+)"/);
  const attrs={},writes=[];
  const v=Object.assign(eventTarget(),{dataset:{video:kind,...(dataSrc?{src:dataSrc[1]}:{})},top,height,
   preload:kind==='hero'?'auto':'none',paused:true,readyState:0,attempts:[],loadCount:0,pauseCount:0,
   autoplayWrites:0,sourceWrites:writes,muted:true,defaultMuted:true,playsInline:true,
   getBoundingClientRect(){return {top:this.top,bottom:this.top+this.height,width:390,height:this.height}},
   getAttribute(key){return attrs[key]||null},
   load(){this.loadCount++;events.push('load:'+kind)},
   pause(){this.paused=true;this.pauseCount++;events.push('pause:'+kind)},
   play(){this.paused=false;events.push('play:'+kind);let resolve,reject;const p=new Promise((a,b)=>{resolve=a;reject=b});this.attempts.push({resolve,reject});return p;},
   playing(){this.paused=false;this.readyState=3;this.emit('playing');this.attempts.at(-1)?.resolve()}
  });
  let autoplay=/\sautoplay(?:\s|>)/.test(tag);
  Object.defineProperty(v,'autoplay',{get(){return autoplay},set(value){autoplay=value;v.autoplayWrites++}});
  Object.defineProperty(v,'src',{get(){return attrs.src},set(value){
   attrs.src=value;events.push('source:'+kind);
   writes.push({src:value,muted:v.muted,defaultMuted:v.defaultMuted,playsInline:v.playsInline,autoplay,preload:v.preload});
  }});
  return v;
 }
 const hero=video('hero',heroTop,800),about=video('about',aboutTop,560),bubble=video('bubble',700,68),videos=[hero,about,bubble];
 const motion=Object.assign(eventTarget(),{matches:reduced});
 const doc=Object.assign(eventTarget(),{hidden:false,readyState:complete?'complete':'loading',querySelectorAll(){return videos}});
 const win=Object.assign(eventTarget(),{innerHeight:800,matchMedia(){return motion}});
 const ctx={window:win,document:doc,requestAnimationFrame(fn){raf.push(fn);return raf.length}};
 if(io){ctx.IntersectionObserver=class{constructor(fn,options){this.fn=fn;this.options=options;observers.push(this)}observe(){}};win.IntersectionObserver=ctx.IntersectionObserver;}
 vm.runInNewContext(media,ctx);
 return {hero,about,bubble,events,doc,motion,win,raf,
  view(updates){observers.find(x=>!x.options.rootMargin).fn(updates.map(([v,yes])=>({target:v,isIntersecting:yes,intersectionRatio:yes?1:0})))},
  near(v,yes){observers.find(x=>x.options.rootMargin).fn([{target:v,isIntersecting:yes}])},
  reduce(yes){motion.matches=yes;motion.emit('change')},hidden(yes){doc.hidden=yes;doc.emit('visibilitychange')},
  loaded(){doc.readyState='complete';win.emit('load')}
 };
}
const flush=async()=>{await Promise.resolve();await Promise.resolve()};
(async()=>{
 let checks=0;
 const check=(label,fn)=>{fn();checks++;console.log('PASS:',label)};
 check('Hero declares a real source and native muted inline looping autoplay at parse time',()=>{
  const hero=html.match(/<video\b[^>]*data-video="hero"[\s\S]*?<\/video>/)[0];
  for(const attribute of ['autoplay','muted','loop','playsinline']) assert(new RegExp('\\s'+attribute+'(?:\\s|>)').test(hero));
  assert(hero.includes('<source src="video/banner.mp4"'));assert(hero.includes('preload="auto"'));assert(!hero.includes('data-src'));
 });
 check('No video controls, Safari control-hiding CSS or gesture recovery',()=>{
  for(const [tag] of html.matchAll(/<video\b[^>]*>/g)) assert(!/\scontrols(?:\s|=|>)/.test(tag));
  assert(!html.includes('::-webkit-media-controls'));assert(!/addEventListener\(['"](?:click|keydown|pause)['"]/.test(media));
 });
 const normal=setup();
 check('Hero startup is untouched by JS; secondary videos remain deferred',()=>{
  assert.equal(normal.hero.loadCount,0);assert.equal(normal.hero.attempts.length,0);assert.equal(normal.hero.pauseCount,0);
  assert.equal(normal.hero.sourceWrites.length,0);assert.equal(normal.hero.autoplayWrites,0);
  assert.equal(normal.about.sourceWrites.length,0);assert.equal(normal.bubble.sourceWrites.length,0);
 });
 normal.hero.playing();normal.hero.emit('canplay');normal.view([[normal.hero,true]]);
 check('Successful native playback does not issue duplicate play calls or unlock secondary loads',()=>{
  assert.equal(normal.hero.attempts.length,0);assert.equal(normal.bubble.sourceWrites.length,0);
 });
 normal.near(normal.about,true);
 check('About prepares only metadata when nearby, without offscreen autoplay',()=>{
  assert.equal(normal.about.preload,'metadata');assert.equal(normal.about.autoplay,false);assert.equal(normal.about.sourceWrites.length,1);
  assert.equal(normal.about.loadCount,0);assert.equal(normal.about.attempts.length,0);
  const attached=normal.about.sourceWrites[0];for(const key of ['muted','defaultMuted','playsInline']) assert.equal(attached[key],true);
 });
 normal.view([[normal.hero,false],[normal.about,true]]);
 check('Prepared About resumes on entry without source reload; hero pauses offscreen',()=>{
  assert(normal.hero.paused);assert.equal(normal.about.preload,'auto');assert.equal(normal.about.autoplay,true);
  assert.equal(normal.about.sourceWrites.length,1);assert.equal(normal.about.loadCount,0);assert.equal(normal.about.attempts.length,1);
 });
 normal.about.playing();await flush();normal.view([[normal.about,true]]);normal.near(normal.about,true);
 check('Repeated observer callbacks never duplicate a play request',()=>assert.equal(normal.about.attempts.length,1));
 normal.loaded();
 check('Nova attaches once after page load and starts through native autoplay',()=>{
  assert.equal(normal.bubble.sourceWrites.length,1);assert.equal(normal.bubble.autoplay,true);assert.equal(normal.bubble.attempts.length,0);
  assert.equal(normal.bubble.loadCount,0);assert.equal(normal.about.attempts.length,1);
 });
 normal.bubble.playing();normal.hidden(true);
 check('Backgrounding pauses all videos',()=>{
  for(const v of [normal.hero,normal.about,normal.bubble]) assert(v.paused);
  assert.equal(normal.about.autoplay,false);assert.equal(normal.bubble.autoplay,false);
 });
 normal.hidden(false);
 check('Foregrounding resumes only visible videos without reloading',()=>{
  assert.equal(normal.hero.attempts.length,0);assert.equal(normal.about.attempts.length,2);assert.equal(normal.bubble.attempts.length,1);
  assert.equal(normal.about.sourceWrites.length,1);assert.equal(normal.bubble.sourceWrites.length,1);
 });
 normal.view([[normal.about,false]]);normal.about.playing();
 check('A late playing event cannot override offscreen pausing',()=>assert(normal.about.paused));
 normal.view([[normal.hero,true]]);
 check('Hero return resumes once without altering its native autoplay or source',()=>{
  assert.equal(normal.hero.attempts.length,1);assert.equal(normal.hero.autoplayWrites,0);assert.equal(normal.hero.sourceWrites.length,0);assert.equal(normal.hero.loadCount,0);
 });
 const independent=setup();independent.near(independent.about,true);independent.hero.emit('error');independent.loaded();
 check('About preparation and Nova loading do not depend on hero success',()=>{
  assert.equal(independent.about.sourceWrites.length,1);assert.equal(independent.bubble.sourceWrites.length,1);assert.equal(independent.hero.attempts.length,0);
 });
 const pending=setup({aboutTop:100});pending.view([[pending.about,false]]);pending.view([[pending.about,true]]);pending.loaded();
 check('An unsettled About play promise cannot block Nova',()=>{
  assert.equal(pending.about.attempts.length,1);assert.equal(pending.bubble.sourceWrites.length,1);
 });
 pending.about.paused=true;pending.about.attempts[0].reject({name:'AbortError'});await flush();
 pending.about.emit('canplay');pending.doc.emit('click');pending.view([[pending.about,true]]);
 check('Rejected play promises are handled without retries, gesture logic or a permanent failure latch',()=>assert.equal(pending.about.attempts.length,1));
 pending.view([[pending.about,false]]);pending.view([[pending.about,true]]);
 check('A later genuine visibility return can resume after a rejection',()=>assert.equal(pending.about.attempts.length,2));
 const reduced=setup({reduced:true,aboutTop:900});reduced.loaded();reduced.hero.playing();
 check('Reduced motion pauses the native hero and prevents lazy video attachment',()=>{
  assert(reduced.hero.paused);assert.equal(reduced.hero.loadCount,0);assert.equal(reduced.hero.attempts.length,0);
  assert.equal(reduced.about.sourceWrites.length,0);assert.equal(reduced.bubble.sourceWrites.length,0);
 });
 reduced.reduce(false);
 check('Turning reduced motion off resumes hero and enables normal deferred loading',()=>{
  assert.equal(reduced.hero.attempts.length,1);assert.equal(reduced.about.sourceWrites.length,1);assert.equal(reduced.bubble.sourceWrites.length,1);
 });
 reduced.reduce(true);reduced.bubble.playing();
 check('Turning reduced motion on pauses without source removal/load cycles',()=>{
  for(const v of [reduced.hero,reduced.about,reduced.bubble]){assert(v.paused);assert.equal(v.loadCount,0);}
  assert.equal(reduced.about.sourceWrites.length,1);assert.equal(reduced.bubble.sourceWrites.length,1);
 });
 const deep=setup({heroTop:-5000,aboutTop:100});
 check('Deep links pause hero and attach visible About for native autoplay',()=>{
  assert(deep.hero.paused);assert.equal(deep.hero.attempts.length,0);assert.equal(deep.about.sourceWrites.length,1);
  assert.equal(deep.about.autoplay,true);assert.equal(deep.about.attempts.length,0);
 });
 const complete=setup({complete:true});
 check('Initialization after page load does not miss Nova deferral release',()=>assert.equal(complete.bubble.sourceWrites.length,1));
 const hidden=setup();hidden.hidden(true);hidden.loaded();
 check('Page load in a background tab does not attach Nova',()=>assert.equal(hidden.bubble.sourceWrites.length,0));
 hidden.hidden(false);check('Returning to the page permits deferred Nova autoplay',()=>{
  assert.equal(hidden.bubble.sourceWrites.length,1);assert.equal(hidden.bubble.attempts.length,0);
 });
 const offscreen=setup();offscreen.view([[offscreen.bubble,false]]);offscreen.loaded();
 check('Offscreen Nova stays deferred even after page load',()=>assert.equal(offscreen.bubble.sourceWrites.length,0));
 offscreen.view([[offscreen.bubble,true]]);check('Nova starts on entry with no click or manual initial play',()=>{
  assert.equal(offscreen.bubble.sourceWrites.length,1);assert.equal(offscreen.bubble.attempts.length,0);
 });
 const fallback=setup({io:false});fallback.hero.top=-2000;fallback.about.top=100;fallback.win.emit('scroll');
 while(fallback.raf.length) fallback.raf.shift()();
 check('No-IntersectionObserver fallback preserves offscreen pause and lazy loading',()=>{
  assert(fallback.hero.paused);assert.equal(fallback.about.sourceWrites.length,1);assert.equal(fallback.about.autoplay,true);
 });
 const denied=setup();denied.view([[denied.hero,false]]);denied.view([[denied.hero,true]]);
 denied.hero.paused=true;denied.hero.attempts[0].reject({name:'NotAllowedError'});await flush();
 denied.hero.emit('canplay');denied.doc.emit('click');
 check('A browser autoplay denial is caught without forcing retries or exposing controls',()=>assert.equal(denied.hero.attempts.length,1));
 const failed=setup();failed.hero.emit('error');failed.hero.emit('canplay');failed.doc.emit('click');
 check('Media errors do not trigger reload/retry cycles',()=>{
  assert.equal(failed.hero.loadCount,0);assert.equal(failed.hero.attempts.length,0);
 });
 const stale=setup();stale.view([[stale.hero,false]]);stale.view([[stale.hero,true]]);stale.view([[stale.hero,false]]);
 stale.hero.attempts[0].resolve();await flush();stale.hero.playing();
 check('A stale completion cannot undo controller pausing',()=>assert(stale.hero.paused));
 check('No recovery counters, promise-priority gates or source-reset calls remain',()=>{
  assert(!/recoveryUsed|priorityReleased|primaryWaiting|\.load\(|removeAttribute|function recover|function gesture/.test(media));
 });
 console.log(`${checks} media controller regression checks passed.`);
})().catch(error=>{console.error(error);process.exitCode=1});
