"use client";

import { useEffect, useState } from "react";

export default function InventoryTrendSparkline({ productId }: { productId: string }) {
    const [history, setHistory] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`/api/inventory/logs?productId=${productId}`);
                const data = await response.json();
                if (data.success) {
                    // Extract quantities over time
                    const trend = (data.data || []).reverse().map((log: any) => Number(log.quantity));
                    setHistory(trend);
                }
            } catch (err) {
                console.error("Fetch trend error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [productId]);

    if (loading || history.length < 2) return <div className="h-4 w-12 bg-gray-50 rounded animate-pulse" />;

    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min || 1;
    const width = 60;
    const height = 20;

    const points = history.map((val, i) => {
        const x = (i / (history.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                fill="none"
                stroke="#D4AF37"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="drop-shadow-[0_1px_2px_rgba(212,175,55,0.3)]"
            />
        </svg>
    );
}
