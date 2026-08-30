import { describe, expect, it, vi } from "vitest";
import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import * as z from "zod";
import { ApiError } from "api/errors";
import { createRequestSender, parseResponse } from "api/request";

const buildClient = (
  handler: (config: InternalAxiosRequestConfig) => Promise<unknown>,
): AxiosInstance => {
  const client = axios.create();
  client.defaults.adapter = async (config) => ({
    data: await handler(config),
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  });
  return client;
};

describe("createRequestSender", () => {
  it("returns the response body", async () => {
    const send = createRequestSender(
      buildClient(() => Promise.resolve({ id: 1 })),
    );
    await expect(send({ url: "/things" })).resolves.toEqual({ id: 1 });
  });

  it("maps a failure to an api error", async () => {
    const client = axios.create();
    client.defaults.adapter = () =>
      Promise.reject(
        Object.assign(new axios.AxiosError("Network Error"), {
          config: { headers: new AxiosHeaders() },
        }),
      );
    const send = createRequestSender(client);
    await expect(send({ url: "/things" })).rejects.toBeInstanceOf(ApiError);
  });

  it("forwards the abort signal to the client", async () => {
    const handler = vi.fn((config: InternalAxiosRequestConfig) =>
      Promise.resolve([config.url]),
    );
    const send = createRequestSender(buildClient(handler));
    const controller = new AbortController();

    await send({ url: "/things", signal: controller.signal });

    expect(handler.mock.calls[0][0].signal).toBe(controller.signal);
  });
});

describe("parseResponse", () => {
  const schema = z.object({ id: z.number() });

  it("returns the parsed value", () => {
    expect(parseResponse(schema, { id: 1 })).toEqual({ id: 1 });
  });

  it("raises a contract error when the shape does not match", () => {
    expect(() => parseResponse(schema, { id: "one" })).toThrowError(ApiError);
    try {
      parseResponse(schema, { id: "one" });
    } catch (error) {
      expect((error as ApiError).kind).toBe("contract");
    }
  });
});
