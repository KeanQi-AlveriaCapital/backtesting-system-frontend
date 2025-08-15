// app/api/strategies/[id]/route.ts
import {
  deleteStrategy,
  getStrategy,
  updateStrategy,
} from "@/lib/services/strategy-services";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Note: params is now Promise<{ id: string }>
) {
  try {
    // Await params before using its properties
    const { id } = await params;

    const strategy = await getStrategy(id);

    if (!strategy) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(strategy);
  } catch (error) {
    console.error("Error fetching strategy:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategy" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Note: params is now Promise<{ id: string }>
) {
  try {
    // Await params before using its properties
    const { id } = await params;
    const updates = await request.json();

    await updateStrategy(id, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating strategy:", error);
    return NextResponse.json(
      { error: "Failed to update strategy" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Note: params is now Promise<{ id: string }>
) {
  try {
    // Await params before using its properties
    const { id } = await params;

    await deleteStrategy(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting strategy:", error);
    return NextResponse.json(
      { error: "Failed to delete strategy" },
      { status: 500 }
    );
  }
}
