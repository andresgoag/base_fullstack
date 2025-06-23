FROM python:3.13-slim
ENV PYTHONUNBUFFERED=1
COPY --from=ghcr.io/astral-sh/uv:0.7.12 /uv /uvx /bin/
ENV APP_DIR=/app
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}
COPY . ${APP_DIR}
RUN uv sync --locked