import os
from dotenv import load_dotenv

if os.getenv("AWS_EXECUTION_ENV") is None:
    load_dotenv()
AWS_REGION = os.environ["AWS_REGION"]
BEDROCK_MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
KNOWLEDGE_BASE_ID = os.environ["KNOWLEDGE_BASE_ID"]
AGENT_ID = os.environ["AGENT_ID"]

# Optional (safe defaults)
S3_BUCKET_NAME = os.environ["S3_BUCKET_NAME"]
S3_BUCKET_ARN = os.environ["S3_BUCKET_ARN"]
S3_DOCS_PREFIX = os.environ.get("S3_DOCS_PREFIX", "docx/")
VECTOR_BUCKET_ARN = os.environ["VECTOR_BUCKET_ARN"]
KNOWLEDGE_BASE_NAME = os.environ["KNOWLEDGE_BASE_NAME"]
AGENT_NAME = os.environ.get("AGENT_NAME")
GUARDRAIL_NAME = os.environ.get("GUARDRAIL_NAME")
GUARDRAIL_ID = os.environ.get("GUARDRAIL_ID")
GUARDRAIL_VERSION = os.environ.get("GUARDRAIL_VERSION", "DRAFT")
INDEX_NAME = os.environ.get("INDEX_NAME")
ALIAS_ID = os.environ.get("ALIAS_ID")
BEDROCK_ROLE_ARN=os.environ.get("BEDROCK_ROLE_ARN")
