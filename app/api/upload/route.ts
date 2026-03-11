import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExt = file.name.split(".").pop() || "png";
        const fileName = `products/images/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const bucket = adminStorage.bucket();
        const fileRef = bucket.file(fileName);

        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        // Make the file publicly accessible
        await fileRef.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
