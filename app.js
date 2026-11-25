const urlInput = document.getElementById("media-url");
const runButton = document.getElementById("run-tool");
const result = document.getElementById("result");
const notice = document.getElementById("notice");
const uploadArea = document.getElementById("upload-area");
const mediaFile = document.getElementById("media-file");
const urlArea = document.getElementById("url-area");
const title = document.getElementById("workspace-title");
const hint = document.getElementById("tool-hint");

let currentTool = "youtube";
let ffmpegInstance = null;

document.getElementById("year").textContent = new Date().getFullYear();

function clearOutput() {
  notice.classList.add("hidden");
  result.classList.add("hidden");
  result.replaceChildren();
}

function showNotice(message) {
  result.classList.add("hidden");
  notice.textContent = message;
  notice.classList.remove("hidden");
}

function addLink(parent, text, url, downloadName) {
  const link = document.createElement("a");
  link.className = "secondary-button";
  link.textContent = text;
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  if (downloadName) {
    link.download = downloadName;
  }

  parent.appendChild(link);
}

function showResult() {
  result.classList.remove("hidden");
  notice.classList.add("hidden");
}

function extractYouTubeId(raw) {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") return url.searchParams.get("v");

      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0])) {
        return parts[1] || null;
      }
    }
  } catch (error) {
    return null;
  }

  return null;
}

function renderThumbnail() {
  clearOutput();

  const id = extractYouTubeId(urlInput.value.trim());

  if (!/^[a-zA-Z0-9_-]{11}$/.test(id || "")) {
    showNotice("Please enter a valid YouTube video or Shorts link.");
    return;
  }

  const imageUrl = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  const heading = document.createElement("h3");
  heading.textContent = "Thumbnail Preview";

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = "YouTube thumbnail preview";

  image.onerror = () => {
    showNotice("Thumbnail is not available for this video.");
  };

  const actions = document.createElement("div");
  actions.className = "result-actions";

  addLink(actions, "Open Image ↗", imageUrl);
  addLink(actions, "Download Image", imageUrl, "SavRS-thumbnail.jpg");

  const note = document.createElement("p");
  note.textContent = "Reuse thumbnails only when you have permission.";

  result.append(heading, image, actions, note);
  showResult();
}

function renderDirect() {
  clearOutput();

  let parsed;

  try {
    parsed = new URL(urlInput.value.trim());
  } catch (error) {
    showNotice("Please enter a complete direct file URL.");
    return;
  }

  if (parsed.protocol !== "https:") {
    showNotice("For safety, only HTTPS links are accepted.");
    return;
  }

  const allowed = /\.(mp4|webm|mov|mp3|m4a|wav|jpg|jpeg|png|webp|gif|pdf|zip)(\?.*)?$/i.test(
    parsed.pathname + parsed.search
  );

  if (!allowed) {
    showNotice("This link does not look like a supported direct file link.");
    return;
  }

  const heading = document.createElement("h3");
  heading.textContent = "Direct File Link Ready";

  const message = document.createElement("p");
  message.textContent =
    "Continue only if you own this file or have permission to download it. The file host may control whether downloading is allowed.";

  const actions = document.createElement("div");
  actions.className = "result-actions";
  addLink(actions, "Open File Link ↗", parsed.href);

  result.append(heading, message, actions);
  showResult();
}

function renderSocialGuide() {
  clearOutput();

  const heading = document.createElement("h3");
  heading.textContent = "Official Social Media Help";

  const message = document.createElement("p");
  message.textContent =
    "Use the official platform options to save or export your own content. SavRS does not bypass private accounts, logins or platform restrictions.";

  const actions = document.createElement("div");
  actions.className = "result-actions";

  addLink(actions, "Facebook Help ↗", "https://www.facebook.com/help/");
  addLink(actions, "Instagram Help ↗", "https://help.instagram.com/");
  addLink(actions, "YouTube Help ↗", "https://support.google.com/youtube/");

  result.append(heading, message, actions);
  showResult();
}

async function loadFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;

  if (!window.FFmpeg) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js";
      script.onload = resolve;
      script.onerror = () => reject(
        new Error("Could not load converter. Check your internet connection.")
      );
      document.head.appendChild(script);
    });
  }

  if (!window.FFmpeg || !window.FFmpeg.createFFmpeg) {
    throw new Error("Converter library is not available in this browser.");
  }

  const { createFFmpeg } = window.FFmpeg;

  ffmpegInstance = createFFmpeg({
    log: false,
    corePath: "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js"
  });

  await ffmpegInstance.load();
  return ffmpegInstance;
}

async function convertToMp3() {
  clearOutput();

  const file = mediaFile.files && mediaFile.files[0];

  if (!file) {
    showNotice("Please select a video or audio file first.");
    return;
  }

  if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
    showNotice("Please select a valid video or audio file.");
    return;
  }

  if (file.size > 100 * 1024 * 1024) {
    showNotice("Please choose a file smaller than 100 MB for this browser version.");
    return;
  }

  runButton.disabled = true;
  runButton.textContent = "Loading converter...";

  try {
    const ffmpeg = await loadFFmpeg();

    const inputName = "savrs-input";
    const outputName = "savrs-output.mp3";

    ffmpeg.FS("writeFile", inputName, await window.FFmpeg.fetchFile(file));

    runButton.textContent = "Converting...";

    await ffmpeg.run(
      "-i", inputName,
      "-vn",
      "-codec:a", "libmp3lame",
      "-q:a", "2",
      outputName
    );

    const data = ffmpeg.FS("readFile", outputName);
    const blob = new Blob([data], { type: "audio/mpeg" });
    const objectUrl = URL.createObjectURL(blob);

    const heading = document.createElement("h3");
    heading.textContent = "Your MP3 File Is Ready";

    const message = document.createElement("p");
    message.textContent = "Conversion completed in your browser.";

    const actions = document.createElement("div");
    actions.className = "result-actions";

    const link = document.createElement("a");
    link.className = "secondary-button";
    link.href = objectUrl;
    link.download = "SavRS-audio.mp3";
    link.textContent = "Download MP3 ↓";

    actions.appendChild(link);
    result.append(heading, message, actions);
    showResult();

    try {
      ffmpeg.FS("unlink", inputName);
      ffmpeg.FS("unlink", outputName);
    } catch (error) {}

  } catch (error) {
    showNotice(error.message || "Conversion failed. Try a smaller file.");
  } finally {
    runButton.disabled = false;
    runButton.textContent = "Convert to MP3 →";
  }
}

function setTool(tool) {
  currentTool = tool;
  clearOutput();

  urlInput.value = "";
  mediaFile.value = "";

  uploadArea.classList.add("hidden");
  urlArea.classList.remove("hidden");
  runButton.classList.remove("hidden");

  if (tool === "youtube") {
    title.textContent = "YouTube Thumbnail Preview";
    hint.textContent = "Paste a YouTube video or Shorts link.";
    urlInput.placeholder = "Paste YouTube link here...";
    runButton.textContent = "Get Thumbnail →";
  } else if (tool === "direct") {
    title.textContent = "Direct File Downloader";
    hint.textContent = "Paste a direct HTTPS link to a file you are allowed to download.";
    urlInput.placeholder = "https://example.com/file.mp4";
    runButton.textContent = "Check File Link →";
  } else if (tool === "audio") {
    title.textContent = "Video to MP3 Converter";
    hint.textContent = "Choose your own video or audio file. Conversion runs in your browser.";
    urlArea.classList.add("hidden");
    uploadArea.classList.remove("hidden");
    runButton.textContent = "Convert to MP3 →";
  } else if (tool === "social") {
    title.textContent = "Social Media Official Guide";
    hint.textContent = "Find official help resources for social platforms.";
    urlArea.classList.add("hidden");
    runButton.classList.add("hidden");
    renderSocialGuide();
  }

  document.getElementById("workspace").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

document.querySelectorAll("[data-tool]").forEach(button => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

runButton.addEventListener("click", () => {
  if (currentTool === "youtube") renderThumbnail();
  if (currentTool === "direct") renderDirect();
  if (currentTool === "audio") convertToMp3();
});

urlInput.addEventListener("keydown", event => {
  if (event.key === "Enter") runButton.click();
});
