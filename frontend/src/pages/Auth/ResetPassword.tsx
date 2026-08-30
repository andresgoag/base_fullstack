import { useMemo } from "react";
import * as z from "zod";
import { Link, useNavigate, useParams } from "react-router";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useConfirmPasswordReset } from "queries/users";
import { useToastContext } from "context/toast/ToastContext";
import { TextField } from "components/FormField/TextField";
import { FormField } from "components/FormField/FormField";
import { PasswordStrengthMeter } from "components/PasswordStrengthMeter/PasswordStrengthMeter";
import { SubmitButton } from "components/SubmitButton/SubmitButton";
import {
  getFieldNames,
  useValidatedForm,
  type FormSchema,
} from "forms/useValidatedForm";
import { useServerFieldErrors } from "forms/useServerFieldErrors";
import { readServerFormErrors } from "forms/serverErrors";
import { buildRequiredPasswordField, checkPasswordRules } from "validation";
import type { PasswordResetFormData } from "models";
import { ROUTES } from "routes";

const NO_KNOWN_PERSONAL_WORDS: string[] = [];

const buildResetPasswordSchema = (
  t: TFunction,
): FormSchema<PasswordResetFormData> =>
  z
    .object({
      new_password: buildRequiredPasswordField(
        t("validation.passwordRequired"),
      ),
      re_new_password: buildRequiredPasswordField(
        t("validation.confirmPasswordRequired"),
      ),
    })
    .superRefine((values, context) => {
      checkPasswordRules(t, context, {
        password: values.new_password,
        confirmation: values.re_new_password,
        passwordPath: "new_password",
        confirmationPath: "re_new_password",
        similarTo: NO_KNOWN_PERSONAL_WORDS,
      });
    });

export const ResetPasswordForm = () => {
  const { t } = useTranslation();
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { mutate, isPending, isError, error } = useConfirmPasswordReset({
    onSuccess: () => {
      showToast({ message: t("auth.resetPassword.done"), type: "success" });
      void navigate(ROUTES.login, { replace: true });
    },
  });
  const schema = useMemo(() => buildResetPasswordSchema(t), [t]);
  const fields = useMemo(() => getFieldNames(schema), [schema]);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useValidatedForm(schema, { disabled: isPending });

  useServerFieldErrors(error, setError, fields);
  const { formMessage } = readServerFormErrors(error, fields);
  const password = useWatch({ control, name: "new_password" }) ?? "";

  if (!uid || !token) {
    return (
      <>
        <h1 className="h3 mb-3 text-center">
          {t("auth.resetPassword.invalidLink")}
        </h1>
        <div className="d-flex justify-content-center">
          <Link to={ROUTES.forgotPassword}>
            {t("auth.resetPassword.requestNewLink")}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="h3 mb-4 text-center">{t("auth.resetPassword.heading")}</h1>
      {isError && formMessage !== null && (
        <div className="alert alert-danger" role="alert">
          {formMessage}
        </div>
      )}
      <form
        onSubmit={(event) =>
          void handleSubmit((data) => {
            mutate({ uid, token, ...data });
          })(event)
        }
        noValidate
      >
        <FormField
          id="new_password"
          label={t("fields.newPassword")}
          error={errors.new_password?.message}
        >
          {(controlProps) => (
            <>
              <input
                {...controlProps}
                {...register("new_password")}
                type="password"
                autoComplete="new-password"
                className={`form-control ${
                  errors.new_password === undefined ? "" : "is-invalid"
                }`}
              />
              <PasswordStrengthMeter password={password} />
            </>
          )}
        </FormField>
        <TextField
          id="re_new_password"
          label={t("fields.confirmNewPassword")}
          type="password"
          autoComplete="new-password"
          error={errors.re_new_password?.message}
          registration={register("re_new_password")}
        />
        <SubmitButton
          label={t("auth.resetPassword.submit")}
          pendingLabel={t("auth.resetPassword.submitting")}
          isPending={isPending}
        />
      </form>
    </>
  );
};
