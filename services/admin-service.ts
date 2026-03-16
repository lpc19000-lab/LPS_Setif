import { supabaseAdmin } from "@/lib/supabase-admin";
import bcrypt from "bcryptjs";

export interface Admin {
    id: string;
    email: string;
    passwordHash?: string;
    name?: string;
    role: string;
    createdAt: Date;
}

export const createAdminUser = async (data: {
    email: string;
    password: string;
    name?: string;
}) => {
    // 1. Create user in Supabase Auth
    // Note: This requires the admin to have 'service_role' or proper permissions to create users.
    // However, since we are separating from Firebase Auth entirely, we will use our own 'admins' table
    // for now to match the existing logic, or use Supabase Auth's 'auth.users'.
    // Given the separation request, we'll store them in our public.admins table.
    
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // For now, we'll use a custom 'admins' table in Supabase.
    const { data: admin, error } = await supabaseAdmin
        .from('admins')
        .insert([{
            email: data.email,
            password_hash: hashedPassword,
            name: data.name,
            role: "SUPER_ADMIN"
        }])
        .select()
        .single();

    if (error) throw error;

    return { 
        id: admin.id, 
        email: admin.email,
        name: admin.name,
        role: admin.role,
        createdAt: new Date(admin.created_at)
    };
};

export const getAdminStats = async () => {
    try {
        // Use RPC or parallel queries for counts
        const [ordersCount, customersCount, productsCount] = await Promise.all([
            supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
        ]);

        // Revenue calculation using Postgres sum aggregation
        const { data: revenueData, error: revError } = await supabaseAdmin
            .from('orders')
            .select('total_price')
            .not('total_price', 'is', null)
            .neq('status', 'CANCELLED');
        
        let totalRevenue = (revenueData || []).reduce((acc, curr) => acc + Number(curr.total_price), 0);

        return {
            totalOrders: ordersCount.count || 0,
            totalCustomers: customersCount.count || 0,
            totalProducts: productsCount.count || 0,
            totalRevenue,
        };
    } catch (error) {
        console.error("Error getting admin stats:", error);
        return {
            totalOrders: 0,
            totalCustomers: 0,
            totalProducts: 0,
            totalRevenue: 0,
        };
    }
};

export const validateAdminCredentials = async (email: string, password: string) => {
    console.log(`[validateAdminCredentials] Checking email: ${email}`);
    const { data: admin, error } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('email', email)
        .maybeSingle();
    
    if (error) {
        console.error(`[validateAdminCredentials] DB Error:`, error);
        return null;
    }
    
    if (!admin) {
        console.log(`[validateAdminCredentials] Admin not found for email: ${email}`);
        return null;
    }
    
    console.log(`[validateAdminCredentials] Admin found, verifying password hash...`);
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
        console.log(`[validateAdminCredentials] Invalid password for: ${email}`);
        return null;
    }

    console.log(`[validateAdminCredentials] Password valid for: ${email}`);
    return { 
        id: admin.id, 
        email: admin.email,
        name: admin.name,
        role: admin.role,
        createdAt: new Date(admin.created_at)
    };
};
