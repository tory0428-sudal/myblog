// main.js — 앱 진입점: DOM 렌더링, 상태 관리, 이벤트 바인딩
// game.js(순수 로직)와 input.js(입력 처리)를 연결한다.

(function () {
  const { createInitialState, applyMove, saveBestScore } = window.Game2048;

  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const newGameBtn = document.getElementById("new-game-btn");
  const overlayEl = document.getElementById("game-overlay");
  const overlayTitleEl = document.getElementById("overlay-title");
  const overlayRestartBtn = document.getElementById("overlay-restart-btn");
  const overlayContinueBtn = document.getElementById("overlay-continue-btn");

  let state = createInitialState();

  /** 현재 state를 기준으로 보드/점수판을 다시 그린다. */
  function render() {
    renderBoard(state.board);
    scoreEl.textContent = String(state.score);
    bestEl.textContent = String(state.best);
    renderOverlay();
  }

  /** 보드 DOM을 완전히 새로 그린다. */
  function renderBoard(board) {
    boardEl.innerHTML = "";
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const value = board[r][c];
        const cell = document.createElement("div");
        cell.className = "cell";
        if (value !== 0) {
          const tile = document.createElement("div");
          tile.className = `tile tile-${value > 2048 ? "super" : value}`;
          tile.textContent = String(value);
          cell.appendChild(tile);
        }
        boardEl.appendChild(cell);
      }
    }
  }

  /** 승리/게임오버 오버레이 표시 여부와 내용을 갱신한다. */
  function renderOverlay() {
    const showWin = state.hasWon && !state.keepPlaying;
    const showGameOver = state.isGameOver;

    if (showWin) {
      overlayTitleEl.textContent = "You Win!";
      overlayEl.classList.remove("hidden");
      overlayContinueBtn.classList.remove("hidden");
    } else if (showGameOver) {
      overlayTitleEl.textContent = "Game Over";
      overlayEl.classList.remove("hidden");
      overlayContinueBtn.classList.add("hidden");
    } else {
      overlayEl.classList.add("hidden");
    }
  }

  /** 방향 입력을 받아 상태를 갱신하고 다시 그린다. input.js에서 호출됨. */
  function handleMove(direction) {
    const next = applyMove(state, direction);
    if (next === state) return; // 변화 없음 (제자리 이동)
    state = next;
    render();
  }

  /** 새 게임 시작. */
  function startNewGame() {
    state = createInitialState();
    render();
  }

  /** 승리 오버레이의 "계속하기" — 오버레이만 닫고 게임은 계속 진행. */
  function continuePlaying() {
    state = { ...state, keepPlaying: true };
    render();
  }

  newGameBtn.addEventListener("click", startNewGame);
  overlayRestartBtn.addEventListener("click", startNewGame);
  overlayContinueBtn.addEventListener("click", continuePlaying);

  // input.js가 노출하는 초기화 함수를 통해 키보드/터치 입력을 연결
  window.Input2048.init({
    boardElement: boardEl,
    onMove: handleMove,
  });

  render();
})();
