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
  const bowArea = document.querySelector(".bow-area");
  const bow = $("bow");
  const arrow = $("arrow");
  const targetHeart = $("targetHeart");
  const impactText = $("impactText");
  const cupidTitle = document.querySelector(".cupid-title");
  const birthday = $("birthday");
  const loveSong = $("loveSong");
  const musicButton = $("musicButton");
  const songFallback = $("songFallback");
  const memoriesButton = $("memoriesButton");
  const memoriesModal = $("memoriesModal");
  const closeMemories = $("closeMemories");

  let journeyIndex = 0;
  let journeyTimer = null;
  let journeyPaused = false;
  let journeyStarted = false;

  let cupidStarted = false;
  let cupidFired = false;
  let aiming = false;
  let pointerId = null;
  let aimMoved = false;

  let musicStarted = false;

  function showOnly(section) {
    [lockScreen, journey, cupid, birthday].forEach((el) => {
      el.hidden = el !== section;
    });
  }

  function setJourneySlide(index) {
    journeySlides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });

    if (journeyProgress) {
      journeyProgress.style.width =
        `${((index + 1) / journeySlides.length) * 100}%`;
    }
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
    if (!journeyStarted) return;

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

  /* ---------------------------------------------------------
     CUPID — MANUAL ARROW INTERACTION
     User presses the bow, pulls/aims, then releases to shoot.
     A simple click/tap on the bow also fires.
  --------------------------------------------------------- */

  function startCupid() {
    cupidStarted = true;
    cupidFired = false;
    aiming = false;
    aimMoved = false;

    cupid.hidden = false;
    cupid.classList.remove("fire", "hit", "aiming", "manual-fire");

    if (cupidTitle) {
      const p = cupidTitle.querySelector("p");
      if (p) {
        p.textContent = "Press and hold the bow. Pull it back, aim at ♥, then release.";
      }
    }

    if (arrow) {
      arrow.style.opacity = "0";
      arrow.style.removeProperty("--arrow-start-left");
      arrow.style.removeProperty("--arrow-start-top");
      arrow.style.transform = "rotate(0deg)";
    }

    if (impactText) impactText.textContent = "♥";
  }

  function getAimPoint(event) {
    const rect = bowArea.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    /*
      Keep the bow/arrow on the left side. The pointer controls
      the vertical aim and the amount of pull-back.
    */
    const pull = Math.max(0, Math.min(85, 150 - x));
    const startLeft = Math.max(8, Math.min(30, 17 + (35 - pull) * 0.12));
    const centerY = rect.height * 0.5;
    const aimY = Math.max(30, Math.min(rect.height - 30, y));

    return {
      pull,
      startLeft,
      aimY,
      centerY
    };
  }

  function updateAim(event) {
    if (!aiming || cupidFired) return;

    const point = getAimPoint(event);

    if (point.pull > 8 || Math.abs(point.aimY - point.centerY) > 8) {
      aimMoved = true;
    }

    const angle =
      Math.max(-12, Math.min(12,
        (point.aimY - point.centerY) * 0.10
      ));

    arrow.style.left = `${point.startLeft}%`;
    arrow.style.top = `${point.aimY}px`;
    arrow.style.opacity = "1";
    arrow.style.transform = `translateY(-50%) rotate(${angle}deg)`;

    bow.style.transform =
      `rotate(180deg) translateY(${Math.max(-10, Math.min(10,
        (point.aimY - point.centerY) * 0.08
      ))}px)`;
  }

  function resetAimVisual() {
    arrow.style.opacity = "0";
    arrow.style.transform = "rotate(0deg)";
    bow.style.transform = "rotate(180deg)";
  }

  function shootArrow() {
    if (!cupidStarted || cupidFired) return;

    cupidFired = true;
    aiming = false;

    cupid.classList.remove("aiming");
    cupid.classList.add("manual-fire");

    /*
      The arrow starts exactly where the user released it.
      CSS animates it to the heart.
    */
    const startLeft = arrow.style.left || "17%";
    const startTop = arrow.style.top || "50%";

    arrow.style.setProperty("--arrow-start-left", startLeft);
    arrow.style.setProperty("--arrow-start-top", startTop);
    arrow.style.opacity = "1";

    bow.style.transform = "rotate(180deg)";

    if (cupidTitle) {
      const p = cupidTitle.querySelector("p");
      if (p) p.textContent = "Here comes my heart… ♥";
    }

    setTimeout(() => {
      cupid.classList.add("hit");
      startMusicAtImpact();
    }, 950);
  }

  function handleAimStart(event) {
    if (!cupidStarted || cupidFired) return;

    if (
      event.button !== undefined &&
      event.button !== 0 &&
      event.pointerType !== "touch" &&
      event.pointerType !== "pen"
    ) {
      return;
    }

    aiming = true;
    aimMoved = false;
    pointerId = event.pointerId;

    cupid.classList.add("aiming");

    if (bowArea.setPointerCapture && event.pointerId !== undefined) {
      try {
        bowArea.setPointerCapture(event.pointerId);
      } catch (_) {}
    }

    updateAim(event);
    event.preventDefault();
  }

  function handleAimMove(event) {
    if (!aiming || cupidFired) return;
    if (pointerId !== null && event.pointerId !== pointerId) return;

    updateAim(event);
    event.preventDefault();
  }

  function handleAimEnd(event) {
    if (!aiming || cupidFired) return;
    if (pointerId !== null && event.pointerId !== pointerId) return;

    /*
      Both gestures work:
      - Drag/pull + release = shoot.
      - Simple click/tap on the bow = shoot.
    */
    if (aimMoved || event.type === "pointerup") {
      shootArrow();
    }

    pointerId = null;
    event.preventDefault();
  }

  if (bowArea) {
    bowArea.addEventListener("pointerdown", handleAimStart);
    bowArea.addEventListener("pointermove", handleAimMove);
    bowArea.addEventListener("pointerup", handleAimEnd);
    bowArea.addEventListener("pointercancel", handleAimEnd);
  }

  async function startMusicAtImpact() {
    if (musicStarted) return;

    try {
      loveSong.currentTime = 0;
      loveSong.volume = 0.55;
      await loveSong.play();

      musicStarted = true;
      musicButton.hidden = false;
      songFallback.hidden = true;
      musicButton.textContent = "🎵 Our song";
    } catch (error) {
      /*
        Chrome/Safari may block programmatic audio. The arrow
        interaction itself is a user gesture, but some browsers
        can still reject delayed playback. Show a one-tap fallback.
      */
      songFallback.hidden = false;
      musicButton.hidden = false;
    }

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
    if (!box) return;

    box.innerHTML = "";

    for (let i = 0; i < 42; i++) {
      const piece = document.createElement("span");

      piece.textContent = ["♥", "✦", "✧", "•"][i % 4];
      piece.style.position = "absolute";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = `${-10 - Math.random() * 20}%`;
      piece.style.fontSize = `${10 + Math.random() * 18}px`;
      piece.style.color =
        ["#ff70a9", "#ffd1e2", "#8fb4ff", "#ffffff"][i % 4];
      piece.style.animation =
        `confettiFall ${4 + Math.random() * 5}s linear ` +
        `${Math.random() * 2}s infinite`;

      box.appendChild(piece);
    }

    if (!document.getElementById("confettiStyle")) {
      const style = document.createElement("style");
      style.id = "confettiStyle";
      style.textContent = `
        @keyframes confettiFall {
          from {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: 1; }
          to {
            transform: translateY(115vh) rotate(420deg);
            opacity: .1;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function toggleMusic() {
    if (loveSong.paused) {
      loveSong.play().then(() => {
        musicStarted = true;
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
      pinInput.classList.remove("pin-wrong");
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

  /*
    Journey:
    Click/tap anywhere = pause.
    Click/tap again = resume.
  */
  journey.addEventListener("pointerdown", (event) => {
    if (
      event.button === 0 ||
      event.pointerType === "touch" ||
      event.pointerType === "pen"
    ) {
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
    if (event.target.dataset.close === "true") {
      memoriesModal.hidden = true;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      memoriesModal.hidden = true;
    }
  });

  /*
    Prevent ugly broken-image icons.
    Keep your existing six photo paths.
  */
  document.querySelectorAll(".gallery img").forEach((img) => {
    img.addEventListener("error", () => {
      img.style.objectFit = "contain";
      img.style.padding = "25px";
      img.alt = "Upload your photo here";
      img.src = "./public/photos/photo-placeholder.svg";
    });
  });

  showOnly(lockScreen);
})();
