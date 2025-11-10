import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import connectMongoDB from "@/lib/mongoDB/mongoDB";

export async function POST(request: Request) {
  try {
    const { id, orgID } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Career ID is required" }, { status: 400 });
    }

    const { db } = await connectMongoDB();

    // Accept either a Mongo ObjectId (24-hex) or the legacy GUID `id` field.
    let query: any = {};
    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    if (isObjectId) {
      query._id = new ObjectId(id);
    } else {
      query.id = id; // legacy guid
    }

    if (orgID) {
      query.orgID = orgID;
    }

    const career = await db.collection("careers").findOne(query);

    if (!career) {
      return NextResponse.json({ error: "Career not found" }, { status: 404 });
    }

    return NextResponse.json(career);
  } catch (error) {
    console.error("Error fetching career:", error);
    return NextResponse.json({ error: "Failed to fetch career data" }, { status: 500 });
  }
}
