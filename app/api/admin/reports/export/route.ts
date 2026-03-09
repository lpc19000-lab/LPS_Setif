import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { OrderStatus } from "@prisma/client";

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
            const products = await prisma.product.findMany({
                include: { category: true },
                orderBy: { name: "asc" }
            });

            csvData = "ID,Name,Brand,Category,BasePrice,StockWeight,LowStockThreshold\n";
            products.forEach(p => {
                csvData += `${p.id},"${p.name}","${p.brand}","${p.category.name}",${p.basePrice},${p.stockWeight},${p.lowStockThreshold}\n`;
            });
            filename = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
        }

        else if (type === "sales") {
            const orders = await prisma.order.findMany({
                where: { status: { not: OrderStatus.CANCELLED } },
                include: { customer: true, items: true },
                orderBy: { createdAt: "desc" }
            });

            csvData = "OrderID,Date,Customer,TotalItems,TotalRevenue,Status\n";
            orders.forEach(o => {
                const totalItems = o.items.reduce((sum, item) => sum + item.quantity, 0);
                csvData += `${o.id},${o.createdAt.toISOString().split('T')[0]},"${o.customer.shopName}",${totalItems},${o.totalPrice},${o.status}\n`;
            });
            filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
        }
        else if (type === "customers") {
            const customers = await prisma.customer.findMany({
                include: { orders: { where: { status: { not: OrderStatus.CANCELLED } } } },
                orderBy: { name: "asc" }
            });

            csvData = "CustomerID,ShopName,ContactName,Phone,Wilaya,TotalOrders,TotalSpent\n";
            customers.forEach(c => {
                const totalSpent = c.orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
                csvData += `${c.id},"${c.shopName}","${c.name}","${c.phone}","${c.wilaya}",${c.orders.length},${totalSpent}\n`;
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
