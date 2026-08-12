from django.contrib import admin
from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenBlacklistView
from user.api.views import (
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
    ThrottledUserViewSet,
)
from comment.api.views import SimilarCommentsView

user_router = DefaultRouter()
user_router.register("users", ThrottledUserViewSet, basename="user")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("auth/", include(user_router.urls)),
    re_path(r"^auth/", include("djoser.urls")),
    path("auth/jwt/create/", ThrottledTokenObtainPairView.as_view(), name="jwt-create"),
    path("auth/jwt/refresh/", ThrottledTokenRefreshView.as_view(), name="jwt-refresh"),
    path("auth/jwt/blacklist/", TokenBlacklistView.as_view(), name="jwt-blacklist"),
    path("comments/similar/", SimilarCommentsView.as_view(), name="comments-similar"),
]
