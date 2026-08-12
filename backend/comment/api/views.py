"""Reference implementation of pgvector similarity search.

SECURITY — THIS ENDPOINT IS A SAMPLE, NOT A PRODUCTION-READY VIEW.

It is deliberately left `AllowAny` and unthrottled so the template runs with no
setup. As written it is an unauthenticated, uncapped spend endpoint: every call
embeds caller-supplied text through the OpenAI API, so anyone who can reach it
can drain the API budget and drive latency for everyone else. The only cost
bound in place is `MAX_QUERY_TEXT_LENGTH`, which caps a single request but not
the request rate.

Before exposing anything modelled on this view, apply all three:

1. `permission_classes = [IsAuthenticated]` — remove anonymous access.
2. `throttle_scope` plus a matching `DEFAULT_THROTTLE_RATES` entry — cap the
   call rate per user. See `ThrottledTokenObtainPairView` in `user/api/views.py`
   for the pattern already used by the auth endpoints.
3. A spend limit on the provider side, so a bug or a stolen token cannot run up
   an unbounded bill.
"""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from comment.api.serializers import (
    SimilarCommentSerializer,
    SimilarCommentsQuerySerializer,
)
from comment.clients import get_embedding_client
from comment.services import find_similar_comments


class SimilarCommentsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = SimilarCommentsQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        comments = find_similar_comments(
            text=query.validated_data["text"],
            embedding_client=get_embedding_client(),
            limit=query.validated_data["limit"],
        )
        return Response(SimilarCommentSerializer(comments, many=True).data)
