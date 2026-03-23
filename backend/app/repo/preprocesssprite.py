import io
import sys
import numpy as np
import torch
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageSegmentation
from scipy.ndimage import binary_erosion
import threading

_model = None
_transform = None
_model_lock = threading.Lock()

MODEL_ID = "ZhengPeng7/BiRefNet_lite"

TARGET_SIZE = 256
PADDING = 12
TRANSFORM_SIZE = 640

WHITE = np.array([255,255,255],dtype=np.uint8)


# -----------------------------
# Load segmentation model
# -----------------------------
def get_model():
    global _model

    if _model is None:
        with _model_lock:
            if _model is None:
                model = AutoModelForImageSegmentation.from_pretrained(
                    MODEL_ID,
                    trust_remote_code=True,
                    device_map=None  # 🔥 IMPORTANT
                )

                model = model.to("cpu")   # 🔥 CRITICAL
                model.eval()

                _model = model

    return _model

# -----------------------------
# Transform
# -----------------------------
def make_transform():

    return transforms.Compose([
        transforms.Resize((TRANSFORM_SIZE,TRANSFORM_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            [0.485,0.456,0.406],
            [0.229,0.224,0.225]
        )
    ])

def get_transform():
    global _transform

    if _transform is None:
        _transform = make_transform()

    return _transform

# -----------------------------
# Get segmentation mask
# -----------------------------
def get_foreground_mask(img, model, transform):

    arr = np.array(img.convert("RGB"))

    tensor = transform(Image.fromarray(arr)).unsqueeze(0)

    tensor = tensor.to("cpu")  # 🔥 FIX

    with torch.no_grad():
        pred = model(tensor)[-1].sigmoid()[0,0]

    pred = pred.cpu().numpy()  # 🔥 FIX

    mask = Image.fromarray((pred*255).astype(np.uint8)).resize(
        img.size,
        Image.LANCZOS
    )

    mask = np.array(mask)/255.0

    return mask > 0.5


# -----------------------------
# Pure white background
# -----------------------------
def apply_pure_white_background(img,mask_bool):

    img_rgb = np.array(img.convert("RGB"))

    result = img_rgb.copy()

    result[~mask_bool] = WHITE

    eroded = binary_erosion(mask_bool,iterations=1)

    edge = mask_bool ^ eroded

    border_colors = result[edge]

    near_white = np.all(border_colors>230,axis=1)

    result[edge][near_white] = WHITE

    return Image.fromarray(result)


# -----------------------------
# Crop to subject
# -----------------------------
def crop_to_subject(img,mask):

    coords = np.argwhere(mask)

    if coords.size==0:
        return img,mask

    y0,x0 = coords.min(axis=0)
    y1,x1 = coords.max(axis=0)

    y0=max(0,y0-PADDING)
    x0=max(0,x0-PADDING)
    y1=min(mask.shape[0],y1+PADDING)
    x1=min(mask.shape[1],x1+PADDING)

    return img.crop((x0,y0,x1,y1)),mask[y0:y1,x0:x1]


# -----------------------------
# Pad to square
# -----------------------------
def pad_to_square(img):

    w,h = img.size

    size = max(w,h)

    canvas = Image.new("RGB",(size,size),(255,255,255))

    canvas.paste(img,((size-w)//2,(size-h)//2))

    return canvas


# -----------------------------
# Main pipeline (bytes input)
# -----------------------------
def preprocess_sprite(image_bytes, pixel_art=True):

    model = get_model()          # ✅ reuse
    transform = get_transform()  # ✅ reuse

    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    mask = get_foreground_mask(img, model, transform)

    cropped_img, cropped_mask = crop_to_subject(img, mask)

    white_bg_img = apply_pure_white_background(
        cropped_img,
        cropped_mask
    )

    squared = pad_to_square(white_bg_img)

    resample = Image.NEAREST if pixel_art else Image.LANCZOS

    final_img = squared.resize(
        (TARGET_SIZE, TARGET_SIZE),
        resample=resample
    )

    buf = io.BytesIO()
    final_img.save(buf, format="PNG")

    return buf.getvalue()
# -----------------------------
# CLI usage
# -----------------------------
def main():

    if len(sys.argv) < 3:

        print("Usage: python preprocess_sprite.py input.png output.png")
        sys.exit(1)

    print("Loading model...")

    print("Processing...")

    with open(sys.argv[1],"rb") as f:
        img_bytes = f.read()

    out_bytes = preprocess_sprite(
        img_bytes,
        pixel_art=True
    )

    with open(sys.argv[2],"wb") as f:
        f.write(out_bytes)

    print("Saved:",sys.argv[2])


if __name__=="__main__":
    main()