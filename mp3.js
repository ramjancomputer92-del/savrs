
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("mediaFile");
  const button = document.getElementById("convertButton");
  const status = document.getElementById("converterStatus");
  const downloadArea = document.getElementById("downloadArea");

  let ffmpeg = null;
  let outputUrl = null;

  function show(message) {
    status.textContent = message;
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.crossOrigin = "anonymous";
      script.onload = resolve;
      script.onerror = () => reject(
        new Error("FFmpeg JavaScript library could not load.")
      );
      document.head.appendChild(script);
    });
  }

  async function prepareFFmpeg() {
    if (ffmpeg && ffmpeg.isLoaded()) return ffmpeg;

    if (!window.FFmpeg) {
      show("Loading MP3 library...");
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/ffmpeg/0.11.6/ffmpeg.min.js"
      );
    }

    if (!window.FFmpeg || !window.FFmpeg.createFFmpeg) {
      throw new Error("FFmpeg library is unavailable.");
    }

    const createFFmpeg = window.FFmpeg.createFFmpeg;

    ffmpeg = createFFmpeg({
      log: true,
      mainName: "main",
      corePath:
        "https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js"
    });

    show("Loading converter engine. Please wait...");
    await ffmpeg.load();

    return ffmpeg;
  }

  button.addEventListener("click", async () => {
    const file = fileInput.files[0];

    if (!file) {
      show("Please select a video or audio file.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      show("Please choose a file smaller than 50 MB.");
      return;
    }

    button.disabled = true;
    downloadArea.replaceChildren();

    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      outputUrl = null;
    }

    let inputName = "savrs_input";
    const outputName = "savrs_output.mp3";

    try {
      const engine = await prepareFFmpeg();

      show("Reading your file...");

      const fileData = new Uint8Array(
        await file.arrayBuffer()
      );

      engine.FS("writeFile", inputName, fileData);

      show("Converting to MP3. Keep this page open...");

      await engine.run(
        "-i", inputName,
        "-vn",
        "-codec:a", "libmp3lame",
        "-q:a", "2",
        outputName
      );

      const result = engine.FS("readFile", outputName);

      const blob = new Blob(
        [result],
        { type: "audio/mpeg" }
      );

      outputUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = outputUrl;
      link.download = "SavRS-Audio.mp3";
      link.textContent = "Download MP3";
      link.style.display = "inline-block";
      link.style.marginTop = "18px";
      link.style.padding = "14px 24px";
      link.style.background = "#00d5c0";
      link.style.color = "#07111f";
      link.style.borderRadius = "9px";
      link.style.fontWeight = "bold";
      link.style.textDecoration = "none";

      downloadArea.appendChild(link);

      show("Success! Your MP3 is ready to download.");

      engine.FS("unlink", inputName);
      engine.FS("unlink", outputName);

    } catch (error) {
      console.error("SavRS MP3 error:", error);
      show("Conversion failed: " + (error.message || "Unknown error"));
    } finally {
      button.disabled = false;
    }
  });
});
