import { NextRequest, NextResponse } from "next/server";
import wilayasDataRaw from "@/lib/algeria_69_wilayas.json";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const wilayaId = searchParams.get("wilayaId");

    if (!wilayaId) {
        return NextResponse.json({ success: false, error: "wilayaId is required" }, { status: 400 });
    }

    try {
        const wilayasData = wilayasDataRaw as any[];
        const wilaya = wilayasData.find((w: any) => String(w.code) === String(wilayaId) || w.name === wilayaId);
        
        if (!wilaya) {
             return NextResponse.json({ success: true, data: [] });
        }

        const communes = (wilaya.communes || []).map((c: any) => ({
            id: c.name,
            name: c.name,
            name_en: c.name,
            name_ar: c.name,
        }));

        return NextResponse.json({ success: true, data: communes });
    } catch (error) {
        console.error("Communes API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch communes" }, { status: 500 });
    }
}
