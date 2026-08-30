import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { getSimilarComments } from "api/comments";
import { queryKeys } from "queries/queryKeys";
import type { SimilarComment } from "models";

export const useSimilarComments = (
  text: string,
): UseQueryResult<SimilarComment[], Error> =>
  useQuery({
    queryKey: queryKeys.comments.similar(text),
    queryFn: ({ signal }) => getSimilarComments({ text }, { signal }),
    enabled: text.length > 0,
    placeholderData: keepPreviousData,
  });
