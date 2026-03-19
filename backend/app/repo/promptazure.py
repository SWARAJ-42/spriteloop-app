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


def build_instruction(token, action, extra):

    examples = f"""
EXAMPLES OF GOOD PROMPTS (RULE-COMPLIANT FORMAT):

1.
{token}, 2D game character running animation, side view, The grey wolf gallops to the right, first stretching its body into a fully extended mid-air leap with legs reaching outward. Upon landing, the wolf crouches low and arches its back, gathering its white-tipped paws underneath its belly to prepare for the next stride. The creature then pushes off the ground to spring back into the air, completing the looping run cycle, on a plain white background.

2.
{token}, 2D game character walking animation, side view, From the initial side-profile pose, the knight in silver armor and red tabard begins walking forward to the right. The sequence starts as they lift their lead leg while shifting the heater shield and sword in a rhythmic counter-motion. As they stride, the body bobs slightly with each step, and the sword arm swings gently for balance. The walk cycle concludes by seamlessly looping back to the original stepping motion for continuous forward movement, on a plain white background.

3.
{token}, 2D game character running animation, side view, The astronaut performs a low-gravity run cycle, characterized by slow, buoyant push-offs and exaggerated horizontal strides. Each step involves a gentle floating arc with long airtime before the boots land and compress against the dusty surface. The bulky white suit moves with soft resistance, while the life-support backpack exhibits subtle secondary motion as it lags behind the body, on a plain white background.
"""

    return f"""
You generate STRICT single-line prompts for a 2D sprite animation system.

STYLE LEARNING:
{examples}

INSTRUCTIONS:
- Output EXACTLY one line.
- Must start with: {token},
- Must say: "2D game character {action} animation, side view,"
- Always end with: "on a plain white background."
- Keep the same rich descriptive storytelling style as the examples.
- Only describe visible features from the image.
- Do NOT invent new clothing, props, or colors.
- Blend motion style naturally with any extra context.

EXTRA CONTEXT:
{extra if extra else "none"}

Now generate the prompt.
"""

def generate_prompt_bytes(image_bytes, action, token, extra):

    base64_image = encode_image_bytes(image_bytes)

    action_word = ACTION_MAP[action]

    instruction = build_instruction(token, action_word, extra)

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

    if action != "running":
        prompt_prefix = f"{token},"

    print(f"{prompt_prefix} {response.choices[0].message.content.strip()}")

    return f"{prompt_prefix} {response.choices[0].message.content.strip()}"

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