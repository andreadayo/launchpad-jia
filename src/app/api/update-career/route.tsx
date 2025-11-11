import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongoDB/mongoDB";
import { ObjectId } from "mongodb";
import { validateAndSanitizeCareerPartial } from "@/lib/sanitize/careerInput";

export async function POST(request: Request) {
  try {
    let requestData = await request.json();
    const { _id, id } = requestData;

    // Validate and sanitize partial update payload
    let sanitizedInput: any;
    try {
      sanitizedInput = validateAndSanitizeCareerPartial(requestData);
    } catch (err: any) {
      console.error("Validation error in update-career:", err);
      const details = err?.issues || err?.errors || err?.message || "Invalid input";
      return NextResponse.json({ error: "VALIDATION_ERROR", details }, { status: 400 });
    }

    // Validate required fields: accept either Mongo _id or legacy guid `id`
    if (!_id && !id) {
      return NextResponse.json({ error: "Job Object ID or id is required" }, { status: 400 });
    }

    const { db } = await connectMongoDB();

    // Use only sanitized fields for the update
    let dataUpdates = { ...sanitizedInput };
    delete dataUpdates.screeningSetting;
    // Don't allow overwriting identifiers
    delete dataUpdates._id;
    delete dataUpdates.id;

    const career = { ...dataUpdates };

    if (_id) {
      await db.collection("careers").updateOne({ _id: new ObjectId(_id) }, { $set: career });
    } else {
      // update by legacy guid 'id' field
      await db.collection("careers").updateOne({ id: id }, { $set: career });
    }

    return NextResponse.json({
      message: "Career updated successfully",
      career,
    });
  } catch (error) {
    console.error("Error updating career:", error);
    return NextResponse.json({ error: "Failed to add career" }, { status: 500 });
  }
}
