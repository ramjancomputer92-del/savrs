
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("mediaFile");
  const convertButton = document.getElementById("convertButton");
  const status = document.getElementById("converterStatus");
  const downloadArea = document.getElementById("downloadArea");

  let ffmpegInstance = null;
  let outputUrl = null;

  function showStatus(message) {
    status.textContent = message;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Could not load converter library."));
      document.head.appendChild(script);
    });
  }

  async function getFFmpeg() {
    if (ffmpegInstance) return ffmpegInstance;

    if (!window.FFmpeg) {
      await loadScript(
        "https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js"
      );
    }

    const { createFFmpeg } = window.FFmpeg;

    const ffmpeg = createFFmpeg({
      log: false,
      corePath:
        "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js"
    });

    showStatus("Loading MP3 converter. Please wait...");
    await ffmpeg.load();

    ffmpegInstance = ffmpeg;
    return ffmpegInstance;
  }

  convertButton.addEventListener("click", async () => {
    const file = fileInput.files[0];

    if (!file) {
      showStatus("Please select a video or audio file first.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      showStatus("Please select a file smaller than 100 MB.");
      return;
    }

    convertButton.disabled = true;
    downloadArea.replaceChildren();

    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      outputUrl = null;
    }

    try {
      const ffmpeg = await getFFmpeg();

      showStatus("Preparing your media file...");

      const inputName = "input_" + Date.now() + ".media";
      const outputName = "savrs_audio.mp3";

      ffmpeg.FS("writeFile", inputName, new Uint8Array(await file.arrayBuffer()));

      showStatus("Converting to MP3. Please keep this page open...");

      await ffmpeg.run(
        "-i", inputName,
        "-vn",
        "-codec:a", "libmp3lame",
        "-q:a", "2",
        outputName
      );

      const output = ffmpeg.FS("readFile", outputName);
      const blob = new Blob([output.buffer], { type: "audio/mpeg" });

      outputUrl = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = outputUrl;
      downloadLink.download = "SavRS-Audio.mp3";
      downloadLink.textContent = "Download MP3";
      downloadLink.style.display = "inline-block";
      downloadLink.style.marginTop = "18px";
      downloadLink.style.padding = "13px 22px";
      downloadLink.style.background = "#00d5c0";
      downloadLink.style.color = "#07111f";
      downloadLink.style.borderRadius = "9px";
      downloadLink.style.fontWeight = "bold";
      downloadLink.style.textDecoration = "none";

      downloadArea.appendChild(downloadLink);

      showStatus("Conversion complete! Your MP3 is ready.");
      
      ffmpeg.FS("unlink", inputName);
      ffmpeg.FS("unlink", outputName);

    } catch (error) {
      console.error(error);
      showStatus(
        "Conversion failed. Your browser may not support this file or the converter could not load. Try a smaller file or another browser."
      );
    } finally {
      convertButton.disabled = false;
    }
  });
});
