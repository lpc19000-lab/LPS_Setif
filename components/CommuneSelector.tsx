"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { algeriaLocations, type WilayaData } from "@/data/algeria-locations";

interface CommuneSelectorProps {
    wilayaId: string | null;
    value: string; // The commune name or ID
    onChange: (commune: { id: string; name: string }) => void;
    error?: string;
    label?: string;
}

interface CommuneItem {
    id: string;
    name: string;
}

export default function CommuneSelector({ wilayaId, value, onChange, error, label }: CommuneSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [communes, setCommunes] = useState<CommuneItem[]>([]);
    const [loading, setLoading] = useState(false);
    const t = useTranslations("common.labels");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!wilayaId) {
            setCommunes([]);
            return;
        }

        const fetchCommunes = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/communes?wilayaId=${wilayaId}`);
                const data = await response.json();
                if (data.success) {
                    setCommunes(data.data.map((c: any) => ({ id: c.id, name: c.name })));
                }
            } catch (err) {
                console.error("Fetch communes error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunes();
    }, [wilayaId]);

    const selectedCommune = communes.find((c: CommuneItem) => c.name === value || c.id === value);

    const filteredCommunes = communes.filter((c: CommuneItem) =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset when wilaya changes
    useEffect(() => {
        if (!wilayaId) return;
        // Search by both name and id because 'value' might be either depending on the parent
        const stillValid = communes.find((c: CommuneItem) => c.name === value || c.id === value);
        if (communes.length > 0 && !stillValid && value && value !== "") {
            onChange({ id: "", name: "" });
        }
    }, [wilayaId, communes, value, onChange]);

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={!wilayaId}
                className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-lg text-left transition-all ${
                    !wilayaId ? "opacity-50 cursor-not-allowed bg-gray-50" :
                    error ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                }`}
            >
                <span className={selectedCommune ? "text-gray-900" : "text-gray-400"}>
                    {loading ? "..." : selectedCommune ? `${selectedCommune.name}` : t("select_commune")}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t("search_commune")}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm py-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {filteredCommunes.length > 0 ? (
                            filteredCommunes.map((commune: CommuneItem) => (
                                <button
                                    key={commune.id}
                                    type="button"
                                    onClick={() => {
                                        onChange({ id: commune.id, name: commune.name });
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-primary/5 transition-colors ${selectedCommune?.id === commune.id ? "bg-primary/10 text-primary font-medium" : "text-gray-700"
                                        }`}
                                >
                                    <span>{commune.name}</span>
                                    {selectedCommune?.id === commune.id && <Check className="w-4 h-4" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">{t("no_results")}</div>
                        )}
                    </div>
                </div>
            )}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
