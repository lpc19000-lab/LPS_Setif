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
}

export default function WilayaSelector({ value, onChange, error, label }: WilayaSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const t = useTranslations("common.labels");
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedWilaya = WILAYAS.find((w: WilayaData) => String(w.id) === String(value) || w.name === value);

    const filteredWilayas = WILAYAS.filter((w: WilayaData) =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(w.id).includes(searchTerm)
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
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-lg text-left transition-all ${error ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                    }`}
            >
                <span className={selectedWilaya ? "text-gray-900" : "text-gray-400"}>
                    {selectedWilaya ? `${selectedWilaya.id} - ${selectedWilaya.name}` : t("select_wilaya")}
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
                            filteredWilayas.map((wilaya: WilayaData) => (
                                <button
                                    key={wilaya.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(wilaya);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-primary/5 transition-colors ${selectedWilaya?.id === wilaya.id ? "bg-primary/10 text-primary font-medium" : "text-gray-700"
                                        }`}
                                >
                                    <span>{wilaya.id} - {wilaya.name}</span>
                                    {selectedWilaya?.id === wilaya.id && <Check className="w-4 h-4" />}
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
