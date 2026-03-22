import requests
import base64
import time
import os
from dotenv import load_dotenv

load_dotenv()

POLL_INTERVAL = 10

# ENV
API_URLS = {
    "running": os.getenv("API_URL_RUNNING"),
    "walking": os.getenv("API_URL_WALKING"),
    "jumping": os.getenv("API_URL_JUMPING"),
    "idle": os.getenv("API_URL_IDLE"),
}

API_KEY = os.getenv("RUNPOD_API_KEY")

def generate_sprite(image_base64: str, prompt: str, lora_name: str, animation_type: str):
    """
    Generate animated sprite WebP from base64 image.

    Returns:
        base64 WebP data
    """

    if animation_type not in API_URLS:
        raise ValueError("Invalid animation type")

    API_URL_BASE = API_URLS[animation_type]

    print(API_URL_BASE)
    print(lora_name)

    RUNSYNC_CALL_URL = f"{API_URL_BASE}/runsync"
    STATUS_CHECK_URL = f"{API_URL_BASE}/status"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    # PAYLOAD
    payload = {
        "input": {
            "workflow": {
                "3": {
                    "inputs": {
                        "seed": 42,
                        "steps": 25,
                        "cfg": 6,
                        "sampler_name": "uni_pc",
                        "scheduler": "simple",
                        "denoise": 1,
                        "model": ["55", 0],
                        "positive": ["50", 0],
                        "negative": ["50", 1],
                        "latent_image": ["50", 2]
                    },
                    "class_type": "KSampler"
                },
                "6": {
                    "inputs": {
                        "text": prompt,
                        "clip": ["38", 0]
                    },
                    "class_type": "CLIPTextEncode"
                },
                "7": {
                    "inputs": {
                        "text": "oversaturated colors, color bleeding, overexposed, underexposed, inconsistent lighting, harsh shadows, reflections, blown highlights, washed out colors, color shift, color flicker, camera shake, camera movement, zoom change, perspective change, viewpoint change, depth of field, background blur, cluttered background, complex background, non white background, gradient background, textured background, noisy background, background objects, background characters, ground, props, shadows cast on background, static frame, frozen frame, dropped frames, unstable frame rate, time skipping, discontinuous motion, broken motion, repeated frame errors, non looping animation, cannot loop seamlessly, first and last frame mismatch, pose drift, character jitter, body drift, position drift, scale change, character size inconsistency, character design changing between frames, outfit change, color change, prop change, accessory change, style inconsistency, inconsistent silhouette, leg swapping, incorrect gait cycle, legs intersecting, feet sliding, unnatural running motion, extra hands, missing hands, duplicated hands, unstable hands, flickering hands, incorrect grip, object disappearing, object changing size, object changing shape, object switching hands, floating objects, hands moving incorrectly while holding an object, deformed character, disfigured body, incorrect proportions, head body ratio change, twisted body, malformed limbs, extra limbs, missing limbs, three legs, multiple arms, extra fingers, fused fingers, poorly drawn hands, poorly drawn face, facial distortion, drifting facial features, flickering expressions, walking backwards, wrong movement direction, left right direction flipping, unstable facing direction, character rotation, incorrect sprite flipping, low quality, worst quality, blur, blurry details, low resolution, pixel stretching, pixel tearing, pixel misalignment, abnormal aliasing, compression artifacts, jpeg artifacts, video compression noise, mosaic artifacts, color banding, style drift, inconsistent art style, non pixel style, 3d style, realistic style, oil painting style, watercolor style, illustration style, photography style, ai artifacts, subtitles, text, watermark, logo, border, ui elements, timeline, progress bar, markers, signature, volumetric light, particles, smoke, fire, glow effects, dynamic background effects",
                        "clip": ["38", 0]
                    },
                    "class_type": "CLIPTextEncode"
                },
                "8": {
                    "inputs": {
                        "samples": ["3", 0],
                        "vae": ["39", 0]
                    },
                    "class_type": "VAEDecode"
                },
                "28": {
                    "inputs": {
                        "filename_prefix": "ComfyUI",
                        "fps": 8,
                        "quality": 80,
                        "method": "default",
                        "lossless": False,
                        "images": ["8", 0]
                    },
                    "class_type": "SaveAnimatedWEBP"
                },
                "37": {
                    "inputs": {
                        "unet_name": "wan2.1_i2v_480p_14B_fp16.safetensors",
                        "weight_dtype": "default"
                    },
                    "class_type": "UNETLoader"
                },
                "38": {
                    "inputs": {
                        "clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
                        "type": "wan"
                    },
                    "class_type": "CLIPLoader"
                },
                "39": {
                    "inputs": {
                        "vae_name": "wan_2.1_vae.safetensors"
                    },
                    "class_type": "VAELoader"
                },
                "47": {
                    "inputs": {
                        "filename_prefix": "ComfyUI",
                        "fps": 8,
                        "codec": "vp9",
                        "crf": 20,
                        "images": ["8", 0]
                    },
                    "class_type": "SaveWEBM"
                },
                "49": {
                    "inputs": {
                        "clip_name": "clip_vision_h.safetensors"
                    },
                    "class_type": "CLIPVisionLoader"
                },
                "50": {
                    "inputs": {
                        "batch_size": 1,
                        "width": 256,
                        "height": 256,
                        "length": 33,
                        "value": 256,
                        "positive": ["6", 0],
                        "negative": ["7", 0],
                        "vae": ["39", 0],
                        "clip_vision_output": ["51", 0],
                        "start_image": ["52", 0]
                    },
                    "class_type": "WanImageToVideo"
                },
                "51": {
                    "inputs": {
                        "crop": "center",
                        "clip_vision": ["49", 0],
                        "image": ["52", 0]
                    },
                    "class_type": "CLIPVisionEncode"
                },
                "52": {
                    "inputs": {
                        "image": "input.png"
                    },
                    "class_type": "LoadImage"
                },
                "54": {
                    "inputs": {
                        "shift": 8.0,
                        "model": ["37", 0]
                    },
                    "class_type": "ModelSamplingSD3"
                },
                "55": {
                    "inputs": {
                        "lora_name": lora_name,
                        "strength_model": 1.0,
                        "model": ["54", 0]
                    },
                    "class_type": "LoraLoaderModelOnly"
                }
            },

            "images": [
                {
                    "name": "input.png",
                    "image": image_base64
                }
            ]
        }
    }

    # Send request
    response = requests.post(RUNSYNC_CALL_URL, headers=headers, json=payload)

    with open("runpod_submit_debug.txt", "w", encoding="utf-8") as f:
        f.write(response.text)

    result = response.json()

    if "id" not in result:
        raise Exception("RunPod job submission failed")

    job_id = result["id"]
    status = result["status"]

    print("Job ID:", job_id)
    print("Initial Status:", status)

    status_url = f"{STATUS_CHECK_URL}{job_id}"

    while status == "IN_PROGRESS":
        time.sleep(POLL_INTERVAL)

        status_response = requests.get(status_url, headers=headers)

        with open("runpod_status_debug.txt", "w", encoding="utf-8") as f:
            f.write(status_response.text)

        status_data = status_response.json()
        status = status_data["status"]

        print("Status:", status)

    if status != "COMPLETED":
        raise Exception("RunPod job failed")

    # Extract WebP
    images = result["output"]["images"]

    for img in images:
        if img["filename"].endswith(".webp"):
            return img["data"]

    raise Exception("WEBP output not found")

if __name__ == "__main__":
    with open("1.png", "rb") as f:
        image_base64 = base64.b64encode(f.read()).decode()

    webp_base64 = generate_sprite(
        image_base64=image_base64,
        prompt="2D game character running animation, side view, running mid-stride, young fantasy adventurer with blond hair, blue tunic and brown boots, leaning forward in a low, fast running stride, on a plain white background.",
        lora_name="gamesprite_2d_running163.safetensors",
        animation_type="running"
    )

    print("WebP generated")