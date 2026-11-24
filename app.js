const urlInput = document.getElementById('media-url');
const runButton = document.getElementById('run-tool');
const result = document.getElementById('result');
const notice = document.getElementById('notice');
const uploadArea = document.getElementById('upload-area');
const mediaFile = document.getElementById('media-file');
const title = document.getElementById('workspace-title');
const hint = document.getElementById('tool-hint');
let currentTool = 'youtube';
let ffmpegInstance = null;

document.getElementById('year').textContent = new Date().getFullYear();

function showNotice(message) {
  notice.textContent = message;
  notice.classList.remove('hidden');
  result.classList.add('hidden');
}
function clearOutput() {
  notice.classList.add('hidden');
  result.classList.add('hidden');
  result.innerHTML = '';
}
function extractYouTubeId(raw) {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
    if (['youtube.com','m.youtube.com','music.youtube.com'].includes(host)) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const parts = u.pathname.split('/').filter(Boolean);
      if (['shorts','embed','live'].includes(parts[0])) return parts[1] || null;
    }
  } catch (_) {}
  return null;
}
function safeYouTubeId(id) { return /^[a-zA-Z0-9_-]{11}$/.test(id || ''); }

function renderThumbnail() {
  clearOutput();
  const raw = urlInput.value.trim();
  const id = extractYouTubeId(raw);
  if (!id || !safeYouTubeId(id)) {
    showNotice('Please paste a valid YouTube video, Shorts, or youtu.be link.');
    return;
  }
  const imageUrl = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  result.classList.remove('hidden');
  result.innerHTML = `
    <strong>Thumbnail preview</strong>
    <img src="${imageUrl}" alt="YouTube thumbnail preview" referrerpolicy="no-referrer">
    <div class="result-actions">
      <a class="secondary-btn" href="${imageUrl}" target="_blank" rel="noopener">Open image</a>
      <a class="secondary-btn" href="${imageUrl}" download="mediagrab-youtube-thumbnail.jpg">Download thumbnail</a>
    </div>
    <p class="hint">Use this image only when you have the right to reuse it. Some videos may not provide this thumbnail size.</p>`;
}

function renderDirect() {
  clearOutput();
  const raw = urlInput.value.trim();
  let parsed;
  try { parsed = new URL(raw); } catch (_) { showNotice('Please enter a complete direct HTTPS media-file URL.'); return; }
  if (parsed.protocol !== 'https:') { showNotice('For safety, this starter tool accepts HTTPS links only.'); return; }
  const allowed = /\.(mp4|webm|mov|mp3|m4a|wav|jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(parsed.pathname + parsed.search);
  if (!allowed) { showNotice('This does not look like a direct media-file URL. Paste a direct link ending in a supported file type.'); return; }
  result.classList.remove('hidden');
  result.innerHTML = `<strong>Direct media link detected</strong><p class="hint">The file host controls whether browser downloads are allowed. Continue only if you own this file or have permission to save it.</p><div class="result-actions"><a class="secondary-btn" href="${parsed.href.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" target="_blank" rel="noopener">Open file link ↗</a></div>`;
}

function renderSocialGuide() {
  clearOutput();
  result.classList.remove('hidden');
  result.innerHTML = `<strong>Use official save options</strong>
    <p class="hint">SavRS does not bypass private accounts, logins, DRM or platform restrictions. For content you own, use the platform's official export or download features.</p>
    <div class="result-actions">
      <a class="secondary-btn" href="https://www.facebook.com/help/" target="_blank" rel="noopener">Facebook Help ↗</a>
      <a class="secondary-btn" href="https://help.instagram.com/" target="_blank" rel="noopener">Instagram Help ↗</a>
      <a class="secondary-btn" href="https://support.google.com/youtube/" target="_blank" rel="noopener">YouTube Help ↗</a>
    </div>`;
}


async function loadFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  if (!window.FFmpeg) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load the conversion library. Check your internet connection and try again.'));
      document.head.appendChild(script);
    });
  }
  const { createFFmpeg } = window.FFmpeg;
  ffmpegInstance = createFFmpeg({
    log: false,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
  });
  await ffmpegInstance.load();
  return ffmpegInstance;
}

async function convertToMp3() {
  clearOutput();
  const file = mediaFile.files && mediaFile.files[0];
  if (!file) { showNotice('Please choose a video or audio file first.'); return; }
  if (file.size > 150 * 1024 * 1024) {
    showNotice('This starter version limits files to 150 MB to reduce browser memory issues. Try a smaller file.');
    return;
  }
  if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
    showNotice('Please choose a supported video or audio file.');
    return;
  }
  runButton.disabled = true;
  runButton.textContent = 'Loading converter…';
  try {
    const ffmpeg = await loadFFmpeg();
    const safeName = 'input_media';
    const outputName = 'savrs-audio.mp3';
    ffmpeg.FS('writeFile', safeName, await window.FFmpeg.fetchFile(file));
    runButton.textContent = 'Converting…';
    await ffmpeg.run('-i', safeName, '-vn', '-codec:a', 'libmp3lame', '-q:a', '2', outputName);
    const data = ffmpeg.FS('readFile', outputName);
    const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
    const objectUrl = URL.createObjectURL(blob);
    result.classList.remove('hidden');
    result.innerHTML = `<strong>MP3 is ready</strong><p class="hint">Audio extracted in your browser. No file was uploaded to MediaGrab/SavRS servers.</p><div class="result-actions"><a class="secondary-btn" href="${objectUrl}" download="SavRS-audio.mp3">Download MP3</a></div>`;
    try { ffmpeg.FS('unlink', safeName); ffmpeg.FS('unlink', outputName); } catch (_) {}
  } catch (error) {
    showNotice(error && error.message ? error.message : 'Conversion failed. Try another file or a smaller file.');
  } finally {
    runButton.disabled = false;
    runButton.innerHTML = 'Convert to MP3 <span>→</span>';
  }
}

function setTool(tool) {
  currentTool = tool;
  clearOutput();
  urlInput.value = '';
  mediaFile.value = '';
  uploadArea.classList.add('hidden');
  if (tool === 'youtube') {
    title.textContent = 'YouTube Thumbnail Downloader';
    hint.textContent = 'Supports standard YouTube video links, youtu.be links and Shorts links.';
    urlInput.placeholder = 'Paste a YouTube video URL here…';
    runButton.innerHTML = 'Get thumbnail <span>→</span>';
    runButton.style.display = '';
  } else if (tool === 'direct') {
    title.textContent = 'Direct File Downloader';
    hint.textContent = 'Paste a direct HTTPS URL to a media file you own or are allowed to download.';
    urlInput.placeholder = 'https://example.com/my-video.mp4';
    runButton.innerHTML = 'Check file link <span>→</span>';
    runButton.style.display = '';
  } else if (tool === 'audio') {
    title.textContent = 'Video to MP3 Converter';
    hint.textContent = 'Choose a video or audio file stored on your device. Conversion runs locally in your browser.';
    urlInput.placeholder = 'File upload is used for MP3 conversion';
    uploadArea.classList.remove('hidden');
    runButton.innerHTML = 'Convert to MP3 <span>→</span>';
    runButton.style.display = '';
  } else {
    title.textContent = 'Social Platform Download Guide';
    hint.textContent = 'Choose an official help resource for Facebook, Instagram or YouTube.';
    urlInput.placeholder = 'No link needed for this guide';
    runButton.style.display = 'none';
    renderSocialGuide();
  }
  document.getElementById('workspace').scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => setTool(button.dataset.tool)));
runButton.addEventListener('click', () => {
  if (currentTool === 'youtube') renderThumbnail();
  if (currentTool === 'direct') renderDirect();
  if (currentTool === 'audio') convertToMp3();
});
urlInput.addEventListener('keydown', event => { if (event.key === 'Enter') runButton.click(); });
