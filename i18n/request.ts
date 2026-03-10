import { getRequestConfig } from "next-intl/server";

const locales = ["fr", "ar"];

export default getRequestConfig(async ({ locale }) => {
    const currentLocale =
        locale && locales.includes(locale) ? locale : "fr";

    const messages = (await import(`../messages/${currentLocale}.json`)).default;

    return {
        locale: currentLocale,
        messages
    };
});
