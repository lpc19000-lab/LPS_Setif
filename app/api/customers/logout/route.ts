import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json(
        { success: true, message: "Logged out successfully" },
        { status: 200 }
    );

    response.cookies.set({
        name: "customer_token",
        value: "",
        httpOnly: true,
        expires: new Date(0),
        path: "/",
    });

    return response;
}
