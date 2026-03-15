'use server';

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(data: { title: string, message: string, link?: string }) {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert([{
                type: 'ANNOUNCEMENT',
                title: data.title,
                message: data.message,
                link: data.link || null,
                is_read: false // Active
            }]);

        if (error) throw error;
        
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteAnnouncement(id: string) {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('type', 'ANNOUNCEMENT');

        if (error) throw error;
        
        revalidatePath('/[locale]/admin/(protected)/announcements', 'page');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
