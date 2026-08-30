import { useMemo } from "react";
import * as z from "zod";
import { Link } from "react-router";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useAuthContext } from "context/auth/AuthContext";
import { TextField } from "components/FormField/TextField";
import { FormField } from "components/FormField/FormField";
import { PhoneField } from "components/PhoneField/PhoneField";
import { buildPhoneField } from "components/PhoneField/phoneSchema";
import { PasswordStrengthMeter } from "components/PasswordStrengthMeter/PasswordStrengthMeter";
import { SubmitButton } from "components/SubmitButton/SubmitButton";
import {
  getFieldNames,
  useValidatedForm,
  type FormSchema,
} from "forms/useValidatedForm";
import { useServerFieldErrors } from "forms/useServerFieldErrors";
import { readServerFormErrors } from "forms/serverErrors";
import {
  buildEmailField,
  buildPersonNameField,
  buildRequiredPasswordField,
  checkPasswordRules,
  MAX_PERSON_NAME_LENGTH,
} from "validation";
import type { RegisterData } from "models";
import { ROUTES } from "routes";

const buildRegisterSchema = (t: TFunction): FormSchema<RegisterData> =>
  z
    .object({
      first_name: buildPersonNameField(t, "validation.firstName"),
      last_name: buildPersonNameField(t, "validation.lastName"),
      email: buildEmailField(t),
      phone: buildPhoneField(t),
      password: buildRequiredPasswordField(t("validation.passwordRequired")),
      re_password: buildRequiredPasswordField(
        t("validation.confirmPasswordRequired"),
      ),
    })
    .superRefine((values, context) => {
      checkPasswordRules(t, context, {
        password: values.password,
        confirmation: values.re_password,
        passwordPath: "password",
        confirmationPath: "re_password",
        similarTo: [values.email, values.first_name],
      });
    });

export const RegisterForm = () => {
  const { t } = useTranslation();
  const { register: registration } = useAuthContext();
  const schema = useMemo(() => buildRegisterSchema(t), [t]);
  const fields = useMemo(() => getFieldNames(schema), [schema]);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useValidatedForm(schema, { disabled: registration.isPending });

  useServerFieldErrors(registration.error, setError, fields);
  const { formMessage } = readServerFormErrors(registration.error, fields);
  const password = useWatch({ control, name: "password" }) ?? "";
  const email = useWatch({ control, name: "email" }) ?? "";
  const firstName = useWatch({ control, name: "first_name" }) ?? "";

  return (
    <>
      <h1 className="h3 mb-4 text-center">{t("auth.register.heading")}</h1>
      {registration.isError && formMessage !== null && (
        <div className="alert alert-danger" role="alert">
          {formMessage}
        </div>
      )}
      <form
        onSubmit={(event) =>
          void handleSubmit((data) => {
            registration.submit(data);
          })(event)
        }
        noValidate
      >
        <TextField
          id="first_name"
          label={t("fields.firstName")}
          autoComplete="given-name"
          maxLength={MAX_PERSON_NAME_LENGTH}
          error={errors.first_name?.message}
          registration={register("first_name")}
        />
        <TextField
          id="last_name"
          label={t("fields.lastName")}
          autoComplete="family-name"
          maxLength={MAX_PERSON_NAME_LENGTH}
          error={errors.last_name?.message}
          registration={register("last_name")}
        />
        <TextField
          id="email"
          label={t("fields.email")}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register("email")}
        />
        <PhoneField
          id="phone"
          label={t("fields.phone")}
          name="phone"
          control={control}
          error={errors.phone?.message}
          isDisabled={registration.isPending}
        />
        <FormField
          id="password"
          label={t("fields.password")}
          error={errors.password?.message}
        >
          {(controlProps) => (
            <>
              <input
                {...controlProps}
                {...register("password")}
                type="password"
                autoComplete="new-password"
                className={`form-control ${
                  errors.password === undefined ? "" : "is-invalid"
                }`}
              />
              <PasswordStrengthMeter
                password={password}
                similarTo={[email, firstName]}
              />
            </>
          )}
        </FormField>
        <TextField
          id="re_password"
          label={t("fields.confirmPassword")}
          type="password"
          autoComplete="new-password"
          error={errors.re_password?.message}
          registration={register("re_password")}
        />
        <div className="d-flex justify-content-center">
          <SubmitButton
            label={t("auth.register.submit")}
            pendingLabel={t("auth.register.submitting")}
            isPending={registration.isPending}
          />
        </div>
      </form>
      <div className="d-flex flex-column align-items-center gap-2 p-3">
        <Link to={ROUTES.login}>{t("auth.register.haveAccount")}</Link>
        <Link to={ROUTES.resendActivation}>
          {t("auth.register.resendActivation")}
        </Link>
      </div>
    </>
  );
};
