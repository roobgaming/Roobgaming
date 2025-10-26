// Registra el Service Worker solo si existe el archivo
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch (e) {
      // SW opcional; no romper si falla
    }
  });
}