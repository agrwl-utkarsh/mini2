import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('assets', exist_ok=True)

# Helper to get font
def get_font(size, bold=False):
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

# 1. Image for Slide 2: Jargon vs Clarity Comparison
def make_problem_image():
    w, h = 900, 520
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Left card: Confusing Raw Readme
    draw.rounded_rectangle([20, 20, 430, 500], radius=16, fill=(249, 250, 251), outline=(229, 231, 235), width=2)
    # Badge
    draw.rounded_rectangle([44, 44, 230, 78], radius=6, fill=(254, 226, 226), outline=(252, 165, 165), width=1)
    draw.text((56, 52), "CONFUSING & DENSE", font=get_font(14, True), fill=(185, 28, 28))
    draw.text((44, 100), "Standard GitHub Project", font=get_font(20, True), fill=(17, 24, 39))
    
    # Terminal-like mock
    draw.rounded_rectangle([44, 140, 406, 240], radius=8, fill=(30, 41, 59))
    draw.text((58, 155), "$ npm i -g @core/engine-v4", font=get_font(13), fill=(148, 163, 184))
    draw.text((58, 180), "$ export RPC_PORT=9092", font=get_font(13), fill=(148, 163, 184))
    draw.text((58, 205), "$ yarn run build --target=wasm", font=get_font(13), fill=(148, 163, 184))

    draw.text((44, 260), "Common Frustrations:", font=get_font(15, True), fill=(55, 65, 81))
    draw.text((44, 295), "• Heavy technical jargon with no context", font=get_font(14), fill=(107, 114, 128))
    draw.text((44, 330), "• Assumes 10 years of prior experience", font=get_font(14), fill=(107, 114, 128))
    draw.text((44, 365), "• Endless command lists before explaining 'Why'", font=get_font(14), fill=(107, 114, 128))
    draw.text((44, 400), "• Readers give up and close the tab", font=get_font(14), fill=(107, 114, 128))

    # Right card: Friendly Mentor Explainer
    draw.rounded_rectangle([470, 20, 880, 500], radius=16, fill=(239, 246, 255), outline=(191, 219, 254), width=2)
    draw.rounded_rectangle([494, 44, 690, 78], radius=6, fill=(219, 234, 254), outline=(147, 197, 253), width=1)
    draw.text((506, 52), "CLEAR & CONVERSATIONAL", font=get_font(14, True), fill=(29, 78, 216))
    draw.text((494, 100), "Our Explainer Approach", font=get_font(20, True), fill=(17, 24, 39))

    # Mentor quote bubble
    draw.rounded_rectangle([494, 140, 856, 270], radius=10, fill=(255, 255, 255), outline=(219, 234, 254), width=1)
    draw.text((510, 155), "\"Imagine you have a big team where everyone", font=get_font(14), fill=(30, 58, 138))
    draw.text((510, 180), "needs to write notes on the same whiteboard.", font=get_font(14), fill=(30, 58, 138))
    draw.text((510, 205), "Instead of whispering in a long line, this tool", font=get_font(14), fill=(30, 58, 138))
    draw.text((510, 230), "gives everyone a live copy of the board...\"", font=get_font(14), fill=(30, 58, 138))

    draw.text((494, 295), "Why People Love It:", font=get_font(15, True), fill=(30, 58, 138))
    draw.text((494, 330), "• Friendly analogies anyone can picture", font=get_font(14), fill=(37, 99, 235))
    draw.text((494, 365), "• Answers what it does in 30 seconds", font=get_font(14), fill=(37, 99, 235))
    draw.text((494, 400), "• Builds confidence for students & teams", font=get_font(14), fill=(37, 99, 235))

    img.save('assets/diagram_problem.png', quality=95)

# 2. Image for Slide 3: 3 Simple Steps for Users
def make_solution_image():
    w, h = 900, 480
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    step_w = 260
    gap = 35
    for i, (num, title, sub, icon_bg) in enumerate([
        ("1", "Paste Any Link", "Just copy the web link of any GitHub code project and paste it in the box.", (37, 99, 235)),
        ("2", "AI Does The Reading", "Our system grabs the documents and reads hundreds of lines of code in seconds.", (59, 130, 246)),
        ("3", "Read Like a Story", "Get a friendly, easy breakdown written in plain language like a helpful teammate.", (16, 185, 129))
    ]):
        x = 25 + i * (step_w + gap)
        draw.rounded_rectangle([x, 40, x + step_w, 440], radius=14, fill=(249, 250, 251), outline=(229, 231, 235), width=2)
        # Circle badge
        draw.ellipse([x + 105, 70, x + 155, 120], fill=icon_bg)
        draw.text((x + 122, 82), num, font=get_font(22, True), fill=(255, 255, 255))
        # Title
        draw.text((x + 25, 160), title, font=get_font(18, True), fill=(17, 24, 39))
        # Divider
        draw.line([x + 25, 195, x + 85, 195], fill=(37, 99, 235), width=3)
        # Description
        words = sub.split()
        lines = []
        cur = []
        for word in words:
            cur.append(word)
            if len(" ".join(cur)) > 24:
                lines.append(" ".join(cur[:-1]))
                cur = [word]
        if cur:
            lines.append(" ".join(cur))
        
        y_text = 220
        for line in lines:
            draw.text((x + 25, y_text), line, font=get_font(14), fill=(75, 85, 99))
            y_text += 26

    # Arrows between cards
    draw.polygon([(295, 240), (310, 230), (310, 250)], fill=(147, 197, 253))
    draw.polygon([(590, 240), (605, 230), (605, 250)], fill=(147, 197, 253))

    img.save('assets/diagram_steps.png', quality=95)

# 3. Image for Slide 4: Simple System Journey (How it Works)
def make_journey_image():
    w, h = 900, 480
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # 4 blocks in horizontal line
    blocks = [
        ("Your Web Browser", "You paste the GitHub link\nor click a popular example.", (239, 246, 255), (37, 99, 235)),
        ("Secure Cloud Server", "Safely handles your request\nwithout storing personal data.", (249, 250, 251), (75, 85, 99)),
        ("GitHub Project Files", "Finds the project overview\nand documentation files.", (249, 250, 251), (75, 85, 99)),
        ("Smart AI Mentor", "Translates all technical files\ninto plain, clear English.", (236, 253, 245), (5, 150, 105))
    ]

    for i, (btitle, bdesc, bcolor, btext_c) in enumerate(blocks):
        x = 30 + i * 215
        draw.rounded_rectangle([x, 90, x + 195, 390], radius=12, fill=bcolor, outline=(229, 231, 235), width=2)
        # Number header
        draw.rounded_rectangle([x + 20, 115, x + 70, 145], radius=6, fill=btext_c)
        draw.text((x + 30, 120), f"0{i+1}", font=get_font(14, True), fill=(255, 255, 255))
        # Title
        draw.text((x + 20, 175), btitle.replace(" ", "\n"), font=get_font(17, True), fill=(17, 24, 39))
        # Desc
        y_d = 260
        for line in bdesc.split("\n"):
            draw.text((x + 20, y_d), line, font=get_font(13), fill=(107, 114, 128))
            y_d += 24

        # Arrow to next
        if i < 3:
            ax = x + 198
            draw.line([ax + 2, 240, ax + 14, 240], fill=(147, 197, 253), width=3)

    img.save('assets/diagram_journey.png', quality=95)

# 4. Image for Slide 5: Backup System (Always Works)
def make_backup_image():
    w, h = 900, 480
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    draw.text((40, 30), "The 5-Tier Safety Net: If one helper is busy, the next steps in automatically", font=get_font(15, True), fill=(75, 85, 99))

    helpers = [
        ("Helper 1: xAI Grok", "Fast, conversational first choice", "Active First", (37, 99, 235)),
        ("Helper 2: Google Gemini", "Deep analysis & strong comprehension", "Instant Backup 1", (59, 130, 246)),
        ("Helper 3: DeepSeek", "Smart technical breakdown engine", "Instant Backup 2", (59, 130, 246)),
        ("Helper 4: OpenRouter", "Access to multiple open models", "Free Community Pool", (107, 114, 128)),
        ("Helper 5: Hugging Face", "Open-source AI backup system", "Final AI Check", (107, 114, 128)),
        ("Safety Net: Clean Text", "Shows original overview with notes", "100% Never Fails", (16, 185, 129))
    ]

    for i, (name, role, status, col) in enumerate(helpers):
        y = 75 + i * 64
        draw.rounded_rectangle([40, y, 860, y + 54], radius=8, fill=(249, 250, 251), outline=(229, 231, 235), width=1)
        # Indicator bar
        draw.rounded_rectangle([40, y, 48, y + 54], radius=4, fill=col)
        # Name
        draw.text((65, y + 16), name, font=get_font(15, True), fill=(17, 24, 39))
        # Role
        draw.text((340, y + 18), role, font=get_font(13), fill=(107, 114, 128))
        # Status pill
        draw.rounded_rectangle([680, y + 12, 840, y + 42], radius=15, fill=(239, 246, 255) if i < 3 else (243, 244, 246))
        draw.text((700, y + 18), status, font=get_font(12, True), fill=col)

    img.save('assets/diagram_backup.png', quality=95)

# 5. Image for Slide 6: Teaching Recipe
def make_teaching_image():
    w, h = 900, 480
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # 4 core ingredients of good explanation
    cards = [
        ("1. Real-World Problem", "Starts with the human frustration:\n'Have you ever struggled to share data...?'", (239, 246, 255), (37, 99, 235)),
        ("2. Everyday Analogy", "Compares code to everyday life:\n'Think of it like a shared office whiteboard...'", (240, 253, 244), (22, 163, 74)),
        ("3. Practical Use Cases", "Explains who actually needs it:\n'Best for online stores, login forms, or blogs.'", (255, 251, 235), (202, 138, 4)),
        ("4. Quick Start Guide", "Simple instructions without panic:\n'Install it in 2 minutes, plug it in, and go.'", (245, 243, 255), (124, 58, 237))
    ]

    for i, (ctitle, cdesc, cbg, ccol) in enumerate(cards):
        col_idx = i % 2
        row_idx = i // 2
        x = 40 + col_idx * 420
        y = 40 + row_idx * 210

        draw.rounded_rectangle([x, y, x + 395, y + 185], radius=12, fill=cbg, outline=(229, 231, 235), width=1)
        draw.text((x + 24, y + 24), ctitle, font=get_font(18, True), fill=ccol)
        draw.line([x + 24, y + 58, x + 80, y + 58], fill=ccol, width=2)
        
        y_sub = y + 80
        for line in cdesc.split("\n"):
            draw.text((x + 24, y_sub), line, font=get_font(14), fill=(55, 65, 81))
            y_sub += 26

    img.save('assets/diagram_teaching.png', quality=95)

# 6. Image for Slide 9: Future Roadmap
def make_roadmap_image():
    w, h = 900, 480
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    features = [
        ("Current", "Plain-English Explainer", "Available Now", "Instantly turns complex repository READMEs into friendly 5-paragraph breakdowns.", (37, 99, 235)),
        ("Next Up", "Visual Flow Diagrams", "In Progress", "Draws interactive diagrams showing how different parts of the project connect.", (16, 185, 129)),
        ("Upcoming", "Project AI Chatbot", "Planned", "Ask direct questions like: 'How do I change the website color in this project?'", (245, 158, 11)),
        ("Vision", "Interactive Code Explorer", "Planned", "Click through code files with side-by-side notes explaining every line.", (139, 92, 246))
    ]

    for i, (phase, ftitle, fstatus, fdesc, fcol) in enumerate(features):
        y = 35 + i * 105
        draw.rounded_rectangle([40, y, 860, y + 90], radius=10, fill=(249, 250, 251), outline=(229, 231, 235), width=1)
        # Left tag
        draw.rounded_rectangle([55, y + 20, 160, y + 50], radius=6, fill=fcol)
        draw.text((70, y + 26), phase.upper(), font=get_font(12, True), fill=(255, 255, 255))
        # Title
        draw.text((185, y + 20), ftitle, font=get_font(17, True), fill=(17, 24, 39))
        # Status
        draw.text((185, y + 50), fstatus, font=get_font(13, True), fill=fcol)
        # Description
        draw.text((420, y + 32), fdesc, font=get_font(13), fill=(107, 114, 128))

    img.save('assets/diagram_roadmap.png', quality=95)

if __name__ == '__main__':
    make_problem_image()
    make_solution_image()
    make_journey_image()
    make_backup_image()
    make_teaching_image()
    make_roadmap_image()
    print("All diagrams generated successfully.")
