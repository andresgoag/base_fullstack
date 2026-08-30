import { describe, expect, it } from "vitest";
import { API_ENDPOINTS } from "api/endpoints";
import { similarCommentListSchema, userSchema } from "models";

const VALID_USER = {
  id: 1,
  email: "ada@example.com",
  phone: "+14155552671",
  first_name: "Ada",
  last_name: "Lovelace",
};

describe("response schemas", () => {
  it("accepts the payload the comments endpoint returns", () => {
    const payload = [
      {
        id: 7,
        text: "The restaurant served delicious pasta last night.",
        created_at: "2026-08-30T02:30:01.104262Z",
        distance: 0.8420345048429803,
      },
    ];

    expect(similarCommentListSchema.parse(payload)).toEqual(payload);
  });

  it("accepts a user the API would return", () => {
    expect(userSchema.parse(VALID_USER)).toEqual(VALID_USER);
  });

  it("rejects a user payload with a renamed field", () => {
    const renamed: Record<string, unknown> = {
      ...VALID_USER,
      firstName: "Ada",
    };
    delete renamed.first_name;
    expect(userSchema.safeParse(renamed).success).toBe(false);
  });

  it("rejects an address the API should never have sent", () => {
    expect(userSchema.safeParse({ ...VALID_USER, email: "ada" }).success).toBe(
      false,
    );
  });

  it("rejects a phone number that is not in E.164 form", () => {
    expect(
      userSchema.safeParse({ ...VALID_USER, phone: "(415) 555-2671" }).success,
    ).toBe(false);
  });

  it("rejects a name longer than the column allows", () => {
    expect(
      userSchema.safeParse({ ...VALID_USER, last_name: "a".repeat(151) })
        .success,
    ).toBe(false);
  });
});

describe("API_ENDPOINTS", () => {
  it("keeps every call on the versioned prefix", () => {
    Object.values(API_ENDPOINTS).forEach((path) => {
      expect(path.startsWith("/api/v1/")).toBe(true);
    });
  });
});
