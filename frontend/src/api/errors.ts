import axios from "axios";
import * as z from "zod";
import { translate } from "i18n/config";

export type ApiErrorKind =
  | "network"
  | "validation"
  | "authentication"
  | "permission"
  | "notFound"
  | "server"
  | "contract"
  | "unknown";

const RETRYABLE_KINDS: ReadonlySet<ApiErrorKind> = new Set([
  "network",
  "server",
]);

const EXPECTED_KINDS: ReadonlySet<ApiErrorKind> = new Set([
  "validation",
  "authentication",
  "permission",
  "notFound",
]);

const genericMessage = (kind: ApiErrorKind): string =>
  translate(`apiError.${kind}`);

type ApiErrorOptions = {
  kind: ApiErrorKind;
  status: number | null;
  message: string;
  fieldErrors?: Record<string, string>;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly fieldErrors: Readonly<Record<string, string>>;

  constructor(options: ApiErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.fieldErrors = Object.freeze({ ...options.fieldErrors });
  }

  get isRetryable(): boolean {
    return RETRYABLE_KINDS.has(this.kind);
  }

  get isExpected(): boolean {
    return EXPECTED_KINDS.has(this.kind);
  }
}

const kindForStatus = (status: number): ApiErrorKind => {
  if (status === 401) return "authentication";
  if (status === 403) return "permission";
  if (status === 404) return "notFound";
  if (status >= 500) return "server";
  if (status >= 400) return "validation";
  return "unknown";
};

const fieldMessagesSchema = z.union([z.string(), z.array(z.string())]);

const apiErrorPayloadSchema = z
  .object({
    detail: z.string().optional(),
    non_field_errors: z.array(z.string()).optional(),
  })
  .catchall(z.unknown());

export type ApiErrorPayload = z.infer<typeof apiErrorPayloadSchema>;

const toMessage = (value: unknown): string | null => {
  const result = fieldMessagesSchema.safeParse(value);
  if (!result.success) return null;
  const message = Array.isArray(result.data)
    ? result.data.join(" ")
    : result.data;
  return message.length > 0 ? message : null;
};

const NON_FIELD_KEYS = new Set(["detail", "non_field_errors"]);

const readPayload = (data: unknown): ApiErrorPayload | null => {
  const result = apiErrorPayloadSchema.safeParse(data);
  return result.success ? result.data : null;
};

const readFieldErrors = (
  payload: ApiErrorPayload | null,
): Record<string, string> => {
  if (payload === null) return {};
  return Object.fromEntries(
    Object.entries(payload).flatMap(([field, value]) => {
      if (NON_FIELD_KEYS.has(field)) return [];
      const message = toMessage(value);
      return message === null ? [] : [[field, message]];
    }),
  );
};

const readGeneralMessage = (
  data: unknown,
  payload: ApiErrorPayload | null,
): string | null => {
  if (typeof data === "string") return data.length > 0 ? data : null;
  if (payload === null) return null;
  return toMessage(payload.detail) ?? toMessage(payload.non_field_errors);
};

const buildMessage = (
  kind: ApiErrorKind,
  data: unknown,
  payload: ApiErrorPayload | null,
  fieldErrors: Record<string, string>,
): string => {
  if (kind === "server" || kind === "network") return genericMessage(kind);
  const general = readGeneralMessage(data, payload);
  if (general !== null) return general;
  const fieldMessages = Object.values(fieldErrors);
  if (fieldMessages.length > 0) return fieldMessages.join(" ");
  return genericMessage(kind);
};

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) {
    return new ApiError({
      kind: "unknown",
      status: null,
      message: genericMessage("unknown"),
      cause: error,
    });
  }
  const response = error.response;
  if (response === undefined) {
    return new ApiError({
      kind: "network",
      status: null,
      message: genericMessage("network"),
      cause: error,
    });
  }
  const kind = kindForStatus(response.status);
  const payload = readPayload(response.data);
  const fieldErrors = readFieldErrors(payload);
  return new ApiError({
    kind,
    status: response.status,
    message: buildMessage(kind, response.data, payload, fieldErrors),
    fieldErrors,
    cause: error,
  });
};

export const toContractError = (cause: unknown): ApiError =>
  new ApiError({
    kind: "contract",
    status: null,
    message: genericMessage("contract"),
    cause,
  });
