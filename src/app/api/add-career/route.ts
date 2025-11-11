import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongoDB/mongoDB";
import { guid } from "@/lib/Utils";
import { ObjectId } from "mongodb";
import { validateAndSanitizeCareer } from "@/lib/sanitize/careerInput";

export async function POST(request: Request) {
  try {
    // Validate and sanitize input
    let sanitizedInput: any;
    try {
      const body = await request.json();
      sanitizedInput = validateAndSanitizeCareer(body);
    } catch (err: any) {
      console.error("Validation error in add-career:", err);
      const details = err?.issues || err?.errors || err?.message || "Invalid input";
      return NextResponse.json({ error: "VALIDATION_ERROR", details }, { status: 400 });
    }

    const {
      jobTitle,
      description,
      questions,
      preScreeningQuestions,
      lastEditedBy,
      createdBy,
      screeningSetting,
      cvScreeningSetting,
      aiScreeningSetting,
      orgID,
      requireVideo,
      location,
      workSetup,
      workSetupRemarks,
      status,
      salaryNegotiable,
      minimumSalary,
      maximumSalary,
      country,
      province,
      employmentType,
    } = sanitizedInput;

    // Validate required fields after sanitization
    if (!jobTitle || !description || !questions || !location || !workSetup) {
      return NextResponse.json(
        {
          error: "Job title, description, questions, location and work setup are required",
        },
        { status: 400 }
      );
    }

    const { db } = await connectMongoDB();

    const orgDetails = await db
      .collection("organizations")
      .aggregate([
        {
          $match: {
            _id: new ObjectId(orgID),
          },
        },
        {
          $lookup: {
            from: "organization-plans",
            let: { planId: "$planId" },
            pipeline: [
              {
                $addFields: {
                  _id: { $toString: "$_id" },
                },
              },
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$planId"] },
                },
              },
            ],
            as: "plan",
          },
        },
        {
          $unwind: "$plan",
        },
      ])
      .toArray();

    if (!orgDetails || orgDetails.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const totalActiveCareers = await db
      .collection("careers")
      .countDocuments({ orgID, status: "active" });

    if (totalActiveCareers >= orgDetails[0].plan.jobLimit + (orgDetails[0].extraJobSlots || 0)) {
      return NextResponse.json(
        { error: "You have reached the maximum number of jobs for your plan" },
        { status: 400 }
      );
    }

    let career: any = {
      id: guid(),
      jobTitle,
      description,
      questions,
      location,
      workSetup,
      workSetupRemarks,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastEditedBy,
      createdBy,
      status: status || "active",
      cvScreeningSetting: cvScreeningSetting || screeningSetting,
      aiScreeningSetting: aiScreeningSetting || screeningSetting,
      orgID,
      requireVideo,
      lastActivityAt: new Date(),
      salaryNegotiable,
      minimumSalary,
      maximumSalary,
      country,
      province,
      employmentType,
    };

    // Only set preScreeningQuestions when explicitly provided in the request.
    if (Array.isArray(preScreeningQuestions)) {
      career.preScreeningQuestions = preScreeningQuestions;
    }

    await db.collection("careers").insertOne(career);

    return NextResponse.json({
      message: "Career added successfully",
      career,
    });
  } catch (error) {
    console.error("Error adding career:", error);
    return NextResponse.json({ error: "Failed to add career" }, { status: 500 });
  }
}
