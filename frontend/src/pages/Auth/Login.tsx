import { useMemo } from "react";
import * as z from "zod";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useAuthContext } from "context/auth/AuthContext";
import { TextField } from "components/FormField/TextField";
import { SubmitButton } from "components/SubmitButton/SubmitButton";
import {
  getFieldNames,
  useValidatedForm,
  type FormSchema,
} from "forms/useValidatedForm";
import { useServerFieldErrors } from "forms/useServerFieldErrors";
import { readServerFormErrors } from "forms/serverErrors";
import { buildEmailField, buildRequiredPasswordField } from "validation";
import type { LoginData } from "models";
import { ROUTES } from "routes";

const buildLoginSchema = (t: TFunction): FormSchema<LoginData> =>
  z.object({
    email: buildEmailField(t),
    password: buildRequiredPasswordField(t("validation.passwordRequired")),
  });

export const LoginForm = () => {
  const { t } = useTranslation();
  const { login } = useAuthContext();
  const schema = useMemo(() => buildLoginSchema(t), [t]);
  const fields = useMemo(() => getFieldNames(schema), [schema]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useValidatedForm(schema, { disabled: login.isPending });

  useServerFieldErrors(login.error, setError, fields);
  const { formMessage } = readServerFormErrors(login.error, fields);

  return (
    <>
      <h1 className="h3 mb-4 text-center">{t("auth.login.heading")}</h1>
      {login.isError && formMessage !== null && (
        <div className="alert alert-danger" role="alert">
          {formMessage}
        </div>
      )}
      <form
        onSubmit={(event) =>
          void handleSubmit((data) => {
            login.submit(data);
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
        <TextField
          id="password"
          label={t("fields.password")}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          registration={register("password")}
        />
        <div className="d-flex justify-content-center">
          <SubmitButton
            label={t("auth.login.submit")}
            pendingLabel={t("auth.login.submitting")}
            isPending={login.isPending}
          />
        </div>
      </form>
      <div className="d-flex flex-column align-items-center gap-2 p-3">
        <Link to={ROUTES.forgotPassword}>{t("auth.login.forgotPassword")}</Link>
        <Link to={ROUTES.register}>{t("auth.login.noAccount")}</Link>
      </div>
    </>
  );
};
