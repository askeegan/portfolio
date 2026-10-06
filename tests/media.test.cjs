// Run: node tests/media.test.cjs. No browser or installed dependencies required.
// Executes the real inline controller with controlled media events and play promises.
// This checks controller behavior; it does not emulate Safari's media decoder or policies.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const media=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('// Media starts independently'))[1];
assert(!/setTimeout|setInterval/.test(media),'No media timers or polling');
function eventTarget(){return {listeners:{},addEventListener(type,fn){(this.listeners[type] ||= []).push(fn)},emit(type,event={}){for(const fn of this.listeners[type]||[])fn(event)}};}
function setup({reduced=false,heroTop=0,aboutTop=5000,io=true}={}){
 const events=[],observers=[],raf=[];
 function video(kind,top,height){
  const src={dataset:{src:'video/'+kind+'.mp4'},attrs:{},set src(v){this.attrs.src=v;events.push('source:'+kind)},get src(){return this.attrs.src},removeAttribute(k){delete this.attrs[k]}};
  return Object.assign(eventTarget(),{dataset:{video:kind},top,height,preload:'none',paused:true,readyState:0,attempts:[],loadCount:0,pauseCount:0,muted:false,defaultMuted:false,playsInline:false,
   getBoundingClientRect(){return {top:this.top,bottom:this.top+this.height,width:390,height:this.height}},querySelectorAll(){return [src]},source:src,
   load(){this.loadCount++;events.push('load:'+kind)},pause(){this.paused=true;this.pauseCount++;events.push('pause:'+kind)},
   play(){this.paused=false;events.push('play:'+kind);let resolve,reject;const p=new Promise((a,b)=>{resolve=a;reject=b});this.attempts.push({resolve,reject});return p;},
   playing(){this.paused=false;this.readyState=3;this.emit('playing');this.attempts.at(-1)?.resolve()}
  });
 }
 const hero=video('hero',heroTop,800),about=video('about',aboutTop,560),bubble=video('bubble',700,68),videos=[hero,about,bubble];
 const motion=Object.assign(eventTarget(),{matches:reduced});
 const doc=Object.assign(eventTarget(),{hidden:false,querySelectorAll(){return videos}});
 const win=Object.assign(eventTarget(),{innerHeight:800,matchMedia(){return motion}});
 const ctx={window:win,document:doc,requestAnimationFrame(fn){raf.push(fn);return raf.length}};
 if(io){ctx.IntersectionObserver=class{constructor(fn,options){this.fn=fn;this.options=options;observers.push(this)}observe(){}};win.IntersectionObserver=ctx.IntersectionObserver;}
 vm.runInNewContext(media,ctx);
 return {hero,about,bubble,events,doc,motion,win,raf,
  view(updates){observers.find(x=>!x.options.rootMargin).fn(updates.map(([v,yes])=>({target:v,isIntersecting:yes,intersectionRatio:yes?1:0})))},
  near(v,yes){observers.find(x=>x.options.rootMargin).fn([{target:v,isIntersecting:yes}])},
  reduce(yes){motion.matches=yes;motion.emit('change')},hidden(yes){doc.hidden=yes;doc.emit('visibilitychange')}
 };
}
const flush=async()=>{await Promise.resolve();await Promise.resolve()};
(async()=>{
 let checks=0;
 const check=(label,fn)=>{fn();checks++;console.log('PASS:',label)};
 const normal=setup();
 check('Hero loads first; About and Nova stay deferred',()=>{
  assert.equal(normal.hero.loadCount,1);assert.equal(normal.hero.attempts.length,1);
  assert.equal(normal.about.loadCount,0);assert.equal(normal.bubble.loadCount,0);
  for(const key of ['muted','defaultMuted','playsInline']) assert.equal(normal.hero[key],true);
 });
 normal.hero.playing();await flush();
 normal.hero.emit('canplay');normal.view([[normal.hero,true]]);
 check('Successful playback does not issue duplicate play calls',()=>{
  assert.equal(normal.hero.attempts.length,1);assert.equal(normal.bubble.attempts.length,1);
 });
 normal.near(normal.about,true);
 check('About still prepares metadata only while near and offscreen',()=>{
  assert.equal(normal.about.preload,'metadata');assert.equal(normal.about.loadCount,1);assert.equal(normal.about.attempts.length,0);
 });
 normal.view([[normal.hero,false],[normal.about,true]]);
 check('About plays on entry without reloading; hero pauses offscreen',()=>{
  assert(normal.hero.paused);assert.equal(normal.about.preload,'auto');assert.equal(normal.about.loadCount,1);assert.equal(normal.about.attempts.length,1);
 });
 const abort=setup();abort.hero.paused=true;abort.hero.attempts[0].reject({name:'AbortError'});await flush();
 check('Transient interruption is recoverable and releases Nova',()=>{
  assert.equal(abort.hero.dataset.playbackState,'interrupted');assert.equal(abort.hero.attempts.length,1);assert.equal(abort.bubble.attempts.length,1);
 });
 abort.hero.readyState=3;abort.hero.emit('canplay');
 check('Readiness allows one automatic recovery without reloading',()=>{
  assert.equal(abort.hero.attempts.length,2);assert.equal(abort.hero.loadCount,1);
 });
 abort.hero.paused=true;abort.hero.attempts[1].reject({name:'AbortError'});await flush();
 for(let i=0;i<10;i++){abort.hero.emit('canplay');abort.hero.emit('loadeddata');abort.view([[abort.hero,true]]);}
 check('Repeated readiness/visibility callbacks cannot form a retry loop',()=>assert.equal(abort.hero.attempts.length,2));
 abort.doc.emit('click');abort.doc.emit('keydown');
 check('A gesture can recover an exhausted interruption but cannot duplicate a pending request',()=>assert.equal(abort.hero.attempts.length,3));
 abort.hero.playing();await flush();
 check('Recovered playback returns to playing',()=>assert.equal(abort.hero.dataset.playbackState,'playing'));
 // Native pause, not the controller's offscreen/background pause.
 const native=setup();native.hero.playing();await flush();native.hero.paused=true;native.hero.emit('pause');
 check('Native pause reconciles state and allows one ready recovery',()=>assert.equal(native.hero.attempts.length,2));
 native.hero.playing();await flush();native.hero.paused=true;native.hero.emit('pause');native.hero.emit('canplay');
 check('Automatic budget is not reset on success, preventing pause/play cycles',()=>{
  assert.equal(native.hero.attempts.length,2);assert.equal(native.hero.dataset.playbackState,'interrupted');
 });
 native.doc.emit('click');native.hero.playing();await flush();
 native.hero.emit('pause');
 check('Stale native pause events do not interrupt a resumed video',()=>assert.equal(native.hero.attempts.length,3));
 native.view([[native.hero,false]]);native.hero.emit('pause');native.hero.emit('canplay');
 check('Intentional offscreen pause is not undone by queued media events',()=>assert.equal(native.hero.attempts.length,3));
 native.view([[native.hero,true]]);native.hero.playing();await flush();
 native.hero.paused=true;native.hero.emit('pause');
 check('A genuinely new visible session gets one recovery allowance',()=>assert.equal(native.hero.attempts.length,5));
 const denied=setup();denied.hero.paused=true;denied.hero.attempts[0].reject({name:'NotAllowedError'});await flush();
 denied.hero.readyState=4;denied.hero.emit('canplay');denied.view([[denied.hero,false]]);denied.view([[denied.hero,true]]);denied.hidden(true);denied.hidden(false);
 check('Autoplay denial survives readiness, viewport re-entry and tab changes',()=>{
  assert.equal(denied.hero.attempts.length,1);assert.equal(denied.hero.dataset.playbackState,'blocked');
 });
 denied.doc.emit('click');check('Autoplay denial retries only on a gesture',()=>assert.equal(denied.hero.attempts.length,2));
 const failed=setup();failed.hero.emit('error');failed.hero.readyState=4;failed.hero.emit('canplay');failed.doc.emit('click');
 check('Real media errors are not automatically retried',()=>assert.equal(failed.hero.attempts.length,1));
 for(const event of ['loadeddata','canplay','stalled','suspend']){
  const pending=setup();pending.near(pending.about,true);pending.hero.readyState=event==='loadeddata'?2:3;pending.hero.emit(event);
  check(`Unsettled initial promise cannot hold Nova after ${event}`,()=>{
   assert.equal(pending.hero.attempts.length,1);assert.equal(pending.bubble.attempts.length,1);
   assert.equal(pending.about.loadCount,0,'Do not change About preparation priority');
  });
 }
 const quiet=setup();quiet.doc.emit('click');
 check('User interaction also releases Nova from a quiet unsettled primary request',()=>{
  assert.equal(quiet.bubble.attempts.length,1);assert.equal(quiet.hero.attempts.length,1);
 });
 const hidden=setup();hidden.hero.readyState=3;hidden.hidden(true);
 hidden.hero.emit('pause');hidden.hero.emit('canplay');hidden.hero.attempts[0].reject({name:'AbortError'});await flush();
 check('Backgrounded videos never recover or start Nova',()=>{
  assert.equal(hidden.hero.attempts.length,1);assert.equal(hidden.bubble.attempts.length,0);
 });
 hidden.hidden(false);check('Foregrounding resumes visible playback',()=>assert.equal(hidden.hero.attempts.length,2));
 const reduced=setup({reduced:true});reduced.hero.emit('canplay');reduced.doc.emit('click');
 check('Reduced motion still attaches no sources and plays nothing',()=>{
  for(const v of [reduced.hero,reduced.about,reduced.bubble]) assert.equal(v.loadCount,0);
 });
 const toggle=setup();toggle.reduce(true);toggle.hero.emit('pause');toggle.hero.emit('canplay');toggle.doc.emit('click');
 toggle.hero.attempts[0].reject({name:'AbortError'});await flush();
 check('Switching to reduced motion unloads and cancels pending attempts safely',()=>{
  assert(!toggle.hero.source.src);assert.equal(toggle.hero.preload,'none');assert.equal(toggle.hero.attempts.length,1);
 });
 toggle.reduce(false);check('Turning reduced motion off restores initial loading priority',()=>{
  assert.equal(toggle.hero.attempts.length,2);assert.equal(toggle.bubble.loadCount,0);
 });
 const stale=setup();stale.view([[stale.hero,false]]);stale.view([[stale.hero,true]]);
 const bubbleLoads=stale.bubble.loadCount;
 stale.hero.attempts[0].resolve();await flush();
 check('Late resolution from an old attempt cannot mark a new attempt playing',()=>{
  assert.equal(stale.hero.dataset.playbackState,'loading');assert.equal(stale.bubble.loadCount,bubbleLoads);
 });
 stale.hero.playing();await flush();
 check('The current attempt still completes normally',()=>assert.equal(stale.hero.dataset.playbackState,'playing'));
 const deep=setup({heroTop:-5000,aboutTop:100});
 check('Deep links start visible About independently of the hero',()=>{
  assert.equal(deep.hero.loadCount,0);assert.equal(deep.about.attempts.length,1);
 });
 const earlyPause=setup();earlyPause.hero.readyState=3;earlyPause.hero.paused=true;earlyPause.hero.emit('pause');
 earlyPause.hero.attempts[0].reject({name:'AbortError'});await flush();
 check('Native pause before initial promise settles invalidates the old rejection',()=>{
  assert.equal(earlyPause.hero.attempts.length,2);assert.equal(earlyPause.hero.dataset.playbackState,'loading');
 });
 earlyPause.hero.paused=true;earlyPause.hero.attempts[1].reject({name:'NotAllowedError'});await flush();
 earlyPause.hero.emit('pause');earlyPause.hero.emit('canplay');
 check('Denial during automatic recovery cannot be retried by subsequent native events',()=>{
  assert.equal(earlyPause.hero.attempts.length,2);assert.equal(earlyPause.hero.dataset.playbackState,'blocked');
 });
 const readyAbort=setup();readyAbort.hero.readyState=3;readyAbort.hero.paused=true;
 readyAbort.hero.attempts[0].reject({name:'AbortError'});await flush();
 check('A transient rejection after readiness gets one immediate bounded recovery',()=>assert.equal(readyAbort.hero.attempts.length,2));
 readyAbort.hero.paused=true;readyAbort.hero.attempts[1].reject({name:'AbortError'});await flush();
 check('Repeated ready-state rejection does not loop',()=>assert.equal(readyAbort.hero.attempts.length,2));
 console.log(`${checks} media controller regression checks passed.`);
})().catch(error=>{console.error(error);process.exitCode=1});
