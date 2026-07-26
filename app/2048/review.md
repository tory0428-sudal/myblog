# 2048 게임 웹앱 검증 결과 (review)

검증일: 2026-07-26
검증 방법: `spec.md` 대비 코드 리뷰 + 정적 서버(`npx serve`)로 `app/2048/index.html`을 띄우고 실제 브라우저(Claude Browser 도구)에서 동작 확인.
(브라우저 자동화 환경에서 OS 레벨 키보드 이벤트가 화면에 컴포지팅되지 않는 제약이 있어, 실제 페이지에 도달하는 것이 확인된 `document.dispatchEvent(KeyboardEvent)` / `TouchEvent` / `element.click()` — 즉 `input.js`가 실제로 등록하는 것과 동일한 리스너 — 를 통해 방향키·스와이프·버튼 클릭을 검증했습니다. 이는 시뮬레이션이 아니라 실제 프로덕션 코드 경로(document의 keydown 리스너, board의 touch 리스너, button의 click 리스너)를 그대로 실행시키는 방식입니다.)

## 1. 코드 리뷰 (spec.md 대비)

- 파일 구조: `index.html`, `style.css`, `game.js`, `input.js`, `main.js` 모두 spec대로 존재하고 역할 분리(순수 로직/입력/렌더링)가 잘 지켜짐.
- `game.js`: 4방향 이동을 "왼쪽 이동 + 회전/역회전"으로 정규화하는 로직, 행 단위 압축·병합(`slideAndMergeRow`), 랜덤 타일 생성(90%/10%), 승리(`hasWinningTile`)·패배(`canMove`) 판정 모두 spec과 일치하며 로직 검증(연속 병합 방지, 이동 없을 시 새 타일 생성 안 함) 정확함.
- `input.js`: 키보드(방향키 + preventDefault) 및 터치 스와이프(최소 20px 임계값, `touchmove`에서 preventDefault로 스크롤/제스처 충돌 방지) 모두 spec대로 구현.
- `main.js`: localStorage 최고점수 로드/저장(`2048-best-score`), 새 게임/다시 시작/계속하기 버튼 바인딩, 오버레이 렌더링(승리/게임오버 분기) 모두 spec과 일치.
- `style.css`: 다크모드(`prefers-color-scheme`) + `data-theme` 확장 지점, 반응형(max-width 480px, `aspect-ratio: 1/1`, `clamp()` 폰트, 터치 타깃 44px 이상, `touch-action: none`) 모두 spec 요구사항 충족.
- 심각한 버그나 spec 대비 누락 사항 없음.

## 2. 브라우저 실동작 테스트

| 항목 | 방법 | 결과 |
|---|---|---|
| 초기 로딩 | 페이지 로드 후 상태 확인 | 보드 16칸, 타일 2개 생성, 점수 0/최고점수 0, 오버레이 숨김, 콘솔 에러 없음 |
| 방향키 이동/병합 | `document.dispatchEvent(KeyboardEvent('keydown', {key:'ArrowDown'}))` 등 | 타일이 실제로 밀리고 합쳐짐 확인 (예: 두 `2` 타일이 아래로 이동 후 새 타일 추가 생성) |
| 점수판 갱신 | 40회 연속 랜덤 방향키 입력 | SCORE/BEST 값이 실시간으로 갱신됨 (예: 220점까지 정상 누적) |
| 최고점수 localStorage 저장 | 위 테스트 후 `localStorage.getItem('2048-best-score')` 확인 | `"220"` 저장 확인 |
| 최고점수 새로고침 후 유지 | 페이지 `navigate`(새로고침)로 재방문 | SCORE는 0으로 리셋, BEST는 `220` 그대로 유지 — 정상 |
| 새 게임 버튼 | `#new-game-btn` 클릭 | 점수 0, 타일 2개로 초기화됨 |
| 게임오버 판정/오버레이 | 랜덤 방향키 최대 1000회 반복 실행 | 168번째 입력에서 보드가 16/16 가득 차고 더 이상 이동 불가한 상태 도달, "Game Over" 오버레이 표시, "계속하기" 버튼은 숨김 처리됨 — 정상 |
| 게임오버 후 다시 시작 | `#overlay-restart-btn` 클릭 | 오버레이 닫히고 점수 0, 타일 2개로 재시작 — 정상 |
| 승리 판정 로직 | `Game2048.applyMove()`를 1024+1024 보드에 직접 적용 | 2048 타일 생성, `hasWon: true`, `justWon: true` 정상 반환 (승리 오버레이는 게임오버 오버레이와 동일한 렌더링 경로를 타므로, 위 게임오버 오버레이 실동작 확인 + 이 로직 검증으로 충분히 커버됨. 실제 플레이로 2048까지 도달시키는 것은 난수 특성상 비현실적이라 생략) |
| 터치 스와이프 | 보드 요소에 `TouchEvent('touchstart'/'touchend')` 디스패치 (상단→하단 등) | 스와이프 방향대로 타일이 실제로 이동함 확인 |
| 모바일 반응형 (375×812) | `resize_window` 375px로 리사이즈 후 `document.documentElement.scrollWidth` 확인 | `scrollWidth(375) === innerWidth(375)`, 가로 스크롤 없음. 보드는 정사각형(343×343) 유지, 새 게임 버튼 터치 타깃 89.8×56px (44px 이상 충족) |
| 다크모드 | `resize_window`의 `colorScheme: dark`로 에뮬레이션 | `prefers-color-scheme: dark` 매치 확인, `body` 배경색 `rgb(26,26,26)`(`#1a1a1a`)로 정상 전환 |
| 콘솔 에러 | 전 과정에서 `read_console_messages` 확인 | 에러/경고 없음 |

## 3. 발견한 문제 및 수정 여부

발견된 버그나 spec 대비 누락 사항이 없었습니다. 코드 리뷰와 브라우저 실동작 테스트 모두 통과했으며, `/app/2048/` 폴더 내 파일은 **수정하지 않았습니다** (수정이 필요한 문제가 없었음).

## 4. 최종 상태

**정상 동작.** 방향키 이동/병합, 점수판 갱신, 새 게임, 최고점수 localStorage 영속성, 게임오버 판정 및 오버레이, 승리 판정 로직, 터치 스와이프, 모바일 반응형(375px, 가로 스크롤 없음), 다크모드까지 모두 spec.md대로 정상 동작함을 확인했습니다.
