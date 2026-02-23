
import boto3
import uuid
from botocore.exceptions import ClientError
from config import AWS_REGION,AGENT_NAME,BEDROCK_ROLE_ARN,KNOWLEDGE_BASE_ID,BEDROCK_MODEL_ID,GUARDRAIL_ID,GUARDRAIL_VERSION


bedrock_agent_client = boto3.client("bedrock-agent", region_name=AWS_REGION)

try:
    response = bedrock_agent_client.create_agent(
        agentName=AGENT_NAME,
        description="IT Support Agent using KB + Guardrails",
        agentResourceRoleArn=BEDROCK_ROLE_ARN,
        foundationModel=BEDROCK_MODEL_ID,  
        guardrailConfiguration={             
            "guardrailIdentifier": GUARDRAIL_ID,
            "guardrailVersion": GUARDRAIL_VERSION
        },
        instruction=f"Use knowledge base {KNOWLEDGE_BASE_ID} to answer IT support questions. "
                    f"If answer is not found, reply: 'I don't know.'",
        clientToken=str(uuid.uuid4())
    )

    agent = response["agent"]
    print("Agent Created:")
    print(f"Agent ID: {agent['agentId']}")
    print(f"Name: {agent['agentName']}")
    print(f"Status: {agent['status']}")

except ClientError as e:
    print(" Failed to create agent:")
    print(e)





