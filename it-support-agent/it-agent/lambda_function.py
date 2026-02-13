import boto3
import logging
import uuid
import json
from botocore.exceptions import ClientError
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

AWS_REGION="us-east-2"
AGENT_ID="GTHIIVIDEF"
ALIAS_ID="GYIQ6VIELI"
# -----------------------------
# Initialize Bedrock Agent Runtime client
# -----------------------------
client = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)


# -----------------------------
# CORS Headers Helper
# -----------------------------
def get_cors_headers():
    """Return CORS headers for all responses"""
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,x-api-key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
    }

def create_response(status_code, body):
    """Create a properly formatted API Gateway response with CORS headers"""
    return {
        "statusCode": status_code,
        "headers": get_cors_headers(),
        "body": json.dumps(body)
    }

# -----------------------------
# Function to invoke agent
# -----------------------------
def invoke_agent(prompt, session_id=None):
    """
    Invoke the Bedrock Agent with a prompt
    
    Args:
        prompt (str): The user's question/input
        session_id (str): Optional session ID. If not provided, generates a new one.
    
    Returns:
        str: The agent's response
    """
    if not session_id:
        session_id = str(uuid.uuid4())
    
    logger.info(f"Invoking agent with session_id: {session_id}")
    logger.info(f"Prompt: {prompt}")
    
    try:
        response = client.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=ALIAS_ID,
            sessionId=session_id,
            inputText=prompt,
            enableTrace=True,
            streamingConfigurations={
                "applyGuardrailInterval": 20,
                "streamFinalResponse": False
            }
        )

        completion = ""
        
        # Process the streaming response
        for event in response.get("completion", []):
            if "chunk" in event:
                chunk = event["chunk"]
                completion += chunk["bytes"].decode()
            
            # Log trace information if available
            if "trace" in event:
                trace_event = event.get("trace")
                trace = trace_event.get("trace", {})
                for key, value in trace.items():
                    logger.info(f"Trace - {key}: {value}")

        logger.info(f"Agent response: {completion}")
        return completion

    except ClientError as e:
        error_msg = f"ClientError invoking agent: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error invoking agent: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg)

# -----------------------------
# Lambda handler
# -----------------------------
def lambda_handler(event, context=None):
    """
    Main Lambda handler for API Gateway events
    
    Expected event body (JSON):
    {
        "question": "Your question here",
        "session_id": "optional-session-id"
    }
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Handle OPTIONS request for CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return create_response(200, {"message": "OK"})
    
    try:
        # Parse request body
        if "body" in event:
            try:
                body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in request body: {str(e)}")
                return create_response(400, {
                    "error": "Invalid JSON in request body",
                    "message": str(e)
                })
        else:
            body = event
        
        # Extract question and session_id from body
        prompt = body.get("question", "").strip()
        session_id = body.get("session_id")
        
        # Validate required fields
        if not prompt:
            logger.warning("Missing 'question' field in request")
            return create_response(400, {
                "error": "Missing required field: question",
                "message": "Please provide a 'question' in the request body"
            })
        
        # Generate session_id if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
            logger.info(f"Generated new session_id: {session_id}")
        
        # Invoke the agent
        try:
            answer = invoke_agent(prompt, session_id)
            
            # Return successful response
            return create_response(200, {
                "question": prompt,
                "answer": answer,
                "session_id": session_id
            })
        
        except Exception as e:
            logger.error(f"Error invoking agent: {str(e)}")
            return create_response(500, {
                "error": "Failed to invoke agent",
                "message": str(e),
                "question": prompt
            })
    
    except Exception as e:
        logger.error(f"Unexpected error in lambda_handler: {str(e)}")
        return create_response(500, {
            "error": "Internal server error",
            "message": str(e)
        })

# # -----------------------------
# # Main function for local testing
# # -----------------------------
# if __name__ == "__main__":
#     print("Testing Bedrock IT Support Agent (local)...")
#     print("Type 'exit' to quit\n")
    
#     # Use a consistent session for local testing
#     test_session_id = str(uuid.uuid4())
#     print(f"Using session ID: {test_session_id}\n")
    
#     while True:
#         user_input = input("You: ").strip()
        
#         if user_input.lower() == "exit":
#             print("Goodbye!")
#             break
        
#         if not user_input:
#             print("Please enter a question.\n")
#             continue
        
#         # Simulate Lambda event
#         test_event = {
#             "body": json.dumps({
#                 "question": user_input,
#                 "session_id": test_session_id
#             })
#         }
        
#         # Call Lambda handler
#         result = lambda_handler(test_event)
        
#         # Parse and display response
#         response_body = json.loads(result["body"])
        
#         if result["statusCode"] == 200:
#             print(f"\nAgent: {response_body['answer']}\n")
#         else:
#             print(f"\nError: {response_body.get('error', 'Unknown error')}")
#             print(f"Message: {response_body.get('message', 'No details')}\n")