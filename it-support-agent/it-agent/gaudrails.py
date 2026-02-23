import boto3
import time
from botocore.exceptions import ClientError
from config import AWS_REGION

def create_bedrock_guardrail(name, description):
    client = boto3.client(service_name="bedrock", region_name=AWS_REGION)

    try:
        response = client.create_guardrail(
            name=name,
            description=description,
            # Contextual grounding policy
        contextualGroundingPolicyConfig={
            "filtersConfig": [
                {
                    "type": "GROUNDING",
                    "threshold": 0.8,   
                    "action": "BLOCK"             
                }
            ]
        },


            # CONTENT FILTERS
            contentPolicyConfig={
                "filtersConfig": [
                    {
                        "type": "HATE",
                        "inputStrength": "HIGH",
                        "outputStrength": "HIGH"
                    },
                    {
                        "type": "SEXUAL",
                        "inputStrength": "HIGH",
                        "outputStrength": "HIGH"
                    },
                    {
                        "type": "VIOLENCE",
                        "inputStrength": "HIGH",
                        "outputStrength": "HIGH"
                    }
                ]
            },

            # TOPIC DENIAL
            topicPolicyConfig={
                "topicsConfig": [
                    {
                        "name": "Financial Advice",
                        "definition": "Providing personalized financial or investment advice",
                        "examples": [
                            "Should I buy Apple stock?",
                            "Tell me how to invest my savings"
                        ],
                        "type": "DENY"
                    }
                ]
            },

            # REQUIRED MESSAGES
            blockedInputMessaging="Sorry, your request was blocked by safety rules.",
            blockedOutputsMessaging="Sorry, I cannot provide a response to that request.",

            # Optional
            clientRequestToken=name
        )

        print(f"Guardrail creation started. Guardrail ID: {response['guardrailId']}")
        return response

    except ClientError as e:
        print("Error creating guardrail:")
        print(e)
        return None


def wait_for_guardrail_ready(guardrail_id):
    client = boto3.client(service_name="bedrock")

    while True:
        response = client.get_guardrail(
            guardrailIdentifier=guardrail_id,
            guardrailVersion="DRAFT"
        )
        status = response["status"]
        print(f"Guardrail status: {status}")

        if status == "READY":
            print("Guardrail is ready")
            break
        elif status == "FAILED":
            print("Guardrail creation failed")
            print(response.get("failureReasons"))
            break

        time.sleep(10)


# if __name__ == "__main__":
#     guardrail_name = "IT-GAUDRAIL"
#     guardrail_description = "Guardrail for IT RAG testing"

#     res = create_bedrock_guardrail(guardrail_name, guardrail_description)
#     if res:
#         wait_for_guardrail_ready(res["guardrailId"])

