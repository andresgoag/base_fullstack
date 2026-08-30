import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "i18n/config";

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage =
    SUPPORTED_LANGUAGES.find((language) =>
      i18n.language.startsWith(language.code),
    )?.code ?? SUPPORTED_LANGUAGES[0].code;

  return (
    <>
      <label htmlFor="language-switcher" className="visually-hidden">
        {t("common.language")}
      </label>
      <select
        id="language-switcher"
        className="form-select form-select-sm w-auto"
        value={currentLanguage}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value);
        }}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </>
  );
};
