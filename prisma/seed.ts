import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting production seeding...");

    // 0. CLEANUP (Remove development data)
    // DANGER: Only for development/prep phase. 
    // Comment out these lines if you want to keep existing data.
    console.log("Cleaning up development data...");
    await prisma.orderLog.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventoryLog.deleteMany({});
    await prisma.productTag.deleteMany({});
    await prisma.productCollection.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.category.deleteMany({});
    console.log("Data cleaned.");

    // 1. Create Admin User
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!adminPassword) throw new Error("ADMIN_INITIAL_PASSWORD env var is not set");
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.upsert({
        where: { email: "admin@gmail.com" },
        update: {
            passwordHash: hashedAdminPassword,
            name: "LPS Admin",
            role: "SUPER_ADMIN",
        },
        create: {
            email: "admin@gmail.com",
            passwordHash: hashedAdminPassword,
            name: "LPS Admin",
            role: "SUPER_ADMIN",
        },
    });
    console.log(`Admin account: admin@gmail.com / (Check your ADMIN_INITIAL_PASSWORD env var)`);

    // 2. Create Initial Categories
    const categories = [
        { name: "Men Perfumes", description: "Premium masculine fragrances." },
        { name: "Women Perfumes", description: "Elegant and sophisticated scents for women." },
        { name: "Unisex", description: "Versatile fragrances suitable for everyone." },
        { name: "Luxury Collection", description: "Our most exclusive and rare fragrances." },
    ];

    for (const cat of categories) {
        const slug = cat.name.toLowerCase().replace(/\s+/g, "-");
        await prisma.category.create({
            data: {
                id: slug,
                name: cat.name,
                slug: slug,
                description: cat.description,
            },
        });
    }
    console.log("Production categories seeded.");

    console.log("Database ready for production!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
