
import argparse
import logging
from pprint import pprint
import boto3
import uuid
from botocore.exceptions import ClientError
from config import BEDROCK_ROLE_ARN,AWS_REGION,KNOWLEDGE_BASE_ID,VECTOR_BUCKET_ARN,INDEX_NAME,S3_BUCKET_ARN

logger = logging.getLogger(__name__)


# ============================================================
# CREATE KNOWLEDGE BASE (S3 VECTORS)
# ============================================================

def create_knowledge_base(
    bedrock_agent_client,
    name,
    vector_bucket_arn,
    index_name,
    description=None
):
    try:
        response = bedrock_agent_client.create_knowledge_base(
            name=name,
            roleArn=BEDROCK_ROLE_ARN,
            knowledgeBaseConfiguration={
                "type": "VECTOR",
                "vectorKnowledgeBaseConfiguration": {
                    "embeddingModelArn":
                        "arn:aws:bedrock:us-east-2::foundation-model/amazon.titan-embed-text-v2:0"
                }
            },
            storageConfiguration={
                "type": "S3_VECTORS",
                "s3VectorsConfiguration": {
                    "vectorBucketArn": vector_bucket_arn,
                    "indexName": index_name
                }
            },
            description=description or "S3 + S3 Vectors Knowledge Base",
            clientToken=str(uuid.uuid4())
        )

        return response["knowledgeBase"]

    except ClientError as e:
        logger.error("Create KB failed: %s", e)
        raise


# ============================================================
# CREATE S3 DATA SOURCE
# ============================================================

def create_s3_data_source(
    bedrock_agent_client,
    knowledge_base_id,
    bucket_arn
):
    response = bedrock_agent_client.create_data_source(
        knowledgeBaseId=knowledge_base_id,
        name="s3-data-source",
        dataSourceConfiguration={
            "type": "S3",
            "s3Configuration": {
                "bucketArn": bucket_arn
            }
        }
    )

    return response["dataSource"]


# ============================================================
# START INGESTION
# ============================================================

def start_ingestion(
    bedrock_agent_client,
    knowledge_base_id,
    data_source_id
):
    return bedrock_agent_client.start_ingestion_job(
        knowledgeBaseId=knowledge_base_id,
        dataSourceId=data_source_id
    )


# ============================================================
# GET KNOWLEDGE BASE
# ============================================================

def get_knowledge_base(bedrock_agent_client, knowledge_base_id):
    response = bedrock_agent_client.get_knowledge_base(
        knowledgeBaseId=knowledge_base_id
    )
    return response["knowledgeBase"]


# ============================================================
# LIST KNOWLEDGE BASES
# ============================================================

def list_knowledge_bases(bedrock_agent_client):
    paginator = bedrock_agent_client.get_paginator("list_knowledge_bases")
    results = []

    for page in paginator.paginate():
        results.extend(page.get("knowledgeBaseSummaries", []))

    return results


# ============================================================
# MAIN CLI
# ============================================================

def main():

    logging.basicConfig(level=logging.INFO)

    import sys

    # ----------------------------------------------------
    # SIMPLE MODE (no CLI args provided)
    # ----------------------------------------------------
    if len(sys.argv) == 1:

        print("Running in SIMPLE mode...\n")

       

        bedrock_agent_client = boto3.client(
            "bedrock-agent",
            region_name=AWS_REGION
        )

        try:
            kb = create_knowledge_base(
                bedrock_agent_client,
                KNOWLEDGE_BASE_ID,
                VECTOR_BUCKET_ARN,
                INDEX_NAME
            )

            print("\nKnowledge Base Created")
            pprint(kb)

            ds = create_s3_data_source(
                bedrock_agent_client,
                kb["knowledgeBaseId"],
                S3_BUCKET_ARN
            )

            print("\nData Source Created")
            pprint(ds)

            start_ingestion(
                bedrock_agent_client,
                kb["knowledgeBaseId"],
                ds["dataSourceId"]
            )

            print("\nIngestion Started")

        except ClientError as e:
            print("Operation failed:")
            print(e)

        return

    # ----------------------------------------------------
    # CLI MODE (arguments provided)
    # ----------------------------------------------------
    parser = argparse.ArgumentParser(
        description="Manage Bedrock Knowledge Bases (S3 + S3 Vectors)"
    )

    parser.add_argument(
        "--action",
        required=True,
        choices=["create", "list", "get", "delete"],
        help="Action to perform"
    )

    parser.add_argument("--name")
    parser.add_argument("--knowledge-base-id")
    parser.add_argument("--vector-bucket-arn")
    parser.add_argument("--index-name")
    parser.add_argument("--document-bucket-arn")
    parser.add_argument("--region", default="us-east-2")

    args = parser.parse_args()

    bedrock_agent_client = boto3.client(
        "bedrock-agent",
        region_name=args.region
    )

    # keep your existing CLI logic here...

if __name__ == "__main__":
    main()



