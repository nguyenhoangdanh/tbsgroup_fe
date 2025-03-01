import { NextRequest, NextResponse } from "next/server";
import { readFromGoogleSheet } from "@/actions/googlesheet";

export async function GET(req: NextRequest) {
  console.log("API route hit");
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range");

  if (!range) {
    return NextResponse.json({ error: "Range is required" }, { status: 400 });
  }

  try {
    const data = await readFromGoogleSheet(range);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheets" },
      { status: 500 }
    );
  }
}
