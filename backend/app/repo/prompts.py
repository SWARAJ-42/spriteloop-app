POSE_PROMPT_RUNNING = """
You are an expert 2D sprite artist and animator. Your task is to repose the given character into a RUNNING animation frame.

STEP 1 — READ THE CHARACTER:
Before posing, study the image carefully and identify:
- What type of character is this? (human, zombie, robot, animal, monster, ghost, etc.)
- What is their natural movement style? (shambling, mechanical, feral, graceful, etc.)
- What equipment or items are they holding or wearing?
- What are their unique physical traits? (extra limbs, unusual proportions, floating parts, etc.)

STEP 2 — DEFINE THEIR RUNNING STYLE:
Apply a running pose that feels TRUE to this character's nature:
- Human warrior → athletic stride, forward lean, controlled arm swing
- Zombie → hunched lurching run, dragging or stiff limbs or horizontal limbs if input image seems, uneven gait
- Robot → mechanical stride, rigid joints, limited arm swing
- Animal / creature → species-appropriate gallop or lope
- Ghost / floater → fast glide or drift, minimal limb movement
- Any other character → use visual logic and lore knowledge to determine how THEY would run

The pose must feel like THIS character running — not a generic human running.

STEP 3 — APPLY THE POSE:

VIEW:
- TRUE SIDE PROFILE (pure 90°). No 3/4 view, no rotation.
- Character faces RIGHT (moving left → right).
- Full body visible. No cropping.

RUNNING MOTION:
- Clear mid-stride: one leg forward, one back.
- Forward lean appropriate to character type.
- Motion must be immediately readable as running.
- Reflect the character's personality in the motion (aggressive, shambling, graceful, etc.).

ARMS / HANDS:
- Arms move opposite to legs (or use character-appropriate arm behavior).
- If holding equipment: KEEP grip exact. Adjust pose around the equipment — never hide or drop it.

EQUIPMENT (NON-NEGOTIABLE):
- ALL held or worn equipment must remain FULLY VISIBLE.
- Do NOT hide behind the body, crop, merge with limbs, or obscure in any way.
- If a limb would overlap equipment → adjust the limb, not the equipment.
- Preserve original size, shape, and orientation of all equipment.
- Equipment visibility always takes priority over pose perfection.

PRESERVE EXACTLY:
- Face, colors, outfit, proportions, and all design details.
- Do not add or remove any elements.

COMPOSITION:
- Clean, readable silhouette with no merged limbs or equipment.
- White background.

GOAL:
A polished side-view running frame that looks and feels natural for THIS specific character, with all equipment fully visible and unobstructed.
"""


POSE_PROMPT_WALKING = """
You are an expert 2D sprite artist and animator. Your task is to repose the given character into a WALKING animation frame.

STEP 1 — READ THE CHARACTER:
Before posing, study the image carefully and identify:
- What type of character is this? (human, zombie, robot, animal, monster, ghost, etc.)
- What is their natural movement style? (casual, stiff, predatory, plodding, floating, etc.)
- What equipment or items are they holding or wearing?
- What are their unique physical traits? (extra limbs, unusual proportions, floating parts, etc.)

STEP 2 — DEFINE THEIR WALKING STYLE:
Apply a walking pose that feels TRUE to this character's nature:
- Human → relaxed, upright stride with gentle arm swing
- Zombie → slow shamble, hunched, dragging one foot, arms loosely forward horizontal also should be based on input image like hozizontal stiff arm if shown
- Robot → measured mechanical steps, limited joint flex
- Animal / creature → species-appropriate natural gait
- Ghost / floater → slow glide or drift, body mostly still
- Any other character → use visual logic and lore knowledge to determine how THEY would walk

The pose must feel like THIS character walking — not a generic human walking.

STEP 3 — APPLY THE POSE:

VIEW:
- TRUE SIDE PROFILE (pure 90°). No 3/4 view, no rotation.
- Character faces RIGHT (moving left → right).
- Full body visible. No cropping.

WALKING MOTION:
- Clear relaxed stride: one leg forward, one slightly back.
- Torso mostly upright (adjust for character type).
- Motion is calm and readable — notably slower and more relaxed than running.
- Reflect the character's personality in the motion.

ARMS / HANDS:
- Relaxed swing opposite to legs (or character-appropriate arm behavior).
- If holding equipment: KEEP grip exact. Adjust pose around the equipment — never hide or drop it.

EQUIPMENT (NON-NEGOTIABLE):
- ALL held or worn equipment must remain FULLY VISIBLE.
- Do NOT hide behind the body, crop, merge with limbs, or obscure in any way.
- If a limb would overlap equipment → adjust the limb, not the equipment.
- Preserve original size, shape, and orientation of all equipment.
- Equipment visibility always takes priority over pose perfection.

PRESERVE EXACTLY:
- Face, colors, outfit, proportions, and all design details.
- Do not add or remove any elements.

COMPOSITION:
- Clean, readable silhouette with no merged limbs or equipment.
- White background.

GOAL:
A polished side-view walking frame that looks and feels natural for THIS specific character, with all equipment fully visible and unobstructed.
"""


POSE_PROMPT_IDLE = """
You are an expert 2D sprite artist and animator. Your task is to repose the given character into a natural IDLE / RESTING pose.

STEP 1 — READ THE CHARACTER:
Before posing, study the image carefully and identify:
- What type of character is this? (human, zombie, robot, animal, monster, ghost, etc.)
- What does "at rest" look like for this character? (standing alert, slouched, hovering, crouching, etc.)
- What equipment or items are they holding or wearing?
- What are their unique physical traits? (extra limbs, unusual proportions, floating parts, etc.)

STEP 2 — DEFINE THEIR IDLE STYLE:
Apply a resting pose that feels TRUE to this character's nature:
- Human warrior → upright, composed, weapon held ready at side
- Zombie → slumped, head dropped, arms hanging loosely
- Robot → rigid stand-by posture, arms close to body
- Animal / creature → natural resting stance with all limbs grounded
- Ghost / floater → hovering slightly, calm drift
- Any other character → use visual logic and lore knowledge to determine their natural resting state

The pose must feel like THIS character at rest — not a generic human standing.

STEP 3 — APPLY THE POSE:

VIEW:
- Neutral front-facing or very slight 3/4 view. No extreme angles.
- Full body visible. No cropping.
- Character centered and clearly readable.

IDLE POSE:
- Calm, balanced, grounded stance (or hover for floaters).
- No action, tension, or motion.
- Reflect the character's personality — a zombie looks dead even standing still; a knight looks composed.

ARMS / LIMBS:
- Relaxed and natural for this character type.
- No tension, no motion blur, no action position.
- If holding equipment: KEEP grip exact. Arms rest naturally around it.

EQUIPMENT (NON-NEGOTIABLE):
- ALL held or worn equipment must remain FULLY VISIBLE.
- Do NOT hide behind the body, crop, merge with limbs, or obscure in any way.
- If a limb would overlap equipment → adjust the limb, not the equipment.
- Preserve original size, shape, and orientation of all equipment.
- Equipment visibility always takes priority over pose perfection.

PRESERVE EXACTLY:
- Face, colors, outfit, proportions, and all design details.
- Do not add or remove any elements.

COMPOSITION:
- Clean, readable silhouette with no merged limbs or equipment.
- White background.

GOAL:
A clean, natural idle pose that captures who this character IS at rest, with all equipment fully visible and unobstructed.
"""


POSE_PROMPT_JUMPING = """
You are an expert 2D sprite artist and animator. Your task is to repose the given character into a JUMPING animation frame.

STEP 1 — READ THE CHARACTER:
Before posing, study the image carefully and identify:
- What type of character is this? (human, zombie, robot, animal, monster, ghost, etc.)
- What would a jump or leap look like for this character? (athletic, stiff, feral, floating, etc.)
- What equipment or items are they holding or wearing?
- What are their unique physical traits? (extra limbs, unusual proportions, floating parts, etc.)

STEP 2 — DEFINE THEIR JUMPING STYLE:
Apply a jump pose that feels TRUE to this character's nature:
- Human warrior → powerful athletic leap, legs tucked or extended, controlled
- Zombie → awkward lurch upward, stiff or flailing limbs, uncoordinated
- Robot → rigid mechanical jump, minimal bend, precise
- Animal / creature → species-appropriate mid-leap, natural arc
- Ghost / floater → dramatic upward surge or ascent, minimal limb change
- Any other character → use visual logic and lore knowledge to determine how THEY would jump

The pose must feel like THIS character jumping — not a generic human jump.

STEP 3 — APPLY THE POSE:

VIEW:
- TRUE SIDE PROFILE (pure 90°). No 3/4 view, no rotation.
- Character faces RIGHT.
- Full body visible. No cropping.

JUMPING MOTION:
- Clearly airborne — fully off the ground.
- Legs bent or extended in a way natural to this character.
- Upward energy must be readable at a glance.
- Avoid stiff or symmetrical limb placement.

ARMS / HANDS:
- Move naturally for balance and character personality.
- If holding equipment: KEEP grip exact. Adjust pose around the equipment — never hide or drop it.

EQUIPMENT (NON-NEGOTIABLE):
- ALL held or worn equipment must remain FULLY VISIBLE.
- Do NOT hide behind the body, crop, merge with limbs, or obscure in any way.
- If a limb would overlap equipment → adjust the limb, not the equipment.
- Preserve original size, shape, and orientation of all equipment.
- Equipment visibility always takes priority over pose perfection.

PRESERVE EXACTLY:
- Face, colors, outfit, proportions, and all design details.
- Do not add or remove any elements.

COMPOSITION:
- Clean, readable silhouette with no merged limbs or equipment.
- White background.

GOAL:
A polished side-view jump frame that looks and feels natural for THIS specific character, with all equipment fully visible and unobstructed.
"""