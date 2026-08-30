from pathlib import Path
from datetime import timedelta
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "djoser",
    "drf_spectacular",
    "phonenumber_field",
    "user",
    "channels",
    "websocket",
    "comment",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

ASGI_APPLICATION = "backend.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [
                env("CHANNEL_LAYERS_VALKEY_URL", default="redis://localhost:6379")
            ],
            "capacity": env.int("CHANNEL_LAYERS_CAPACITY", default=500),
            "expiry": env.int("CHANNEL_LAYERS_EXPIRY", default=10),
        },
    }
}

OPENAPI_SCHEMA_FILE = env("OPENAPI_SCHEMA_FILE", default="/schema/openapi.yml")

WEBSOCKET_PROTOCOL_FILE = env(
    "WEBSOCKET_PROTOCOL_FILE", default="/schema/websocket.json"
)

WEBSOCKET_AUTH_TIMEOUT_SECONDS = env.float(
    "WEBSOCKET_AUTH_TIMEOUT_SECONDS", default=10.0
)
WEBSOCKET_RATE_LIMIT_MESSAGES = env.int("WEBSOCKET_RATE_LIMIT_MESSAGES", default=30)
WEBSOCKET_RATE_LIMIT_WINDOW_SECONDS = env.float(
    "WEBSOCKET_RATE_LIMIT_WINDOW_SECONDS", default=10.0
)

DATABASES = {"default": env.db("DATABASE_URL")}

AUTH_USER_MODEL = "user.User"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation"
            ".UserAttributeSimilarityValidator"
        )
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = env("LANGUAGE_CODE", default="en-us")
LANGUAGES = [
    ("en", "English"),
    ("es", "Espanol"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

PHONENUMBER_DEFAULT_REGION = env("PHONENUMBER_DEFAULT_REGION", default="US")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "auth": env("AUTH_THROTTLE_RATE", default="10/minute"),
        "embeddings": env("EMBEDDINGS_THROTTLE_RATE", default="30/minute"),
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Fullstack project API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api/v1",
    "COMPONENT_SPLIT_REQUEST": True,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(seconds=env.int("ACCESS_LIFETIME")),
    "REFRESH_TOKEN_LIFETIME": timedelta(seconds=env.int("REFRESH_LIFETIME")),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS", default=["http://localhost:5173"]
)

OPENAI_API_KEY = env("OPENAI_API_KEY", default="")
EMBEDDING_MODEL_NAME = env("EMBEDDING_MODEL_NAME", default="text-embedding-3-small")
EMBEDDING_DIMENSIONS = 1536

EMAIL_BACKEND = env(
    "EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend"
)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="no-reply@localhost")

FRONTEND_PROTOCOL = env("FRONTEND_PROTOCOL", default="http")
FRONTEND_DOMAIN = env("FRONTEND_DOMAIN", default="localhost:5173")

DJOSER = {
    "LOGIN_FIELD": "email",
    "USER_CREATE_PASSWORD_RETYPE": True,
    "PASSWORD_RESET_CONFIRM_RETYPE": True,
    "SET_PASSWORD_RETYPE": True,
    "PASSWORD_RESET_SHOW_EMAIL_NOT_FOUND": False,
    "SEND_ACTIVATION_EMAIL": env.bool("SEND_ACTIVATION_EMAIL", default=False),
    "EMAIL_FRONTEND_PROTOCOL": FRONTEND_PROTOCOL,
    "EMAIL_FRONTEND_DOMAIN": FRONTEND_DOMAIN,
    "EMAIL_FRONTEND_SITE_NAME": env("SITE_NAME", default="Fullstack project"),
    "ACTIVATION_URL": "auth/activate/{uid}/{token}",
    "PASSWORD_RESET_CONFIRM_URL": "auth/reset-password/{uid}/{token}",
    "SERIALIZERS": {
        "user_create": "user.api.serializers.UserCreateSerializer",
        "current_user": "user.api.serializers.UserSerializer",
        "user": "user.api.serializers.UserSerializer",
    },
}
