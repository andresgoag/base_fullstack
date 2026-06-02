from rest_framework import serializers
from comment.models import Comment


class SimilarCommentSerializer(serializers.ModelSerializer):
    distance = serializers.FloatField(read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "text", "created_at", "distance")
        read_only_fields = ("id", "text", "created_at", "distance")
