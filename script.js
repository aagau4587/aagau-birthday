(() => {
  "use strict";

  const PIN = "4587";
  const SURPRISE_PIN = String.fromCharCode(50, 49, 50, 48);
  const JOURNEY_SLIDE_MS = 3800;
  const $ = id => document.getElementById(id);

  const lockScreen=$('lockScreen'), pinForm=$('pinForm'), pinInput=$('pinInput'), pinError=$('pinError');
  const journey=$('journey'), journeySlides=[...document.querySelectorAll('.journey-slide')], journeyStatus=$('journeyStatus'), journeyProgress=$('journeyProgress');
  const cupid=$('cupid'), birthday=$('birthday'), loveSong=$('loveSong'), musicButton=$('musicButton'), songFallback=$('songFallback');
  const memoriesButton=$('memoriesButton'), memoriesModal=$('memoriesModal'), closeMemories=$('closeMemories');
  const surpriseButton=$('surpriseButton'), surpriseModal=$('surpriseModal'), closeSurprise=$('closeSurprise'), surprisePinForm=$('surprisePinForm'), surprisePinInput=$('surprisePinInput'), surprisePinError=$('surprisePinError'), surpriseLock=$('surpriseLock'), surpriseVideoArea=$('surpriseVideoArea'), surpriseVideo=$('surpriseVideo');
  const archery=$('archery'), bow=$('bow'), arrow=$('arrow'), strL=$('strL'), strR=$('strR'), serving=$('serving'), tip=$('tip'), target=$('target'), targetHeart=$('targetHeart'), aim=$('aim'), heartFragments=$('heartFragments');

  let journeyIndex=0, journeyTimer=null, journeyPaused=false, journeyStarted=false;
  let cupidStarted=false, cupidPlayed=false, cupidDrawing=false, cupidStartX=0, cupidStartY=0, cupidStartDraw=0;
  let cupidMaxDraw=110, cupidCurDraw=0, pullUX=0, pullUY=1, arrowBaseX=0, arrowBaseY=0, svgScale=1;
  let musicStarted=false, cupidBeatTimer=null;
  const REST_NOCK=150, nockProxy={val:REST_NOCK};

  function showOnly(section){[lockScreen,journey,cupid,birthday].forEach(el=>el.hidden=el!==section)}

  function setJourneySlide(index){
    journeySlides.forEach((slide,i)=>slide.classList.toggle('active',i===index));
    journeyProgress.style.width=`${((index+1)/journeySlides.length)*100}%`;
  }
  function scheduleNextJourneySlide(){
    clearTimeout(journeyTimer); if(journeyPaused)return;
    journeyTimer=setTimeout(()=>{
      if(journeyPaused)return;
      if(journeyIndex<journeySlides.length-1){journeyIndex++;setJourneySlide(journeyIndex);scheduleNextJourneySlide()}
      else finishJourney();
    },JOURNEY_SLIDE_MS);
  }
  function startJourney(){
    journeyStarted=true;journeyIndex=0;journeyPaused=false;journey.classList.remove('paused');journeyStatus.textContent='OUR STORY IS PLAYING';setJourneySlide(0);scheduleNextJourneySlide();
  }
  function toggleJourneyPause(){
    if(!journeyStarted||cupidStarted)return;
    journeyPaused=!journeyPaused;journey.classList.toggle('paused',journeyPaused);
    if(journeyPaused){clearTimeout(journeyTimer);journeyStatus.textContent='OUR STORY IS PAUSED'}else{journeyStatus.textContent='OUR STORY IS PLAYING';scheduleNextJourneySlide()}
  }
  function finishJourney(){clearTimeout(journeyTimer);journeyStarted=false;startCupid()}

  function applyNock(){const y=nockProxy.val;strL.setAttribute('y2',y);strR.setAttribute('y2',y);serving.setAttribute('cy',y)}
  function setCupidDraw(d){
    cupidCurDraw=Math.max(0,Math.min(cupidMaxDraw,d));
    arrow.style.transform=`translate(${arrowBaseX}px,${arrowBaseY+cupidCurDraw}px)`;
    nockProxy.val=REST_NOCK+cupidCurDraw/svgScale;applyNock();aim.style.opacity=String(.55*(cupidCurDraw/cupidMaxDraw));
  }
  function refreshCupidRig(){
    const W=cupid.clientWidth||innerWidth,H=cupid.clientHeight||innerHeight,mobile=W<=700;
    const gripX=mobile?W*.24:W*.23,gripY=mobile?H*.70:H*.73,heartX=mobile?W*.69:W*.68,heartY=mobile?H*.31:H*.32;
    const aimRad=Math.atan2(heartY-gripY,heartX-gripX);pullUX=-Math.cos(aimRad);pullUY=-Math.sin(aimRad);
    archery.style.transform='none';archery.style.left='0px';archery.style.top='0px';arrow.style.transform='none';applyNock();
    const aR=archery.getBoundingClientRect(),bR=bow.getBoundingClientRect(),sR=serving.getBoundingClientRect(),rR=arrow.getBoundingClientRect();
    const scaleY=bR.height/300;svgScale=scaleY||1;
    const gripLX=(bR.left-aR.left)+150*(bR.width/320),gripLY=(bR.top-aR.top)+150*scaleY;
    const nockLX=(sR.left-aR.left)+sR.width/2,nockLY=(sR.top-aR.top)+sR.height/2;
    arrowBaseX=nockLX-((rR.left-aR.left)+rR.width/2);arrowBaseY=nockLY-((rR.top-aR.top)+rR.height/2);
    archery.style.left=`${gripX-gripLX}px`;archery.style.top=`${gripY-gripLY}px`;archery.style.transformOrigin=`${gripLX}px ${gripLY}px`;archery.style.transform=`rotate(${aimRad*180/Math.PI}deg)`;
    arrow.style.transform=`translate(${arrowBaseX}px,${arrowBaseY}px)`;
    cupidMaxDraw=Math.min(bR.height*.70,H*(mobile?.15:.16),mobile?82:118);cupidCurDraw=0;nockProxy.val=REST_NOCK;applyNock();
  }
  function startCupid(){
    cupidStarted=true;cupid.hidden=false;cupid.classList.remove('hit','shattered');cupidPlayed=false;heartFragments.innerHTML='';archery.style.opacity='0';target.style.opacity='0';target.style.transform='translateY(10px) scale(.9)';arrow.style.opacity='1';aim.style.opacity='0';
    setTimeout(()=>{refreshCupidRig();archery.style.opacity='1';target.style.opacity='1';target.style.transform='translateY(0) scale(1)';cupid.classList.add('cupid-ready');startCupidHeartBeat()},80);
  }
  function startCupidHeartBeat(){clearInterval(cupidBeatTimer);cupidBeatTimer=setInterval(()=>{if(cupidPlayed)return;targetHeart.animate([{transform:'scale(1)'},{transform:'scale(1.07)'},{transform:'scale(1)'}],{duration:850,easing:'ease-in-out'})},1500)}
  function stopCupidHeartBeat(){clearInterval(cupidBeatTimer);cupidBeatTimer=null}
  function springCupidBack(){const from=cupidCurDraw,start=performance.now();function step(now){const t=Math.min(1,(now-start)/520),ease=1-Math.pow(1-t,3);setCupidDraw(from*(1-ease));if(t<1)requestAnimationFrame(step)}requestAnimationFrame(step)}
  function createHeartShatter(){
    heartFragments.innerHTML='';const pieces=['♥','✦','✧','◆','•','💗'];
    for(let i=0;i<24;i++){const el=document.createElement('span');el.textContent=pieces[i%pieces.length];el.className='heart-fragment';el.style.left='50%';el.style.top='33%';const angle=2*Math.PI*i/24+(Math.random()-.5)*.4,dist=70+Math.random()*180;el.style.setProperty('--dx',`${Math.cos(angle)*dist}px`);el.style.setProperty('--dy',`${Math.sin(angle)*dist}px`);el.style.setProperty('--rot',`${-180+Math.random()*360}deg`);el.style.setProperty('--delay',`${Math.random()*80}ms`);el.style.fontSize=`${10+Math.random()*18}px`;heartFragments.appendChild(el)}
  }
  function fireCupid(){
    if(cupidPlayed)return;cupidPlayed=true;stopCupidHeartBeat();aim.style.opacity='0';cupid.classList.add('shooting');
    const tRect=target.getBoundingClientRect(),tipRect=tip.getBoundingClientRect(),tipX=tipRect.left+tipRect.width/2,tipY=tipRect.top+tipRect.height/2,heartX=tRect.left+tRect.width/2,heartY=tRect.top+tRect.height/2;
    const dx=heartX-tipX,dy=heartY-tipY,distance=Math.hypot(dx,dy),duration=Math.max(520,Math.min(900,distance*1.25));
    const startX=arrowBaseX,startY=arrowBaseY+cupidCurDraw,endX=startX+dx/svgScale,endY=startY+dy/svgScale,start=performance.now();
    function fly(now){const t=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-t,3);arrow.style.transform=`translate(${startX+(endX-startX)*ease}px,${startY+(endY-startY)*ease}px)`;if(t<1)requestAnimationFrame(fly);else impactCupid()}requestAnimationFrame(fly);
  }
  function impactCupid(){
    cupid.classList.add('hit');targetHeart.style.transform='scale(1.16)';setTimeout(()=>{createHeartShatter();cupid.classList.add('shattered')},120);startMusicAtImpact();
  }
  function startMusicAtImpact(){
    if(musicStarted){setTimeout(showBirthday,1300);return}
    loveSong.currentTime=0;loveSong.volume=.55;
    loveSong.play().then(()=>{musicStarted=true;musicButton.hidden=false;songFallback.hidden=true}).catch(()=>{musicButton.hidden=false;songFallback.hidden=false});
    setTimeout(showBirthday,1300);
  }
  function showBirthday(){cupid.hidden=true;birthday.hidden=false;musicButton.hidden=false;createConfetti()}
  function createConfetti(){
    const box=$('confetti');box.innerHTML='';for(let i=0;i<48;i++){const p=document.createElement('span');p.textContent=['♥','✦','✧','•'][i%4];p.style.position='absolute';p.style.left=`${Math.random()*100}%`;p.style.top=`${-10-Math.random()*20}%`;p.style.fontSize=`${10+Math.random()*18}px`;p.style.color=['#ff70a9','#ffd1e2','#c6b7ff','#fff'][i%4];p.style.animation=`confettiFall ${4+Math.random()*5}s linear ${Math.random()*2}s infinite`;box.appendChild(p)}
    if(!document.getElementById('confettiStyle')){const s=document.createElement('style');s.id='confettiStyle';s.textContent='@keyframes confettiFall{from{transform:translateY(0) rotate(0);opacity:0}10%{opacity:1}to{transform:translateY(115vh) rotate(420deg);opacity:.1}}';document.head.appendChild(s)}
  }
  function toggleMusic(){
    if(loveSong.paused){loveSong.play().then(()=>{musicStarted=true;musicButton.textContent='🎵 Our song';songFallback.hidden=true}).catch(()=>songFallback.hidden=false)}else{loveSong.pause();musicButton.textContent='▶ Our song'}
  }

  pinForm.addEventListener('submit',e=>{e.preventDefault();if(pinInput.value.trim()!==PIN){pinError.textContent='Almost… try your favourite number ♥';pinInput.value='';pinInput.classList.remove('pin-wrong');void pinInput.offsetWidth;pinInput.classList.add('pin-wrong');return}pinError.textContent='';lockScreen.style.transition='opacity .9s ease,transform .9s ease';lockScreen.style.opacity='0';lockScreen.style.transform='scale(1.04)';setTimeout(()=>{showOnly(journey);lockScreen.style.opacity='';lockScreen.style.transform='';startJourney()},850)});
  journey.addEventListener('pointerdown',e=>{if(e.button===0||e.pointerType==='touch'||e.pointerType==='pen')toggleJourneyPause()});
  songFallback.addEventListener('click',toggleMusic);musicButton.addEventListener('click',toggleMusic);

  archery.addEventListener('pointerdown',e=>{if(cupidPlayed)return;cupidDrawing=true;cupidStartX=e.clientX;cupidStartY=e.clientY;cupidStartDraw=cupidCurDraw;archery.classList.add('is-drawing');try{archery.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
  archery.addEventListener('pointermove',e=>{if(!cupidDrawing||cupidPlayed)return;const proj=(e.clientX-cupidStartX)*pullUX+(e.clientY-cupidStartY)*pullUY;setCupidDraw(cupidStartDraw+proj)});
  function endCupidDraw(){if(!cupidDrawing)return;cupidDrawing=false;archery.classList.remove('is-drawing');if(cupidCurDraw>cupidMaxDraw*.26)fireCupid();else springCupidBack()}
  archery.addEventListener('pointerup',endCupidDraw);archery.addEventListener('pointercancel',endCupidDraw);archery.addEventListener('keydown',e=>{if(cupidPlayed)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();setCupidDraw(cupidMaxDraw*.9);fireCupid()}});
  window.addEventListener('resize',()=>{if(!cupid.hidden&&!cupidPlayed)refreshCupidRig()});

  memoriesButton.addEventListener('click',()=>{memoriesModal.hidden=false});closeMemories.addEventListener('click',()=>{memoriesModal.hidden=true});memoriesModal.addEventListener('click',e=>{if(e.target.dataset.close==='true')memoriesModal.hidden=true});

  surpriseButton.addEventListener('click',()=>{surpriseModal.hidden=false;surpriseLock.hidden=false;surpriseVideoArea.hidden=true;surprisePinInput.value='';surprisePinError.textContent='';setTimeout(()=>surprisePinInput.focus(),120)});
  closeSurprise.addEventListener('click',closeSurpriseModal);
  surpriseModal.addEventListener('click',e=>{if(e.target.dataset.surpriseClose==='true')closeSurpriseModal()});
  function closeSurpriseModal(){surpriseModal.hidden=true;surpriseVideo.pause();surpriseVideo.currentTime=0}
  surprisePinForm.addEventListener('submit',async e=>{
    e.preventDefault();const entered=surprisePinInput.value.trim().toUpperCase();
    if(entered!==SURPRISE_PIN){surprisePinError.textContent='Nahi… ek baar aur try kar ♥';surprisePinInput.value='';surprisePinInput.classList.remove('pin-wrong');void surprisePinInput.offsetWidth;surprisePinInput.classList.add('pin-wrong');return}
    surprisePinError.textContent='';surpriseLock.hidden=true;surpriseVideoArea.hidden=false;surpriseVideo.currentTime=0;
    try{await surpriseVideo.play()}catch(_){/* User can tap the video play control if autoplay is blocked. */}
  });

  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;memoriesModal.hidden=true;closeSurpriseModal()});
  document.querySelectorAll('.gallery img').forEach(img=>img.addEventListener('error',()=>{img.onerror=null;img.src='./public/photos/photo-placeholder.svg';img.style.objectFit='cover'}));
})();
