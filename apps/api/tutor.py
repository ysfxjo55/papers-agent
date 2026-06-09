from anthropic import Anthropic
import os
from dotenv import load_dotenv

load_dotenv()

try:
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
except Exception as e:
    print(f"Error initializing Anthropic client: {e}")
    raise e

def get_ai_reply(system: str, messages: list) -> str:
    """
    Inputs: system prompt (str), message history (list of dicts)
    Output: raw reply text (str)
    """
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=system,
            messages=messages
        )
    except Exception as e:
        print(f"Error calling Anthropic API: {e}")
        raise e

    return response.content[0].text


if __name__ == "__main__":

    test_system = "You are a helpful assistant that answers in exactly one short sentence."
    test_messages = [
        {"role": "user", "content": "What is the capital of France?"}
    ]

    try:
        reply = get_ai_reply(system=test_system, messages=test_messages)
        print(f"Claude: {reply}")
    except Exception as e:
        print(f"Error: {e}")
