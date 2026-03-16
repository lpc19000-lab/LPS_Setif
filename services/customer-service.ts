import { supabaseAdmin } from "@/lib/supabase-admin";
import bcrypt from "bcryptjs";

export interface Customer {
    id: string;
    phone: string;
    passwordHash?: string;
    name: string;
    shopName: string;
    wilaya: string;
    commune: string;
    address: string;
    role: string;
    status?: string;
    createdAt: Date;
    ordersCount?: number;
    orders?: any[];
    _count?: { orders: number };
}

// ── REGISTER ──────────────────────────────────────────────────────────────
export const registerCustomer = async (data: {
    name: string;
    phone: string;
    password: string;
    wilayaNumber: string;
    wilayaName: string;
    commune: string;
    address: string;
    shopName: string;
    role?: string;
}) => {
    // Check if phone is already registered
    const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('phone', data.phone)
        .maybeSingle();
    
    if (existing) {
        throw new Error("A customer with this phone number already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const { password, ...rest } = data;

    const { data: newCustomer, error } = await supabaseAdmin
        .from('customers')
        .insert([{
            name: data.name,
            phone: data.phone,
            password_hash: passwordHash,
            shop_name: data.shopName,
            wilaya: `${data.wilayaNumber} - ${data.wilayaName}`,
            wilaya_id: Number(data.wilayaNumber),
            commune: data.commune,
            address: data.address,
            role: data.role || "TRADER"
        }])
        .select()
        .single();

    if (error) throw error;

    return { 
        id: newCustomer.id, 
        name: newCustomer.name,
        phone: newCustomer.phone,
        shopName: newCustomer.shop_name,
        wilaya: newCustomer.wilaya,
        commune: newCustomer.commune,
        address: newCustomer.address,
        role: newCustomer.role 
    };
};

// ── READ ──────────────────────────────────────────────────────────────────
export const getCustomerById = async (id: string): Promise<Customer | null> => {
    try {
        const { data: customer, error: custError } = await supabaseAdmin
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (custError || !customer) return null;

        // Fetch orders count and recent orders
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('customer_id', id)
            .order('created_at', { ascending: false });

        return {
            id: customer.id,
            phone: customer.phone,
            name: customer.name || "Unknown",
            shopName: customer.shop_name || "Customer",
            wilaya: customer.wilaya || "",
            commune: customer.commune || "",
            address: customer.address || "",
            role: customer.role || "TRADER",
            status: customer.status || "ACTIVE",
            createdAt: new Date(customer.created_at),
            ordersCount: orders?.length || 0,
            orders: orders || []
        };
    } catch (err) {
        console.error("Customer fetch error (getCustomerById):", err);
        return null;
    }
};

export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    try {
        const { data: customer, error } = await supabaseAdmin
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();

        if (error || !customer) return null;

        return {
            id: customer.id,
            phone: customer.phone,
            name: customer.name || "Unknown",
            shopName: customer.shop_name || "Customer",
            wilaya: customer.wilaya || "",
            commune: customer.commune || "",
            address: customer.address || "",
            role: customer.role || "TRADER",
            status: customer.status || "ACTIVE",
            passwordHash: customer.password_hash,
            createdAt: new Date(customer.created_at),
        };
    } catch (err) {
        console.error("Customer fetch error (getCustomerByPhone):", err);
        return null;
    }
};

export const getCustomers = async (limit = 1000, startAfterStr?: string): Promise<Customer[]> => {
    try {
        let query = supabaseAdmin
            .from('customers')
            .select('*, orders(id)')
            .order('created_at', { ascending: false });
        
        if (startAfterStr) {
            query = query.lt('created_at', startAfterStr);
        }
        
        const { data: customers, error } = await query.limit(limit);
        if (error) throw error;

        return (customers || []).map(customer => ({
            id: customer.id,
            phone: customer.phone,
            name: customer.name || "Unknown",
            shopName: customer.shop_name || "Customer",
            wilaya: customer.wilaya || "",
            commune: customer.commune || "",
            address: customer.address || "",
            role: customer.role || "TRADER",
            status: customer.status || "ACTIVE",
            createdAt: new Date(customer.created_at),
            ordersCount: (customer as any).orders?.length || 0,
            _count: { orders: (customer as any).orders?.length || 0 }
        }));
    } catch (err) {
        console.error("Customers fetch error (getCustomers):", err);
        return [];
    }
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateCustomer = async (
    id: string,
    data: Partial<{
        name: string;
        phone: string;
        wilayaNumber: string;
        wilayaName: string;
        commune: string;
        address: string;
        shopName: string;
    }>
) => {
    const updateObj: any = {};
    if (data.name) updateObj.name = data.name;
    if (data.phone) updateObj.phone = data.phone;
    if (data.address) updateObj.address = data.address;
    if (data.shopName) updateObj.shop_name = data.shopName;
    if (data.commune) updateObj.commune = data.commune;
    if (data.wilayaNumber && data.wilayaName) {
        updateObj.wilaya = `${data.wilayaNumber} - ${data.wilayaName}`;
        updateObj.wilaya_id = Number(data.wilayaNumber);
    }

    const { data: updated, error } = await supabaseAdmin
        .from('customers')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return { id, ...data };
};
