import sys
import io
import warnings
import numpy as np
import torch
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageSegmentation
from tqdm import tqdm

warnings.filterwarnings("ignore")

MODEL_ID = "ZhengPeng7/BiRefNet_lite"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

TRANSFORM_SIZE = 640      # smaller = much faster
FRAME_SKIP = 2            # run model every N frames


def load_model():
    model = AutoModelForImageSegmentation.from_pretrained(
        MODEL_ID,
        trust_remote_code=True
    )

    model.to(DEVICE)   # <-- move to GPU
    model.eval()

    return model


def extract_frames(webp_bytes):

    img = Image.open(io.BytesIO(webp_bytes))

    frames = []
    durations = []

    if not hasattr(img, "n_frames") or img.n_frames == 1:

        frames.append(img.convert("RGBA"))
        durations.append(img.info.get("duration", 100))

    else:

        try:
            while True:

                frames.append(img.copy().convert("RGBA"))
                durations.append(img.info.get("duration", 100))

                img.seek(img.tell() + 1)

        except EOFError:
            pass

    meta = {"loop": img.info.get("loop", 0)}

    return frames, durations, meta


def make_transform():

    return transforms.Compose([
        transforms.Resize((TRANSFORM_SIZE, TRANSFORM_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            [0.485,0.456,0.406],
            [0.229,0.224,0.225]
        )
    ])


def run_inference(model, frames, transform):

    masks = [None]*len(frames)
    last_mask = None

    for i in tqdm(range(len(frames))):

        if i % FRAME_SKIP != 0 and last_mask is not None:
            masks[i] = last_mask
            continue

        frame = frames[i]

        arr = np.array(frame.convert("RGB"))

        tensor = transform(Image.fromarray(arr)).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            pred = model(tensor)[-1].sigmoid()[0,0]

        pred = pred.detach().cpu().numpy()   # <-- move back to CPU

        mask = Image.fromarray((pred*255).astype(np.uint8)).resize(
            frame.size,
            Image.LANCZOS
        )

        mask = np.array(mask)/255.0

        masks[i] = mask
        last_mask = mask

    return masks

def temporal_smooth(masks):

    if len(masks) <= 1:
        return masks

    out = []

    for i in range(len(masks)):

        lo = max(0,i-1)
        hi = min(len(masks),i+2)

        stack = np.stack(masks[lo:hi],axis=0)

        out.append(stack.mean(axis=0))

    return out


def apply_mask(frame, mask):

    alpha = (mask*255).clip(0,255)

    orig = np.array(frame.convert("RGBA"),dtype=np.float32)

    rgb = orig[:,:,:3]

    whiteness = rgb.min(axis=2)

    fringe = (whiteness>228) & (alpha<180)

    alpha[fringe]=0

    alpha=np.where(alpha<8,0,alpha)
    alpha=np.where(alpha>247,255,alpha)

    orig[:,:,3]=alpha

    return Image.fromarray(orig.astype(np.uint8),"RGBA")


def process_webp(webp_bytes):
    model = load_model()

    transform = make_transform()

    frames,durations,meta = extract_frames(webp_bytes)

    masks = run_inference(model,frames,transform)

    masks = temporal_smooth(masks)

    processed = [
        apply_mask(f,m)
        for f,m in zip(frames,masks)
    ]

    buf = io.BytesIO()

    if len(processed)==1:

        processed[0].save(buf,format="WEBP",lossless=True)

    else:

        processed[0].save(
            buf,
            format="WEBP",
            save_all=True,
            append_images=processed[1:],
            duration=durations,
            loop=meta["loop"],
            lossless=True,
            quality=100,
            method=6
        )

    return buf.getvalue()


def main():
    print("Using device:", DEVICE)

    if len(sys.argv)<2:

        print("Usage: python remove_bg_fast.py input.webp")
        sys.exit(1)

    with open(sys.argv[1],"rb") as f:
        webp_bytes=f.read()

    print("Loading model...")

    print("Processing...")

    out = process_webp(webp_bytes)

    with open("output.webp","wb") as f:
        f.write(out)

    print("Saved output.webp")


if __name__=="__main__":
    main()