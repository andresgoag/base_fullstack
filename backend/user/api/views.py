from djoser.views import UserViewSet as DjoserUserViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_scope = "auth"


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_scope = "auth"


class ThrottledUserViewSet(DjoserUserViewSet):
    throttle_scope = "auth"
