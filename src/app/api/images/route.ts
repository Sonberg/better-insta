import { NextRequest, NextResponse } from "next/server";

const SUPABASE_API_URL =
  "https://wkuhfuofhpjuwilhhtnj.supabase.co/functions/v1";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "6";

    const response = await fetch(
      `${SUPABASE_API_URL}/list-images?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch images");
    }

    const data = await response.json();
    return NextResponse.json(data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
