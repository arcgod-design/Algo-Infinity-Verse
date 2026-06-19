import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let db = null;
let useFirestore = false;

function initFirebase() {
  if (getApps().length > 0) {
    db = getFirestore();
    useFirestore = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase credentials not set.");
    return;
  }

  try {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    db = getFirestore();
    useFirestore = true;
  } catch (e) {
    console.error(e);
  }
}

initFirebase();

const SESSION_COOKIE = "aiv_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required before issuing session cookies.");
  }
  return process.env.SESSION_SECRET;
}

function sign(v) {
  return crypto.createHmac("sha256", sessionSecret()).update(v).digest("base64url");
}

function b64u(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createSessionToken(user) {
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64u(JSON.stringify({
    sub: user.id,
    name: user.name,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  }));
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

function sessionCookie(token) {
  const secure = process.env.VERCEL === "1";
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

async function readUsers() {
  if (!useFirestore) return [];
  try {
    const snapshot = await db.collection("users").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function getUserByEmail(email) {
  if (!useFirestore) {
    const users = await readUsers();
    return users.find((u) => u.email === email) || null;
  }
  const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "ID token is required." });
    }

    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(idToken);
    } catch (verifyError) {
      console.error("[auth/google] Token verification failed:", verifyError.message);
      return res.status(401).json({ error: "Invalid or expired Google token." });
    }

    const provider = decoded.firebase?.sign_in_provider;
    const email = String(decoded.email || "").trim().toLowerCase();
    if (provider !== "google.com" || !email || decoded.email_verified !== true) {
      return res.status(401).json({ error: "Invalid or expired Google token." });
    }

    const { name, picture } = decoded;
    const uid = decoded.uid;

    let user = await getUserByEmail(email);

    if (!user) {
      const newUser = {
        name: name || email.split("@")[0],
        email,
        avatar: picture || "🚀",
        xp: 0,
        level: 1,
        authProvider: "google",
        createdAt: new Date().toISOString(),
      };

      if (useFirestore) {
        await db.collection("users").doc(uid).set(newUser);
        user = { id: uid, ...newUser };
      } else {
        user = { id: uid, ...newUser };
      }
    }

    const token = createSessionToken(user);
    return res
      .status(200)
      .setHeader("Set-Cookie", sessionCookie(token))
      .json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("[auth/google] Error:", error);
    return res.status(500).json({ error: "Google authentication failed." });
  }
}
