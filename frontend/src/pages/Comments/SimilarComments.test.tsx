import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SimilarComments } from "pages/Comments/SimilarComments";
import { renderWithProviders } from "test/renderWithProviders";
import { ApiError } from "api/errors";
import type { RequestOptions } from "api/request";
import type { SimilarComment, SimilarCommentQuery } from "models";
import { endAuthSession, startAuthSession } from "auth/authSession";
import { buildAccessToken } from "test/tokens";

const comments = vi.hoisted(() => ({
  getSimilarComments:
    vi.fn<
      (
        query: SimilarCommentQuery,
        options?: RequestOptions,
      ) => Promise<SimilarComment[]>
    >(),
}));
vi.mock("api/comments", () => comments);
vi.mock("api/tokens", () => ({
  loginUser: vi.fn(),
  refreshToken: vi.fn(),
  blacklistToken: vi.fn(),
}));
vi.mock("api/users", () => ({
  registerUser: vi.fn(),
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 1,
    email: "ada@example.com",
    phone: "+14155552671",
    first_name: "Ada",
    last_name: "Lovelace",
  }),
}));

describe("SimilarComments", () => {
  beforeEach(() => {
    localStorage.clear();
    endAuthSession();
    startAuthSession({ access: buildAccessToken(300_000), refresh: "r1" });
    vi.clearAllMocks();
  });

  it("invites the visitor to search before requesting anything", () => {
    renderWithProviders(<SimilarComments />);

    expect(screen.getByText("Type something to search.")).toBeInTheDocument();
    expect(comments.getSimilarComments).not.toHaveBeenCalled();
  });

  it("lists the comments the search returned", async () => {
    comments.getSimilarComments.mockResolvedValue([
      {
        id: 7,
        text: "The parcel arrived three days late",
        created_at: "2026-01-01T00:00:00Z",
        distance: 0.12,
      },
    ]);
    renderWithProviders(<SimilarComments />);

    await userEvent.type(
      screen.getByLabelText("Describe what you are looking for"),
      "late delivery",
    );

    expect(
      await screen.findByText("The parcel arrived three days late", undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("88% similar")).toBeInTheDocument();
  });

  it("passes an abort signal so an outdated search can be cancelled", async () => {
    comments.getSimilarComments.mockResolvedValue([]);
    renderWithProviders(<SimilarComments />);

    await userEvent.type(
      screen.getByLabelText("Describe what you are looking for"),
      "late",
    );
    await screen.findByText("No comments matched that search.", undefined, {
      timeout: 3000,
    });

    const [, options] = comments.getSimilarComments.mock.calls[0];
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it("shows the failure when the search cannot be completed", async () => {
    comments.getSimilarComments.mockRejectedValue(
      new ApiError({
        kind: "validation",
        status: 400,
        message: "Query parameter 'text' is required.",
      }),
    );
    renderWithProviders(<SimilarComments />);

    await userEvent.type(
      screen.getByLabelText("Describe what you are looking for"),
      "late",
    );

    expect(
      await screen.findByRole("alert", undefined, { timeout: 3000 }),
    ).toHaveTextContent("Query parameter 'text' is required.");
  });
});
