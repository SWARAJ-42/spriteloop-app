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
                    "text": "2D game character running animation, side view, running mid-stride, young fantasy adventurer with blond hair, blue tunic and brown boots, leaning forward in a low, fast running stride, on a plain white background.",
                    "clip": ["38", 0]
                },
                "class_type": "CLIPTextEncode"
            },
            "7": {
                "inputs": {
                    "text": "色调艳丽，颜色溢出，过曝，欠曝，光照不一致，强阴影，反光，高光爆炸，整体发灰，色彩漂移，颜色闪烁，画面抖动，镜头晃动，镜头移动，缩放变化，透视变化，视角变化，景深，背景虚化，杂乱背景，复杂背景，非纯白背景，渐变背景，纹理背景，噪点背景，背景元素，背景人物，地面，道具，阴影投射到背景\n\n静态画面，卡帧，掉帧，帧率不稳定，时间跳跃，动作不连贯，动作断裂，动作重复错误，非循环动画，无法无缝循环，首尾帧不一致，姿态漂移，角色抖动，身体漂移，位置漂移，比例变化，角色大小变化\n\n低质量，最差质量，模糊，细节模糊不清，分辨率过低，像素拉伸，像素断裂，像素不对齐，锯齿异常，压缩伪影，JPEG压缩残留，视频压缩噪点，马赛克，色块断层\n\n风格混乱，风格漂移，画风变化，不一致画风，非像素风，3D风格，写实风格，油画风，水彩风，插画风，摄影风，AI痕迹明显\n\n角色畸形，毁容，比例错误，头身比例变化，身体扭曲，形态畸形的肢体，多余肢体，缺失肢体，三条腿，多只手，多余手指，手指融合，画得不好的手部，画得不好的脸部，面部变形，五官漂移，表情闪烁\n\n倒着走，动作方向错误，左右方向反转，朝向不稳定，角色旋转，翻转错误\n\n字幕，文字，水印，logo，边框，UI元素，时间轴，进度条，标记，签名\n\n非2D，非平面，体积光，粒子特效，烟雾，火焰，光效特效，动态背景特效\n",
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
                    "width": 512,
                    "height": 512,
                    "length": 81,
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
                    "lora_name": "gamesprite_2d_running163.safetensors",
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
