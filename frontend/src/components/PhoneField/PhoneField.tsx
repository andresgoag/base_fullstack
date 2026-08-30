import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { FormField } from "components/FormField/FormField";
import "react-phone-number-input/style.css";

type PhoneFieldProps<Values extends FieldValues> = {
  id: string;
  label: string;
  name: Path<Values>;
  control: Control<Values>;
  error?: string;
  isDisabled?: boolean;
};

export const PhoneField = <Values extends FieldValues>({
  id,
  label,
  name,
  control,
  error,
  isDisabled = false,
}: PhoneFieldProps<Values>) => (
  <FormField id={id} label={label} error={error}>
    {(controlProps) => (
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value, onBlur } }) => (
          <PhoneInput
            {...controlProps}
            international
            defaultCountry="US"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={isDisabled}
            flags={flags}
            className={`form-control d-flex align-items-center ${
              error === undefined ? "" : "is-invalid"
            }`}
          />
        )}
      />
    )}
  </FormField>
);
