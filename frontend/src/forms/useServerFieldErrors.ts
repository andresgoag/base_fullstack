import { useEffect } from "react";
import type { FieldValues, UseFormSetError } from "react-hook-form";
import { applyServerFieldErrors } from "forms/serverErrors";

export const useServerFieldErrors = <Values extends FieldValues>(
  error: Error | null,
  setError: UseFormSetError<Values>,
  knownFields: readonly string[],
): void => {
  useEffect(() => {
    if (error === null) return;
    applyServerFieldErrors(error, setError, knownFields);
  }, [error, setError, knownFields]);
};
