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

  let journeyIndex = 0;
  let journeyTimer = null;
  let journeyPaused = false;
  let journeyStarted = false;
  let cupidStarted = false;
  let musicStarted = false;
  let musicBlocked = false;

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

  function startCupid() {
    cupidStarted = true;
    cupid.hidden = false;
    cupid.classList.remove("fire", "hit");

    // Give the transition a moment, then automatically fire the arrow.
    setTimeout(() => {
      cupid.classList.add("fire");

      // Arrow reaches the heart at the end of this animation.
      setTimeout(() => {
        cupid.classList.add("hit");
        startMusicAtImpact();
      }, 930);
    }, 1200);
  }

  async function startMusicAtImpact() {
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
      pinInput.classList.remove("wrong");
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
