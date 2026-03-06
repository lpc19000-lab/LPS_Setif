"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> { }

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
    ({ className, ...props }, ref) => {
        return (
            <div className={cn("relative group", className)}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                    ref={ref}
                    className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    {...props}
                />
            </div>
        );
    }
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
