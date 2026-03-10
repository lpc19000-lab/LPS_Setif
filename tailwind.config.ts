import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#D4AF37", // Gold
                    light: "#E5C76B",
                    dark: "#B8860B",
                },
                background: "#FDFDFD", // Soft White
                secondary: "#F5F5DC", // Beige
                text: "#333333", // Dark Gray
            },
            fontFamily: {
                serif: ["var(--font-serif)", "serif"],
                sans: ["var(--font-sans)", "sans-serif"],
                arabic: ["var(--font-arabic)", "var(--font-sans)", "sans-serif"],
            },
        },
    },
    plugins: [],
};
export default config;
