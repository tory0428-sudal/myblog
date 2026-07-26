// input.js — 키보드 방향키 + 모바일 터치 스와이프 입력 처리
// game.js의 이동 로직을 직접 호출하지 않고, main.js가 넘겨주는 onMove(direction) 콜백만 호출한다.

(function () {
  const MIN_SWIPE_DISTANCE = 20; // px, 이보다 짧은 스와이프는 무시 (오조작 방지)

  const KEY_TO_DIRECTION = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };

  /**
   * @param {{ boardElement: HTMLElement, onMove: (direction: string) => void }} options
   */
  function init(options) {
    const { boardElement, onMove } = options;

    document.addEventListener("keydown", (e) => {
      const direction = KEY_TO_DIRECTION[e.key];
      if (!direction) return;
      e.preventDefault(); // 방향키로 페이지 스크롤되는 것 방지
      onMove(direction);
    });

    let touchStartX = 0;
    let touchStartY = 0;
    let tracking = false;

    boardElement.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) return;
        tracking = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    boardElement.addEventListener(
      "touchmove",
      (e) => {
        if (!tracking) return;
        // 보드 영역 내 스크롤/바운스/제스처 충돌 방지
        e.preventDefault();
      },
      { passive: false }
    );

    boardElement.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) < MIN_SWIPE_DISTANCE) return;

      let direction;
      if (absX > absY) {
        direction = deltaX > 0 ? "right" : "left";
      } else {
        direction = deltaY > 0 ? "down" : "up";
      }
      onMove(direction);
    });

    boardElement.addEventListener("touchcancel", () => {
      tracking = false;
    });
  }

  window.Input2048 = { init };
})();
