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

    c_card_bg = RGBColor(248, 250, 252)
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

    def add_footer(slide, current_num, total_num=5, note=""):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(6.82), Inches(10.0), Inches(0.35))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"{note} · GitHub Repository Explainer" if note else "GitHub Repository Explainer"
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

    # --- SLIDE 1: INTRODUCTION ---
    s1 = prs.slides.add_slide(blank_layout)
    add_header(s1, "Slide 01 · Welcome & Overview", "GitHub Repository Explainer",
               "A friendly, everyday guide that turns complex open-source software projects into clear, conversational English anyone can understand.")
    create_card(s1, 0.8, 2.15, 3.65, 4.35, "The Core Mission", "Making Code Approachable",
                "Think of it like having an experienced, patient friend sitting right beside you, explaining what a codebase does without intimidating words.", blue_accent=True)
    create_card(s1, 4.84, 2.15, 3.65, 4.35, "Frictionless Experience", "Just Paste a Link",
                "No accounts to create, no software to install, and no environment setup. Just paste any GitHub repository link and click one button.")
    create_card(s1, 8.88, 2.15, 3.65, 4.35, "Built to Last", "Always Fast & Reliable",
                "Powered by multiple smart helpers behind the scenes. If one helper is busy or down, another steps in instantly so you never see an error.")
    add_footer(s1, 1, note="Introductory Slide · Welcome & Overview")

    # --- SLIDE 2: THE PROBLEM ---
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Slide 02 · The Problem", "The Day-One Shock: Walking Into a Massive Codebase Blind",
               "When junior engineers and beginners get into open source or join a new company, they are suddenly handed thousands of lines of unfamiliar logic with no guided tour.")
    add_image_box(s2, 0.8, 2.1, 6.2, 4.4, "assets/slide2_problem.png")
    create_card(s2, 7.25, 2.1, 5.28, 4.4, "The Beginner's Dilemma", "Lost in Nested Files & Logic",
                "• Overwhelming volume: Handed 50,000+ lines of code across hundreds of files on day one.\n\n"
                "• No starting map: You don't know which files matter, where logic begins, or why decisions were made.\n\n"
                "• Hesitation to bother seniors: Beginners fear asking 'stupid' questions every ten minutes.\n\n"
                "• The Result: Days turn into weeks of staring at screens instead of building confidence.", blue_accent=True)
    add_footer(s2, 2, note="Explanation 1 of 8 · The Problem: Onboarding Friction for Junior Engineers")

    # --- SLIDE 3: THE SOLUTION ---
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Slide 03 · The Solution", "The Solution: An On-Demand Senior Mentor in Your Browser",
               "Instead of suffering in silence or digging through dense files, junior developers get a patient companion whose only job is to explain any project clearly.")
    add_image_box(s3, 0.8, 2.1, 11.733, 4.4, "assets/slide3_solution.png")
    add_footer(s3, 3, note="Explanation 2 of 8 · The Solution: Zero-Friction 3-Step Walkthrough")

    # --- SLIDE 4: THE CONCEPT ---
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Slide 04 · The Concept", "The Concept: How It Translates Code into Human Concepts",
               "Rather than spitting out code line-by-line, the explainer focuses on human mental models, everyday analogies, and the 'why' behind the software.")
    add_image_box(s4, 0.8, 2.1, 11.733, 4.4, "assets/slide4_concept.png")
    add_footer(s4, 4, note="Explanation 3 of 8 · The Concept: Conceptual Translation vs Jargon Dumps")

    # --- SLIDE 5: THE EXPERIENCE ---
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Slide 05 · The Experience", "The Experience: From Total Confusion to Confident in 60 Seconds",
               "What the user actually sees: a cohesive, 5-paragraph narrative walkthrough that leaves them ready to contribute and discuss with their team.")
    add_image_box(s5, 0.8, 2.1, 11.733, 4.4, "assets/slide5_experience.png")
    add_footer(s5, 5, note="Explanation 4 of 8 · The Experience: The 60-Second Transformation")

    output_path = "presentation.pptx"
    prs.save(output_path)
    print("Generated 5-slide presentation.pptx successfully.")

if __name__ == '__main__':
    create_deck()
