from fastapi import Header, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import settings


def require_google_admin(x_google_credential: str = Header(default="")) -> None:
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google client ID is not configured",
        )
    if not x_google_credential:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Google credential",
        )

    try:
        id_info = id_token.verify_oauth2_token(
            x_google_credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        ) from exc

    if id_info.get("email", "").lower() not in settings.admin_email_set:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
