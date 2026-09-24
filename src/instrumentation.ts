export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "development") return;
  const { verifyModels, logModelChecks } = await import("./lib/openai");
  // Don't block boot on the network; just warn if a configured model is missing.
  verifyModels()
    .then(logModelChecks)
    .catch((err: unknown) => {
      console.warn(`[openai] model check skipped: ${err instanceof Error ? err.message : err}`);
    });
}
