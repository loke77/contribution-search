import os
import re

from fastapi import FastAPI
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .api.routes.contributions import router as contributions_router
from .security import SecurityHeadersMiddleware


def create_app() -> FastAPI:
    docs_setting = os.getenv("APP_EXPOSE_API_DOCS", "true").strip().lower()
    if docs_setting not in {"true", "false"}:
        raise ValueError("APP_EXPOSE_API_DOCS must be true or false")

    app = FastAPI(
        title="Contribution Search",
        version="1.0.0",
        openapi_url="/openapi.json" if docs_setting == "true" else None,
    )
    app.include_router(contributions_router)

    host_setting = os.getenv("APP_ALLOWED_HOSTS")
    if host_setting is not None:
        allowed_hosts = [host.strip().lower() for host in host_setting.split(",")]
        if any(
            re.fullmatch(r"(?:\*\.)?[a-z0-9_][a-z0-9_.-]*", host) is None
            for host in allowed_hosts
        ):
            raise ValueError(
                "APP_ALLOWED_HOSTS must contain explicit hostnames or *.domain entries"
            )
        app.add_middleware(
            TrustedHostMiddleware, allowed_hosts=allowed_hosts, www_redirect=False
        )
    app.add_middleware(SecurityHeadersMiddleware)
    return app


app = create_app()
