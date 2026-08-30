import type { UseFormRegisterReturn } from "react-hook-form";
import { FormField } from "components/FormField/FormField";

type TextFieldProps = {
  id: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  maxLength?: number;
  error?: string;
  registration: UseFormRegisterReturn;
};

export const TextField = ({
  id,
  label,
  type = "text",
  autoComplete,
  maxLength,
  error,
  registration,
}: TextFieldProps) => (
  <FormField id={id} label={label} error={error}>
    {(controlProps) => (
      <input
        {...controlProps}
        {...registration}
        type={type}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={`form-control ${error === undefined ? "" : "is-invalid"}`}
      />
    )}
  </FormField>
);
