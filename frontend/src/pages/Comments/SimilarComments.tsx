import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "hooks/useDebouncedValue";
import { useSimilarComments } from "queries/comments";

const SEARCH_DEBOUNCE_MS = 400;

export const SimilarComments = () => {
  const { t, i18n } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [submittedText, setSubmittedText] = useState<string | null>(null);
  const debouncedSearchText = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const activeSearchText = submittedText ?? debouncedSearchText;
  const { data, isPending, isFetching, isError, error } =
    useSimilarComments(activeSearchText);

  const formatSimilarity = (distance: number): string => {
    const similarity = Math.max(0, Math.min(1, 1 - distance));
    return t("comments.similarity", {
      percentage: new Intl.NumberFormat(i18n.language).format(
        Math.round(similarity * 100),
      ),
    });
  };

  return (
    <div className="container mt-3 col-12 col-lg-8">
      <h1 className="mb-1">{t("comments.heading")}</h1>
      <p className="text-muted">{t("comments.intro")}</p>
      <form
        className="mb-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedText(searchText);
        }}
      >
        <label htmlFor="search" className="form-label">
          {t("comments.searchLabel")}
        </label>
        <input
          type="search"
          id="search"
          className="form-control"
          value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value);
            setSubmittedText(null);
          }}
          placeholder={t("comments.searchPlaceholder")}
        />
      </form>
      {isError && (
        <div className="alert alert-danger" role="alert">
          {error.message}
        </div>
      )}
      <div aria-live="polite">
        {activeSearchText.length === 0 && (
          <p className="text-muted">{t("comments.prompt")}</p>
        )}
        {activeSearchText.length > 0 && isPending && (
          <div className="spinner-border" role="status">
            <span className="visually-hidden">{t("comments.searching")}</span>
          </div>
        )}
        {data && data.length === 0 && (
          <p className="text-muted">{t("comments.empty")}</p>
        )}
        {data && data.length > 0 && (
          <ul className={`list-group ${isFetching ? "opacity-50" : ""}`}>
            {data.map((comment) => (
              <li
                key={comment.id}
                className="list-group-item d-flex justify-content-between align-items-start gap-3"
              >
                <span>{comment.text}</span>
                <span className="badge text-bg-secondary flex-shrink-0">
                  {formatSimilarity(comment.distance)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
