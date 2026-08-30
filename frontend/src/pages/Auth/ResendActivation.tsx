import { useMemo } from "react";
import * as z from "zod";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useResendActivation } from "queries/users";
import { TextField } from "components/FormField/TextField";
import { SubmitButton } from "components/SubmitButton/SubmitButton";
import {
  getFieldNames,
  useValidatedForm,
  type FormSchema,
} from "forms/useValidatedForm";
import { useServerFieldErrors } from "forms/useServerFieldErrors";
import { readServerFormErrors } from "forms/serverErrors";
import { buildEmailField } from "validation";
import type { ResendActivationData } from "models";
import { ROUTES } from "routes";

const buildResendActivationSchema = (
  t: TFunction,
): FormSchema<ResendActivationData> => z.object({ email: buildEmailField(t) });

export const ResendActivationForm = () => {
  const { t } = useTranslation();
  const { mutate, isPending, isSuccess, isError, error } =
    useResendActivation();
  const schema = useMemo(() => buildResendActivationSchema(t), [t]);
  const fields = useMemo(() => getFieldNames(schema), [schema]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useValidatedForm(schema, { disabled: isPending });

  useServerFieldErrors(error, setError, fields);
  const { formMessage } = readServerFormErrors(error, fields);

  if (isSuccess) {
    return (
      <>
        <h1 className="h3 mb-3 text-center">{t("common.checkYourEmail")}</h1>
        <p className="text-muted text-center">
          {t("auth.resendActivation.sent")}
        </p>
        <div className="d-flex justify-content-center">
          <Link to={ROUTES.login}>{t("common.backToLogin")}</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="h3 mb-4 text-center">
        {t("auth.resendActivation.heading")}
      </h1>
      {isError && formMessage !== null && (
        <div className="alert alert-danger" role="alert">
          {formMessage}
        </div>
      )}
      <form
        onSubmit={(event) =>
          void handleSubmit((data) => {
            mutate(data);
          })(event)
        }
        noValidate
      >
        <TextField
          id="email"
          label={t("fields.email")}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register("email")}
        />
        <SubmitButton
          label={t("auth.resendActivation.submit")}
          pendingLabel={t("auth.resendActivation.submitting")}
          isPending={isPending}
        />
      </form>
      <div className="d-flex justify-content-center p-3">
        <Link to={ROUTES.login}>{t("common.backToLogin")}</Link>
      </div>
    </>
  );
};
