"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { algeriaLocations as WILAYAS, type WilayaData } from "@/data/algeria-locations";
import { useTranslations } from "next-intl";

interface WilayaSelectorProps {
    value: string;
    onChange: (wilaya: { id: string; name: string }) => void;
    error?: string;
    label?: string;
    id?: string;
    name?: string;
}

export default function WilayaSelector({ value, onChange, error, label, id, name }: WilayaSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [wilayas, setWilayas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const t = useTranslations("common.labels");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchWilayas = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/wilayas");
                const data = await response.json();
                if (data.success) {
                    setWilayas(data.data);
                }
            } catch (err) {
                console.error("Fetch wilayas error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWilayas();
    }, []);

    const getWilayaName = (w: any) => w.name || w.name_en || w.name_ar || "";

    const selectedWilaya = wilayas.find((w: any) => String(w.number) === String(value) || getWilayaName(w) === value);

    const filteredWilayas = wilayas.filter((w: any) =>
        getWilayaName(w).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(w.number).includes(searchTerm)
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

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <button
                id={id}
                name={name}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-lg text-left transition-all ${error ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                    }`}
            >
                <span className={selectedWilaya ? "text-gray-900" : "text-gray-400"}>
                    {loading ? "..." : selectedWilaya ? `${selectedWilaya.number} - ${getWilayaName(selectedWilaya)}` : t("select_wilaya")}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t("search_wilaya")}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm py-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {filteredWilayas.length > 0 ? (
                            filteredWilayas.map((wilaya: any) => (
                                <button
                                    key={wilaya.number}
                                    type="button"
                                    onClick={() => {
                                        onChange({ id: String(wilaya.number), name: getWilayaName(wilaya) });
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-primary/5 transition-colors ${selectedWilaya?.number === wilaya.number ? "bg-primary/10 text-primary font-medium" : "text-gray-700"
                                        }`}
                                >
                                    <span>{wilaya.number} - {getWilayaName(wilaya)}</span>
                                    {selectedWilaya?.number === wilaya.number && <Check className="w-4 h-4" />}
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
