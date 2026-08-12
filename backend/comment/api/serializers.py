from rest_framework import serializers
from comment.models import Comment

MAX_QUERY_TEXT_LENGTH = 2000
DEFAULT_LIMIT = 5
MAX_LIMIT = 50


class SimilarCommentsQuerySerializer(serializers.Serializer):
    text = serializers.CharField(
        max_length=MAX_QUERY_TEXT_LENGTH, trim_whitespace=True, allow_blank=False
    )
    limit = serializers.IntegerField(
        min_value=1, max_value=MAX_LIMIT, default=DEFAULT_LIMIT
    )


class SimilarCommentSerializer(serializers.ModelSerializer):
    distance = serializers.FloatField(read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "text", "created_at", "distance")
        read_only_fields = ("id", "text", "created_at", "distance")
