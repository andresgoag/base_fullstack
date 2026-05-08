from django.contrib import admin
from django.urls import include, path, re_path
from rest_framework_simplejwt.views import TokenBlacklistView
from user.api.views import ThrottledTokenObtainPairView, ThrottledTokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    re_path(r"^auth/", include("djoser.urls")),
    path("auth/jwt/create/", ThrottledTokenObtainPairView.as_view(), name="jwt-create"),
    path("auth/jwt/refresh/", ThrottledTokenRefreshView.as_view(), name="jwt-refresh"),
    path("auth/jwt/blacklist/", TokenBlacklistView.as_view(), name="jwt-blacklist"),
]
