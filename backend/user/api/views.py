from djoser.views import UserViewSet as DjoserUserViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

THROTTLED_USER_ACTIONS = frozenset(
    {
        "create",
        "activation",
        "resend_activation",
        "reset_password",
        "reset_password_confirm",
        "set_password",
    }
)


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_scope = "auth"


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_scope = "auth"


class ThrottledUserViewSet(DjoserUserViewSet):
    throttle_scope = "auth"

    def get_throttles(self):
        if self.action in THROTTLED_USER_ACTIONS:
            return super().get_throttles()
        return []
