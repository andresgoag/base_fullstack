import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "api/errors";

export type ServerFieldError = {
  field: string;
  message: string;
};

export type ServerFormErrors = {
  fieldErrors: ServerFieldError[];
  formMessage: string | null;
};

export const readServerFormErrors = (
  error: unknown,
  knownFields: readonly string[],
): ServerFormErrors => {
  if (!(error instanceof ApiError)) {
    return {
      fieldErrors: [],
      formMessage: error instanceof Error ? error.message : null,
    };
  }
  const fieldErrors = Object.entries(error.fieldErrors).flatMap(
    ([field, message]) =>
      knownFields.includes(field) ? [{ field, message }] : [],
  );
  const hasUnmappedErrors =
    Object.keys(error.fieldErrors).length > fieldErrors.length;
  const formMessage =
    fieldErrors.length === 0 || hasUnmappedErrors ? error.message : null;
  return { fieldErrors, formMessage };
};

export const applyServerFieldErrors = <Values extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<Values>,
  knownFields: readonly string[],
): void => {
  readServerFormErrors(error, knownFields).fieldErrors.forEach(
    ({ field, message }) => {
      setError(field as Path<Values>, { type: "server", message });
    },
  );
};
