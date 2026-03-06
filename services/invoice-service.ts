import prisma from "@/lib/db";

// ── READ ──────────────────────────────────────────────────────────────────
export const getInvoices = async () => {
    return await prisma.invoice.findMany({
        include: {
            order: {
                include: { customer: true, items: { include: { product: true } } },
            },
        },
        orderBy: { issueDate: "desc" },
    });
};

export const getInvoiceById = async (id: string) => {
    return await prisma.invoice.findUnique({
        where: { id },
        include: {
            order: {
                include: { customer: true, items: { include: { product: true } } },
            },
        },
    });
};

export const getInvoiceByOrderId = async (orderId: string) => {
    return await prisma.invoice.findUnique({
        where: { orderId },
        include: {
            order: {
                include: { customer: true, items: { include: { product: true } } },
            },
        },
    });
};

// ── CREATE (used internally by OrderService transaction) ──────────────────
export const createInvoice = async (orderId: string, amount: number) => {
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1)
        .toString()
        .padStart(4, "0")}`;

    return await prisma.invoice.create({
        data: {
            orderId,
            invoiceNumber,
            totalAmount: amount,
        },
    });
};
