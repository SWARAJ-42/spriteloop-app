import sys
import base64
from openai import AzureOpenAI
import os
from dotenv import load_dotenv

load_dotenv()

endpoint = os.getenv("ENDPOINT")
deployment = os.getenv("DEPLOYMENT")
subscription_key = os.getenv("SUBSCRIPTION_KEY")
api_version = os.getenv("API_VERSION")

ACTION_MAP = {
    "running": "running",
    "walking": "walking",
    "jumping": "jumping",
    "idle": "idle"
}

client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=subscription_key,
)


def encode_image_bytes(image_bytes):

    return base64.b64encode(image_bytes).decode("utf-8")

def build_instruction(action, extra):

    examples = f"""
EXAMPLES:

1. 
2D game character running animation, side view, The grey wolf gallops to the right, first stretching its body into a fully extended mid-air leap with legs reaching outward. Upon landing, the wolf crouches low and arches its back, gathering its white-tipped paws underneath its belly to prepare for the next stride. The creature then pushes off the ground to spring back into the air, completing the looping run cycle, on a plain white background.

2. 
2D game character walking animation, side view, From the initial side-profile pose, the knight in silver armor and red tabard begins walking forward to the right. The sequence starts as they lift their lead leg while shifting the heater shield and sword in a rhythmic counter-motion. As they stride, the body bobs slightly with each step, and the sword arm swings gently for balance. The walk cycle concludes by seamlessly looping back to the original stepping motion for continuous forward movement, on a plain white background.

3.
2D game character running animation, side view, The astronaut performs a low-gravity run cycle, characterized by slow, buoyant push-offs and exaggerated horizontal strides. Each step involves a gentle floating arc with long airtime before the boots land and compress against the dusty surface. The bulky white suit moves with soft resistance, while the life-support backpack exhibits subtle secondary motion as it lags behind the body, on a plain white background.
"""

    return f"""Generate a descriptive prompt for a 2D sprite animation.

Guidelines:
- Start with: 2D game character {action} animation, side view,
- End with: on a plain white background.
- Keep it as a single line.
- Use a descriptive, visual scientific style of the action similar to the examples.
- Do not add new elements that are not present.

User accepted prompt (Just refine it): {extra if extra else "none"}

{examples}
"""

def generate_prompt_bytes(image_bytes, action, token, extra):

    base64_image = encode_image_bytes(image_bytes)

    action_word = ACTION_MAP[action]

    instruction = build_instruction(action_word, extra)

    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {
                "role": "system",
                "content": "You are a sprite animation prompt generator."
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": instruction},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=150,
        temperature=0.3
    )

    prompt_prefix = ""

    print("This is the action:", action_word)

    if action_word.strip() != "running" and len(token) > 0:
        prompt_prefix = f"{token},"

    print(f"{prompt_prefix} {response.choices[0].message.content.strip()}".strip())

    # exit(0)

    return f"{prompt_prefix} {response.choices[0].message.content.strip()}".strip()

def main():

    if len(sys.argv) < 4:
        print("Usage: python generate_prompt_azure.py image.png action token [extra]")
        sys.exit(1)

    image_path = sys.argv[1]
    action = sys.argv[2]
    token = sys.argv[3]
    extra = sys.argv[4] if len(sys.argv) > 4 else ""

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    prompt = generate_prompt_bytes(image_bytes, action, token, extra)

    print(prompt)


if __name__ == "__main__":
    main()