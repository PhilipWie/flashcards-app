import type de from "./locales/de";

// typed translation keys: t("decks.titel") (typo) or a missing key is a build error
declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "translation";
        resources: {
            translation: typeof de;
        };
    }
}
