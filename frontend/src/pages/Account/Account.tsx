import * as z from "zod";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { TextField } from "components/FormField/TextField";
import { FormField } from "components/FormField/FormField";
import { PhoneField } from "components/PhoneField/PhoneField";
import { buildPhoneField } from "components/PhoneField/phoneSchema";
import { PasswordStrengthMeter } from "components/PasswordStrengthMeter/PasswordStrengthMeter";
import { SubmitButton } from "components/SubmitButton/SubmitButton";
import { useAuthContext } from "context/auth/AuthContext";
import { useToastContext } from "context/toast/ToastContext";
import { useChangePassword, useUpdateProfile } from "queries/users";
import {
  getFieldNames,
  useValidatedForm,
  type FormSchema,
} from "forms/useValidatedForm";
import { useServerFieldErrors } from "forms/useServerFieldErrors";
import { readServerFormErrors } from "forms/serverErrors";
import {
  buildPersonNameField,
  buildRequiredPasswordField,
  checkPasswordRules,
  MAX_PERSON_NAME_LENGTH,
} from "validation";
import type { ChangePasswordData, ProfileUpdateData } from "models";

const buildProfileSchema = (t: TFunction): FormSchema<ProfileUpdateData> =>
  z.object({
    first_name: buildPersonNameField(t, "validation.firstName"),
    last_name: buildPersonNameField(t, "validation.lastName"),
    phone: buildPhoneField(t),
  });

const buildChangePasswordSchema = (
  t: TFunction,
  similarTo: string[],
): FormSchema<ChangePasswordData> =>
  z
    .object({
      current_password: buildRequiredPasswordField(
        t("validation.currentPasswordRequired"),
      ),
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
        similarTo,
      });
    });

const ProfileSection = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuthContext();
  const { showToast } = useToastContext();
  const profileSchema = useMemo(() => buildProfileSchema(t), [t]);
  const profileFields = useMemo(
    () => getFieldNames(profileSchema),
    [profileSchema],
  );
  const { mutate, isPending, isError, error } = useUpdateProfile({
    onSuccess: () => {
      showToast({ message: t("account.updated"), type: "success" });
    },
  });
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isDirty },
  } = useValidatedForm(profileSchema, {
    disabled: isPending,
    values: {
      first_name: currentUser.user?.first_name ?? "",
      last_name: currentUser.user?.last_name ?? "",
      phone: currentUser.user?.phone ?? "",
    },
  });

  useServerFieldErrors(error, setError, profileFields);
  const { formMessage } = readServerFormErrors(error, profileFields);

  if (currentUser.isLoading) {
    return (
      <div className="spinner-border" role="status">
        <span className="visually-hidden">{t("account.loadingProfile")}</span>
      </div>
    );
  }

  return (
    <section className="card p-4 mb-4">
      <h2 className="h4 mb-3">{t("account.profile")}</h2>
      <p className="text-muted">{currentUser.user?.email}</p>
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
        <PhoneField
          id="phone"
          label={t("fields.phone")}
          name="phone"
          control={control}
          error={errors.phone?.message}
          isDisabled={isPending}
        />
        <SubmitButton
          label={t("account.save")}
          pendingLabel={t("account.saving")}
          isPending={isPending}
          isDisabled={!isDirty}
          className="btn btn-primary"
        />
      </form>
    </section>
  );
};

const ChangePasswordSection = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuthContext();
  const { showToast } = useToastContext();
  const email = currentUser.user?.email ?? "";
  const firstName = currentUser.user?.first_name ?? "";
  const changePasswordSchema = useMemo(
    () => buildChangePasswordSchema(t, [email, firstName]),
    [t, email, firstName],
  );
  const changePasswordFields = useMemo(
    () => getFieldNames(changePasswordSchema),
    [changePasswordSchema],
  );
  const { mutate, isPending, isError, error } = useChangePassword({
    onSuccess: () => {
      reset();
      showToast({ message: t("account.passwordChanged"), type: "success" });
    },
  });
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useValidatedForm(changePasswordSchema, { disabled: isPending });

  useServerFieldErrors(error, setError, changePasswordFields);
  const { formMessage } = readServerFormErrors(error, changePasswordFields);
  const newPassword = useWatch({ control, name: "new_password" }) ?? "";

  return (
    <section className="card p-4">
      <h2 className="h4 mb-3">{t("account.changePassword")}</h2>
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
          id="current_password"
          label={t("fields.currentPassword")}
          type="password"
          autoComplete="current-password"
          error={errors.current_password?.message}
          registration={register("current_password")}
        />
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
              <PasswordStrengthMeter
                password={newPassword}
                similarTo={[email, firstName]}
              />
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
          label={t("account.changePasswordSubmit")}
          pendingLabel={t("account.saving")}
          isPending={isPending}
          className="btn btn-primary"
        />
      </form>
    </section>
  );
};

export const Account = () => {
  const { t } = useTranslation();

  return (
    <div className="container mt-3 col-12 col-lg-8">
      <h1 className="mb-4">{t("account.heading")}</h1>
      <ProfileSection />
      <ChangePasswordSection />
    </div>
  );
};
