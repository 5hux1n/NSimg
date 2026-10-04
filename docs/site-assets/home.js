'use strict';

const $ = (selector) => document.querySelector(selector);
const demoResult = $('#demo-result');
const demoHint = $('#demo-hint');
const demoState = $('#demo-state');

function insertDemo(fromGallery = false) {
  demoResult.hidden = false;
  demoHint.hidden = true;
  demoState.textContent = fromGallery
    ? '已插入历史示例图片。这是本地演示，不进行实际上传。'
    : '已插入示例图片。这是本地演示，不进行实际上传。';
}
$('#demo-insert').addEventListener('click', () => insertDemo());
document.querySelectorAll('[data-demo-gallery]').forEach(button => {
  button.addEventListener('click', () => insertDemo(true));
});
$('#demo-reset').addEventListener('click', () => {
  demoResult.hidden = true;
  demoHint.hidden = false;
  demoState.textContent = '本页仅演示，不上传文件或调用图床 API。';
});

$('#theme-preview').addEventListener('click', event => {
  const night = $('#forum-preview').classList.toggle('night');
  event.currentTarget.setAttribute('aria-pressed', String(night));
  event.currentTarget.textContent = night ? '查看日间配色' : '查看夜间配色';
});

let feedbackTimer;
function feedback(message) {
  const output = $('#copy-feedback');
  output.textContent = message;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => { output.textContent = ''; }, 3500);
}

// Copy exactly the original file, including its final newline. The fallback
// selects a readonly field so the same content remains manually copyable.
async function copyText(text, field) {
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    const active = document.activeElement;
    const scrollX = window.scrollX, scrollY = window.scrollY;
    const temporary = !field;
    if (temporary) {
      field = document.createElement('textarea');
      field.value = text;
      field.readOnly = true;
      field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
      document.body.append(field);
    }
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, field.value.length);
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { /* keep selection */ }
    if (temporary) field.remove();
    if (copied || temporary) {
      active?.focus({ preventScroll: true });
      window.scrollTo(scrollX, scrollY);
    }
    return copied;
  }
}

const cssField = $('#css-code');
$('#select-css').addEventListener('click', () => {
  cssField.focus({ preventScroll: true });
  cssField.select();
  cssField.setSelectionRange(0, cssField.value.length);
  $('#css-copy-status').textContent = '已选中完整 CSS，可使用系统复制操作。';
});
$('#copy-css').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  const success = await copyText(cssField.value, cssField);
  button.disabled = false;
  if (success) {
    $('#css-copy-status').textContent = '已复制完整 CSS，可以到论坛的自定义 style 中粘贴。';
    feedback('完整 CSS 已复制');
  } else {
    $('#css-copy-status').textContent = '浏览器未允许自动复制。完整代码已选中，请使用系统复制操作。';
    feedback('代码已选中，请手动复制');
  }
});

document.querySelectorAll('[data-copy-text]').forEach(button => {
  button.addEventListener('click', async () => {
    const success = await copyText(button.dataset.copyText);
    feedback(success ? '扩展页地址已复制' : '请手动复制旁边的扩展页地址');
  });
});
