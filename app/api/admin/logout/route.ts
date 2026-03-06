import { NextResponse } from "next/server";

export async function POST() {
    try {
        const response = NextResponse.json(
            { success: true, message: "Logged out successfully" },
            { status: 200 }
        );

        response.cookies.delete("admin_token");

        return response;
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
