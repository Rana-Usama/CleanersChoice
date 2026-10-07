import * as admin from "firebase-admin";
import {onRequest} from "firebase-functions/v2/https";
import {executeWorkSessionOperation} from "./operations";
import {WorkSessionError} from "./model";

export const workSessionOperation = onRequest({region: "us-central1", cors: false}, async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.set("Allow", "POST");
    res.status(405).json({error: {code: "invalid-argument", message: "Use POST."}});
    return;
  }
  const match = /^Bearer (.+)$/.exec(req.get("Authorization") || "");
  if (!match) {
    res.status(401).json({error: {code: "unauthenticated", message: "Please sign in again."}});
    return;
  }
  let uid: string;
  try {
    const token = await admin.auth().verifyIdToken(match[1], true);
    uid = token.uid;
  } catch {
    res.status(401).json({error: {
      code: "unauthenticated", message: "Your sign-in has expired. Please sign in again.",
    }});
    return;
  }
  try {
    const result = await executeWorkSessionOperation(admin.firestore(), uid, req.body);
    res.status(200).json({result});
  } catch (error) {
    if (error instanceof WorkSessionError) {
      const status = error.code === "permission-denied" ? 403 : error.code === "invalid-argument" ? 400 : 409;
      res.status(status).json({error: {code: error.code, message: error.message}});
    } else {
      console.error("Work session operation failed", error);
      res.status(500).json({error: {
        code: "internal", message: "Could not save the work session. Retry the same request.",
      }});
    }
  }
});
