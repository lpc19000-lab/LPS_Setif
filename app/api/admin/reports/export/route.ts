import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

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
            const productsQuery = await adminDb.collection("products").orderBy("name", "asc").get();
            csvData = "ID,Name,Brand,Category,BasePrice,StockWeight,LowStockThreshold\n";
            productsQuery.docs.forEach(doc => {
                const p = doc.data();
                csvData += `${doc.id},"${p.name}","${p.brand}","${p.categoryName || ''}",${p.basePrice},${p.stockWeight},${p.lowStockThreshold || 500}\n`;
            });
            filename = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
        }

        else if (type === "sales") {
            const ordersQuery = await adminDb.collection("orders")
                .where("status", "!=", "CANCELLED")
                .orderBy("createdAt", "desc")
                .get();

            csvData = "OrderID,Date,Customer,TotalItems,TotalRevenue,Status\n";
            for (const doc of ordersQuery.docs) {
                const o = doc.data();
                const createdAt = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
                const totalItems = (o.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
                
                let shopName = "";
                if (o.customerId) {
                    const custDoc = await adminDb.collection("customers").doc(o.customerId).get();
                    shopName = custDoc.data()?.shopName || "";
                }
                
                csvData += `${doc.id},${createdAt.toISOString().split('T')[0]},"${shopName}",${totalItems},${o.totalPrice},${o.status}\n`;
            }
            filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
        }
        else if (type === "customers") {
            const customersQuery = await adminDb.collection("customers").orderBy("name", "asc").get();
            const ordersQuery = await adminDb.collection("orders").where("status", "!=", "CANCELLED").get();

            const customerOrdersMap = new Map<string, { count: number; totalSpent: number }>();
            ordersQuery.docs.forEach(doc => {
                const o = doc.data();
                if (o.customerId) {
                    const curr = customerOrdersMap.get(o.customerId) || { count: 0, totalSpent: 0 };
                    curr.count++;
                    curr.totalSpent += Number(o.totalPrice || 0);
                    customerOrdersMap.set(o.customerId, curr);
                }
            });

            csvData = "CustomerID,ShopName,ContactName,Phone,Wilaya,TotalOrders,TotalSpent\n";
            customersQuery.docs.forEach(doc => {
                const c = doc.data();
                const stats = customerOrdersMap.get(doc.id) || { count: 0, totalSpent: 0 };
                csvData += `${doc.id},"${c.shopName}","${c.name}","${c.phone}","${c.wilaya}",${stats.count},${stats.totalSpent}\n`;
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
