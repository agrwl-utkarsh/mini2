import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 widescreen dimensions (13.333 x 7.5 inches)
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Clean color palette
    c_bg = RGBColor(255, 255, 255)
    c_card_bg = RGBColor(250, 251, 252)
    c_card_accent = RGBColor(239, 246, 255)
    c_border = RGBColor(229, 231, 235)
    c_accent_border = RGBColor(219, 234, 254)
    c_text_dark = RGBColor(17, 24, 39)
    c_text_muted = RGBColor(75, 85, 99)
    c_text_soft = RGBColor(107, 114, 128)
    c_accent_blue = RGBColor(37, 99, 235)

    def add_header(slide, category, title, subtitle):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.55), Inches(11.733), Inches(1.5))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        # Category
        p_cat = tf.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.name = 'Arial'
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = c_text_soft
        p_cat.space_after = Pt(4)

        # Title
        p_title = tf.add_paragraph()
        p_title.text = title
        p_title.font.name = 'Arial'
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = c_text_dark
        p_title.space_after = Pt(6)

        # Subtitle
        if subtitle:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle
            p_sub.font.name = 'Arial'
            p_sub.font.size = Pt(13)
            p_sub.font.color.rgb = c_text_muted

    def add_footer(slide, current_num, total_num=10, left_text="GitHub Repo Explainer · agrwl-utkarsh/mini2"):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(6.8), Inches(11.733), Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = left_text
        p.font.name = 'Arial'
        p.font.size = Pt(9.5)
        p.font.color.rgb = c_text_soft

        tb_num = slide.shapes.add_textbox(Inches(11.5), Inches(6.8), Inches(1.0), Inches(0.4))
        tf_num = tb_num.text_frame
        tf_num.word_wrap = True
        tf_num.margin_left = tf_num.margin_top = tf_num.margin_right = tf_num.margin_bottom = 0
        p_num = tf_num.paragraphs[0]
        p_num.alignment = PP_ALIGN.RIGHT
        p_num.text = f"{current_num:02d} / {total_num:02d}"
        p_num.font.name = 'Arial'
        p_num.font.size = Pt(9.5)
        p_num.font.color.rgb = c_text_soft

    def create_card(slide, left, top, width, height, label, title, text, accent=False):
        shape = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(left), Inches(top), Inches(width), Inches(height)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = c_card_accent if accent else c_card_bg
        shape.line.color.rgb = c_accent_border if accent else c_border
        shape.line.width = Pt(1)

        tb = slide.shapes.add_textbox(
            Inches(left + 0.25), Inches(top + 0.25), Inches(width - 0.5), Inches(height - 0.5)
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
            p_lbl.font.color.rgb = c_text_soft
            p_lbl.space_after = Pt(4)
            p_t = tf.add_paragraph()
        else:
            p_t = tf.paragraphs[0]

        p_t.text = title
        p_t.font.name = 'Arial'
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = c_text_dark
        p_t.space_after = Pt(8)

        if text:
            p_body = tf.add_paragraph()
            p_body.text = text
            p_body.font.name = 'Arial'
            p_body.font.size = Pt(11.5)
            p_body.font.color.rgb = c_text_muted

    # --- SLIDE 1: Title ---
    s1 = prs.slides.add_slide(blank_layout)
    add_header(s1, "Project Overview & Architecture", "GitHub Repo Explainer",
               "A resilient, zero-friction developer tool that translates complex open-source repositories into clear, mentor-style conceptual explanations.")
    create_card(s1, 0.8, 2.3, 3.65, 4.1, "Core Purpose", "Demystify Open Source",
                "Paste any GitHub repository URL to receive an intuitive narrative breakdown without wading through dense jargon or inconsistent README files.")
    create_card(s1, 4.84, 2.3, 3.65, 4.1, "System Architecture", "5-Tier Resilient Fallback",
                "Engineered for 99.9% uptime with cascading multi-provider AI redundancy across Grok, Gemini, DeepSeek, OpenRouter, and Hugging Face.")
    create_card(s1, 8.88, 2.3, 3.65, 4.1, "Stack & Delivery", "Modern Minimalist Web",
                "Lightweight React + Vite single-page application powered by a Vercel Serverless Function backend with zero external database dependencies.")
    add_footer(s1, 1)

    # --- SLIDE 2: Problem ---
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "The Problem", "The Friction of Navigating Open Source",
               "Developers spend hours deciphering open-source codebases before writing a single line of code.")
    create_card(s2, 0.8, 2.3, 5.65, 4.1, "The Status Quo", "Why Traditional READMEs Fail Readers",
                "• Written for creators, not learners: READMEs assume extensive domain context, skipping high-level foundational mental models.\n\n"
                "• Fragmented documentation: Critical explanations are scattered across wikis, issues, or omitted entirely.\n\n"
                "• Boilerplate overload: Lengthy CLI commands, badge arrays, and configuration details obscure core value.\n\n"
                "• Intimidating to juniors: Cryptic architectural jargon discourages new developers and non-technical stakeholders.")
    create_card(s2, 6.88, 2.3, 5.65, 4.1, "The Opportunity", "The Need for an Automated Senior Mentor",
                "\"Explain it like a senior engineer sitting right beside a junior developer during a 1-on-1 walkthrough.\"\n\n"
                "Software needs a reliable translation layer: take raw repository technical documentation and distill it into intuitive concepts, practical analogies, and clear setup guidance.", accent=True)
    add_footer(s2, 2)

    # --- SLIDE 3: Solution ---
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "The Solution", "An Intelligent, Conversational Distillation Engine",
               "A single entry point turning any repository link into an engaging, structured learning experience.")
    create_card(s3, 0.8, 2.3, 3.65, 4.1, "Input Simplicity", "Zero Friction Entry",
                "No accounts, no repo cloning, no local environment installation. Paste an HTTP link or select one-click presets (Next.js, React, Vite, Tailwind CSS).")
    create_card(s3, 4.84, 2.3, 3.65, 4.1, "Pedagogical Design", "Mentor-Style Synthesis",
                "Strict system prompt instructions forbid repetitive bullet points and verbatim copying. Produces 5–6 cohesive paragraphs centered around 'Why', analogies, and real-world value.")
    create_card(s3, 8.88, 2.3, 3.65, 4.1, "Graceful Resilience", "Never Shows a Broken Screen",
                "Automated provider fallback prevents rate-limit lockouts. If all LLMs are unreachable, cleanly returns the sanitized README as an ultimate safety net.")
    add_footer(s3, 3)

    # --- SLIDE 4: Architecture Pipeline ---
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "System Architecture", "End-to-End Execution Pipeline",
               "A lightweight, decoupled design optimizing for rapid response times and cold-start minimization.")
    steps = [
        ("1. Client URL", "React frontend parses user input, validates URLs, and offers 1-click popular repository presets."),
        ("2. Serverless Proxy", "/api/analyze parses repo coordinates and keeps API credentials securely server-side."),
        ("3. Ingestion", "Fetches raw docs across main/master branches and .md/.txt/.rst extensions via raw CDN."),
        ("4. Fallback LLM", "Executes ordered provider calls with token truncation (8,000 chars) to prevent context blowup."),
        ("5. Presentation", "Client streams output into tabbed workspaces: Explanation, Architecture, Chat, and Explorer.")
    ]
    for i, (stitle, sdesc) in enumerate(steps):
        left = 0.8 + (i * 2.42)
        create_card(s4, left, 2.3, 2.25, 4.1, f"Step 0{i+1}", stitle, sdesc)
    add_footer(s4, 4)

    # --- SLIDE 5: 5-Tier LLM Matrix ---
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Engineering Highlight", "The 5-Tier Fault-Tolerant LLM Matrix",
               "Zero-downtime AI generation: if any provider encounters rate limits or timeouts, execution cascades instantly.")
    tiers = [
        ("Tier 01", "xAI Grok", "grok-beta via api.x.ai/v1 (Primary Choice)", True),
        ("Tier 02", "Google Gemini", "gemini-1.5-flash -> gemini-1.5-pro -> gemini-1.0-pro", False),
        ("Tier 03", "DeepSeek", "deepseek-chat via api.deepseek.com/v1 (Cost Efficient)", False),
        ("Tier 04", "OpenRouter", "llama-3.2-3b, phi-3-mini, gemma-2-2b, qwen-2.5-7b (Free Tier Pool)", False),
        ("Tier 05", "Hugging Face", "Meta-Llama-3.1-8B-Instruct, Phi-3-mini-128k (Inference API)", False),
        ("Safety Net", "Raw README Fallback", "Clean text excerpt (3,000 chars) + full transparent diagnostic trace", False)
    ]
    for i, (tnum, tname, tdesc, is_acc) in enumerate(tiers):
        top = 2.3 + (i * 0.68)
        shape = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(top), Inches(11.733), Inches(0.58))
        shape.fill.solid()
        shape.fill.fore_color.rgb = c_card_accent if is_acc else c_card_bg
        shape.line.color.rgb = c_accent_border if is_acc else c_border
        shape.line.width = Pt(1)

        tb = s5.shapes.add_textbox(Inches(1.0), Inches(top + 0.12), Inches(11.3), Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"{tnum}  |  {tname}  —  {tdesc}"
        p.font.name = 'Arial'
        p.font.size = Pt(11)
        p.font.color.rgb = c_text_dark
        p.font.bold = is_acc
    add_footer(s5, 5)

    # --- SLIDE 6: Prompt Engineering ---
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "AI Quality & Pedagogy", "Prompt Engineering: The Mentor Persona",
               "Transforming raw text dumping into high-signal educational content through rigorous prompt constraints.")
    create_card(s6, 0.8, 2.3, 5.65, 4.1, "Pedagogical Framework", "Mandatory Narrative Structure",
                "1. The Problem Space: Painting the before/after developer friction.\n\n"
                "2. Conceptual Architecture: 'Think of it like...' everyday analogies.\n\n"
                "3. Core Capabilities: Pragmatic capabilities over feature checklists.\n\n"
                "4. First Steps: Gentle setup walkthrough from scratch.\n\n"
                "5. Jargon Dissection: On-the-fly definitions of key technical terms.\n\n"
                "6. Real-World Context: Identifying ideal use cases and project fits.")
    create_card(s6, 6.88, 2.3, 5.65, 4.1, "Output Guardrails", "Strict Negative Prompting",
                "CRITICAL SYSTEM RULES:\n\n"
                "• DO NOT copy or quote README directly\n\n"
                "• DO NOT output section-by-section lists\n\n"
                "• Write ONLY in flowing, natural PARAGRAPHS (5-6 min)\n\n"
                "• Conversational tone: use 'you' and 'we'\n\n"
                "• Avoid academic or robotic summaries\n\n"
                "Result: Human-sounding walkthrough that feels like a pairing session.")
    add_footer(s6, 6)

    # --- SLIDE 7: Tech Stack ---
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Implementation", "Minimalist, Zero-Overhead Tech Stack",
               "Carefully curated dependencies prioritizing instant cold boots, zero database maintenance, and portable hosting.")
    create_card(s7, 0.8, 2.3, 2.7, 4.1, "Frontend", "React 18",
                "Component-driven reactive state, accessible forms, keyboard-navigable tabs, and responsive UI without heavyweight UI frameworks.")
    create_card(s7, 3.81, 2.3, 2.7, 4.1, "Build Tool", "Vite 5",
                "Sub-second HMR dev server and optimized production bundles under 60 KB compressed for instant browser execution.")
    create_card(s7, 6.82, 2.3, 2.7, 4.1, "Serverless", "Node.js 20",
                "Vercel serverless function execution handling secure API calls, timeout handling, and multi-branch raw GitHub streaming.")
    create_card(s7, 9.83, 2.3, 2.7, 4.1, "Architecture", "Stateless",
                "Pure stateless design. Zero database migrations, zero user data retention, and zero persistent infrastructure costs.")
    add_footer(s7, 7)

    # --- SLIDE 8: Deployment & Ops ---
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Operations & Deployment", "Zero-Config Deployment on Vercel",
               "Deployable in under 60 seconds with simple declarative configuration and modular environment variable tiers.")
    create_card(s8, 0.8, 2.3, 5.65, 4.1, "Configuration", "Plug-and-Play Environment Variables",
                "Add as many or as few API keys as you prefer. The system automatically detects active keys and constructs the optimal fallback chain at runtime:\n\n"
                "• GROK_API_KEY (xAI Grok Tier 1)\n"
                "• GEMINI_API_KEY (Google Gemini Tier 2)\n"
                "• DEEPSEEK_API_KEY (DeepSeek Tier 3)\n"
                "• OPENROUTER_API_KEY (Free Model Tier 4)\n"
                "• HUGGINGFACE_API_KEY (HF Inference Tier 5)")
    create_card(s8, 6.88, 2.3, 5.65, 4.1, "Operational Profile", "Production Characteristics",
                "• Global Edge Distribution: Frontend cached across Vercel's global CDN edges.\n\n"
                "• Serverless Scalability: Instant elasticity from 0 to thousands of concurrent requests.\n\n"
                "• Native Dev Parity: 'npm run dev' works out-of-the-box with local proxy support.\n\n"
                "• Cost Effective: Operates completely within free tiers (Vercel Hobby + OpenRouter free models).")
    add_footer(s8, 8)

    # --- SLIDE 9: Roadmap ---
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Future Capabilities", "Platform Roadmap: Beyond READMEs",
               "The foundation is laid for expanding into a comprehensive interactive repository exploration suite.")
    create_card(s9, 0.8, 2.3, 3.65, 4.1, "Tab 2 · In Progress", "Architecture Flow Diagrams",
                "Automated generation of visual Mermaid.js architectural diagrams illustrating component topologies, data flows, and external service contracts.", accent=True)
    create_card(s9, 4.84, 2.3, 3.65, 4.1, "Tab 3 · Planned", "Repository Chatbot Q&A",
                "Conversational assistant with contextual embeddings over repository documentation, enabling targeted inquiries like 'How do I configure auth?'.")
    create_card(s9, 8.88, 2.3, 3.65, 4.1, "Tab 4 · Planned", "Interactive Code Explorer",
                "In-browser file tree navigation with syntax highlighting and inline AI commentary for individual functions, classes, and config files.")
    add_footer(s9, 9)

    # --- SLIDE 10: Conclusion ---
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Conclusion", "Summary & Key Takeaways",
               "A focused developer tool built with exceptional craft, pragmatic reliability, and clean execution.")
    create_card(s10, 0.8, 2.3, 3.65, 4.1, "Value Delivered", "Immediate Comprehension",
                "Cuts onboarding time for unfamiliar open-source codebases from hours to minutes through conversational synthesis.")
    create_card(s10, 4.84, 2.3, 3.65, 4.1, "Architectural Strength", "Bulletproof Reliability",
                "Five tiers of automated LLM failover ensure users are never greeted by broken screens or rate limit errors.")
    create_card(s10, 8.88, 2.3, 3.65, 4.1, "Design Aesthetic", "Clean, Human-Centered",
                "Built for focus: clean typography, white/soothing palette, responsive layout, and zero superfluous distraction.")
    add_footer(s10, 10)

    output_path = "presentation.pptx"
    prs.save(output_path)
    print(f"Successfully generated {output_path}")

if __name__ == '__main__':
    create_deck()
