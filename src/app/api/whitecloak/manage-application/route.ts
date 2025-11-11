import connectMongoDB from "@/lib/mongoDB/mongoDB";
import sanitizePreScreenAnswers from "@/lib/sanitize/preScreenAnswers";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { interviewData, email, body, interviewTransaction } = await request.json();

  if (!interviewData || !email || !body) {
    return NextResponse.json(
      {
        error: "INTERVIEW_NOT_FOUND",
        message:
          "Interview data could not be found for the given credentials. Unable to proceed with the operation.",
      },
      { status: 404 }
    );
  }

  const { db } = await connectMongoDB();
  const interviewInstance = await db
    .collection("interviews")
    .findOne({ email, _id: new ObjectId(interviewData._id) });

  if (!interviewInstance) {
    return NextResponse.json(
      {
        error: "INTERVIEW_NOT_FOUND",
        message:
          "Interview data could not be found for the given credentials. Unable to proceed with the operation.",
      },
      { status: 404 }
    );
  }

  if (body.forDeletion) {
    // await db.collection("interviews").deleteOne({
    //   _id: new ObjectId(interviewData._id),
    //   email,
    // });
  }

  if (!body.forDeletion) {
    // Sanitize applicant pre-screen answers server-side for defense-in-depth.
    if (body.preScreenAnswers && typeof body.preScreenAnswers === "object") {
      try {
        body.preScreenAnswers = sanitizePreScreenAnswers(body.preScreenAnswers);
      } catch (e) {
        // If sanitization fails, avoid persisting untrusted input.
        return NextResponse.json(
          { error: "INVALID_INPUT", message: "Unable to sanitize input." },
          { status: 400 }
        );
      }
    }

    await db.collection("interviews").updateOne(
      {
        _id: new ObjectId(interviewData._id),
        email,
      },
      {
        $set: {
          ...body,
        },
      }
    );
  }

  if (interviewTransaction) {
    await db.collection("interview-history").insertOne({
      ...interviewTransaction,
      createdAt: Date.now(),
    });
  }

  // Update career lastActivityAt to current date
  await db
    .collection("careers")
    .updateOne({ id: interviewInstance.id }, { $set: { lastActivityAt: new Date() } });

  return NextResponse.json({
    message: "Job application updated successfully.",
  });
}
