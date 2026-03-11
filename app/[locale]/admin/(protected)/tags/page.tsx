import TagClientView from "@/components/admin/TagClientView";
import { getTranslations } from "next-intl/server";
import { getTags } from "@/services/tag-service";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.tags" });

    const tags = await getTags();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                <p className="text-gray-500 mt-1 tracking-wide">{t("subtitle")}</p>
            </div>
            <TagClientView tags={tags} />
        </div>
    );
}
