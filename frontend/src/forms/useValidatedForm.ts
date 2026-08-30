import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type * as z from "zod";

export type FormSchema<Values> = z.ZodObject<z.ZodRawShape> &
  z.ZodType<Values, Values>;

export const getFieldNames = <Values>(
  schema: FormSchema<Values>,
): readonly string[] => Object.keys(schema.shape);

export const useValidatedForm = <Values extends FieldValues>(
  schema: FormSchema<Values>,
  options: Omit<UseFormProps<Values, unknown, Values>, "resolver"> = {},
): UseFormReturn<Values, unknown, Values> =>
  useForm<Values, unknown, Values>({
    mode: "onTouched",
    ...options,
    resolver: standardSchemaResolver(schema),
  });
