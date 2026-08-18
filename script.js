(() => {
  "use strict";

  const PIN = "4587";
  const JOURNEY_SLIDE_MS = 3800;

  const $ = (id) => document.getElementById(id);

  const lockScreen = $("lockScreen");
  const pinForm = $("pinForm");
  const pinInput = $("pinInput");
  const pinError = $("pinError");
  const journey = $("journey");
  const journeySlides = [...document.querySelectorAll(".journey-slide")];
  const journeyStatus = $("journeyStatus");
  const journeyProgress = $("journeyProgress");
  const cupid = $("cupid");
  const birthday = $("birthday");
  const loveSong = $("loveSong");
  const musicButton = $("musicButton");
  const songFallback = $("songFallback");
  const memoriesButton = $("memoriesButton");
  const memoriesModal = $("memoriesModal");
  const closeMemories = $("closeMemories");
  const archery = $("archery");
  const bow = $("bow");
  const arrow = $("arrow");
  const strL = $("strL");
  const strR = $("strR");
  const serving = $("serving");
  const tip = $("tip");
  const target = $("target");
  const targetHeart = $("targetHeart");
  const heartGlow = document.querySelector("#target .heart__glow");
  const aim = $("aim");
  const heartFragments = $("heartFragments");

  let journeyIndex = 0;
  let journeyTimer = null;
  let journeyPaused = false;
  let journeyStarted = false;
  let cupidStarted = false;
  let musicStarted = false;
  let musicBlocked = false;
  let cupidPlayed = false;
  let cupidDrawing = false;
  let cupidStartX = 0, cupidStartY = 0, cupidStartDraw = 0;
  let cupidMaxDraw = 110, cupidCurDraw = 0;
  let pullUX = 0, pullUY = 1, arrowBaseX = 0, arrowBaseY = 0, svgScale = 1;
  const REST_NOCK = 96;
  const nockProxy = { val: REST_NOCK };

  function showOnly(section) {
    [lockScreen, journey, cupid, birthday].forEach(el => {
      el.hidden = el !== section;
    });
  }

  function setJourneySlide(index) {
    journeySlides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
    journeyProgress.style.width = `${((index + 1) / journeySlides.length) * 100}%`;
  }

  function scheduleNextJourneySlide() {
    clearTimeout(journeyTimer);
    if (journeyPaused) return;

    journeyTimer = setTimeout(() => {
      if (journeyPaused) return;

      if (journeyIndex < journeySlides.length - 1) {
        journeyIndex += 1;
        setJourneySlide(journeyIndex);
        scheduleNextJourneySlide();
      } else {
        finishJourney();
      }
    }, JOURNEY_SLIDE_MS);
  }

  function startJourney() {
    journeyStarted = true;
    journeyIndex = 0;
    journeyPaused = false;
    journey.classList.remove("paused");
    journeyStatus.textContent = "OUR STORY IS PLAYING";
    setJourneySlide(0);
    scheduleNextJourneySlide();
  }

  function toggleJourneyPause() {
    if (!journeyStarted || cupidStarted) return;

    journeyPaused = !journeyPaused;
    journey.classList.toggle("paused", journeyPaused);

    if (journeyPaused) {
      clearTimeout(journeyTimer);
      journeyStatus.textContent = "OUR STORY IS PAUSED";
    } else {
      journeyStatus.textContent = "OUR STORY IS PLAYING";
      scheduleNextJourneySlide();
    }
  }

  function finishJourney() {
    clearTimeout(journeyTimer);
    journeyStarted = false;
    journey.hidden = true;
    startCupid();
  }

  function applyNock() {
    const y = nockProxy.val;
    strL.setAttribute("y2", y);
    strR.setAttribute("y2", y);
    serving.setAttribute("cy", y);
  }

  function setCupidDraw(d) {
    cupidCurDraw = Math.max(0, Math.min(cupidMaxDraw, d));
    arrow.style.transform = `translate(${arrowBaseX}px, ${arrowBaseY + cupidCurDraw}px)`;
    nockProxy.val = REST_NOCK + cupidCurDraw / svgScale;
    applyNock();
    aim.style.opacity = String(0.5 * (cupidCurDraw / cupidMaxDraw));
  }

  function refreshCupidRig() {
    const W = cupid.clientWidth || window.innerWidth;
    const H = cupid.clientHeight || window.innerHeight;
    const stage = document.getElementById("cupidReferenceStage");
    const gripX = W * 0.24;
    const gripY = H * 0.76;
    const heartX = W * 0.5;
    const heartY = H * 0.33;
    const aimRad = Math.atan2(heartX - gripX, gripY - heartY);
    pullUX = -Math.sin(aimRad);
    pullUY = Math.cos(aimRad);

    archery.style.transform = "none";
    archery.style.left = "0px";
    archery.style.top = "0px";
    arrow.style.transform = "none";
    applyNock();

    const aR = archery.getBoundingClientRect();
    const bR = bow.getBoundingClientRect();
    const sR = serving.getBoundingClientRect();
    const rR = arrow.getBoundingClientRect();
    svgScale = bR.width / 180 || 1;
    const gripLX = (bR.left - aR.left) + 72 / 180 * bR.width;
    const gripLY = (bR.top - aR.top) + (90 / 180) * bR.height;
    const nockLX = (sR.left - aR.left) + 0.5 * sR.width;
    const nockLY = (sR.top - aR.top) + 0.5 * sR.height;
    arrowBaseX = nockLX - ((rR.left - aR.left) + 0.5 * rR.width);
    arrowBaseY = nockLY - ((rR.top - aR.top) + (205 / 220) * rR.height);

    archery.style.left = `${gripX - gripLX}px`;
    archery.style.top = `${gripY - gripLY}px`;
    archery.style.transformOrigin = `${gripLX}px ${gripLY}px`;
    archery.style.transform = `rotate(${aimRad * 180 / Math.PI}deg)`;
    arrow.style.transform = `translate(${arrowBaseX}px, ${arrowBaseY}px)`;
    cupidMaxDraw = Math.min(bR.height * 0.72, H * 0.16, 132);
    cupidCurDraw = 0;
  }

  function startCupid() {
    cupidStarted = true;
    cupid.hidden = false;
    cupid.classList.remove("hit", "shattered");
    cupidPlayed = false;
    heartFragments.innerHTML = "";
    archery.style.opacity = "0";
    target.style.opacity = "0";
    target.style.transform = "translateY(10px) scale(.9)";
    arrow.style.opacity = "1";
    aim.style.opacity = "0";
    setTimeout(() => {
      refreshCupidRig();
      archery.style.opacity = "1";
      archery.style.transform += " scale(1)";
      target.style.opacity = "1";
      target.style.transform = "translateY(0) scale(1)";
      cupid.classList.add("cupid-ready");
      startCupidHeartBeat();
    }, 80);
  }

  let cupidBeatTimer = null;
  function startCupidHeartBeat() {
    clearInterval(cupidBeatTimer);
    cupidBeatTimer = setInterval(() => {
      if (cupidPlayed) return;
      targetHeart.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.07)" },
        { transform: "scale(1)" }
      ], { duration: 850, easing: "ease-in-out" });
    }, 1500);
  }

  function stopCupidHeartBeat() { clearInterval(cupidBeatTimer); cupidBeatTimer = null; }

  function springCupidBack() {
    const from = cupidCurDraw;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / 520);
      const ease = 1 - Math.pow(1 - t, 3);
      setCupidDraw(from * (1 - ease));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function createHeartShatter() {
    heartFragments.innerHTML = "";
    const pieces = ["💙","◆","✦","•","💎","✧"];
    for (let i = 0; i < 22; i++) {
      const el = document.createElement("span");
      el.textContent = pieces[i % pieces.length];
      el.className = "heart-fragment";
      el.style.left = "50%";
      el.style.top = "33%";
      const angle = (Math.PI * 2 * i / 22) + (Math.random() - .5) * .4;
      const dist = 70 + Math.random() * 180;
      el.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      el.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      el.style.setProperty("--rot", `${-180 + Math.random() * 360}deg`);
      el.style.setProperty("--delay", `${Math.random() * 80}ms`);
      el.style.fontSize = `${10 + Math.random() * 18}px`;
      heartFragments.appendChild(el);
    }
  }

  async function fireCupid() {
    if (cupidPlayed) return;
    cupidPlayed = true;
    stopCupidHeartBeat();
    aim.style.opacity = "0";
    cupid.classList.add("shooting");

    const tRect = target.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const tipX = tipRect.left + tipRect.width / 2;
    const tipY = tipRect.top + tipRect.height / 2;
    const heartX = tRect.left + tRect.width / 2;
    const heartY = tRect.top + tRect.height / 2;
    const flight = Math.hypot(heartX - tipX, heartY - tipY);
    const startY = arrowBaseY + cupidCurDraw;
    const flyY = startY - flight;

    const duration = 560;
    const start = performance.now();
    function fly(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      arrow.style.transform = `translate(${arrowBaseX}px, ${startY + (flyY - startY) * ease}px)`;
      arrow.style.opacity = "1";
      if (t < 1) requestAnimationFrame(fly);
      else impactCupid();
    }
    requestAnimationFrame(fly);
  }

  function impactCupid() {
    cupid.classList.add("hit");
    targetHeart.style.transform = "scale(1.16)";
    targetHeart.style.filter = "brightness(1.8) drop-shadow(0 0 35px rgba(80,200,255,.95))";
    setTimeout(() => {
      createHeartShatter();
      cupid.classList.add("shattered");
    }, 120);
    startMusicAtImpact();
  }

  archery.addEventListener("pointerdown", (e) => {
    if (cupidPlayed) return;
    cupidDrawing = true;
    cupidStartX = e.clientX;
    cupidStartY = e.clientY;
    cupidStartDraw = cupidCurDraw;
    archery.classList.add("is-drawing");
    try { archery.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });

  archery.addEventListener("pointermove", (e) => {
    if (!cupidDrawing || cupidPlayed) return;
    const proj = (e.clientX - cupidStartX) * pullUX + (e.clientY - cupidStartY) * pullUY;
    setCupidDraw(cupidStartDraw + proj);
  });

  function endCupidDraw() {
    if (!cupidDrawing) return;
    cupidDrawing = false;
    archery.classList.remove("is-drawing");
    if (cupidCurDraw > cupidMaxDraw * 0.26) fireCupid();
    else springCupidBack();
  }
  archery.addEventListener("pointerup", endCupidDraw);
  archery.addEventListener("pointercancel", endCupidDraw);
  archery.addEventListener("keydown", (e) => {
    if (cupidPlayed) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCupidDraw(cupidMaxDraw * .9); fireCupid(); }
  });
  window.addEventListener("resize", () => { if (!cupid.hidden && !cupidPlayed) refreshCupidRig(); });

  async function startMusicAtImpact
() {
    if (musicStarted) return;

    try {
      loveSong.currentTime = 0;
      loveSong.volume = 0.55;
      await loveSong.play();
      musicStarted = true;
      musicBlocked = false;
      musicButton.hidden = false;
      songFallback.hidden = true;
    } catch (error) {
      // Browsers may block delayed autoplay. Show a one-tap fallback.
      musicBlocked = true;
      songFallback.hidden = false;
      musicButton.hidden = false;
    }

    // Birthday begins immediately after the impact moment.
    setTimeout(showBirthday, 1300);
  }

  function showBirthday() {
    cupid.hidden = true;
    birthday.hidden = false;
    musicButton.hidden = false;
    createConfetti();
  }

  function createConfetti() {
    const box = $("confetti");
    box.innerHTML = "";
    for (let i = 0; i < 42; i++) {
      const piece = document.createElement("span");
      piece.textContent = ["♥", "✦", "✧", "•"][i % 4];
      piece.style.position = "absolute";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = `${-10 - Math.random() * 20}%`;
      piece.style.fontSize = `${10 + Math.random() * 18}px`;
      piece.style.color = ["#ff70a9", "#ffd1e2", "#8fb4ff", "#ffffff"][i % 4];
      piece.style.animation = `confettiFall ${4 + Math.random() * 5}s linear ${Math.random() * 2}s infinite`;
      box.appendChild(piece);
    }

    if (!document.getElementById("confettiStyle")) {
      const style = document.createElement("style");
      style.id = "confettiStyle";
      style.textContent = `
        @keyframes confettiFall {
          from { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          to { transform: translateY(115vh) rotate(420deg); opacity: .1; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function toggleMusic() {
    if (loveSong.paused) {
      loveSong.play().then(() => {
        musicStarted = true;
        musicBlocked = false;
        musicButton.textContent = "🎵 Our song";
        songFallback.hidden = true;
      }).catch(() => {
        songFallback.hidden = false;
      });
    } else {
      loveSong.pause();
      musicButton.textContent = "▶ Our song";
    }
  }

  pinForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (pinInput.value.trim() !== PIN) {
      pinError.textContent = "Almost… try your favourite number ♥";
      pinInput.value = "";
      pinInput.classList.remove("wrong", "pin-wrong");
      void pinInput.offsetWidth;
      pinInput.classList.add("pin-wrong");
      return;
    }

    pinError.textContent = "";
    pinInput.blur();

    lockScreen.style.transition = "opacity .9s ease, transform .9s ease";
    lockScreen.style.opacity = "0";
    lockScreen.style.transform = "scale(1.04)";

    setTimeout(() => {
      showOnly(journey);
      startJourney();
    }, 850);
  });

  // The Journey intentionally has no next/previous buttons.
  // A click/tap anywhere pauses; the next click/tap resumes.
  journey.addEventListener("pointerdown", (event) => {
    if (event.button === 0 || event.pointerType === "touch" || event.pointerType === "pen") {
      toggleJourneyPause();
    }
  });

  songFallback.addEventListener("click", toggleMusic);
  musicButton.addEventListener("click", toggleMusic);

  memoriesButton.addEventListener("click", () => {
    memoriesModal.hidden = false;
  });

  closeMemories.addEventListener("click", () => {
    memoriesModal.hidden = true;
  });

  memoriesModal.addEventListener("click", (event) => {
    if (event.target.dataset.close === "true") memoriesModal.hidden = true;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") memoriesModal.hidden = true;
  });

  // Prevent broken images from leaving ugly browser icons.
  document.querySelectorAll(".gallery img").forEach((img) => {
    img.addEventListener("error", () => {
      img.style.objectFit = "contain";
      img.style.padding = "25px";
      img.alt = "Upload your photo here";
      img.src = "./public/photos/photo-placeholder.svg";
    });
  });

  // Start with only the lock screen.
  showOnly(lockScreen);
})();
