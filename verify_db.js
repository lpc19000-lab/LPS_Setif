import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Testing Prisma Database Connection...");

        // Test 1: Fetch 5 products
        const products = await prisma.product.findMany({
            take: 5,
            select: { id: true, name: true, slug: true }
        });
        console.log(`Successfully fetched ${products.length} products:`);
        console.log(JSON.stringify(products, null, 2));

        // Test 2: Fetch an admin user
        const admin = await prisma.admin.findFirst({
            select: { id: true, email: true, role: true }
        });

        if (admin) {
            console.log("Successfully fetched an admin user:", admin.email);
        } else {
            console.log("No admin users found in the database. (But connection worked)");
        }

    } catch (error) {
        console.error("Database connection or query failed:", error);
    } finally {
        await prisma.$disconnect();
        console.log("Prisma connection closed.");
    }
}

main();
