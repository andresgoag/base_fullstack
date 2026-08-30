import { sendRequest } from "api/client";
import { API_ENDPOINTS } from "api/endpoints";
import { parseResponse, type RequestOptions } from "api/request";
import {
  similarCommentListSchema,
  type SimilarComment,
  type SimilarCommentQuery,
} from "models";

export const getSimilarComments = async (
  { text }: SimilarCommentQuery,
  { signal }: RequestOptions = {},
): Promise<SimilarComment[]> =>
  parseResponse(
    similarCommentListSchema,
    await sendRequest({
      method: "get",
      url: API_ENDPOINTS.similarComments,
      params: { text },
      signal,
    }),
  );
