import crypto from "crypto";
import { initializeFirebase, getDb, COLLECTIONS } from "../../firebase.js";

initializeFirebase();
const db = getDb();
const useFirestore = !!db;

const SESSION_COOKIE = "aiv_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }
  return "dev-only-change-me-with-SESSION_SECRET-before-deploying";
}

function sign(v) {
  return crypto.createHmac("sha256", sessionSecret()).update(v).digest("base64url");
}

function b64u(i) {
  return Buffer.from(i).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}

function createSessionToken(u) {
  const h = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const p = b64u(JSON.stringify({
    sub: u.id, name: u.name, email: u.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  }));
  return `${h}.${p}.${sign(`${h}.${p}`)}`;
}

function sessionCookie(token) {
  const secure = process.env.VERCEL === "1";
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly", "SameSite=Lax", "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

async function verifyGoogleIdToken(idToken) {
  try {
    // Cryptographically verify the Google ID token with the Firebase Admin SDK.
    // verifyIdToken checks the RS256 signature against Google's public keys and
    // validates the aud (project id), iss (securetoken.google.com/<project>) and
    // exp claims — far stronger than the previous Identity Toolkit REST lookup.
    const { getAuth } = await import("firebase-admin/auth");
    const t = await getAuth().verifyIdToken(idToken);
    return {
      uid: t.uid,
      email: t.email,
      name: t.name || t.email,
      picture: t.picture || null,
      emailVerified: t.email_verified === true,
    };
  } catch (err) {
    console.error("[google-auth] verifyIdToken failed:", err.message);
    return null;
  }
}

async function readUsers() {
  if (!useFirestore) return [];
  try {
    const snap = await db.collection("users").get();
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (e) { console.error(e); return []; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    if (!process.env.FIREBASE_PROJECT_ID) {
      return res.status(500).json({ error: "Firebase is not configured. Set FIREBASE_PROJECT_ID environment variable." });
    }

    let decoded;
    decoded = await verifyGoogleIdToken(idToken);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { uid, email, name, picture } = decoded;
    const cleanEmail = (email || "").toLowerCase().trim();
    const displayName = name || cleanEmail.split("@")[0] || "Learner";

    // Enforce a Google-verified email so the email-based matching below is safe.
    if (!cleanEmail) {
      return res.status(400).json({ error: "Google token has no email." });
    }
    if (!decoded.emailVerified) {
      return res.status(403).json({ error: "Google account email is not verified." });
    }

    let user = null;
    const allUsers = await readUsers();
    user = allUsers.find(u => u.firebaseUid === uid);
    if (!user) {
      const byEmail = allUsers.find(u => u.email === cleanEmail);
      if (byEmail) {
        // Only link to an account that is itself Google-provisioned; never
        // silently merge a Google login into a password account (takeover risk).
        const isGoogleAccount = byEmail.authProvider === "google" || !!byEmail.firebaseUid;
        if (!isGoogleAccount) {
          return res.status(409).json({
            error: "An account with this email already exists. Please sign in with your password.",
          });
        }
        user = byEmail;
      }
    }

    if (user) {
      user.name = displayName;
      user.avatar = picture || user.avatar;
      user.lastLogin = new Date().toISOString();
      if (!user.firebaseUid) user.firebaseUid = uid;
      if (!user.authProvider) user.authProvider = "google";
      if (useFirestore) {
        await db.collection("users").doc(user.id).update({
          name: displayName,
          avatar: picture || null,
          lastLogin: new Date().toISOString(),
          firebaseUid: uid,
          authProvider: "google",
        });
      }
    } else {
      const newUser = {
        id: uid,
        name: displayName,
        email: cleanEmail,
        avatar: picture || null,
        firebaseUid: uid,
        authProvider: "google",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      if (useFirestore) {
        const docRef = await db.collection("users").add(newUser);
        newUser.id = docRef.id;
      }
      user = newUser;
    }

    const token = createSessionToken(user);
    const cookie = sessionCookie(token);

    return res.status(200)
      .setHeader("Set-Cookie", cookie)
      .json({
        authenticated: true,
        user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      });

  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
