import json
from pathlib import Path

from django.conf import settings

_protocol = json.loads(Path(settings.WEBSOCKET_PROTOCOL_FILE).read_text())

CLOSE_UNAUTHORIZED = _protocol["closeCodes"]["unauthorized"]
CLOSE_MESSAGE_TOO_LARGE = _protocol["closeCodes"]["messageTooLarge"]
CLOSE_TOKEN_EXPIRED = _protocol["closeCodes"]["tokenExpired"]
CLOSE_AUTH_TIMEOUT = _protocol["closeCodes"]["authTimeout"]
CLOSE_RATE_LIMIT_EXCEEDED = _protocol["closeCodes"]["rateLimitExceeded"]

ERROR_INVALID_MESSAGE = _protocol["errorCodes"]["invalidMessage"]
ERROR_UNSUPPORTED_TYPE = _protocol["errorCodes"]["unsupportedType"]

MAX_MESSAGE_LENGTH = _protocol["maxMessageLength"]
