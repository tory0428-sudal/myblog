// game.js — 2048 순수 게임 로직 (DOM에 의존하지 않음)
//
// 상태 객체: { board, score, best, isGameOver, hasWon, keepPlaying }
// board는 4x4 2차원 배열, 빈 칸은 0.

const GRID_SIZE = 4;
const WIN_VALUE = 2048;
const BEST_SCORE_KEY = "2048-best-score";

/** 4x4 빈 보드를 생성한다. */
function createEmptyBoard() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

/** localStorage에서 최고 점수를 읽어온다. 값이 없거나 잘못된 경우 0을 반환. */
function loadBestScore() {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (e) {
    return 0;
  }
}

/** localStorage에 최고 점수를 저장한다. */
function saveBestScore(value) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(value));
  } catch (e) {
    // localStorage 사용 불가 환경(예: 프라이빗 모드) — 무시
  }
}

/** 새 게임 상태를 생성한다 (타일 2개로 시작). */
function createInitialState() {
  const state = {
    board: createEmptyBoard(),
    score: 0,
    best: loadBestScore(),
    isGameOver: false,
    hasWon: false,
    keepPlaying: false,
  };
  addRandomTile(state.board);
  addRandomTile(state.board);
  return state;
}

/** 보드에서 빈 칸(값이 0인 칸) 좌표 목록을 반환한다. */
function getEmptyCells(board) {
  const cells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

/** 빈 칸 중 하나를 무작위로 골라 90% 확률로 2, 10% 확률로 4를 배치한다. */
function addRandomTile(board) {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return false;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

/**
 * 한 행(길이 4, 왼쪽 방향 기준)을 왼쪽으로 밀고 병합한다.
 * 반환값: { row: number[4], gained: number } — gained는 이번 이동으로 획득한 점수.
 */
function slideAndMergeRow(row) {
  const compact = row.filter((v) => v !== 0);
  const merged = [];
  let gained = 0;

  for (let i = 0; i < compact.length; i++) {
    const current = compact[i];
    if (i < compact.length - 1 && compact[i + 1] === current) {
      const mergedValue = current * 2;
      merged.push(mergedValue);
      gained += mergedValue;
      i++; // 다음 값은 이미 병합에 사용했으므로 건너뜀 (같은 턴 재병합 방지)
    } else {
      merged.push(current);
    }
  }

  while (merged.length < GRID_SIZE) merged.push(0);

  return { row: merged, gained };
}

/** 보드를 시계방향으로 90도 회전한 새 보드를 반환한다. */
function rotateClockwise(board) {
  const result = createEmptyBoard();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      result[c][GRID_SIZE - 1 - r] = board[r][c];
    }
  }
  return result;
}

/** 보드를 반시계방향으로 90도 회전한 새 보드를 반환한다. */
function rotateCounterClockwise(board) {
  const result = createEmptyBoard();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      result[GRID_SIZE - 1 - c][r] = board[r][c];
    }
  }
  return result;
}

/**
 * 방향에 관계없이 "왼쪽으로 밀기" 로직을 재사용하기 위해
 * 보드를 회전시켜 왼쪽 이동 기준으로 맞춘 뒤, 처리 후 다시 역회전한다.
 * direction: 'left' | 'right' | 'up' | 'down'
 * 반환값: { board, gained, moved }
 */
function moveBoard(board, direction) {
  let working = board;

  // 각 방향을 왼쪽 이동 기준으로 정규화
  if (direction === "up") working = rotateCounterClockwise(working);
  else if (direction === "down") working = rotateClockwise(working);
  else if (direction === "right") {
    working = rotateClockwise(rotateClockwise(working));
  }
  // 'left'는 그대로 사용

  let gained = 0;
  const movedBoard = working.map((row) => {
    const { row: newRow, gained: rowGained } = slideAndMergeRow(row);
    gained += rowGained;
    return newRow;
  });

  // 원래 방향으로 되돌리기
  let result = movedBoard;
  if (direction === "up") result = rotateClockwise(movedBoard);
  else if (direction === "down") result = rotateCounterClockwise(movedBoard);
  else if (direction === "right") {
    result = rotateClockwise(rotateClockwise(movedBoard));
  }

  const moved = !boardsEqual(board, result);

  return { board: result, gained, moved };
}

/** 두 보드가 완전히 동일한지 비교한다. */
function boardsEqual(a, b) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/** 보드 안에 지정한 값(기본: WIN_VALUE) 이상의 타일이 있는지 확인한다. */
function hasWinningTile(board, target = WIN_VALUE) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] >= target) return true;
    }
  }
  return false;
}

/** 보드에 빈 칸이 없고, 4방향 모두 이동/병합이 불가능하면 true. */
function isBoardFull(board) {
  return getEmptyCells(board).length === 0;
}

function canMove(board) {
  if (!isBoardFull(board)) return true;
  const directions = ["left", "right", "up", "down"];
  return directions.some((dir) => moveBoard(board, dir).moved);
}

/**
 * 상태에 방향 이동을 적용한다. 실제로 이동/병합이 발생했을 때만
 * 새 타일을 생성하고 점수/승패 상태를 갱신한다.
 * 상태 객체를 직접 변경하지 않고 새로운 상태를 반환한다.
 */
function applyMove(state, direction) {
  if (state.isGameOver) return state;

  const { board: newBoard, gained, moved } = moveBoard(state.board, direction);

  if (!moved) {
    return state;
  }

  addRandomTile(newBoard);

  const newScore = state.score + gained;
  const newBest = Math.max(state.best, newScore);
  if (newBest > state.best) saveBestScore(newBest);

  const justWon = !state.hasWon && hasWinningTile(newBoard);
  const stillPlayable = canMove(newBoard);

  return {
    board: newBoard,
    score: newScore,
    best: newBest,
    hasWon: state.hasWon || justWon,
    keepPlaying: state.keepPlaying,
    isGameOver: !stillPlayable,
    justWon,
  };
}

// 브라우저 전역(window)에 노출 — 모듈 번들러 없이 script 태그로 로드하기 위함
window.Game2048 = {
  GRID_SIZE,
  WIN_VALUE,
  BEST_SCORE_KEY,
  createEmptyBoard,
  createInitialState,
  loadBestScore,
  saveBestScore,
  addRandomTile,
  moveBoard,
  applyMove,
  canMove,
  hasWinningTile,
  getEmptyCells,
};
