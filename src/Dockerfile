FROM public.ecr.aws/lambda/python:3.11

# Install build tools if needed
RUN pip install --upgrade pip

# Install pinned dependencies directly via wheel
COPY requirements.txt .
RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt

# Copy application code and model artifacts
COPY . ${LAMBDA_TASK_ROOT}

CMD ["pipeline.handler.handler"]
