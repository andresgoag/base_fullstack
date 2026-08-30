import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import type * as z from "zod";
import { toApiError, toContractError } from "api/errors";

export type RequestOptions = {
  signal?: AbortSignal;
};

export type RequestSender = <Data>(config: AxiosRequestConfig) => Promise<Data>;

export const createRequestSender =
  (client: AxiosInstance): RequestSender =>
  async <Data>(config: AxiosRequestConfig): Promise<Data> => {
    try {
      const response = await client.request<Data>(config);
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      throw toApiError(error);
    }
  };

export const parseResponse = <Value>(
  schema: z.ZodType<Value>,
  data: unknown,
): Value => {
  const result = schema.safeParse(data);
  if (!result.success) throw toContractError(result.error);
  return result.data;
};
