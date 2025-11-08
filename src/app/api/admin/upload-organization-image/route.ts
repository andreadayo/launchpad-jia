import { NextResponse } from "next/server";
import admin from "firebase-admin";

async function initFirebaseAdmin() {
  if (admin.apps.length > 0) return admin;

  const svc = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!svc) throw new Error("FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_B64 not set");

  let parsed;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64 && !process.env.FIREBASE_SERVICE_ACCOUNT) {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf8");
      parsed = JSON.parse(decoded);
    } else {
      parsed = JSON.parse(svc as string);
    }
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", err);
    throw err;
  }

  admin.initializeApp({
    credential: admin.credential.cert(parsed as any),
    // If you set a bucket via env, use it; otherwise Firebase will use default
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${parsed.project_id}.appspot.com`,
  });

  return admin;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as any;
    const destPath = (form.get("path") as any) || (form.get("fileName") as any);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!destPath) {
      return NextResponse.json({ error: "No destination path provided" }, { status: 400 });
    }

    const adminInstance = await initFirebaseAdmin();
    const bucket = adminInstance.storage().bucket();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileRef = bucket.file(destPath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || "application/octet-stream",
      },
      resumable: false,
    });

    // Make file readable by anyone (optional). If you prefer signed URLs, use getSignedUrl instead.
    try {
      await fileRef.makePublic();
    } catch (e) {
      // Not fatal; continue and attempt to return a signed url instead
      console.warn("makePublic failed, attempting signed URL", e);
    }

    // Build public URL
    const bucketName = bucket.name;
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(destPath)}`;

    // As a fallback, try signed URL if public URL won't work
    // Return the publicUrl regardless; if bucket isn't public, signedUrl would be needed.

    return NextResponse.json({ url: publicUrl, path: destPath });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: (error as any)?.message || "Upload failed" }, { status: 500 });
  }
}
