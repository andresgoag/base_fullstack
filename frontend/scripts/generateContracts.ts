import { readFile, writeFile } from "node:fs/promises";
import openapiTypeScript, { astToString } from "openapi-typescript";

const SCHEMA_DIRECTORY = "/schema";
const OPENAPI_OUTPUT = "src/api/schema.d.ts";
const WEBSOCKET_OUTPUT = "src/websocket/protocolCodes.ts";

type WebsocketProtocol = {
  closeCodes: Record<string, number>;
  errorCodes: Record<string, string>;
  maxMessageLength: number;
};

const toEntries = (values: Record<string, string | number>): string =>
  Object.entries(values)
    .map(([name, value]) =>
      typeof value === "number"
        ? `  ${name}: ${String(value)},`
        : `  ${name}: ${JSON.stringify(value)},`,
    )
    .join("\n");

const generateOpenApiTypes = async () => {
  const document = await openapiTypeScript(
    new URL(`file://${SCHEMA_DIRECTORY}/openapi.yml`),
  );
  await writeFile(OPENAPI_OUTPUT, astToString(document));
};

const generateWebsocketCodes = async () => {
  const protocol = JSON.parse(
    await readFile(`${SCHEMA_DIRECTORY}/websocket.json`, "utf8"),
  ) as WebsocketProtocol;
  const contents = [
    "export const WEBSOCKET_CLOSE_CODES = {",
    toEntries(protocol.closeCodes),
    "} as const;",
    "",
    "export const WEBSOCKET_ERROR_CODES = {",
    toEntries(protocol.errorCodes),
    "} as const;",
    "",
    `export const MAX_WEBSOCKET_MESSAGE_LENGTH = ${String(protocol.maxMessageLength)};`,
    "",
  ].join("\n");
  await writeFile(WEBSOCKET_OUTPUT, contents);
};

await generateOpenApiTypes();
await generateWebsocketCodes();
