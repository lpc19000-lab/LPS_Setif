import { NextResponse } from "next/server";
import { getInventoryHealthScore, getSmartAlerts, getProfitAnalytics } from "@/services/intelligence-service";

export async function GET() {
    try {
        const [healthScore, alerts, profitSnapshot] = await Promise.all([
            getInventoryHealthScore(),
            getSmartAlerts(),
            getProfitAnalytics()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                healthScore,
                alerts,
                profitSnapshot: {
                    dailyProfit: profitSnapshot.dailyProfit,
                    globalMarginPercent: profitSnapshot.globalMarginPercent,
                    overallProfit: profitSnapshot.overallProfit,
                    topProfitableProducts: profitSnapshot.topProfitableProducts
                }
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
