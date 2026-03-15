# Lambda container image — Python 3.12 base provided by AWS
FROM public.ecr.aws/lambda/python:3.12

WORKDIR ${LAMBDA_TASK_ROOT}

# Install uv for dependency resolution
RUN pip install uv --no-cache-dir

# Copy dependency manifests
COPY pyproject.toml uv.lock ./

# Export only the Lambda-compatible core deps (no playwright/gradio/uvicorn)
# then install them into the Lambda task root for correct module discovery
RUN uv export \
      --no-dev \
      --no-group dev \
      --no-group local \
      --format requirements-txt \
      -o /tmp/requirements.txt \
    && pip install \
      -r /tmp/requirements.txt \
      --no-cache-dir \
      --target "${LAMBDA_TASK_ROOT}"

# Copy application source
COPY backend/ ./backend/

# Create sandbox directory for agent file operations (persists within warm invocation)
RUN mkdir -p ${LAMBDA_TASK_ROOT}/sandbox

# Lambda handler: backend.main.handler = Mangum(app)
CMD ["backend.main.handler"]
