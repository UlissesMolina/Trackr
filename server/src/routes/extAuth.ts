import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();

const EXT_JWT_SECRET = process.env.EXT_JWT_SECRET;
if (!EXT_JWT_SECRET) {
  throw new Error("EXT_JWT_SECRET env var is required");
}

router.get("/login", (_req: Request, res: Response) => {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    res.status(500).send("CLERK_PUBLISHABLE_KEY not configured");
    return;
  }

  // Extract the Frontend API URL from the publishable key
  // pk_test_xxxx or pk_live_xxxx — the base64 part decodes to the FAPI domain
  let fapiUrl = "";
  try {
    const base64Part = publishableKey.replace(/^pk_(test|live)_/, "");
    fapiUrl = Buffer.from(base64Part, "base64").toString("utf-8").replace(/\$$/, "");
  } catch {
    res.status(500).send("Invalid CLERK_PUBLISHABLE_KEY format");
    return;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Sign in to Trackr</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #0f1117; color: #e1e4ea;
    display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .msg { text-align: center; }
  .msg p { margin-top: 8px; font-size: 14px; color: #8b8fa3; }
</style></head><body>
<div id="app">
  <div class="msg">
    <h2>Signing in to Trackr...</h2>
    <p id="status">Loading...</p>
  </div>
</div>
<script
  defer
  crossorigin="anonymous"
  src="https://${fapiUrl}/npm/@clerk/ui@1/dist/ui.browser.js"
  type="text/javascript"
></script>
<script
  defer
  crossorigin="anonymous"
  data-clerk-publishable-key="${publishableKey}"
  src="https://${fapiUrl}/npm/@clerk/clerk-js@6/dist/clerk.browser.js"
  type="text/javascript"
></script>
<script>
window.addEventListener("load", async function () {
  const status = document.getElementById("status");
  try {
    await Clerk.load({
      ui: { ClerkUI: window.__internal_ClerkUICtor },
    });

    if (Clerk.session) {
      status.textContent = "Redirecting...";
      const token = await Clerk.session.getToken();
      window.location.href = "/api/ext/auth/callback?session_token=" + encodeURIComponent(token);
      return;
    }

    // Mount sign-in component
    const app = document.getElementById("app");
    app.innerHTML = '<div id="sign-in"></div>';
    Clerk.mountSignIn(document.getElementById("sign-in"), {
      afterSignInUrl: window.location.href,
      afterSignUpUrl: window.location.href,
    });
  } catch (err) {
    status.textContent = "Error: " + err.message;
  }
});
</script>
</body></html>`;

  res.type("html").send(html);
});

router.get("/callback", async (req: Request, res: Response) => {
  const sessionToken = req.query.session_token as string | undefined;

  if (!sessionToken) {
    res.status(400).send("Missing session_token parameter");
    return;
  }

  try {
    const { verifyToken } = await import("@clerk/express");
    const payload = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    if (!payload.sub) {
      res.status(401).send("Invalid session: no user ID");
      return;
    }

    const extToken = jwt.sign({ sub: payload.sub }, EXT_JWT_SECRET!, {
      expiresIn: "90d",
    });

    // Redirect to the done page — the extension's background script watches for this URL
    res.redirect(`/api/ext/auth/done?token=${encodeURIComponent(extToken)}`);
  } catch (err) {
    console.error("Extension auth callback error:", err);
    res.status(401).send("Authentication failed. Please try again.");
  }
});

// Success page — shown briefly before the extension closes the tab
router.get("/done", (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Trackr</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #0f1117; color: #e1e4ea;
    display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .msg { text-align: center; }
  .msg p { margin-top: 8px; font-size: 14px; color: #8b8fa3; }
  .msg .check { font-size: 48px; margin-bottom: 12px; }
</style></head><body>
<div class="msg">
  <div class="check">&#10003;</div>
  <h2>Signed in to Trackr!</h2>
  <p>This tab will close automatically...</p>
</div>
</body></html>`;
  res.type("html").send(html);
});

export default router;
