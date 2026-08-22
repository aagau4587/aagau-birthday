(() => {
  "use strict";

  const PIN = "4587";
  const SURPRISE_PIN = String.fromCharCode(50, 49, 50, 48);
  const JOURNEY_SLIDE_MS = 3800;
  const $ = id => document.getElementById(id);

  const lockScreen=$('lockScreen'), pinForm=$('pinForm'), pinInput=$('pinInput'), pinError=$('pinError');
  const journey=$('journey'), journeySlides=[...document.querySelectorAll('.journey-slide')], journeyStatus=$('journeyStatus'), journeyProgress=$('journeyProgress');
  const cupid=$('cupid'), birthday=$('birthday'), loveSong=$('loveSong'), memorySong=$('memorySong'), musicButton=$('musicButton'), songFallback=$('songFallback');
  const memoriesButton=$('memoriesButton'), memoriesModal=$('memoriesModal'), closeMemories=$('closeMemories'), memoryNowPlaying=$('memoryNowPlaying');
  const surpriseButton=$('surpriseButton'), surpriseModal=$('surpriseModal'), closeSurprise=$('closeSurprise'), surprisePinForm=$('surprisePinForm'), surprisePinInput=$('surprisePinInput'), surprisePinError=$('surprisePinError'), surpriseLock=$('surpriseLock'), surpriseVideoArea=$('surpriseVideoArea'), surpriseVideo=$('surpriseVideo'), surprisePlayButton=$('surprisePlayButton'), surpriseVideoError=$('surpriseVideoError');
  const archery=$('archery'), bow=$('bow'), arrow=$('arrow'), strL=$('strL'), strR=$('strR'), serving=$('serving'), tip=$('tip'), target=$('target'), targetHeart=$('targetHeart'), aim=$('aim'), heartFragments=$('heartFragments');

  let journeyIndex=0, journeyTimer=null, journeyPaused=false, journeyStarted=false;
  let cupidStarted=false, cupidPlayed=false, cupidDrawing=false, cupidStartX=0, cupidStartY=0, cupidStartDraw=0;
  let cupidMaxDraw=110, cupidCurDraw=0, pullUX=0, pullUY=1, arrowBaseX=0, arrowBaseY=0, svgScale=1;
  let musicStarted=false, cupidBeatTimer=null;
  let currentMemorySong=0;

  const REST_NOCK=150, nockProxy={val:REST_NOCK};

  // Each photo has its own song.
  // Upload these six files to public/music/ with exactly these names.
  const memorySongs = {
    1: "./public/music/photo1-song.mp3",
    2: "./public/music/photo2-song.mp3",
    3: "./public/music/photo3-song.mp3",
    4: "./public/music/photo4-song.mp3",
    5: "./public/music/photo5-song.mp3",
    6: "./public/music/photo6-song.mp3"
  };

  function showOnly(section){[lockScreen,journey,cupid,birthday].forEach(el=>el.hidden=el!==section)}

  function setJourneySlide(index){
    journeySlides.forEach((slide,i)=>slide.classList.toggle('active',i===index));
    journeyProgress.style.width=`${((index+1)/journeySlides.length)*100}%`;
  }

  function scheduleNextJourneySlide(){
    clearTimeout(journeyTimer);
    if(journeyPaused)return;
    journeyTimer=setTimeout(()=>{
      if(journeyPaused)return;
      if(journeyIndex<journeySlides.length-1){
        journeyIndex++;
        setJourneySlide(journeyIndex);
        scheduleNextJourneySlide();
      }else{
        finishJourney();
      }
    },JOURNEY_SLIDE_MS);
  }

  function startJourney(){
    journeyStarted=true;
    journeyIndex=0;
    journeyPaused=false;
    journey.classList.remove('paused');
    journeyStatus.textContent='OUR STORY IS PLAYING';
    setJourneySlide(0);
    scheduleNextJourneySlide();
  }

  function toggleJourneyPause(){
    if(!journeyStarted||cupidStarted)return;
    journeyPaused=!journeyPaused;
    journey.classList.toggle('paused',journeyPaused);
    if(journeyPaused){
      clearTimeout(journeyTimer);
      journeyStatus.textContent='OUR STORY IS PAUSED';
    }else{
      journeyStatus.textContent='OUR STORY IS PLAYING';
      scheduleNextJourneySlide();
    }
  }

  function finishJourney(){
    clearTimeout(journeyTimer);
    journeyStarted=false;
    startCupid();
  }

  function applyNock(){
    const y=nockProxy.val;
    strL.setAttribute('y2',y);
    strR.setAttribute('y2',y);
    serving.setAttribute('cy',y);
  }

  function setCupidDraw(d){
    cupidCurDraw=Math.max(0,Math.min(cupidMaxDraw,d));
    arrow.style.transform=`translate(${arrowBaseX}px,${arrowBaseY+cupidCurDraw}px)`;
    nockProxy.val=REST_NOCK+cupidCurDraw/svgScale;
    applyNock();
    aim.style.opacity=String(.55*(cupidCurDraw/cupidMaxDraw));
  }

  function refreshCupidRig(){
    const W=cupid.clientWidth||innerWidth,H=cupid.clientHeight||innerHeight,mobile=W<=700;
    const gripX=mobile?W*.24:W*.23,gripY=mobile?H*.70:H*.73,heartX=mobile?W*.69:W*.68,heartY=mobile?H*.31:H*.32;
    const aimRad=Math.atan2(heartY-gripY,heartX-gripX);
    pullUX=-Math.cos(aimRad);
    pullUY=-Math.sin(aimRad);
    archery.style.transform='none';
    archery.style.left='0px';
    archery.style.top='0px';
    arrow.style.transform='none';
    applyNock();

    const aR=archery.getBoundingClientRect(),bR=bow.getBoundingClientRect(),sR=serving.getBoundingClientRect(),rR=arrow.getBoundingClientRect();
    const scaleY=bR.height/300;
    svgScale=scaleY||1;
    const gripLX=(bR.left-aR.left)+150*(bR.width/320),gripLY=(bR.top-aR.top)+150*scaleY;
    const nockLX=(sR.left-aR.left)+sR.width/2,nockLY=(sR.top-aR.top)+sR.height/2;
    arrowBaseX=nockLX-((rR.left-aR.left)+rR.width/2);
    arrowBaseY=nockLY-((rR.top-aR.top)+rR.height/2);
    archery.style.left=`${gripX-gripLX}px`;
    archery.style.top=`${gripY-gripLY}px`;
    archery.style.transformOrigin=`${gripLX}px ${gripLY}px`;
    archery.style.transform=`rotate(${aimRad*180/Math.PI}deg)`;
    arrow.style.transform=`translate(${arrowBaseX}px,${arrowBaseY}px)`;
    cupidMaxDraw=Math.min(bR.height*.70,H*(mobile?.15:.16),mobile?82:118);
    cupidCurDraw=0;
    nockProxy.val=REST_NOCK;
    applyNock();
  }

  function startCupid(){
    cupidStarted=true;
    cupid.hidden=false;
    cupid.classList.remove('hit','shattered');
    cupidPlayed=false;
    heartFragments.innerHTML='';
    archery.style.opacity='0';
    target.style.opacity='0';
    target.style.transform='translateY(10px) scale(.9)';
    arrow.style.opacity='1';
    aim.style.opacity='0';

    setTimeout(()=>{
      refreshCupidRig();
      archery.style.opacity='1';
      target.style.opacity='1';
      target.style.transform='translateY(0) scale(1)';
      cupid.classList.add('cupid-ready');
      startCupidHeartBeat();
    },80);
  }

  function startCupidHeartBeat(){
    clearInterval(cupidBeatTimer);
    cupidBeatTimer=setInterval(()=>{
      if(cupidPlayed)return;
      targetHeart.animate(
        [{transform:'scale(1)'},{transform:'scale(1.07)'},{transform:'scale(1)'}],
        {duration:850,easing:'ease-in-out'}
      );
    },1500);
  }

  function stopCupidHeartBeat(){
    clearInterval(cupidBeatTimer);
    cupidBeatTimer=null;
  }

  function springCupidBack(){
    const from=cupidCurDraw,start=performance.now();
    function step(now){
      const t=Math.min(1,(now-start)/520),ease=1-Math.pow(1-t,3);
      setCupidDraw(from*(1-ease));
      if(t<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function createHeartShatter(){
    heartFragments.innerHTML='';
    const pieces=['♥','✦','✧','◆','•','💗'];
    for(let i=0;i<24;i++){
      const el=document.createElement('span');
      el.textContent=pieces[i%pieces.length];
      el.className='heart-fragment';
      el.style.left='50%';
      el.style.top='33%';
      const angle=2*Math.PI*i/24+(Math.random()-.5)*.4,dist=70+Math.random()*180;
      el.style.setProperty('--dx',`${Math.cos(angle)*dist}px`);
      el.style.setProperty('--dy',`${Math.sin(angle)*dist}px`);
      el.style.setProperty('--rot',`${-180+Math.random()*360}deg`);
      el.style.setProperty('--delay',`${Math.random()*80}ms`);
      el.style.fontSize=`${10+Math.random()*18}px`;
      heartFragments.appendChild(el);
    }
  }

  function fireCupid(){
    if(cupidPlayed)return;
    cupidPlayed=true;
    stopCupidHeartBeat();
    aim.style.opacity='0';
    cupid.classList.add('shooting');

    const tRect=target.getBoundingClientRect(),tipRect=tip.getBoundingClientRect();
    const tipX=tipRect.left+tipRect.width/2,tipY=tipRect.top+tipRect.height/2;
    const heartX=tRect.left+tRect.width/2,heartY=tRect.top+tRect.height/2;
    const dx=heartX-tipX,dy=heartY-tipY,distance=Math.hypot(dx,dy),duration=Math.max(520,Math.min(900,distance*1.25));
    const startX=arrowBaseX,startY=arrowBaseY+cupidCurDraw,endX=startX+dx/svgScale,endY=startY+dy/svgScale,start=performance.now();

    function fly(now){
      const t=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-t,3);
      arrow.style.transform=`translate(${startX+(endX-startX)*ease}px,${startY+(endY-startY)*ease}px)`;
      if(t<1)requestAnimationFrame(fly);else impactCupid();
    }
    requestAnimationFrame(fly);
  }

  function impactCupid(){
    cupid.classList.add('hit');
    targetHeart.style.transform='scale(1.16)';
    setTimeout(()=>{createHeartShatter();cupid.classList.add('shattered')},120);
    startMusicAtImpact();
  }

  function startMusicAtImpact(){
    if(musicStarted){
      setTimeout(showBirthday,1300);
      return;
    }

    loveSong.currentTime=0;
    loveSong.volume=.55;
    loveSong.play().then(()=>{
      musicStarted=true;
      musicButton.hidden=false;
      songFallback.hidden=true;
    }).catch(()=>{
      musicButton.hidden=false;
      songFallback.hidden=false;
    });

    setTimeout(showBirthday,1300);
  }

  function showBirthday(){
    cupid.hidden=true;
    birthday.hidden=false;
    musicButton.hidden=false;
    createConfetti();
  }

  function createConfetti(){
    const box=$('confetti');
    box.innerHTML='';
    for(let i=0;i<48;i++){
      const p=document.createElement('span');
      p.textContent=['♥','✦','✧','•'][i%4];
      p.style.position='absolute';
      p.style.left=`${Math.random()*100}%`;
      p.style.top=`${-10-Math.random()*20}%`;
      p.style.fontSize=`${10+Math.random()*18}px`;
      p.style.color=['#ff70a9','#ffd1e2','#c6b7ff','#fff'][i%4];
      p.style.animation=`confettiFall ${4+Math.random()*5}s linear ${Math.random()*2}s infinite`;
      box.appendChild(p);
    }
    if(!document.getElementById('confettiStyle')){
      const s=document.createElement('style');
      s.id='confettiStyle';
      s.textContent='@keyframes confettiFall{from{transform:translateY(0) rotate(0);opacity:0}10%{opacity:1}to{transform:translateY(115vh) rotate(420deg);opacity:.1}}';
      document.head.appendChild(s);
    }
  }

  function toggleMusic(){
    // If a memory song is playing, don't allow the main song to start over it.
    if(!memorySong.paused){
      stopMemorySong();
    }

    if(loveSong.paused){
      loveSong.play().then(()=>{
        musicStarted=true;
        musicButton.textContent='🎵 Our song';
        songFallback.hidden=true;
      }).catch(()=>songFallback.hidden=false);
    }else{
      loveSong.pause();
      musicButton.textContent='▶ Our song';
    }
  }

  // ---------------- MEMORY PHOTO MUSIC ----------------

  function stopMemorySong(){
    memorySong.pause();
    memorySong.currentTime=0;
    memorySong.removeAttribute('src');
    memorySong.load();

    document.querySelectorAll('.gallery figure').forEach(figure=>{
      figure.classList.remove('playing');
    });

    currentMemorySong=0;

    if(memoryNowPlaying){
      memoryNowPlaying.textContent='Tap a photo to play its song ♥';
    }
  }

  async function playMemorySong(photoNumber, figure){
    const song=memorySongs[photoNumber];
    if(!song)return;

    // Stop the main "Our song" immediately.
    loveSong.pause();
    loveSong.currentTime=0;
    musicStarted=false;
    musicButton.textContent='▶ Our song';

    // Clicking the currently playing photo toggles pause.
    if(currentMemorySong===photoNumber && !memorySong.paused){
      memorySong.pause();
      if(figure)figure.classList.remove('playing');
      if(memoryNowPlaying)memoryNowPlaying.textContent=`Song ${photoNumber} paused ♥`;
      return;
    }

    // Stop the previous photo song.
    memorySong.pause();
    memorySong.currentTime=0;

    document.querySelectorAll('.gallery figure').forEach(item=>{
      item.classList.remove('playing');
    });

    currentMemorySong=photoNumber;
    memorySong.src=song;
    memorySong.volume=.65;

    if(figure)figure.classList.add('playing');
    if(memoryNowPlaying)memoryNowPlaying.textContent=`♪ Playing Song ${photoNumber} for this memory ♥`;

    try{
      await memorySong.play();
    }catch(error){
      if(memoryNowPlaying){
        memoryNowPlaying.textContent=`Tap the photo again to play Song ${photoNumber} ♥`;
      }
      console.warn('Memory song playback failed:',error);
    }
  }

  function setupMemoryGallery(){
    document.querySelectorAll('.gallery figure').forEach((figure,index)=>{
      const img=figure.querySelector('img');
      if(!img)return;

      const photoNumber=Number(img.dataset.song)||index+1;

      img.addEventListener('click',()=>{
        playMemorySong(photoNumber,figure);
      });

      figure.addEventListener('click',(event)=>{
        if(event.target.tagName!=='IMG'){
          playMemorySong(photoNumber,figure);
        }
      });

      img.addEventListener('error',()=>{
        img.onerror=null;
        img.src='./public/photos/photo-placeholder.svg';
        img.style.objectFit='cover';
      });
    });
  }

  // ---------------- MAIN EVENT HANDLERS ----------------

  pinForm.addEventListener('submit',e=>{
    e.preventDefault();
    if(pinInput.value.trim()!==PIN){
      pinError.textContent='Almost… try your favourite number ♥';
      pinInput.value='';
      pinInput.classList.remove('pin-wrong');
      void pinInput.offsetWidth;
      pinInput.classList.add('pin-wrong');
      return;
    }

    pinError.textContent='';
    lockScreen.style.transition='opacity .9s ease,transform .9s ease';
    lockScreen.style.opacity='0';
    lockScreen.style.transform='scale(1.04)';

    setTimeout(()=>{
      showOnly(journey);
      lockScreen.style.opacity='';
      lockScreen.style.transform='';
      startJourney();
    },850);
  });

  journey.addEventListener('pointerdown',e=>{
    if(e.button===0||e.pointerType==='touch'||e.pointerType==='pen')toggleJourneyPause();
  });

  songFallback.addEventListener('click',toggleMusic);
  musicButton.addEventListener('click',toggleMusic);

  archery.addEventListener('pointerdown',e=>{
    if(cupidPlayed)return;
    cupidDrawing=true;
    cupidStartX=e.clientX;
    cupidStartY=e.clientY;
    cupidStartDraw=cupidCurDraw;
    archery.classList.add('is-drawing');
    try{archery.setPointerCapture(e.pointerId)}catch(_){}
    e.preventDefault();
  });

  archery.addEventListener('pointermove',e=>{
    if(!cupidDrawing||cupidPlayed)return;
    const proj=(e.clientX-cupidStartX)*pullUX+(e.clientY-cupidStartY)*pullUY;
    setCupidDraw(cupidStartDraw+proj);
  });

  function endCupidDraw(){
    if(!cupidDrawing)return;
    cupidDrawing=false;
    archery.classList.remove('is-drawing');
    if(cupidCurDraw>cupidMaxDraw*.26)fireCupid();
    else springCupidBack();
  }

  archery.addEventListener('pointerup',endCupidDraw);
  archery.addEventListener('pointercancel',endCupidDraw);

  archery.addEventListener('keydown',e=>{
    if(cupidPlayed)return;
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      setCupidDraw(cupidMaxDraw*.9);
      fireCupid();
    }
  });

  window.addEventListener('resize',()=>{
    if(!cupid.hidden&&!cupidPlayed)refreshCupidRig();
  });

  memoriesButton.addEventListener('click',()=>{
    memoriesModal.hidden=false;
  });

  closeMemories.addEventListener('click',()=>{
    memoriesModal.hidden=true;
    stopMemorySong();
  });

  memoriesModal.addEventListener('click',e=>{
    if(e.target.dataset.close==='true'){
      memoriesModal.hidden=true;
      stopMemorySong();
    }
  });

  surpriseButton.addEventListener('click',()=>{
    surpriseModal.hidden=false;
    surpriseLock.hidden=false;
    surpriseVideoArea.hidden=true;
    surprisePinInput.value='';
    surprisePinError.textContent='';
    setTimeout(()=>surprisePinInput.focus(),120);
  });

  closeSurprise.addEventListener('click',closeSurpriseModal);

  surpriseModal.addEventListener('click',e=>{
    if(e.target.dataset.surpriseClose==='true')closeSurpriseModal();
  });

  function closeSurpriseModal(){
    surpriseModal.hidden=true;
    surpriseVideo.pause();
    surpriseVideo.currentTime=0;
  }

  async function playSurpriseVideo(){
    surpriseVideoError.hidden=true;
    surprisePlayButton.classList.remove('show');

    try{
      surpriseVideo.load();
      await new Promise((resolve,reject)=>{
        if(surpriseVideo.readyState>=3){
          resolve();
          return;
        }

        const ok=()=>{cleanup();resolve()};
        const bad=()=>{cleanup();reject(new Error('video-load-failed'))};
        const cleanup=()=>{
          surpriseVideo.removeEventListener('canplay',ok);
          surpriseVideo.removeEventListener('error',bad);
        };

        surpriseVideo.addEventListener('canplay',ok,{once:true});
        surpriseVideo.addEventListener('error',bad,{once:true});
        setTimeout(()=>{
          cleanup();
          reject(new Error('video-timeout'));
        },8000);
      });

      await surpriseVideo.play();
    }catch(err){
      surprisePlayButton.classList.add('show');
      surpriseVideoError.hidden=false;
      console.warn('Surprise video playback failed:',err);
    }
  }

  surprisePinForm.addEventListener('submit',async e=>{
    e.preventDefault();
    const entered=surprisePinInput.value.trim().toUpperCase();

    if(entered!==SURPRISE_PIN){
      surprisePinError.textContent='Nahi… ek baar aur try kar ♥';
      surprisePinInput.value='';
      surprisePinInput.classList.remove('pin-wrong');
      void surprisePinInput.offsetWidth;
      surprisePinInput.classList.add('pin-wrong');
      return;
    }

    surprisePinError.textContent='';
    surpriseLock.hidden=true;
    surpriseVideoArea.hidden=false;
    surpriseVideo.currentTime=0;
    await playSurpriseVideo();
  });

  surprisePlayButton.addEventListener('click',()=>playSurpriseVideo());

  surpriseVideo.addEventListener('error',()=>{
    surprisePlayButton.classList.add('show');
    surpriseVideoError.hidden=false;
  });

  surpriseVideo.addEventListener('play',()=>{
    surprisePlayButton.classList.remove('show');
  });

  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    memoriesModal.hidden=true;
    stopMemorySong();
    closeSurpriseModal();
  });

  setupMemoryGallery();

  // Disable right-click.
  document.addEventListener("contextmenu",e=>{
    e.preventDefault();
  });

  // Disable common developer/source shortcuts.
  document.addEventListener("keydown",e=>{
    if(
      e.key==="F12" ||
      (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key.toUpperCase())) ||
      (e.ctrlKey && e.key.toUpperCase()==="U")
    ){
      e.preventDefault();
    }
  });
})();
