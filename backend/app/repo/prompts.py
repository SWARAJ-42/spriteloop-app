
# ──────────────────────────────────────────────────────────
# POSE PROMPTS
# ──────────────────────────────────────────────────────────

POSE_PROMPT_RUNNING = """
You are an image editor. Repose the subject into a clean 2D game sprite-friendly RUNNING pose in a STRICT SIDE VIEW while preserving the character’s original identity, equipment, and style.

VIEW AND ORIENTATION (VERY IMPORTANT):
- The character must be shown in a TRUE SIDE PROFILE.
- The body must be viewed from the side only (NOT 3/4 view, NOT facing the viewer).
- The head, torso, hips, and feet must all align in a single side-view plane.
- The character must face RIGHT (moving LEFT → RIGHT).
- The full body must be visible from head to toe.
- The character should look like a frame from a 2D side-scrolling game.

RUNNING POSE REQUIREMENTS:
- The pose must clearly show a RUNNING stride.
- One leg extended forward.
- One leg extended backward.
- The torso slightly leaning forward for motion.

ARM MOVEMENT (IMPORTANT):
- Arms must swing opposite to the legs (natural running motion).
- The forward leg pairs with the backward arm.
- The backward leg pairs with the forward arm.
- Arms must remain fully visible in side view.

ANIMAL / CREATURE RULES:
If the subject is an animal or creature:
- Use a natural running locomotion pose.
- Front and back legs extended like a mid-stride frame.
- The spine should follow the natural running posture of the creature.
- Maintain species-accurate limb positioning.

EQUIPMENT AND PROPS:
- ALL original equipment must remain visible.
- Weapons, armor, tools, and accessories must NOT disappear.
- The character must continue holding equipment correctly while running.

STRICT PRESERVATION RULES:
- DO NOT change the character’s face, identity, species, clothing, fur, armor, or colors.
- DO NOT redesign the character.
- DO NOT change body proportions.
- DO NOT crop the subject.

BACKGROUND:
- Keep the background simple and neutral.

GOAL:
Produce a clean SIDE-PROFILE running sprite frame suitable for a 2D side-scrolling animation, with natural limb movement and strict side view orientation.
"""


POSE_PROMPT_WALKING = """
You are an image editor. Repose the subject into a clean 2D game sprite-friendly WALKING pose in a STRICT SIDE VIEW while preserving the character’s original identity, equipment, and style.

VIEW AND ORIENTATION (VERY IMPORTANT):
- The character must be shown in a TRUE SIDE PROFILE.
- The body must be viewed strictly from the side (NOT 3/4 view, NOT facing the viewer).
- The head, torso, hips, and feet must align in the same side-view plane.
- The character must face RIGHT (moving LEFT → RIGHT).
- The full body must be visible from head to toe.
- The character should resemble a frame from a 2D side-scrolling game.

WALKING POSE REQUIREMENTS:
- The pose must clearly show a relaxed WALKING stride.
- One leg stepping forward.
- One leg stepping slightly behind.
- The stride should be shorter and more relaxed than a running pose.
- The torso should remain mostly upright (not leaning forward).

ARM MOVEMENT:
- Arms should swing naturally in a relaxed walking motion.
- The arm opposite the forward leg should swing forward.
- The arm opposite the back leg should swing backward.
- The motion should feel calm and natural.

ANIMAL / CREATURE RULES:
If the subject is an animal or creature:
- Use a natural walking locomotion pose.
- Front and back legs should show a mid-step walking frame.
- Maintain realistic limb positions for the species.

EQUIPMENT AND PROPS:
- ALL original equipment must remain visible.
- Weapons, armor, tools, and accessories must NOT disappear.
- The character must continue holding equipment correctly.

STRICT PRESERVATION RULES:
- DO NOT change the character’s face, identity, species, clothing, fur, armor, or colors.
- DO NOT redesign the character.
- DO NOT change body proportions.
- DO NOT crop the subject.

BACKGROUND:
- Keep the background simple and neutral if necessary.

GOAL:
Produce a clean SIDE-PROFILE walking sprite frame suitable for a 2D side-scrolling animation, with relaxed movement and strict side-view orientation.
"""


POSE_PROMPT_IDLE = """
You are an image editor. Repose the subject into a clean 2D game sprite-friendly IDLE reference pose while preserving the character’s original identity, design, and equipment.

VIEW AND ORIENTATION:
- The character should stand in a neutral idle stance.
- The character may face forward or slightly toward the viewer (front or slight 3/4 view).
- The pose should look like a calm reference frame from a 2D game sprite sheet.
- The full body must be visible from head to toe.
- The character should be centered and clearly visible.

IDLE POSE REQUIREMENTS:
- The character should stand relaxed and balanced.
- The body posture should be upright and stable.
- Both feet should be naturally placed on the ground.
- The pose should look calm and stationary.

ARM / LIMB POSITION:
- Arms or front limbs should rest naturally beside the body.
- Hands, paws, or claws should appear relaxed.
- No exaggerated movement or action pose.

ANIMAL / CREATURE RULES:
If the subject is an animal or creature:
- The creature should stand in a natural idle stance.
- All legs should be grounded and balanced.
- Maintain natural anatomy and species posture.

EQUIPMENT AND PROPS:
- ALL original equipment must remain visible.
- Weapons, armor, tools, and accessories must NOT disappear.
- Equipment should appear naturally positioned in the idle stance.

STRICT PRESERVATION RULES:
- DO NOT change the character’s face, identity, species, clothing, fur, armor, or colors.
- DO NOT redesign the character.
- DO NOT alter body proportions.
- DO NOT crop the subject.

BACKGROUND:
- Keep the background simple and neutral.

GOAL:
Create a clean idle reference pose suitable for a 2D game sprite sheet while preserving the character’s appearance and personality.
"""


POSE_PROMPT_JUMPING = """
You are an image editor. Repose the subject into a clean 2D game sprite-friendly JUMPING pose while preserving the character’s original identity, equipment, and design.

VIEW AND ORIENTATION:
- The subject should appear in a clear mid-air jumping pose.
- The character should face RIGHT (moving LEFT → RIGHT).
- The full body must be visible from head to toe.
- The character should resemble a frame from a 2D side-scrolling game animation.

JUMPING POSE REQUIREMENTS:
- The character must appear airborne (not touching the ground).
- Legs should be bent naturally as if pushing upward or mid-jump.
- The torso should show upward motion or slight lift.
- The pose should clearly communicate a jump frame.

ARM / LIMB POSITION:
- Arms should move naturally to maintain balance during the jump.
- Limbs should not look stiff or symmetrical.
- The silhouette should clearly show motion.

ANIMAL / CREATURE RULES:
If the subject is an animal or creature:
- The creature should appear mid-leap.
- Legs should bend naturally as part of a jumping motion.
- Maintain realistic anatomy for the species.

EQUIPMENT AND PROPS:
- ALL original equipment must remain visible.
- Weapons, armor, tools, and accessories must NOT disappear.
- Equipment must remain naturally positioned during the jump.

STRICT PRESERVATION RULES:
- DO NOT change the character’s face, identity, species, clothing, fur, armor, or colors.
- DO NOT redesign the character.
- DO NOT alter body proportions.
- DO NOT crop the subject.

BACKGROUND:
- Keep the background simple and neutral.

GOAL:
Create a clean jumping animation frame suitable for a 2D side-scrolling sprite sheet while preserving the character’s appearance and personality.
"""

