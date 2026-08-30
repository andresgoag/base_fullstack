from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenBlacklistView

from comment.api.views import SimilarCommentsView
from user.api.views import (
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
    ThrottledUserViewSet,
)

router = DefaultRouter()
router.register("users", ThrottledUserViewSet, basename="user")

api_v1_patterns = [
    path("auth/", include(router.urls)),
    path(
        "auth/jwt/create/",
        ThrottledTokenObtainPairView.as_view(),
        name="jwt-create",
    ),
    path(
        "auth/jwt/refresh/",
        ThrottledTokenRefreshView.as_view(),
        name="jwt-refresh",
    ),
    path("auth/jwt/blacklist/", TokenBlacklistView.as_view(), name="jwt-blacklist"),
    path("comments/similar/", SimilarCommentsView.as_view(), name="comments-similar"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1_patterns)),
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path(
        "api/schema/docs/",
        SpectacularSwaggerView.as_view(url_name="api-schema"),
        name="api-docs",
    ),
]
