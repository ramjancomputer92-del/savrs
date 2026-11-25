document.addEventListener("DOMContentLoaded", () => {
  const platformButtons = document.querySelectorAll(".platform-card");
  const videoUrl = document.getElementById("videoUrl");
  const formatSelect = document.getElementById("formatSelect");
  const selectedPlatform = document.getElementById("selectedPlatform");
  const pasteBtn = document.getElementById("pasteBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const statusBox = document.getElementById("statusBox");

  let currentPlatform = "youtube";

  const platformNames = {
    youtube: "YouTube",
    facebook: "Facebook",
    instagram: "Instagram"
  };

  const placeholders = {
    youtube: "Paste YouTube video URL here...",
    facebook: "Paste Facebook video URL here...",
    instagram: "Paste Instagram Reel URL here..."
  };

  function showStatus(message, type = "info") {
    statusBox.textContent = message;
    statusBox.dataset.type = type;
  }

  function selectPlatform(platform) {
    if (!platformNames[platform]) return;

    currentPlatform = platform;

    platformButtons.forEach(button => {
      const active = button.dataset.platform === platform;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    selectedPlatform.textContent = platformNames[platform] + " selected";
    videoUrl.placeholder = placeholders[platform];
    videoUrl.value = "";

    showStatus("Paste your " + platformNames[platform] + " link to continue.");
  }

  platformButtons.forEach(button => {
    button.addEventListener("click", () => {
      selectPlatform(button.dataset.platform);
    });
  });

  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();

      if (!text) {
        showStatus("Your clipboard is empty.", "error");
        return;
      }

      videoUrl.value = text.trim();
      showStatus("Link pasted. Now press Continue.", "success");
    } catch (error) {
      showStatus("Clipboard access unavailable. Please paste the link manually.", "error");
      videoUrl.focus();
    }
  });

  function getPlatformFromUrl(value) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");

      if (
        host === "youtube.com" ||
        host === "youtu.be" ||
        host === "m.youtube.com" ||
        host === "youtube-nocookie.com"
      ) {
        return "youtube";
      }

      if (
        host === "facebook.com" ||
        host === "fb.watch" ||
        host === "m.facebook.com"
      ) {
        return "facebook";
      }

      if (
        host === "instagram.com" ||
        host === "instagr.am"
      ) {
        return "instagram";
      }

      return null;
    } catch {
      return null;
    }
  }

  function validHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  downloadBtn.addEventListener("click", async () => {
    const link = videoUrl.value.trim();
    const format = formatSelect.value;

    if (!link) {
      showStatus("Please paste a video link first.", "error");
      videoUrl.focus();
      return;
    }

    if (!validHttpUrl(link)) {
      showStatus("Please enter a valid HTTP or HTTPS link.", "error");
      return;
    }

    const detectedPlatform = getPlatformFromUrl(link);

    if (!detectedPlatform) {
      showStatus("This platform is not supported. Use YouTube, Facebook or Instagram.", "error");
      return;
    }

    if (detectedPlatform !== currentPlatform) {
      showStatus(
        "This is a " + platformNames[detectedPlatform] +
        " link. Please select " + platformNames[detectedPlatform] +
        " above and try again.",
        "error"
      );
      return;
    }

    showStatus(
      "Your " + platformNames[currentPlatform] +
      " link is valid. Actual " + format.toUpperCase() +
      " processing is not connected yet. Backend setup is the next step.",
      "info"
    );
  });

  videoUrl.addEventListener("input", () => {
    if (videoUrl.value.trim()) {
      showStatus("Link entered. Select your format and press Continue.");
    }
  });

  selectPlatform("youtube");
});
