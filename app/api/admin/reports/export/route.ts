import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        if (!type) {
            return new NextResponse("Missing report type", { status: 400 });
        }

        let csvData = "";
        let filename = "report.csv";

        if (type === "inventory") {
            const { data: products, error } = await supabaseAdmin
                .from("products")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;

            csvData = "ID,Name,Brand,Category,BasePrice,StockWeight,LowStockThreshold\n";
            products?.forEach((p) => {
                csvData += `${p.id},"${p.name}","${p.brand}","${p.category_id || ''}",${p.base_price},${p.stock_weight},${p.low_stock_threshold || 500}\n`;
            });
            filename = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
        }

        else if (type === "sales") {
            const { data: orders, error } = await supabaseAdmin
                .from("orders")
                .select("*, customers(shop_name), order_items(quantity)")
                .neq("status", "CANCELLED")
                .order("created_at", { ascending: false });

            if (error) throw error;

            csvData = "OrderID,Date,Customer,TotalItems,TotalRevenue,Status\n";
            orders?.forEach((o: any) => {
                const createdAt = new Date(o.created_at);
                const totalItems = (o.order_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
                const shopName = o.customers?.shop_name || "";
                
                csvData += `${o.id},${createdAt.toISOString().split('T')[0]},"${shopName}",${totalItems},${o.total_price},${o.status}\n`;
            });
            filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
        }
        else if (type === "customers") {
            // Complex aggregation: customer total spend
            // In a real app, we might use a view or a group by query
            // For now, we'll mimic the manual aggregation if simple queries are preferred
            
            const { data: customers, error: cError } = await supabaseAdmin
                .from("customers")
                .select("*")
                .order("name", { ascending: true });

            if (cError) throw cError;

            const { data: orders, error: oError } = await supabaseAdmin
                .from("orders")
                .select("customer_id, total_price")
                .neq("status", "CANCELLED");

            if (oError) throw oError;

            const customerOrdersMap = new Map<string, { count: number; totalSpent: number }>();
            orders?.forEach((o) => {
                if (o.customer_id) {
                    const curr = customerOrdersMap.get(o.customer_id) || { count: 0, totalSpent: 0 };
                    curr.count++;
                    curr.totalSpent += Number(o.total_price || 0);
                    customerOrdersMap.set(o.customer_id, curr);
                }
            });

            csvData = "CustomerID,ShopName,ContactName,Phone,Wilaya,TotalOrders,TotalSpent\n";
            customers?.forEach((c) => {
                const stats = customerOrdersMap.get(c.id) || { count: 0, totalSpent: 0 };
                csvData += `${c.id},"${c.shop_name}","${c.name}","${c.phone}","${c.wilaya}",${stats.count},${stats.totalSpent}\n`;
            });
            filename = `customers_report_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            return new NextResponse("Invalid report type", { status: 400 });
        }

        // Return CSV file
        return new NextResponse(csvData, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error("Export Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
