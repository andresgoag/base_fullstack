from rest_framework import serializers
from comment.models import Comment


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ("id", "text", "created_at")
        read_only_fields = ("id", "created_at")


class SimilarCommentSerializer(serializers.ModelSerializer):
    distance = serializers.FloatField(read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "text", "created_at", "distance")
        read_only_fields = fields
