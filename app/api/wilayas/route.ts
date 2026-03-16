import { NextResponse } from "next/server";
import wilayasDataRaw from "@/lib/algeria_69_wilayas.json";

export async function GET() {
    try {
        const wilayasData = wilayasDataRaw as any[];
        const wilayas = wilayasData.map((w: any) => ({
            id: w.code,
            number: w.code,
            name: w.name,
            name_en: w.name,
            name_ar: w.name,
        }));

        return NextResponse.json({ success: true, data: wilayas });
    } catch (error) {
        console.error("Wilayas API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch wilayas" }, { status: 500 });
    }
}
