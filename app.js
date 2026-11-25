
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const platforms = {
    youtube: {
      input: "youtubeUrl",
      previewButton: "youtubePreviewBtn",
      preview: "youtubePreview",
      thumbnail: "youtubeThumbnail",
      title: "youtubeVideoTitle",
      format: "youtubeFormat",
      action: "youtubeActionBtn",
      status: "youtubeStatus",
      hosts: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
      label: "YouTube"
    },
    facebook: {
      input: "facebookUrl",
      previewButton: "facebookPreviewBtn",
      preview: "facebookPreview",
      thumbnail: "facebookThumbnail",
      title: "facebookVideoTitle",
      format: "facebookFormat",
      action: "facebookActionBtn",
      status: "facebookStatus",
      hosts: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"],
      label: "Facebook"
    },
    instagram: {
      input: "instagramUrl",
      previewButton: "instagramPreviewBtn",
      preview: "instagramPreview",
      thumbnail: "instagramThumbnail",
      title: "instagramVideoTitle",
      format: "instagramFormat",
      action: "instagramActionBtn",
      status: "instagramStatus",
      hosts: ["instagram.com", "www.instagram.com"],
      label: "Instagram"
    }
  };

  function getElement(id) {
    return document.getElementById(id);
  }

  function setStatus(config, message, isError = false) {
    const element = getElement(config.status);
    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#ff8585" : "#00d6c5";
  }

  function getSafeUrl(value) {
    try {
      const url = new URL(value.trim());

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return null;
      }

      if (url.username || url.password) {
        return null;
      }

      return url;
    } catch {
      return null;
    }
  }

  function isSupportedHost(url, config) {
    return config.hosts.includes(url.hostname.toLowerCase());
  }

  function getYouTubeId(url) {
    const host = url.hostname.toLowerCase();
    let id = "";

    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (url.pathname === "/watch") {
      id = url.searchParams.get("v") || "";
    } else {
      const parts = url.pathname.split("/").filter(Boolean);

      if (["shorts", "embed", "live"].includes(parts[0])) {
        id = parts[1] || "";
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  }

  function clearPreview(config) {
    const preview = getElement(config.preview);
    const image = getElement(config.thumbnail);
    const title = getElement(config.title);

    if (preview) preview.hidden = true;

    if (image) {
      image.removeAttribute("src");
      image.alt = config.label + " thumbnail preview";
    }

    if (title) title.textContent = config.label + " Preview";
  }

  function showYouTubePreview(config, id) {
    const preview = getElement(config.preview);
    const image = getElement(config.thumbnail);
    const title = getElement(config.title);

    if (!preview || !image || !title) return;

    const thumbnailUrl =
      "https://img.youtube.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg";

    image.onerror = () => {
      image.removeAttribute("src");
      title.textContent = "Thumbnail is unavailable.";
    };

    image.onload = () => {
      title.textContent = "YouTube video preview";
    };

    image.src = thumbnailUrl;
    preview.hidden = false;
  }

  function previewPlatform(key) {
    const config = platforms[key];
    const input = getElement(config.input);

    if (!input) return;

    const url = getSafeUrl(input.value);

    clearPreview(config);

    if (!url) {
      setStatus(config, "Please enter a valid HTTP or HTTPS link.", true);
      return;
    }

    if (!isSupportedHost(url, config)) {
      setStatus(config, "This link does not appear to belong to " + config.label + ".", true);
      return;
    }

    if (key === "youtube") {
      const id = getYouTubeId(url);

      if (!id) {
        setStatus(config, "Could not identify a valid YouTube video ID.", true);
        return;
      }

      showYouTubePreview(config, id);
      setStatus(config, "YouTube thumbnail preview requested. Downloading is not provided by this link checker.");
      return;
    }

    setStatus(
      config,
      config.label + " link recognized. A thumbnail preview is not available through this tool."
    );
  }

  function checkPlatform(key) {
    const config = platforms[key];
    const input = getElement(config.input);
    const format = getElement(config.format);

    if (!input || !format) return;

    const url = getSafeUrl(input.value);

    if (!url) {
      setStatus(config, "Please enter a valid HTTP or HTTPS link.", true);
      return;
    }

    if (!isSupportedHost(url, config)) {
      setStatus(config, "This link does not appear to belong to " + config.label + ".", true);
      return;
    }

    const selectedFormat = format.value.toUpperCase();

    setStatus(
      config,
      selectedFormat + " direct downloading is not available through the official public link checker. Use the platform's official save/export options, or convert a file you own using SavRS MP3 Converter."
    );
  }

  Object.entries(platforms).forEach(([key, config]) => {
    const previewButton = getElement(config.previewButton);
    const actionButton = getElement(config.action);
    const input = getElement(config.input);

    if (previewButton) {
      previewButton.addEventListener("click", () => previewPlatform(key));
    }

    if (actionButton) {
      actionButton.addEventListener("click", () => checkPlatform(key));
    }

    if (input) {
      input.addEventListener("input", () => {
        clearPreview(config);
        setStatus(config, "");
      });
    }
  });

  const year = getElement("currentYear");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
});
