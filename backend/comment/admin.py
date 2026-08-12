from django.contrib import admin
from comment.clients import get_embedding_client
from comment.models import Comment
from comment.services import create_comment, replace_comment_text


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "text", "created_at")
    readonly_fields = ("embedding_source_hash", "created_at")
    exclude = ("embedding",)

    def save_model(self, request, obj, form, change):
        if change:
            replace_comment_text(obj.pk, obj.text, get_embedding_client())
        else:
            create_comment(obj.text, get_embedding_client())
