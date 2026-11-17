import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('assets', exist_ok=True)

def get_font(size, bold=False):
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

# 1. Slide 2 Image: The Day-One Shock of Thousands of Lines of Code
def make_slide2_image():
    w, h = 900, 500
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Left box: Overwhelmed New Engineer Reality
    draw.rounded_rectangle([20, 20, 430, 480], radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
    # Badge
    draw.rounded_rectangle([44, 44, 250, 78], radius=6, fill=(254, 226, 226), outline=(252, 165, 165), width=1)
    draw.text((56, 52), "DAY-ONE REALITY", font=get_font(13, True), fill=(185, 28, 28))
    draw.text((44, 98), "Tackling 50,000+ Lines", font=get_font(20, True), fill=(15, 23, 42))

    # File tree representation
    draw.rounded_rectangle([44, 140, 406, 250], radius=8, fill=(30, 41, 59))
    draw.text((58, 155), "📁 src/controllers/dispatcher.ts (4,200 lines)", font=get_font(12), fill=(203, 213, 225))
    draw.text((58, 178), "📁 src/core/engine/lifecycle.rs (12,850 lines)", font=get_font(12), fill=(203, 213, 225))
    draw.text((58, 201), "📁 config/protocols/middleware.yaml", font=get_font(12), fill=(203, 213, 225))
    draw.text((58, 224), "📁 ... and 480 more nested files", font=get_font(12), fill=(148, 163, 184))

    draw.text((44, 275), "What Beginners Experience:", font=get_font(15, True), fill=(51, 65, 85))
    draw.text((44, 308), "• Staring at the screen with no mental map", font=get_font(13.5), fill=(100, 116, 139))
    draw.text((44, 340), "• Fear of asking 'stupid' questions to seniors", font=get_font(13.5), fill=(100, 116, 139))
    draw.text((44, 372), "• Trying to hold complex logic in memory", font=get_font(13.5), fill=(100, 116, 139))
    draw.text((44, 404), "• Imposter syndrome before writing one line", font=get_font(13.5), fill=(100, 116, 139))

    # Right box: The Onboarding Barrier
    draw.rounded_rectangle([470, 20, 880, 480], radius=16, fill=(239, 246, 255), outline=(191, 219, 254), width=2)
    draw.rounded_rectangle([494, 44, 710, 78], radius=6, fill=(219, 234, 254), outline=(147, 197, 253), width=1)
    draw.text((506, 52), "THE LEARNING CLIFF", font=get_font(13, True), fill=(29, 78, 216))
    draw.text((494, 98), "The Cost of Lost Time", font=get_font(20, True), fill=(15, 23, 42))

    # Big metric callouts
    draw.rounded_rectangle([494, 140, 856, 230], radius=10, fill=(255, 255, 255), outline=(219, 234, 254), width=1)
    draw.text((514, 155), "Weeks Spent Deciphering Code", font=get_font(18, True), fill=(37, 99, 235))
    draw.text((514, 188), "Instead of learning and contributing, developers spend weeks", font=get_font(13), fill=(100, 116, 139))
    draw.text((514, 206), "just figuring out where execution starts and stops.", font=get_font(13), fill=(100, 116, 139))

    draw.text((494, 260), "Why Existing Docs Don't Help:", font=get_font(15, True), fill=(30, 58, 138))
    draw.text((494, 295), "• Written by creators who already know everything", font=get_font(13.5), fill=(37, 99, 235))
    draw.text((494, 327), "• Only list raw terminal commands, not concepts", font=get_font(13.5), fill=(37, 99, 235))
    draw.text((494, 359), "• Assumes 10 years of prior framework knowledge", font=get_font(13.5), fill=(37, 99, 235))
    draw.text((494, 391), "• Leaves junior engineers completely stranded", font=get_font(13.5), fill=(37, 99, 235))

    img.save('assets/slide2_problem.png', quality=95)

# 2. Slide 3 Image: An On-Demand Senior Mentor
def make_slide3_image():
    w, h = 900, 480
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    step_w = 260
    gap = 35
    items = [
        ("Step 1: Just A Link", "No cloning, no environment setup, no dependencies. Copy any GitHub URL.", (37, 99, 235)),
        ("Step 2: Senior Mentor Walkthrough", "Translates thousands of lines of logic into clear concepts and real-world 'Why'.", (59, 130, 246)),
        ("Step 3: Confident Beginner", "Understands the big picture in 60 seconds and knows exactly what to do next.", (16, 185, 129))
    ]

    for i, (title, sub, col) in enumerate(items):
        x = 25 + i * (step_w + gap)
        draw.rounded_rectangle([x, 35, x + step_w, 445], radius=14, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
        # Circle badge
        draw.ellipse([x + 105, 65, x + 155, 115], fill=col)
        draw.text((x + 122, 77), str(i + 1), font=get_font(20, True), fill=(255, 255, 255))
        # Title
        draw.text((x + 20, 150), title.split(":")[0], font=get_font(13, True), fill=col)
        draw.text((x + 20, 172), title.split(":")[1].strip(), font=get_font(17, True), fill=(15, 23, 42))
        draw.line([x + 20, 215, x + 70, 215], fill=col, width=3)
        # Sub
        y_t = 240
        words = sub.split()
        cur = []
        for w_word in words:
            cur.append(w_word)
            if len(" ".join(cur)) > 23:
                draw.text((x + 20, y_t), " ".join(cur[:-1]), font=get_font(13.5), fill=(71, 85, 105))
                y_t += 25
                cur = [w_word]
        if cur:
            draw.text((x + 20, y_t), " ".join(cur), font=get_font(13.5), fill=(71, 85, 105))

    # Connector arrows
    draw.polygon([(295, 240), (312, 230), (312, 250)], fill=(147, 197, 253))
    draw.polygon([(590, 240), (607, 230), (607, 250)], fill=(147, 197, 253))

    img.save('assets/slide3_solution.png', quality=95)

# 3. Slide 4 Image: Code Translation Process
def make_slide4_image():
    w, h = 900, 480
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    blocks = [
        ("1. The 'Why' First", "Starts with the human frustration:\n'Imagine you're trying to share data across 5 pages...'", (239, 246, 255), (37, 99, 235)),
        ("2. Everyday Analogies", "Uses familiar mental models:\n'It's like an office whiteboard where everyone sees updates instantly.'", (240, 253, 244), (22, 163, 74)),
        ("3. Instant Jargon Relief", "Defines hard words on the spot:\n'API simply means a digital doorway for two apps to talk.'", (255, 251, 235), (202, 138, 4)),
        ("4. Gentle First Steps", "Removes setup panic:\n'Install it in 2 minutes, wrap your main screen, and you're ready.'", (245, 243, 255), (124, 58, 237))
    ]

    for i, (btitle, bdesc, bbg, bcol) in enumerate(blocks):
        col_idx = i % 2
        row_idx = i // 2
        x = 35 + col_idx * 425
        y = 35 + row_idx * 215

        draw.rounded_rectangle([x, y, x + 400, y + 195], radius=14, fill=bbg, outline=(226, 232, 240), width=1)
        draw.text((x + 24, y + 24), btitle, font=get_font(18, True), fill=bcol)
        draw.line([x + 24, y + 58, x + 80, y + 58], fill=bcol, width=2)
        
        y_sub = y + 80
        for line in bdesc.split("\n"):
            draw.text((x + 24, y_sub), line, font=get_font(14), fill=(51, 65, 85))
            y_sub += 26

    img.save('assets/slide4_concept.png', quality=95)

# 4. Slide 5 Image: Transformation in 60 Seconds
def make_slide5_image():
    w, h = 900, 480
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle([30, 30, 870, 450], radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=2)

    # Header bar
    draw.rounded_rectangle([50, 50, 850, 100], radius=8, fill=(255, 255, 255), outline=(203, 213, 225), width=1)
    draw.text((70, 68), "🔗 https://github.com/facebook/react", font=get_font(14), fill=(100, 116, 139))
    draw.rounded_rectangle([680, 58, 835, 92], radius=6, fill=(37, 99, 235))
    draw.text((700, 66), "Explain This Repo", font=get_font(13, True), fill=(255, 255, 255))

    # Narrative card preview
    draw.rounded_rectangle([50, 120, 850, 425], radius=10, fill=(255, 255, 255), outline=(219, 234, 254), width=1)
    draw.text((75, 140), "WHAT THIS PROJECT DOES (IN PLAIN ENGLISH)", font=get_font(12, True), fill=(37, 99, 235))
    
    sample_text = [
        "Imagine you are building a website and you keep having to write code that manually rewrites",
        "the screen whenever a user clicks a button. It gets messy fast. That's the frustration React solves.",
        "Instead of rewriting whole pages, you build small, reusable LEGO blocks called components.",
        "When data changes, React figures out the tiny piece that changed and updates only that spot.",
        "Getting started takes two minutes, and it gives you the foundation used by millions of apps."
    ]
    y_p = 175
    for line in sample_text:
        draw.text((75, y_p), line, font=get_font(14), fill=(51, 65, 85))
        y_p += 28

    # Value tags at the bottom
    tags = [("✓ 0 Lines of Code to Read", (239, 246, 255), (37, 99, 235)),
            ("✓ Understands the 'Why'", (240, 253, 244), (22, 163, 74)),
            ("✓ Ready for Team Discussion", (245, 243, 255), (124, 58, 237))]
    for i, (tag_t, tag_bg, tag_col) in enumerate(tags):
        tx = 75 + i * 250
        draw.rounded_rectangle([tx, 355, tx + 230, 395], radius=6, fill=tag_bg)
        draw.text((tx + 18, 368), tag_t, font=get_font(12, True), fill=tag_col)

    img.save('assets/slide5_experience.png', quality=95)

if __name__ == '__main__':
    make_slide2_image()
    make_slide3_image()
    make_slide4_image()
    make_slide5_image()
    print("Generated 5-slide preview images successfully.")
