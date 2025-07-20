// Egyptian Movies Charades Game Logic

// == Constants ==
const MOVIES_URL = "https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/a70b215f13b33d0559de1f9da3909c15/c34077f2-d2e0-4a63-bd16-82a94f26660f/16faabcb.json";

// == State ==
const state = {
  players: [
    { name: "اللاعب الأول", score: 0 },
    { name: "اللاعب الثاني", score: 0 }
  ],
  currentPlayerIndex: 0,
  roundTimeMinutes: 2,
  totalRounds: 7,
  currentRound: 1,
  timer: {
    remaining: 0,
    intervalId: null,
    isRunning: false
  },
  movies: [],
  usedMovies: new Set(),
  currentMovie: ""
};

// == DOM Elements ==
const screens = {
  welcome: document.getElementById("welcome-screen"),
  settings: document.getElementById("settings-screen"),
  game: document.getElementById("game-screen"),
  results: document.getElementById("results-screen")
};

// Buttons & Inputs
const startSetupBtn = document.getElementById("start-setup");
const backToWelcomeBtn = document.getElementById("back-to-welcome");
const startGameBtn = document.getElementById("start-game");
const durationSlider = document.getElementById("duration-slider");
const roundsSlider = document.getElementById("rounds-slider");
const durationDisplay = document.getElementById("duration-display");
const roundsDisplay = document.getElementById("rounds-display");
const player1Input = document.getElementById("player1-name");
const player2Input = document.getElementById("player2-name");

// Game screen elements
const currentPlayerNameEl = document.getElementById("current-player-name");
const roundDisplayEl = document.getElementById("round-display");
const player1DisplayEl = document.getElementById("player1-display");
const player2DisplayEl = document.getElementById("player2-display");
const player1ScoreEl = document.getElementById("player1-score");
const player2ScoreEl = document.getElementById("player2-score");
const timerDisplayEl = document.getElementById("timer-display");
const showMovieBtn = document.getElementById("show-movie-btn");
const movieTitleEl = document.getElementById("current-movie");
const startTimerBtn = document.getElementById("start-timer-btn");
const actionButtonsWrapper = document.getElementById("action-buttons");
const correctBtn = document.getElementById("correct-btn");
const wrongBtn = document.getElementById("wrong-btn");
const newMovieBtn = document.getElementById("new-movie-btn");

// Results screen elements
const winnerNameEl = document.getElementById("winner-name");
const winnerScoreEl = document.getElementById("winner-score");
const loserNameEl = document.getElementById("loser-name");
const loserScoreEl = document.getElementById("loser-score");
const totalMoviesEl = document.getElementById("total-movies");
const successRateEl = document.getElementById("success-rate");
const newGameBtn = document.getElementById("new-game");
const backHomeBtn = document.getElementById("back-home");

// == Utility Functions ==
function showScreen(screenKey) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[screenKey].classList.add("active", "fade-in");
  setTimeout(() => screens[screenKey].classList.remove("fade-in"), 500);
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(1, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  timerDisplayEl.textContent = formatTime(state.timer.remaining);
  timerDisplayEl.classList.remove("warning", "danger");
  if (state.timer.remaining <= 10) {
    timerDisplayEl.classList.add("danger");
  }
}

function stopTimer() {
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
    state.timer.isRunning = false;
  }
}

function startTimer() {
  if (state.timer.isRunning) return;
  state.timer.isRunning = true;
  startTimerBtn.classList.add("loading");
  state.timer.remaining = state.roundTimeMinutes * 60;
  updateTimerDisplay();
  state.timer.intervalId = setInterval(() => {
    state.timer.remaining--;
    updateTimerDisplay();
    if (state.timer.remaining <= 0) {
      handleTimeUp();
    }
  }, 1000);

  // Enable action buttons
  actionButtonsWrapper.classList.remove("hidden");
  startTimerBtn.disabled = true;
  correctBtn.disabled = false;
  wrongBtn.disabled = false;
  newMovieBtn.disabled = false;
}

function pickNewMovie() {
  // If all movies used, reset
  if (state.usedMovies.size === state.movies.length) {
    state.usedMovies.clear();
  }
  let movie = "";
  let attempts = 0;
  while (attempts < 10) {
    movie = state.movies[Math.floor(Math.random() * state.movies.length)];
    if (!state.usedMovies.has(movie)) break;
    attempts++;
  }
  state.usedMovies.add(movie);
  state.currentMovie = movie;
  movieTitleEl.textContent = movie;
}

function prepareTurn() {
  // Update header info
  currentPlayerNameEl.textContent = state.players[state.currentPlayerIndex].name;
  roundDisplayEl.textContent = `الجولة ${state.currentRound} من ${state.totalRounds}`;

  // Hide movie & buttons
  movieTitleEl.classList.add("hidden");
  showMovieBtn.disabled = false;
  showMovieBtn.classList.remove("loading");

  // Reset timer UI
  stopTimer();
  state.timer.remaining = state.roundTimeMinutes * 60;
  updateTimerDisplay();
  startTimerBtn.disabled = false;
  startTimerBtn.classList.remove("loading");
  actionButtonsWrapper.classList.add("hidden");
  correctBtn.disabled = true;
  wrongBtn.disabled = true;
  newMovieBtn.disabled = true;

  // Pick a new movie in advance (but hidden)
  pickNewMovie();
}

function switchPlayer() {
  state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
}

function endTurn(addPoint) {
  // Update score if needed
  if (addPoint) {
    state.players[state.currentPlayerIndex].score++;
  }
  updateScoresDisplay();

  // Check end conditions
  if (
    state.players.some((p) => p.score >= 5) ||
    state.currentRound >= state.totalRounds
  ) {
    showResultsScreen();
    return;
  }

  // Next round & player
  state.currentRound++;
  switchPlayer();
  prepareTurn();
}

function updateScoresDisplay() {
  player1ScoreEl.textContent = state.players[0].score;
  player2ScoreEl.textContent = state.players[1].score;
}

function handleCorrect() {
  stopTimer();
  endTurn(true);
}

function handleWrong() {
  stopTimer();
  endTurn(false);
}

function handleTimeUp() {
  stopTimer();
  handleWrong();
}

function showResultsScreen() {
  // Determine winner / draw
  const [p1, p2] = state.players;
  let winner = null;
  if (p1.score > p2.score) winner = p1;
  else if (p2.score > p1.score) winner = p2;

  if (winner) {
    winnerNameEl.textContent = winner.name;
    winnerScoreEl.textContent = winner.score;
    const loser = winner === p1 ? p2 : p1;
    loserNameEl.textContent = loser.name;
    loserScoreEl.textContent = loser.score;
  } else {
    // Draw
    winnerNameEl.textContent = "تعادل";
    winnerScoreEl.textContent = `${p1.score} - ${p2.score}`;
    document.getElementById("winner-label").textContent = "";
    loserNameEl.textContent = "";
    loserScoreEl.textContent = "";
  }

  totalMoviesEl.textContent = state.usedMovies.size;
  const totalCorrect = state.players[0].score + state.players[1].score;
  const successRate = totalCorrect === 0 ? 0 : ((totalCorrect / state.usedMovies.size) * 100).toFixed(1);
  successRateEl.textContent = `${successRate}%`;

  showScreen("results");
}

function resetGame() {
  // Reset state to defaults (except loaded movies)
  state.players[0].score = 0;
  state.players[1].score = 0;
  state.currentPlayerIndex = 0;
  state.currentRound = 1;
  state.usedMovies.clear();
}

function startGame() {
  // Read settings
  state.roundTimeMinutes = parseInt(durationSlider.value, 10);
  state.totalRounds = parseInt(roundsSlider.value, 10);
  state.players[0].name = player1Input.value.trim() || "اللاعب الأول";
  state.players[1].name = player2Input.value.trim() || "اللاعب الثاني";

  // Update score labels
  player1DisplayEl.textContent = state.players[0].name;
  player2DisplayEl.textContent = state.players[1].name;
  currentPlayerNameEl.textContent = state.players[0].name;

  resetGame();
  prepareTurn();
  showScreen("game");
}

// == Event Listeners ==
startSetupBtn.addEventListener("click", () => {
  showScreen("settings");
});

backToWelcomeBtn.addEventListener("click", () => {
  showScreen("welcome");
});

startGameBtn.addEventListener("click", startGame);

durationSlider.addEventListener("input", () => {
  durationDisplay.textContent = durationSlider.value;
});

roundsSlider.addEventListener("input", () => {
  roundsDisplay.textContent = roundsSlider.value;
});

showMovieBtn.addEventListener("click", () => {
  movieTitleEl.classList.remove("hidden");
  showMovieBtn.disabled = true;
});

startTimerBtn.addEventListener("click", startTimer);

correctBtn.addEventListener("click", handleCorrect);
wrongBtn.addEventListener("click", handleWrong);

newMovieBtn.addEventListener("click", () => {
  pickNewMovie();
});

newGameBtn.addEventListener("click", () => {
  showScreen("settings");
});

backHomeBtn.addEventListener("click", () => {
  showScreen("welcome");
});

// == Initialization ==
async function init() {
  try {
    const res = await fetch(MOVIES_URL);
    const data = await res.json();
    state.movies = shuffle(data.movies);
  } catch (err) {
    console.error("Failed to load movies", err);
    // fallback minimal list
    state.movies = ["العزيمة", "الأرض", "المومياء"];
  }
}

init();
