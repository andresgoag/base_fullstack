from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from pgvector.django import CosineDistance
from comment.api.serializers import SimilarCommentSerializer
from comment.embeddings import embed_text
from comment.models import Comment

DEFAULT_LIMIT = 5


class SimilarCommentsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        text = request.query_params.get("text")
        if not text:
            return Response(
                {"detail": "Query parameter 'text' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        query_embedding = embed_text(text)
        comments = (
            Comment.objects.annotate(
                distance=CosineDistance("embedding", query_embedding)
            )
            .order_by("distance")[:DEFAULT_LIMIT]
        )
        serializer = SimilarCommentSerializer(comments, many=True)
        return Response(serializer.data)
