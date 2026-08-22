(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = document.getElementById('contact-status');
  var submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = '보내는 중...';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          status.textContent = '메시지가 전송됐어요. 감사합니다!';
          status.className = 'contact-status contact-status-success';
        } else {
          status.textContent = '전송에 실패했어요. 잠시 후 다시 시도해주세요.';
          status.className = 'contact-status contact-status-error';
        }
        status.hidden = false;
      })
      .catch(function () {
        status.textContent = '전송에 실패했어요. 잠시 후 다시 시도해주세요.';
        status.className = 'contact-status contact-status-error';
        status.hidden = false;
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = '보내기';
      });
  });
})();
