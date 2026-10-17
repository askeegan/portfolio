(function(){
  var motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileQuery=window.matchMedia('(max-width:720px)');
  var reduce=motionQuery.matches;

  // One frame scheduler; off-screen animation tasks do not read layout or update styles.
  var motionTasks=[], motionFrame=0;
  function wakeMotion(){
    if(!motionFrame && !document.hidden && !motionQuery.matches){motionFrame=requestAnimationFrame(tickMotion);}
  }
  function tickMotion(now){
    motionFrame=0;
    if(document.hidden || motionQuery.matches) return;
    var any=false;
    motionTasks.forEach(function(task){if(task.active){task.draw(now);any=true;}});
    if(any) wakeMotion();
  }
  function animateInView(host,draw,margin){
    var task={draw:draw,active:true};
    motionTasks.push(task);
    draw(performance.now());
    if('IntersectionObserver' in window){
      var observer=new IntersectionObserver(function(entries){
        task.active=entries[0].isIntersecting;
        if(task.active) wakeMotion();
      },{rootMargin:(margin || 160)+'px'});
      observer.observe(host);
    }
    wakeMotion();
  }
  document.addEventListener('visibilitychange',wakeMotion);
  motionQuery.addEventListener('change',wakeMotion);

  // Mobile capabilities pin at the navbar; scroll distance advances the four rows.
  (function(){
    var list=document.querySelector('#approach .do-list');
    if(!list) return;
    var track=list.closest('.cap-scroll');
    var rows=[].slice.call(list.querySelectorAll('.do-item')), active=-1, queued=0, distance=640;
    var measuredWidth=null, measuredOrientation=null;
    function setMeasurement(name,value){
      if(track.style.getPropertyValue(name)!==value){track.style.setProperty(name,value);}
    }
    function measure(){
      if(mobileQuery.matches){
        var width=window.innerWidth;
        var orientation=window.screen && window.screen.orientation ? window.screen.orientation.type : window.orientation;
        // Browser-bar height changes must not resize the scroll track or shift its steps.
        if(width!==measuredWidth || orientation!==measuredOrientation){
          distance=Math.max(320,window.innerHeight*0.22*rows.length);
          measuredWidth=width;measuredOrientation=orientation;
        }
        setMeasurement('--cap-list-height',list.offsetHeight+'px');
        setMeasurement('--cap-distance',distance+'px');
      } else {
        measuredWidth=null;measuredOrientation=null;
        ['--cap-list-height','--cap-distance'].forEach(function(name){
          if(track.style.getPropertyValue(name)){track.style.removeProperty(name);}
        });
      }
      schedule();
    }
    function update(){
      queued=0;
      var next=-1;
      if(mobileQuery.matches){
        var pin=document.querySelector('nav').getBoundingClientRect().height+8;
        var bounds=track.getBoundingClientRect(), travelled=pin-bounds.top;
        if(travelled>=0 && bounds.bottom>pin){
          next=Math.min(rows.length-1,Math.floor(travelled/distance*rows.length));
        }
      }
      if(next===active) return;
      if(active>=0){rows[active].classList.remove('is-active');}
      if(next>=0){rows[next].classList.add('is-active');}
      active=next;
    }
    function schedule(){
      if(!mobileQuery.matches && active<0) return;
      if(!queued){queued=requestAnimationFrame(update);}
    }
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',measure);
    window.addEventListener('orientationchange',measure);
    if(window.screen && window.screen.orientation && window.screen.orientation.addEventListener){
      window.screen.orientation.addEventListener('change',measure);
    }
    mobileQuery.addEventListener('change',measure);
    if('ResizeObserver' in window){new ResizeObserver(measure).observe(list);}
    if(document.fonts && document.fonts.ready){document.fonts.ready.then(measure);}
    measure();update();
  })();

  // Mobile overlay, background scroll lock and a measured fixed-header offset.
  var nav=document.querySelector('nav'), menu=document.getElementById('navMenu');
  var navLinks=document.getElementById('mainNav'), mobileMenu=document.getElementById('mobileMenu');
  var menuOpened=false, menuScroll=0, menuBodyTop='', menuFocusTimer=0, menuBackground=[];
  function updateNavScroll(){
    nav.classList.toggle('is-scrolled',(menuOpened ? menuScroll : window.scrollY)>12);
  }
  function setMenu(open){
    open=!!(open && mobileQuery.matches);
    navLinks.inert=mobileQuery.matches;
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open ? 'Close navigation' : 'Open navigation');
    if(open===menuOpened){updateNavScroll();return;}
    clearTimeout(menuFocusTimer);
    menuOpened=open;
    nav.classList.toggle('is-menu-open',open);
    mobileMenu.classList.toggle('open',open);
    if(open){
      menuScroll=window.scrollY;menuBodyTop=document.body.style.top;
      mobileMenu.inert=false;mobileMenu.setAttribute('aria-hidden','false');
      menuBackground=[].slice.call(document.body.children).filter(function(el){return el!==nav && el!==mobileMenu && el.tagName!=='SCRIPT';})
        .map(function(el){var prior=el.inert;el.inert=true;return {el:el,prior:prior};});
      document.body.style.top=-menuScroll+'px';
      document.documentElement.classList.add('mobile-menu-open');
      menuFocusTimer=setTimeout(function(){mobileMenu.querySelector('a').focus({preventScroll:true});},motionQuery.matches ? 0 : 180);
    } else {
      if(mobileMenu.contains(document.activeElement)){menu.focus({preventScroll:true});}
      mobileMenu.inert=true;mobileMenu.setAttribute('aria-hidden','true');
      menuBackground.forEach(function(item){item.el.inert=item.prior;});menuBackground=[];
      document.documentElement.classList.remove('mobile-menu-open');
      document.body.style.top=menuBodyTop;
      window.scrollTo({top:menuScroll,left:0,behavior:'instant'});
    }
    updateNavScroll();
  }
  function updateNavHeight(){
    document.documentElement.style.setProperty('--nav-height',nav.getBoundingClientRect().height+'px');
  }
  menu.addEventListener('click',function(){setMenu(!menuOpened);});
  mobileMenu.querySelectorAll('a').forEach(function(link){link.addEventListener('click',function(){setMenu(false);});});
  document.addEventListener('keydown',function(e){
    if(!menuOpened) return;
    if(e.key==='Escape'){e.preventDefault();setMenu(false);menu.focus({preventScroll:true});return;}
    if(e.key==='Tab'){
      var focusable=[menu].concat([].slice.call(mobileMenu.querySelectorAll('a,button')));
      var index=focusable.indexOf(document.activeElement);
      if(index===-1 || (e.shiftKey && index===0) || (!e.shiftKey && index===focusable.length-1)){
        e.preventDefault();focusable[e.shiftKey ? focusable.length-1 : 0].focus({preventScroll:true});
      }
    }
  });
  window.addEventListener('scroll',updateNavScroll,{passive:true});
  mobileQuery.addEventListener('change',function(){setMenu(false);updateNavHeight();});
  if('ResizeObserver' in window){new ResizeObserver(updateNavHeight).observe(nav);}
  window.addEventListener('resize',updateNavHeight);
  setMenu(false);updateNavHeight();



  // hero name: split into letters, auto-fit to one full-width line, domino reveal (0 -> 100)
  var hn=document.getElementById('heroName');
  if(hn){
    var txt=hn.textContent, idx=0, mobileStart=0.2;
    hn.setAttribute('aria-label',txt);
    hn.innerHTML=txt.split(/\s+/).map(function(word){
      var html='<span class="hero-line"><span class="hero-line-inner">';
      for(var c=0;c<word.length;c++){
        html+='<span class="ch"><span class="chi" style="animation-delay:'+(idx*0.1).toFixed(2)+'s;--mobile-letter-delay:'+(mobileStart+c*0.1).toFixed(2)+'s">'+word[c]+'</span></span>';idx++;
      }
      mobileStart+=(word.length-1)*0.1+1.15+0.1;
      return html+'</span></span>';
    }).join('<span class="sp" aria-hidden="true"></span>');
    hn.closest('.hero').style.setProperty('--hero-details-delay',Math.max(0,mobileStart-2.45).toFixed(2)+'s');

    function fitHero(){
      hn.style.fontSize='';
      if(mobileQuery.matches){
        var lines=[].slice.call(hn.querySelectorAll('.hero-line-inner'));
        var actual=Math.max.apply(null,lines.map(function(line){return line.getBoundingClientRect().width;}));
        if(actual){
          var size=parseFloat(getComputedStyle(hn).fontSize);
          hn.style.fontSize=(size*Math.min(1,hn.clientWidth*0.98/actual))+'px';
        }
        return;
      }
      for(var pass=0;pass<3;pass++){
        var cs=parseFloat(getComputedStyle(hn).fontSize);
        var avail=hn.clientWidth, actual=hn.scrollWidth;
        if(!actual) break;
        hn.style.fontSize=(cs*(avail/actual)*0.992)+'px';
      }
    }
    fitHero();
    if(!reduce){
      document.documentElement.classList.add('anim');
      var nL=hn.querySelectorAll('.chi').length, total=mobileQuery.matches ? mobileStart-0.1 : (nL-1)*0.1+1.15;
      setTimeout(function(){hn.classList.add('revealed');},(total+0.15)*1000);
    } else { hn.classList.add('revealed'); }
    var rt; window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(fitHero,120);});
    if(document.fonts&&document.fonts.ready){document.fonts.ready.then(fitHero);}
  }

  // scroll-linked LETTER wave, smooth left-to-right sweep across a sentence (reused by #intro and #about)
  function setupWave(st){
    if(!st) return;
    // split text into words (kept whole so they never break) of masked letters
    function split(root){
      [].slice.call(root.childNodes).forEach(function(node){
        if(node.nodeType===3){
          var tokens=node.textContent.split(/(\s+)/), frag=document.createDocumentFragment();
          tokens.forEach(function(tok){
            if(tok===''){return;}
            if(/^\s+$/.test(tok)){ frag.appendChild(document.createTextNode(tok)); return; }
            var word=document.createElement('span'); word.className='word';
            for(var c=0;c<tok.length;c++){
              var rw=document.createElement('span'); rw.className='rw';
              var rwi=document.createElement('span'); rwi.className='rwi'; rwi.textContent=tok[c];
              rw.appendChild(rwi); word.appendChild(rw);
            }
            frag.appendChild(word);
          });
          root.replaceChild(frag,node);
        } else if(node.nodeType===1){ split(node); }
      });
    }
    split(st);
    var wraps=[].slice.call(st.querySelectorAll('.rw'));
    var inner=wraps.map(function(w){return w.firstChild;});
    var m=wraps.length;
    if(reduce){ inner.forEach(function(el){el.style.transform='none';}); return; }

    // cache each letter's layout offset (top within block) + horizontal centre, only changes on resize
    var offTop=new Array(m), cx=new Array(m), cur=new Array(m);
    for(var z=0;z<m;z++){cur[z]=0;}
    function measure(){
      var sb=st.getBoundingClientRect();
      for(var i=0;i<m;i++){ var r=wraps[i].getBoundingClientRect();
        offTop[i]=r.top-sb.top; cx[i]=(r.left+r.right)/2; }
    }
    measure();
    var ro; window.addEventListener('resize',function(){clearTimeout(ro);ro=setTimeout(measure,150);});
    if(document.fonts&&document.fonts.ready){document.fonts.ready.then(measure);}

    function ease(x){ return 1-Math.pow(1-x,3); }   // easeOutCubic
    var spread=0.78;                                // how far the wave trails across the sentence
    function frame(){
      var sb=st.getBoundingClientRect();
      var vh=window.innerHeight||document.documentElement.clientHeight;
      var vw=window.innerWidth||document.documentElement.clientWidth;
      if(sb.bottom>-160 && sb.top<vh+160){
        var startY=vh*0.90, endY=vh*0.56;
        for(var i=0;i<m;i++){
          var top=sb.top+offTop[i];
          var t=(startY-top)/(startY-endY); if(t<0)t=0; else if(t>1)t=1;   // vertical (per line) trigger
          var phase=(cx[i]/vw)*spread;                                      // horizontal position = wave
          var eff=(t-phase)/(1-spread); if(eff<0)eff=0; else if(eff>1)eff=1;
          eff=ease(eff);
          cur[i]+=(eff-cur[i])*0.085;                                       // lerp smoothing
          inner[i].style.transform='translateY('+((1-cur[i])*112).toFixed(2)+'%)';
        }
      }
    }
    animateInView(st,frame);
  }
  setupWave(document.getElementById('statementText'));
  setupWave(document.getElementById('aboutBig'));

  // about title "Behind the work": scroll-SCRUBBED elevator (letters rise left-to-right with scroll, reverse on scroll up)
  (function(){
    var at=document.getElementById('aboutTitle');
    if(!at) return;
    var txt=at.textContent;
    at.setAttribute('aria-label',txt);
    at.innerHTML=txt.split(/\s+/).map(function(word){
      var html='<span class="title-word">';
      for(var c=0;c<word.length;c++){html+='<span class="ch"><span class="chi">'+word[c]+'</span></span>';}
      return html+'</span>';
    }).join(' ');
    var chis=[].slice.call(at.querySelectorAll('.chi')), n=chis.length;
    if(reduce || !n){ chis.forEach(function(e){e.style.transform='none';}); return; }
    function ease(x){return 1-Math.pow(1-x,3);}
    var span=0.55;   // how far the per-letter stagger trails across the scrub
    animateInView(at,function(){
      var vh=window.innerHeight||document.documentElement.clientHeight;
      var r=at.getBoundingClientRect(), c=r.top+r.height/2;    // the title's own vertical centre
      var p=(vh*0.90-c)/(vh*0.40); if(p<0)p=0; else if(p>1)p=1; // title rising from 90% -> 50% of viewport = 0 -> 1
      for(var i=0;i<n;i++){
        var pc=(p-(i/n)*span)/(1-span); if(pc<0)pc=0; else if(pc>1)pc=1; pc=ease(pc);
        chis[i].style.transform='translateY('+((1-pc)*112).toFixed(2)+'%)';   // 1:1 with scroll, no lag either way
      }
    });
  })();

  // Let's Talk: hover swaps random letters to the accent colour (white falls down, accent drops in from above)
  [].slice.call(document.querySelectorAll('.cta-inner')).forEach(function(ctaInner){
    var ctaWords=ctaInner.querySelector('.cta-words');
    if(!ctaWords || reduce) return;
    var hoverQuery=window.matchMedia('(hover:hover) and (pointer:fine)');
    function autoMode(){return mobileQuery.matches || !hoverQuery.matches;}
    var raw=ctaWords.textContent, h='';
    for(var ci=0;ci<raw.length;ci++){
      var ch=raw[ci];
      if(ch===' '){ h+=' '; continue; }
      if(ch==="'"||ch==="’"||ch==="´"||ch==="‘"){ h+='<span class="apos">'+ch+'</span>'; continue; }
      var e=(ch==='&')?'&amp;':(ch==='<')?'&lt;':ch;
      h+='<span class="ltr"><span class="ltr-a">'+e+'</span><span class="ltr-b" aria-hidden="true">'+e+'</span></span>';
    }
    ctaWords.innerHTML=h;
    var ltrs=[].slice.call(ctaWords.querySelectorAll('.ltr')), swapTimers=[];
    function clearSwaps(){swapTimers.forEach(clearTimeout);swapTimers=[];ltrs.forEach(function(l){l.classList.remove('swapped');});}
    var previousSelection='';
    function animateLetters(){
      clearSwaps();
      var idx=ltrs.map(function(_,i){return i;});
      for(var a=idx.length-1;a>0;a--){var b=Math.floor(Math.random()*(a+1));var t=idx[a];idx[a]=idx[b];idx[b]=t;}
      var selected=idx.slice(0,Math.max(2,Math.round(ltrs.length*0.4)));
      var signature=selected.slice().sort(function(a,b){return a-b;}).join(',');
      if(signature===previousSelection){selected=selected.map(function(i){return (i+1)%ltrs.length;});}
      previousSelection=selected.slice().sort(function(a,b){return a-b;}).join(',');
      selected.forEach(function(i,k){swapTimers.push(setTimeout(function(){ltrs[i].classList.add('swapped');},k*55));});
    }
    ctaInner.addEventListener('mouseenter',function(){if(!autoMode()){animateLetters();}});
    ctaInner.addEventListener('mouseleave',function(){if(!autoMode()){clearSwaps();}});

    // Mobile repeats the full hover effect while visible, independently of scrolling.
    var active=false, nextChange=0, wasAuto=false;
    animateInView(ctaInner.closest('.cta'),function(now){
      if(!autoMode()){
        if(wasAuto){clearSwaps();ctaInner.classList.remove('auto-active');}
        active=false;nextChange=0;wasAuto=false;return;
      }
      wasAuto=true;
      if(!nextChange){nextChange=now+550;return;}
      if(now<nextChange) return;
      active=!active;
      ctaInner.classList.toggle('auto-active',active);
      if(active){animateLetters();}else{clearSwaps();}
      nextChange=now+(active ? 1500 : 750);
    });
  });

  // CV download: inside the Claude preview use the downloads capability; on a normal host let the <a download> work
  var deckBtn=document.querySelector('.deck-btn');
  if(deckBtn){
    deckBtn.addEventListener('click',function(e){
      if(!(window.claude && window.claude.use)) return;   // hosted site: native download link handles it
      e.preventDefault();
      (async function(){
        var dl=null; try{ dl=await window.claude.use('downloads'); }catch(err){}
        if(!dl){ window.open('cv.pdf','_blank'); return; }   // capability unavailable: open in a new tab
        try{
          var blob=await (await fetch('cv.pdf')).blob();
          await dl.save({filename:'Alejandro-Keegan-CV.pdf', data:blob});
        }catch(err){}
      })();
    });
  }

  // stats: count up 0 -> target (flip-clock feel) when scrolled into view, replay on re-enter
  var statVals=[].slice.call(document.querySelectorAll('.stat-val'));
  if(statVals.length){
    function runCount(el){
      var to=parseFloat(el.getAttribute('data-to'))||0, dur=1500, start=null;
      function step(ts){ if(start===null)start=ts; var p=Math.min((ts-start)/dur,1);
        var e=1-Math.pow(1-p,3); el.textContent=Math.round(e*to);
        if(p<1){requestAnimationFrame(step);} else {el.textContent=to;} }
      requestAnimationFrame(step);
    }
    if(reduce){ statVals.forEach(function(el){el.textContent=el.getAttribute('data-to');}); }
    else if('IntersectionObserver' in window){
      var so=new IntersectionObserver(function(es){es.forEach(function(e){
        if(e.isIntersecting){ runCount(e.target); so.unobserve(e.target); }  // count once, then stay
      });},{threshold:.6});
      statVals.forEach(function(el){so.observe(el);});
    } else { statVals.forEach(function(el){el.textContent=el.getAttribute('data-to');}); }
  }

  // headings: scroll-linked push from OUTSIDE the frame into place (reverses on scroll up)
  if(!reduce){
    function pxEase(x){ return 1-Math.pow(1-x,3); }
    function pushSetup(el,dir){            // dir -1 = from left, +1 = from right
      var base=0,cur=0,rt;
      var off=parseFloat(el.getAttribute('data-px-delay'))||0;  // fraction of vh: shifts band later so this part lags
      var isContact=!!el.closest('#contact');
      var anchor=isContact ? el.closest('#contact').querySelector('.eyebrow') : el;
      function measure(){ var t=el.style.transform; el.style.transform='none';
        var r=el.getBoundingClientRect();
        base = dir<0 ? (r.right+40) : ((window.innerWidth-r.left)+40);
        el.style.transform=t; }
      measure();
      if(document.fonts && document.fonts.ready){document.fonts.ready.then(measure);}
      window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(measure,150);});
      animateInView(isContact ? el.closest('#contact') : el.parentElement,function(){
        var mobileContact=isContact && mobileQuery.matches;
        var r=(mobileContact ? anchor : el).getBoundingClientRect(), vh=window.innerHeight||document.documentElement.clientHeight;
        var startY=vh*(0.95-off), endY=vh*(mobileContact ? 0.50 : ((isContact ? 0.45 : 0.6)-off));
        var p=(startY-r.top)/(startY-endY); if(p<0)p=0; else if(p>1)p=1; p=pxEase(p);
        cur+=(p-cur)*(isContact ? 0.08 : 0.12);
        // Keep easing through the final stretch instead of snapping at the scroll threshold.
        el.style.transform='translateX('+(dir*(1-cur)*base).toFixed(1)+'px)';
      });
    }
    [].slice.call(document.querySelectorAll('.px-l')).forEach(function(el){ pushSetup(el,-1); });
    [].slice.call(document.querySelectorAll('.px-r')).forEach(function(el){ pushSetup(el, 1); });

    // About support blocks: slide up from behind a mask, scroll-linked, ONE FULL AT A TIME (reversible)
    (function(){
      var ps=[].slice.call(document.querySelectorAll('#about .support .rise-in'));
      if(!ps.length) return;
      var startBase=0.94, bandW=0.14;   // staircase positions naturally stagger each block
      ps.forEach(function(el,i){
        var host=el.parentElement, cur=0;
        animateInView(host,function(){
          var r=host.getBoundingClientRect(), vh=window.innerHeight||document.documentElement.clientHeight;
          var startY=vh*startBase, endY=vh*(startBase-bandW);
          var p=(startY-r.top)/(startY-endY); if(p<0)p=0; else if(p>1)p=1; p=pxEase(p);
          cur+=(p-cur)*0.16;
          el.style.transform='translateY('+((1-cur)*110).toFixed(2)+'%)';
        });
      });
    })();

    // ID-size portrait fills the space right of the second step, sliding in with scroll.
    (function(){
      var host=document.querySelector('#about .about-me');
      var portrait=document.querySelector('#about .about-portrait-motion');
      if(!host || !portrait) return;
      var cur=0;
      animateInView(host,function(){
        var r=host.getBoundingClientRect(), vh=window.innerHeight;
        var p=(vh*0.94-r.top)/(vh*0.28);
        p=pxEase(Math.max(0,Math.min(1,p)));
        cur+=(p-cur)*0.16;
        var distance=Math.max(0,window.innerWidth-r.left+40);
        portrait.style.transform='translateX('+((1-cur)*distance).toFixed(2)+'px)';
      });
    })();

    // Guitar-string separators: pull the line toward the cursor, release = damped twang back to flat
    (function(){
      var strings=[].slice.call(document.querySelectorAll('.strings .string'));
      strings.forEach(function(el){
        var svg=el.querySelector('svg'), path=el.querySelector('path');
        var W=1,H=1,cy=0, pos=0, vel=0, target=0, cx=0;
        function size(){ var r=el.getBoundingClientRect(); W=Math.max(1,r.width); H=Math.max(1,r.height); cy=H-0.5; cx=W/2;
          svg.setAttribute('viewBox','0 0 '+W+' '+H); }
        function flat(){path.setAttribute('d','M0,'+cy+' L'+W+','+cy);}
        size();flat();
        if('ResizeObserver' in window){
          new ResizeObserver(function(){size();flat();}).observe(el);
        }
        if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches){
          window.addEventListener('resize',function(){size();flat();});return;
        }
        window.addEventListener('resize',size);
        el.addEventListener('pointerenter',function(){size();});
        el.addEventListener('pointermove',function(e){ var r=el.getBoundingClientRect();
          cx=e.clientX-r.left; target=(e.clientY-r.top)-cy; });
        el.addEventListener('pointerleave',function(){ target=0; });
        var stiff=0.11, damp=0.91;   // softer spring + more damping = smoother pull and settle
        animateInView(el,function(){
          vel+=(target-pos)*stiff; vel*=damp; pos+=vel;
          if(Math.abs(target)<0.01 && Math.abs(pos)<0.05 && Math.abs(vel)<0.05){ pos=0; vel=0; }
          path.setAttribute('d','M0,'+cy.toFixed(1)+' Q'+cx.toFixed(1)+','+(cy+pos).toFixed(1)+' '+W.toFixed(1)+','+cy.toFixed(1));
        });
      });
    })();
  }

  if(reduce){
    document.querySelectorAll('.string').forEach(function(el){
      function flat(){
        var r=el.getBoundingClientRect(), y=Math.max(0,r.height-0.5);
        el.querySelector('svg').setAttribute('viewBox','0 0 '+r.width+' '+r.height);
        el.querySelector('path').setAttribute('d','M0,'+y+' L'+r.width+','+y);
      }
      flat();window.addEventListener('resize',flat);
    });
  }

  // ---- chat assistant: keyword-matched FAQ (edit KB to add answers) ----
  (function(){
    var launch=document.getElementById('cbotLaunch'), panel=document.getElementById('cbotPanel'),
        closeBtn=document.getElementById('cbotClose'), body=document.getElementById('cbotBody'),
        chipsEl=document.getElementById('cbotChips'), form=document.getElementById('cbotForm'),
        input=document.getElementById('cbotInput');
    if(!launch||!panel) return;

    // FAQ content only; id/label also identify ambiguous matches and test expectations.
    // k = topic phrases, q = explicit question intent (higher priority), x = excluded phrases, exact = whole message.
    var KB=[
      {id:"new-builds",
       label:"new store builds",
       k:["new store","new website","new site","build a store","build my store","build my website","build a website","build a shopify store","build a shopify website","create a store","start a store","set up a store","setup a store","store from scratch","website from scratch","store from the ground up","custom ecommerce build","new shopify store","new shopify website","new ecommerce store","build an online store","build my shopify store","build me a website","build me a store","need a shopify store","build my site","build a site"],
       a:"Yes. Alex builds custom Shopify stores from the ground up, with thoughtful architecture, design implementation and functionality shaped around the brand and its customers. He can also handle the product, payment and app setup needed for launch."},
      {id:"redesigns",
       label:"redesigns and migrations",
       k:["redesign","redesigns","re design","revamp","rebuild","refresh","migrate","migration","migrations","replatform","re platform","existing store","current store","move my store","switch platforms"],
       q:["can you migrate","can alex migrate","can you redesign","can alex redesign","can you rebuild","can alex rebuild","can you refresh","can alex refresh"],
       a:"Alex redesigns and rebuilds existing stores, migrates between platforms or themes, and improves speed and conversion. Send the store URL and what you want to change to alejandrokeegandev@gmail.com."},
      {id:"shopify",
       label:"Shopify",
       k:["shopify","liquid","theme","themes","shopify plus","checkout","checkout extensibility","custom app","custom apps","shopify app","shopify apps","metafield","metafields"],
       a:"Shopify is Alex's home base: Liquid, custom themes, Shopify Plus, checkout extensibility, custom apps and migrations. He builds around the store's requirements, from storefront details to more complex functionality."},
      {id:"headless",
       label:"headless storefronts",
       k:["headless","headless commerce","headless shopify","shopify headless","hydrogen","next.js","nextjs","next js","react","storefront api","vercel","composable","jamstack"],
       a:"Alex builds headless storefronts with Next.js or Hydrogen, using Shopify's Storefront API. He works across the architecture, React frontend and integrations to create a fast, custom shopping experience."},
      {id:"stack",
       label:"technology stack",
       k:["stack","technology","technologies","skills","framework","frameworks","typescript","graphql","tailwind","coding","programming languages"],
       q:["stack","technologies","frameworks","programming languages","what tools","which tools","what technology","which technology","what do you use","what does alex use","built with","code in"],
       a:"Alex works with Shopify, Liquid and the Storefront API, plus Next.js, React, TypeScript, Hydrogen, GraphQL, Tailwind and Vercel for headless builds. He chooses the stack to fit the project."},
      {id:"integrations",
       label:"features and integrations",
       k:["klaviyo","subscription","subscriptions","integrate","integration","integrations","quiz","quizzes","bundle","bundles","loyalty","email flow","email flows","email automation","third party","plugin","plugins","automation","custom features","payment setup","payment gateway"],
       q:["integrate","integration","integrations","email flow","email flows","email automation","loyalty program","payment setup","payment gateway"],
       a:"Alex builds custom ecommerce features and third-party integrations, including subscriptions, quizzes, bundles, Klaviyo and APIs. The approach depends on how your store and existing systems need to work together."},
      {id:"performance",
       label:"conversion and performance",
       k:["cro","conversion","conversions","performance","page speed","site speed","store speed","slow store","slow website","slow site","store is slow","site is slow","website is slow","core web vitals","optimize","optimise","optimization","optimisation","more sales","abandoned carts","cart abandonment","load time","loading time","loading slowly","ux"],
       q:["cro","conversion","conversions","performance","page speed","site speed","store speed","core web vitals","load time","loading time"],
       a:"Alex focuses on fast load times, clear UX and the details that help visitors buy. He improves Core Web Vitals and shopping flows with performance and conversion in mind."},
      {id:"availability",
       label:"availability",
       k:["available","availability","hire","hiring","full time","part time","contract","freelance","looking for work","taking projects","taking on projects","taking on new projects","work with you","work with alex","work together","join our team"],
       q:["available","availability","hiring","full time","part time","freelance","hire you","hire alex","work with you","work with alex","work together","taking on projects","taking on new projects","join our team"],
       a:"Alex is open to full-time, contract roles, and freelance projects. He works remotely with teams worldwide. Email alejandrokeegandev@gmail.com with the role or project you have in mind."},
      {id:"location",
       label:"location and timezone",
       k:["located","location","based","timezone","time zone","bali","indonesia","remote","working hours","time overlap","remotely"],
       q:["where are you based","where is alex based","where do you live","where does alex live","where are you located","where is alex located","timezone","time zone","working hours","time overlap","timezone overlap"],
       a:"Alex is based in Bali, Indonesia (UTC+8) and works remotely with teams and brands worldwide. For specific working hours or timezone overlap, check with him directly."},
      {id:"experience",
       label:"experience",
       k:["experience","background","senior","team lead","lead developer","junior","qualifications"],
       q:["years of experience","how much experience","how long have you been","how long has alex been","how long have you worked","how long has alex worked","how many stores","how many years","how many shopify stores","how many sites","how many websites","experience with"],
       a:"Alex is a senior Shopify and headless ecommerce developer. He's led development teams and shipped 50+ Shopify stores last year across wellness, beauty, jewellery and more."},
      {id:"portfolio",
       label:"portfolio",
       k:["portfolio","selected work","past work","previous work","your work","alex s work","recent work","live builds","case study","case studies","project examples","store examples","previous projects","past projects","previous clients","stores you built","stores has alex built","built before","showcase"],
       q:["portfolio","selected work","past work","previous work","see your work","see alex s work","case study","case studies","project examples","store examples","previous projects","past projects","previous clients","stores you built","stores has alex built","built before","what brands"],
       a:"Take a look at Selected Work on this site: live builds include Rooted Vitamins, REHAUS, Larsson & Jennings and Plantwell, plus more linked stores."},
      {id:"timelines",
       label:"timelines",
       k:["timeline","timelines","turnaround","deadline","rush","asap","delivery time","two days","2 days"],
       q:["timeline","timelines","turnaround","deadline","how long","how fast","how quickly","how quick","how soon","delivery time","two days","2 days"],
       a:"Once the design and scope are ready, Alex can often build a website refresh in around 2 days. Custom Shopify builds, migrations and headless projects can take longer depending on scope. He'll confirm a realistic timeline with you."},
      {id:"pricing",
       label:"pricing",
       k:["price","prices","pricing","cost","costs","budget","quote","rates","hourly","fee","fees","expensive","afford","invoice","deposit"],
       q:["price","prices","pricing","cost","costs","budget","quote","rates","hourly","how much","what do you charge","what does alex charge","payment terms","engagement structure","cost of","cost to","price of"],
       x:["shipping cost","shipping costs","cost of shipping","shipping fees","delivery fees"],
       a:"Pricing depends on scope. Share the project with Alex at alejandrokeegandev@gmail.com and he can provide a clear quote or recommend an engagement structure that fits the work."},
      {id:"process",
       label:"process",
       k:["process","workflow","next steps","next step","kickoff","kick off","onboarding"],
       q:["process","workflow","how do you work","how does alex work","how does it work","get started","getting started","kickoff","kick off","onboarding","next steps","next step"],
       a:"Alex starts by understanding the business, goals and scope, then agrees the approach, timeline and engagement. Once the design is ready, he builds, shares progress for feedback, and tests before launch."},
      {id:"services",
       label:"services",
       k:["services","service","specialty","specialties","specialise","specialises","specialize","specializes","specialisation","specialization"],
       q:["what do you do","what does alex do","what services","which services","what can alex help with","what can you help with","what do you offer","what does alex offer","what can you do","what can alex do","how can alex help me","how can you help me"],
       a:"Alex develops Shopify and headless storefronts: custom builds, redesigns, migrations, integrations and ongoing improvements. His work combines frontend engineering and architecture with UX, performance and conversion thinking."},
      {id:"support",
       label:"ongoing support",
       k:["support","maintenance","maintain","after launch","ongoing support","retainer","care plan","store updates","manage my store","look after my store"],
       q:["maintenance","after launch","ongoing support","retainer","care plan","store updates","manage my store","look after my store","ongoing shopify support","store support","do you offer support","does alex offer support","post launch"],
       a:"Yes. Alex can keep your store maintained and improving after launch, from fixes and updates to new features and performance work. Email alejandrokeegandev@gmail.com to discuss ongoing support."},
      {id:"why-alex",
       label:"why hire Alex",
       k:["why you","why alex","why hire","why work with","stand out"],
       q:["why hire","why work with","why should i hire","why should we hire","what makes alex different","what makes you different","why choose alex","why choose you","stand out","why hire alex","why hire you","why work with alex","why work with you"],
       a:"You work directly with a senior developer who sees the wider ecommerce picture. Alex combines development with UX, performance, CRO and design awareness, grounded in the brand, customer and business behind the build."},
      {id:"industries",
       label:"industries",
       k:["industry","industries","niche","sector","sectors","wellness","beauty","skincare","supplement","supplements","jewellery","jewelry","fashion","cosmetics","dtc"],
       q:["industry","industries","niche","sectors","types of brands","kinds of brands"],
       a:"Alex has built stores for wellness, beauty, skincare, supplements, jewellery and other DTC brands. He adapts the approach to the product, customers and business."},
      {id:"contact",
       label:"contact",
       k:["contact","email","e mail","linkedin","github","whatsapp","phone number"],
       q:["contact","email address","e mail address","your email","your e mail","alex s email","alex s e mail","get in touch","how do i reach","how can i reach","reach alex","reach you","talk to alex","talk to you","message alex","message you","book a call","schedule a call","contact alex","contact you"],
       a:"The easiest way to reach Alex is alejandrokeegandev@gmail.com. His LinkedIn and GitHub are in the footer too."},
      {id:"cv",
       label:"CV",
       k:["cv","resume","curriculum vitae"],
       q:["cv","resume","curriculum vitae"],
       a:"Alex's CV is available through the Download CV button on this site. You can also request it at alejandrokeegandev@gmail.com."},
      {id:"languages",
       label:"spoken languages",
       k:["english","spanish","german","spoken languages","speak"],
       q:["do you speak","does alex speak","spoken languages","what languages do you speak","what languages does alex speak","what language do you speak","what language does alex speak"],
       a:"Alex is a native Spanish speaker, speaks fluent English and some German. Clear communication from kickoff to launch is a priority for him."},
      {id:"references",
       label:"references",
       k:["reference","references","testimonial","testimonials","vouch"],
       q:["references","testimonials","client reviews","clients say","client feedback","who can vouch"],
       a:"Alex can share references and examples of past work on request. Email alejandrokeegandev@gmail.com to ask."},
      {id:"bots",
       label:"bots and assistants",
       k:["chatbot","chatbots","chat bot","bot like this","want a bot","bot for","own bot","get this bot","build a bot","build an assistant","ai assistant","faq assistant","assistant like nova","nova for my","who built nova","who made nova","who built this bot","who made this bot","who made this","who built this assistant","this bot","this assistant"],
       a:"Alex can build an assistant like Nova directly into a website, from a lightweight FAQ experience to a smarter AI assistant built around the business. Email alejandrokeegandev@gmail.com to discuss yours."},
      {id:"about-alex",
       label:"about Alex",
       k:["who is alex","who s alex","about alex","tell me about alex","who is alex keegan","tell me about alex keegan","about alex keegan","who s alex keegan"],
       exact:true,
       a:"Alex Keegan is a senior Shopify and headless ecommerce developer based in Bali. He builds custom storefronts with attention to the technology, shopping experience and business behind them."},
      {id:"about-nova",
       label:"about Nova",
       k:["who are you","who is nova","what is nova","about nova","your name","tell me about yourself","are you ai","are you a bot","are you alex","about you","what is this"],
       q:["who are you","who is nova","what is nova","about nova","your name","tell me about yourself","are you ai","are you a bot","are you alex","about you"],
       a:"I'm Nova, Alex Keegan's assistant. I answer FAQs about Alex's work, stack, availability, pricing and services using a set of prepared responses."},
      {id:"greetings",
       label:"greetings",
       k:["hello","hi","hey","hi there","hello there","hey there","hi nova","hello nova","hey nova","good morning","good afternoon","good evening","yo","howdy","greetings","good morning nova","how are you","hi how are you","hey how are you"],
       exact:true,
       a:"Hey! Ask me about Alex's stack, availability, work, pricing, or building a store."},
      {id:"goodbye",
       label:"thanks and goodbye",
       k:["thanks","thank you","cheers","thanks nova","thank you nova","thanks for your help","thank you for your help","appreciate it","bye","goodbye","see you","see you later","thanks bye","thanks goodbye"],
       exact:true,
       a:"Anytime! Reach out at alejandrokeegandev@gmail.com whenever you're ready."}
    ];
    var FALLBACK="I don't have an answer for that one. I can help with Alex's work, services, stack, availability, pricing and timelines. For anything else, email Alex at alejandrokeegandev@gmail.com.";
    var GREETING="Hey, I'm Nova, Alex Keegan's assistant. Ask me about Alex's work, stack, availability, pricing, timelines, or building your store.";
    var CHIPS=[["Want a bot like this?","want a bot like this"],["What's your stack?","stack"],["Available for work?","available"],["See your work","portfolio work"],["How to reach you?","contact email"]];

    function normalizeQuestion(text){
      return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/[^a-z0-9]+/g,' ').trim();
    }
    // Normalize once. Whole-token matching avoids e.g. "hi" inside "shipping".
    var FAQ_MATCHERS=KB.map(function(entry){
      return {entry:entry,exclude:(entry.x||[]).map(normalizeQuestion),phrases:entry.k.map(function(phrase){return {text:normalizeQuestion(phrase),intent:false};})
        .concat((entry.q||[]).map(function(phrase){return {text:normalizeQuestion(phrase),intent:true};}))};
    });
    function matchQuestion(text){
      var original=normalizeQuestion(text), question=original;
      // Ignore a conversational salutation only when a question follows it.
      question=question.replace(/^(?:hi|hello|hey|good morning|good afternoon|good evening)(?: nova)? +(?=.+)/,'');
      var padded=' '+question+' ', matches=[], bestScore=0;
      if(!question) return matches;
      FAQ_MATCHERS.forEach(function(item){
        if(item.exclude.some(function(phrase){return padded.indexOf(' '+phrase+' ')!==-1;})) return;
        var score=0;
        item.phrases.forEach(function(phrase){
          var found=item.entry.exact ? (question===phrase.text || original===phrase.text) : padded.indexOf(' '+phrase.text+' ')!==-1;
          // Use the strongest phrase, not overlapping/repeated keyword counts.
          var weight=(phrase.intent ? 100 : 0)+phrase.text.split(' ').length;
          if(found) score=Math.max(score,weight);
        });
        if(score>bestScore){bestScore=score;matches=[item.entry];}
        else if(score && score===bestScore){matches.push(item.entry);}
      });
      return matches;
    }
    function answer(text){
      var matches=matchQuestion(text);
      if(!matches.length) return FALLBACK;
      if(matches.length===1) return matches[0].a;
      return "Are you asking about "+matches.map(function(entry){return entry.label;}).join(' or ')+"? Ask about one at a time and I'll help.";
    }
    function addMsg(text,who){ var m=document.createElement('div'); m.className='cbot-msg '+who; m.textContent=text;
      body.appendChild(m); body.scrollTop=body.scrollHeight; return m; }
    function botReply(text){ setTimeout(function(){ addMsg(answer(text),'bot'); }, 280); }
    function send(text){ if(!text.trim())return; addMsg(text,'user'); botReply(text); }

    var started=false;
    function start(){ if(started)return; started=true;
      addMsg(GREETING,'bot');
      CHIPS.forEach(function(c){ var b=document.createElement('button'); b.className='cbot-chip'; b.type='button';
        b.textContent=c[0]; b.addEventListener('click',function(){ addMsg(c[0],'user'); botReply(c[1]); }); chipsEl.appendChild(b); });
    }
    var focusTimer=0;
    function fitChat(){
      var viewport=window.visualViewport;
      var height=viewport ? viewport.height : window.innerHeight;
      var keyboard=viewport ? Math.max(0,window.innerHeight-height-viewport.offsetTop) : 0;
      var keyboardOpen=keyboard>100 && panel.classList.contains('open');
      var safeBottom=parseFloat(getComputedStyle(launch).bottom)||16;
      var bottom=keyboardOpen ? keyboard+12 : safeBottom+80;
      var available=Math.max(120,height-(keyboardOpen ? 24 : safeBottom+96));
      panel.style.setProperty('--chat-bottom',bottom+'px');
      panel.style.setProperty('--chat-height',available+'px');
      panel.classList.toggle('compact',height<500);
      document.documentElement.classList.toggle('chat-keyboard-open',keyboardOpen);
    }
    function open(){
      panel.inert=false;panel.setAttribute('aria-hidden','false');
      launch.setAttribute('aria-expanded','true');
      panel.classList.add('open');start();fitChat();
      clearTimeout(focusTimer);
      focusTimer=setTimeout(function(){
        var target=window.matchMedia('(hover:hover) and (pointer:fine)').matches ? input : closeBtn;
        target.focus({preventScroll:true});
      },motionQuery.matches ? 0 : 300);
    }
    function close(){
      clearTimeout(focusTimer);
      // Move focus out before marking the dialog hidden.
      if(panel.contains(document.activeElement)){launch.focus({preventScroll:true});}
      panel.classList.remove('open');panel.inert=true;
      panel.setAttribute('aria-hidden','true');launch.setAttribute('aria-expanded','false');
      fitChat();
    }
    window.addEventListener('resize',fitChat);
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize',fitChat);
      window.visualViewport.addEventListener('scroll',fitChat);
    }
    document.addEventListener('keydown',function(e){if(!e.defaultPrevented && e.key==='Escape' && panel.classList.contains('open')){close();}});
    fitChat();
    launch.addEventListener('click',function(){ panel.classList.contains('open')?close():open(); });
    closeBtn.addEventListener('click',close);
    form.addEventListener('submit',function(e){ e.preventDefault(); send(input.value); input.value=''; });
  })();

  // marquee strip: showcase the stack (clearer to visitors than brand names)
  var names=['Shopify','Shopify Plus','Liquid','Headless Commerce','Hydrogen','Next.js','React','TypeScript','JavaScript','Storefront API','GraphQL','Tailwind','Vercel','Checkout Extensibility','CRO','Core Web Vitals','Git'];
  var strip=document.getElementById('strip');
  if(strip){var row=names.map(function(n){return '<span>'+n+'</span>';}).join('');strip.innerHTML=row+row;}


  // reveal on scroll (fade-ups)
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.14});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
  } else { document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');}); }

  // live-build tiles: scroll-scrubbed wipe — each image fills 0%->100% tied to scroll, reversible
  (function(){
    var tiles=Array.prototype.slice.call(document.querySelectorAll('.wtile'));
    if(!tiles.length) return;
    var items=tiles.map(function(t){return {im:t.querySelector('.wtile-img'),img:t.querySelector('img'),el:t};})
                   .filter(function(o){return o.im;});
    if(reduce){ items.forEach(function(o){o.im.style.clipPath='none';if(o.img)o.img.style.transform='none';}); return; }
    function cl(v){return v<0?0:v>1?1:v;}
    function tick(){
      var vh=window.innerHeight||document.documentElement.clientHeight;
      var start=vh*0.94, end=vh*0.42;   // begin near bottom, complete above mid-screen
      for(var i=0;i<items.length;i++){
        var o=items[i], r=o.el.getBoundingClientRect();
        var p=cl((start-r.top)/(start-end));
        o.im.style.clipPath='inset('+((1-p)*100).toFixed(2)+'% 0 0 0)';
        if(o.img) o.img.style.transform='scale('+(1+(1-p)*0.08).toFixed(4)+')';
      }
    }
    animateInView(document.getElementById('work'),tick);
  })();

  // Copy email: clipboard API with a real copy fallback and honest status.
  var btn=document.getElementById('copy'), copyTimer=0;
  if(btn){
    btn.setAttribute('aria-live','polite');
    btn.addEventListener('click',function(){
      var email=document.getElementById('email').textContent.trim();
      function status(success){
        clearTimeout(copyTimer);btn.textContent=success ? 'Copied ✓' : 'Select email';
        copyTimer=setTimeout(function(){btn.textContent='Copy';},1800);
      }
      function fallback(){
        var field=document.createElement('textarea');
        field.value=email;field.readOnly=true;
        field.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;';
        document.body.appendChild(field);field.focus({preventScroll:true});field.select();
        field.setSelectionRange(0,email.length);
        var copied=false;
        try{copied=document.execCommand('copy');}catch(err){}
        field.remove();btn.focus({preventScroll:true});
        if(!copied){
          var range=document.createRange();range.selectNodeContents(document.getElementById('email'));
          var selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
        }
        status(copied);
      }
      if(navigator.clipboard && window.isSecureContext){navigator.clipboard.writeText(email).then(function(){status(true);},fallback);}
      else {fallback();}
    });
  }

  // ---- custom cursor: dot tracks mouse, ring trails + stretches with movement ----
  var fine=window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if(fine && !reduce){
    var dot=document.createElement('div'); dot.className='cursor-dot';
    var ring=document.createElement('div'); ring.className='cursor-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.documentElement.classList.add('has-cursor');
    var mx=innerWidth/2,my=innerHeight/2, rx=mx,ry=my, px=mx,py=my, seen=false;
    addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;
      if(!seen){seen=true;rx=px=mx;ry=py=my;}},{passive:true});
    function curLoop(){
      dot.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)';
      rx+=(mx-rx)*0.2; ry+=(my-ry)*0.2;
      var dx=rx-px, dy=ry-py; px=rx; py=ry;
      var sp=Math.min(Math.sqrt(dx*dx+dy*dy),42), str=sp/42;
      var ang=Math.atan2(dy,dx)*180/Math.PI;
      ring.style.transform='translate('+rx+'px,'+ry+'px) translate(-50%,-50%) rotate('+ang+'deg) scale('+(1+str*0.55)+','+(1-str*0.32)+')';
      requestAnimationFrame(curLoop);
    }
    requestAnimationFrame(curLoop);
    document.querySelectorAll('a,button,.card,.mw,.seal,.copybtn').forEach(function(el){
      el.addEventListener('mouseenter',function(){ring.classList.add('hot');});
      el.addEventListener('mouseleave',function(){ring.classList.remove('hot');});
    });
    addEventListener('mouseleave',function(){dot.style.opacity='0';ring.style.opacity='0';});
    addEventListener('mouseenter',function(){dot.style.opacity='1';ring.style.opacity='1';});
  }

  // Use native scrolling on phones; retain Lenis on desktop.
  var lenis=null, lenisFrame=0;
  function lenisTick(now){
    lenisFrame=0;
    if(!lenis || document.hidden) return;
    lenis.raf(now);lenisFrame=requestAnimationFrame(lenisTick);
  }
  function configureScrolling(){
    var enabled=!motionQuery.matches && !mobileQuery.matches && window.Lenis;
    if(enabled && !lenis){lenis=new Lenis({lerp:0.1,wheelMultiplier:1,smoothWheel:true});}
    if(!enabled && lenis){lenis.destroy();lenis=null;}
    if(lenisFrame){cancelAnimationFrame(lenisFrame);lenisFrame=0;}
    if(lenis && !document.hidden){lenisFrame=requestAnimationFrame(lenisTick);}
  }
  mobileQuery.addEventListener('change',configureScrolling);
  motionQuery.addEventListener('change',configureScrolling);
  document.addEventListener('visibilitychange',configureScrolling);
  configureScrolling();
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var id=a.getAttribute('href');if(id.length<2) return;
      var target=document.getElementById(id.slice(1));if(!target) return;
      if(a.classList.contains('skip-link')) return;
      e.preventDefault();setMenu(false);
      var offset=nav.getBoundingClientRect().height+12;
      if(lenis){lenis.scrollTo(target,{offset:-offset});}
      else {
        window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+window.scrollY-offset),
          behavior:motionQuery.matches ? 'instant' : 'smooth'});
      }
      try{if(window.location.hash!==id){history.pushState(null,'',id);}}catch(err){}
    });
  });

document.documentElement.classList.add('site-ready');
})();
