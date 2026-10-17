// Media starts independently of the optional Lenis dependency below.
(function(){
  var motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function within(video,margin){
    var r=video.getBoundingClientRect();
    return r.width>0 && r.height>0 && r.bottom> -margin && r.top<window.innerHeight+margin;
  }
  var states=[].slice.call(document.querySelectorAll('[data-video]')).map(function(video){
    var sources=[].slice.call(video.querySelectorAll('source'));
    if(video.dataset.src) sources.push(video);
    return {video:video,kind:video.dataset.video,sources:sources,visible:within(video,0),
      near:within(video,600),loaded:false,pending:false,playing:false,attempt:0,played:false,failure:null,
      interrupted:false,recoveryUsed:false,priorityReleased:false};
  });
  function primaryWaiting(forNova){
    return states.some(function(s){return s.kind!=='bubble' && s.visible && !s.played && !s.failure &&
      !s.interrupted && !(forNova && s.priorityReleased);});
  }
  function preload(state,value){
    if(state.video.preload!==value) state.video.preload=value;
  }
  function prepare(state,value){
    state.video.muted=true;state.video.defaultMuted=true;state.video.playsInline=true;
    state.video.controls=false;
    preload(state,value);
    var added=!state.loaded;
    if(added){
      state.sources.forEach(function(source){source.src=source.dataset.src;});
      state.loaded=true;
    }
    // Arm native autoplay only with a source attached and visible playback approved.
    if(state.video.autoplay!==(value==='auto')) state.video.autoplay=value==='auto';
    if(added) state.video.load();
  }
  function pause(state){
    state.video.autoplay=false;
    state.interrupted=false;state.recoveryUsed=false;
    if(state.pending || state.playing || !state.video.paused){
      state.attempt++;state.pending=false;state.playing=false;state.video.pause();
      state.video.dataset.playbackState='paused';
    }
  }
  function recover(state,gesture){
    if(motion.matches || document.hidden || !state.visible || state.pending) return;
    if(state.failure && !(gesture && state.failure==='NotAllowedError')) return;
    if(!state.interrupted && state.failure!=='NotAllowedError') return;
    // At most one automatic recovery per visible session; genuine gestures can try again.
    if(!gesture && (state.recoveryUsed || state.video.readyState<3)) return;
    state.interrupted=false;state.failure=null;state.recoveryUsed=true;
    sync(state);
  }
  function interrupted(state){
    state.attempt++;state.pending=false;state.playing=false;state.interrupted=true;
    state.video.dataset.playbackState='interrupted';
    syncAll();recover(state,false);
  }
  function playing(state){
    if(motion.matches || document.hidden || !state.visible){pause(state);return;}
    if(state.video.paused){interrupted(state);return;}
    state.pending=false;state.playing=true;state.played=true;state.interrupted=false;state.failure=null;
    state.video.dataset.playbackState='playing';syncAll();
  }
  function requestPlay(state){
    if(state.pending || (state.playing && !state.video.paused) || state.failure || state.interrupted) return;
    state.pending=true;state.playing=false;
    var attempt=++state.attempt;
    state.video.dataset.playbackState='loading';
    function rejected(error){
      // A visibility change or source removal can cancel an older play promise.
      if(attempt!==state.attempt) return;
      if(error && error.name==='AbortError'){interrupted(state);return;}
      state.pending=false;state.playing=false;state.failure=error && error.name || 'PlaybackError';
      state.video.dataset.playbackState=state.failure==='NotAllowedError' ? 'blocked' : 'error';
      syncAll();
    }
    try{
      var promise=state.video.play();
      if(promise && promise.then){
        promise.then(function(){
          if(attempt!==state.attempt) return;
          playing(state);
        },rejected);
      }
    }catch(error){rejected(error);}
  }
  function sync(state){
    if(motion.matches){
      pause(state);preload(state,'none');
      if(state.loaded){
        state.sources.forEach(function(source){source.removeAttribute('src');});
        state.loaded=false;state.played=false;state.failure=null;state.priorityReleased=false;state.video.load();
      }
      return;
    }
    if(document.hidden){pause(state);preload(state,'none');return;}
    if(!state.visible){
      pause(state);
      if(state.kind==='about' && state.near && !primaryWaiting()) prepare(state,'metadata');
      else preload(state,'none');
      return;
    }
    // Keep the small Nova loop from competing with a visible primary video's first start.
    if(state.kind==='bubble' && !state.loaded && primaryWaiting(true)) return;
    prepare(state,'auto');
    requestPlay(state);
  }
  function syncAll(){states.forEach(sync);}
  function visibility(state,visible){
    if(visible && !state.visible){
      // A new visibility session must not bypass a genuine autoplay denial.
      if(state.failure!=='NotAllowedError') state.failure=null;
      state.interrupted=false;state.recoveryUsed=false;
    }
    state.visible=visible;
  }
  states.forEach(function(state){
    state.video.addEventListener('playing',function(){playing(state);});
    state.video.addEventListener('pause',function(){
      // Ignore our own pauses and stale queued events after playback has resumed.
      if(!state.video.paused || (!state.pending && !state.playing)) return;
      if(motion.matches || document.hidden || !state.visible){pause(state);return;}
      interrupted(state);
    });
    function releasePriority(){
      if(!state.loaded) return;
      // Nova need not wait for a play promise once a frame is ready or fetching stops.
      state.priorityReleased=true;syncAll();
    }
    state.video.addEventListener('loadeddata',releasePriority);
    state.video.addEventListener('canplay',function(){releasePriority();recover(state,false);});
    state.video.addEventListener('stalled',releasePriority);
    state.video.addEventListener('suspend',releasePriority);
    state.video.addEventListener('error',function(){
      state.attempt++;state.pending=false;state.playing=false;state.interrupted=false;state.failure='MediaError';
      state.video.dataset.playbackState='error';syncAll();
    });
  });
  if('IntersectionObserver' in window){
    var visibleObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var state=states.find(function(s){return s.video===entry.target;});
        visibility(state,entry.isIntersecting);
      });
      syncAll();
    },{threshold:0});
    states.forEach(function(state){visibleObserver.observe(state.video);});
    // Metadata only ahead of About; playback still requires actual viewport visibility.
    var prepareObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var state=states.find(function(s){return s.video===entry.target;});
        state.near=entry.isIntersecting;
      });
      syncAll();
    },{rootMargin:'600px 0px',threshold:0});
    states.filter(function(s){return s.kind==='about';}).forEach(function(s){prepareObserver.observe(s.video);});
  } else {
    // Event-driven visibility fallback for browsers without IntersectionObserver.
    var queued=false;
    function measure(){
      queued=false;
      states.forEach(function(s){visibility(s,within(s.video,0));s.near=within(s.video,600);});
      syncAll();
    }
    function schedule(){if(!queued){queued=true;requestAnimationFrame(measure);}}
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
  }
  motion.addEventListener('change',syncAll);
  document.addEventListener('visibilitychange',syncAll);
  // Autoplay denial requires a gesture; it can also recover an exhausted interruption.
  function gesture(){
    if(motion.matches || document.hidden) return;
    states.forEach(function(state){
      // A quiet, unsettled request must not keep Nova deferred after user interaction.
      if(state.visible && state.loaded && state.pending) state.priorityReleased=true;
      recover(state,true);
    });
    syncAll();
  }
  document.addEventListener('click',gesture);
  document.addEventListener('keydown',gesture);
  syncAll();
})();
