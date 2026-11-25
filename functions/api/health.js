export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      success: true,
      project: "SavRS",
      message: "SavRS Backend is running!",
      services: {
        youtube: "Not connected",
        facebook: "Not connected",
        instagram: "Not connected",
        mp3: "Not connected"
      }
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}

