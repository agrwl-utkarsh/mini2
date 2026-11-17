import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # White theme with clean blue accents
    c_white = RGBColor(255, 255, 255)
    c_card_bg = RGBColor(249, 250, 251)
    c_card_blue = RGBColor(239, 246, 255)
    c_border = RGBColor(226, 232, 240)
    c_border_blue = RGBColor(191, 219, 254)
    c_text_dark = RGBColor(15, 23, 42)
    c_text_muted = RGBColor(51, 65, 85)
    c_text_soft = RGBColor(100, 116, 139)
    c_blue_primary = RGBColor(37, 99, 235)

    def add_header(slide, tag, title, subtitle):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.48), Inches(11.733), Inches(1.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p_tag = tf.paragraphs[0]
        p_tag.text = tag.upper()
        p_tag.font.name = 'Arial'
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = c_blue_primary
        p_tag.space_after = Pt(4)

        p_title = tf.add_paragraph()
        p_title.text = title
        p_title.font.name = 'Arial'
        p_title.font.size = Pt(23)
        p_title.font.bold = True
        p_title.font.color.rgb = c_text_dark
        p_title.space_after = Pt(4)

        if subtitle:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle
            p_sub.font.name = 'Arial'
            p_sub.font.size = Pt(12)
            p_sub.font.color.rgb = c_text_muted

    def add_footer(slide, current_num, total_num=10, note=""):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(6.82), Inches(10.0), Inches(0.35))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"{note} · GitHub Repo Explainer" if note else "GitHub Repo Explainer"
        p.font.name = 'Arial'
        p.font.size = Pt(9.5)
        p.font.color.rgb = c_text_soft

        tb_num = slide.shapes.add_textbox(Inches(11.0), Inches(6.82), Inches(1.533), Inches(0.35))
        tf_num = tb_num.text_frame
        tf_num.word_wrap = True
        tf_num.margin_left = tf_num.margin_top = tf_num.margin_right = tf_num.margin_bottom = 0
        p_num = tf_num.paragraphs[0]
        p_num.alignment = PP_ALIGN.RIGHT
        p_num.text = f"Slide {current_num:02d} of {total_num:02d}"
        p_num.font.name = 'Arial'
        p_num.font.bold = True
        p_num.font.size = Pt(9.5)
        p_num.font.color.rgb = c_blue_primary

    def create_card(slide, left, top, width, height, label, title, text, blue_accent=False):
        shape = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(left), Inches(top), Inches(width), Inches(height)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = c_card_blue if blue_accent else c_card_bg
        shape.line.color.rgb = c_border_blue if blue_accent else c_border
        shape.line.width = Pt(1)

        tb = slide.shapes.add_textbox(
            Inches(left + 0.22), Inches(top + 0.22), Inches(width - 0.44), Inches(height - 0.44)
        )
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        if label:
            p_lbl = tf.paragraphs[0]
            p_lbl.text = label.upper()
            p_lbl.font.name = 'Arial'
            p_lbl.font.size = Pt(9)
            p_lbl.font.bold = True
            p_lbl.font.color.rgb = c_blue_primary
            p_lbl.space_after = Pt(4)
            p_t = tf.add_paragraph()
        else:
            p_t = tf.paragraphs[0]

        p_t.text = title
        p_t.font.name = 'Arial'
        p_t.font.size = Pt(14)
        p_t.font.bold = True
        p_t.font.color.rgb = c_text_dark
        p_t.space_after = Pt(6)

        if text:
            p_b = tf.add_paragraph()
            p_b.text = text
            p_b.font.name = 'Arial'
            p_b.font.size = Pt(11)
            p_b.font.color.rgb = c_text_muted

    def add_image_box(slide, left, top, width, height, image_path):
        if os.path.exists(image_path):
            slide.shapes.add_picture(image_path, Inches(left), Inches(top), Inches(width), Inches(height))

    # --- SLIDE 1: INTRODUCTORY SLIDE (Slide 1 of 10) ---
    s1 = prs.slides.add_slide(blank_layout)
    add_header(s1, "Welcome & Introduction", "GitHub Repo Explainer",
               "A simple, friendly tool that turns complicated computer code projects into clear, everyday English anyone can understand.")
    create_card(s1, 0.8, 2.15, 3.65, 4.35, "What It Is", "A Helpful Guide for Curious People",
                "Think of it like having an experienced, patient friend sitting right next to you, explaining what a software project does without confusing words.", blue_accent=True)
    create_card(s1, 4.84, 2.15, 3.65, 4.35, "How You Use It", "Just Paste a Link",
                "No accounts to create, no software to download, and no coding knowledge needed. Just copy a project link, paste it in, and click one button.")
    create_card(s1, 8.88, 2.15, 3.65, 4.35, "Why It's Special", "Reliable & Always Ready",
                "Backed by 5 smart helpers working behind the scenes. If one helper is busy or down, another steps in instantly so you never see an error screen.")
    add_footer(s1, 1, note="Introductory Overview")

    # --- SLIDE 2: EXPLANATION 1 — The Problem ---
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "The Problem We Solve", "Why Looking at Code Projects is Frustrating",
               "Most software pages are written by technical experts for other experts, leaving students, beginners, and teammates lost.")
    add_image_box(s2, 0.8, 2.1, 6.2, 4.4, "assets/diagram_problem.png")
    create_card(s2, 7.25, 2.1, 5.28, 4.4, "The Core Frustration", "Information Overload & Jargon",
                "• Too much jargon: Words like 'RPC', 'middleware', and 'WASM' without definitions.\n\n"
                "• Skips the big picture: Jumps straight into 50 installation commands without explaining what the app does.\n\n"
                "• Intimidating to read: Leaves curious learners and non-technical stakeholders feeling excluded.\n\n"
                "• Our Solution: We strip away the noise and explain the project conceptually first.", blue_accent=True)
    add_footer(s2, 2, note="Explanation 1 of 8: The Problem Space")

    # --- SLIDE 3: EXPLANATION 2 — How to use it ---
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "How It Works For You", "Three Effortless Steps: From Link to Understanding",
               "Anyone can use the tool in less than 10 seconds. You don't need any special technical skills or account sign-ups.")
    add_image_box(s3, 0.8, 2.1, 11.733, 4.4, "assets/diagram_steps.png")
    add_footer(s3, 3, note="Explanation 2 of 8: User Journey")

    # --- SLIDE 4: EXPLANATION 3 — Behind the scenes ---
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Behind The Scenes", "What Happens When You Click 'Explain'",
               "A quick, quiet relay race takes place across four simple stations to deliver your friendly explanation in under two seconds.")
    add_image_box(s4, 0.8, 2.1, 11.733, 4.4, "assets/diagram_journey.png")
    add_footer(s4, 4, note="Explanation 3 of 8: System Journey")

    # --- SLIDE 5: EXPLANATION 4 — 5-Tier Safety Net ---
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Reliability Feature", "Our 5-Tier Backup Team: Built to Never Break",
               "Online services sometimes go down or get overloaded. We built an automatic safety net so you will never see an empty error screen.")
    add_image_box(s5, 0.8, 2.1, 6.4, 4.4, "assets/diagram_backup.png")
    create_card(s5, 7.45, 2.1, 5.08, 4.4, "How Hand-off Works", "Like an Olympic Relay Team",
                "If our primary AI helper is busy, resting, or hits a rate limit, your request is passed to the next helper in a fraction of a second:\n\n"
                "1. Tier 1: Fast, conversational xAI Grok\n"
                "2. Tiers 2 & 3: Google Gemini & DeepSeek\n"
                "3. Tiers 4 & 5: Free community model networks\n\n"
                "Ultimate Safety Net: Clean document text preview with diagnostic notes so you always get immediate value.", blue_accent=True)
    add_footer(s5, 5, note="Explanation 4 of 8: Multi-Tier Reliability")

    # --- SLIDE 6: EXPLANATION 5 — Teaching Recipe ---
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "Quality & Tone", "The Teaching Recipe: How We Keep It Friendly",
               "We don't just summarize; we teach. Strict rules make sure the response reads like a conversation, not a robotic manual.")
    add_image_box(s6, 0.8, 2.1, 6.4, 4.4, "assets/diagram_teaching.png")
    create_card(s6, 7.45, 2.1, 5.08, 4.4, "Strict Teaching Guardrails", "No Robotic Summaries",
                "• Real analogies: Relates code ideas to everyday things (whiteboards, libraries, recipes).\n\n"
                "• Conversational paragraphs: Talks naturally with 'you' and 'we' instead of cold bullet points.\n\n"
                "• Clear definitions: Explains tricky terms the moment they appear.\n\n"
                "• Zero copying: Never blindly copies paragraphs from the original page.")
    add_footer(s6, 6, note="Explanation 5 of 8: Pedagogical Approach")

    # --- SLIDE 7: EXPLANATION 6 — Who benefits? ---
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Audience & Real-World Use", "Who Benefits From This Tool?",
               "This tool bridges the communication gap between technical code and human understanding for people with different goals.")
    create_card(s7, 0.8, 2.15, 3.65, 4.35, "Audience 01", "Coding Students & Beginners",
                "When you're learning to code, reading big projects on GitHub is intimidating. This tool gives learners a gentle starting point and builds confidence.\n\n"
                "Impact: Saves hours of confusion on day one.")
    create_card(s7, 4.84, 2.15, 3.65, 4.35, "Audience 02", "Designers & Product Managers",
                "Team members who don't write code can quickly understand what an engineering team is building, making collaboration easy and painless.\n\n"
                "Impact: Bridges technical & creative teams.", blue_accent=True)
    create_card(s7, 8.88, 2.15, 3.65, 4.35, "Audience 03", "Busy Professional Developers",
                "Senior engineers evaluate dozens of code tools each week. Instead of spending 20 minutes reading through each one, they get the gist in 30 seconds.\n\n"
                "Impact: Accelerates tool discovery 10x.")
    add_footer(s7, 7, note="Explanation 6 of 8: Real-World Use Cases")

    # --- SLIDE 8: EXPLANATION 7 — Clean, Fast, Private ---
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Simple By Design", "Built Clean: Fast, Private, and Lightweight",
               "We intentionally kept the software simple so it loads instantly on any phone or laptop without hidden complexities.")
    create_card(s8, 0.8, 2.15, 5.65, 4.35, "Privacy First", "Zero Personal Data Stored",
                "We do not collect personal information, passwords, or emails. We don't have a database tracking your searches. Once your explanation is finished, it disappears safely.\n\n"
                "• No user logins or passwords required\n"
                "• No cookies or advertising trackers\n"
                "• Completely private and respectful")
    create_card(s8, 6.88, 2.15, 5.65, 4.35, "Speed & Reliability", "Instant Loading Worldwide",
                "Hosted across global cloud servers. Whether you're opening it from New York, London, or Tokyo, the page loads in the blink of an eye.\n\n"
                "• Lightweight build (tiny file size under 60 KB)\n"
                "• Runs smoothly on slow mobile connections\n"
                "• Costs $0 to run using smart free tiers", blue_accent=True)
    add_footer(s8, 8, note="Explanation 7 of 8: Design Principles")

    # --- SLIDE 9: EXPLANATION 8 — Future Roadmap ---
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Looking Ahead", "What's Coming Next: The Future Roadmap",
               "While today's tool is great at explaining code summaries, we have exciting visual and interactive features planned right inside the app.")
    add_image_box(s9, 0.8, 2.1, 11.733, 4.4, "assets/diagram_roadmap.png")
    add_footer(s9, 9, note="Explanation 8 of 8: Product Evolution")

    # --- SLIDE 10: CONCLUDING SLIDE (Slide 10 of 10) ---
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Summary & Closing", "Making Technology Understandable for Everyone",
               "A quick recap of how GitHub Repo Explainer transforms confusing code into clear learning.")
    create_card(s10, 0.8, 2.15, 3.65, 4.35, "Takeaway 1", "Instant Clarity",
                "Turns intimidating software jargon into friendly, easy-to-read explanations with everyday analogies anyone can grasp.", blue_accent=True)
    create_card(s10, 4.84, 2.15, 3.65, 4.35, "Takeaway 2", "Reliable by Design",
                "A five-tier safety net guarantees the system is always responsive and ready to help, without annoying error screens.")
    create_card(s10, 8.88, 2.15, 3.65, 4.35, "Takeaway 3", "Built for Everyone",
                "Zero accounts, zero downloads, zero cost, and 100% private. Created to help curious people learn with confidence.", blue_accent=True)
    add_footer(s10, 10, note="Concluding Summary")

    output_path = "presentation.pptx"
    prs.save(output_path)
    print(f"Generated {output_path} successfully with images and updated content.")

if __name__ == '__main__':
    create_deck()
