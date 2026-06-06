from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sentry_sdk

from app.api.routes import router
from app.core.config import settings

sentry_sdk.init(
    dsn="https://72abdf845d19142e32502fd97d3c3aa5@o4511507821101056.ingest.de.sentry.io/4511507965280336",
    # Add data like request headers and IP for users,
    # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
    send_default_pii=True,
)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/", tags=["root"])
def read_root() -> dict[str, str]:
    return {"message": "Welcome to Visal Trivia API"}
