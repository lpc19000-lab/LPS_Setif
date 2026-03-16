import { NextResponse } from "next/server";
import wilayasDataRaw from "@/lib/algeria_69_wilayas.json";

const wilayasData = wilayasDataRaw as any[];

export async function GET() {
    try {
        // Return strictly the 69 wilayas dataset
        const wilayas = wilayasData.map(w => ({
            id: w.code,
            number: w.code,
            name: w.name,
            name_en: w.name,
            name_ar: w.name, // The JSON currently holds french names.
        }));

        return NextResponse.json({ success: true, data: wilayas });
    } catch (error) {
        console.error("Wilayas API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch wilayas" }, { status: 500 });
    }
}
