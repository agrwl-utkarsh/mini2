#!/usr/bin/env python3
"""
Builds Repository-Explainer-Synopsis.docx in the EXACT format of the supplied
reference synopsis (final _synopsis_2.pdf):

  1.                              INTRODUCTION
  4.1 BACKGROUND INFORMATION:-
  a. Inefficient Campus Dining Management:
  <paragraph>

  5.1 PRELIMINARY SYSTEM DESCRIPTION:-
  1. CUSTOMER AND CANTEEN OWNER (ADMIN) INTERFACE:
  <paragraph>

  HARDWARE REQUIREMENTS:-
          CLIENT SIDE:-
  Ram                    :     2 GB
"""
import os
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

HERE = os.path.dirname(os.path.abspath(__file__))
FIG = os.path.join(HERE, "figures")
OUTFILE = os.path.join(HERE, "..", "..", "Repository-Explainer-Synopsis.docx")

doc = Document()

# ── page setup: A4, same margins as the reference ─────────────────────────────
for s in doc.sections:
    s.page_width = Inches(8.27)
    s.page_height = Inches(11.69)
    s.top_margin = Inches(1.0)
    s.bottom_margin = Inches(1.0)
    s.left_margin = Inches(1.25)
    s.right_margin = Inches(1.0)

normal = doc.styles["Normal"]
normal.font.name = "Times New Roman"
normal.font.size = Pt(12)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.5
rpr = normal.element.get_or_add_rPr()
rfonts = rpr.get_or_add_rFonts()
rfonts.set(qn("w:eastAsia"), "Times New Roman")


def _footer_page_numbers():
    footer = doc.sections[0].footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    run._r.addnext(fld)


def line(text="", size=12, bold=False, italic=False, align="justify",
         before=0, after=6, indent=0.0, spacing=1.5, keep=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = spacing
    if indent:
        p.paragraph_format.left_indent = Inches(indent)
    if keep:
        p.paragraph_format.keep_with_next = True
    p.alignment = {"justify": WD_ALIGN_PARAGRAPH.JUSTIFY,
                   "center": WD_ALIGN_PARAGRAPH.CENTER,
                   "left": WD_ALIGN_PARAGRAPH.LEFT}[align]
    if text:
        r = p.add_run(text)
        r.bold = bold
        r.italic = italic
        r.font.size = Pt(size)
        r.font.name = "Times New Roman"
    return p


def _strip_table_borders(tbl):
    tblPr = tbl._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "none")
        el.set(qn("w:sz"), "0")
        borders.append(el)
    tblPr.append(borders)


def _no_space_cell(cell):
    for p in cell.paragraphs:
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0


def chapter_head(num, title):
    """
    Chapter heading as ONE centred paragraph:
        '1.                INTRODUCTION'
    Spacing is achieved with spaces, not tabs -- tabs reflow in PDF renderers,
    spaces do not. This matches the visual of the reference synopsis and is
    stable in both Word and PDF.
    """
    p = doc.add_paragraph()
    p.paragraph_format.page_break_before = True
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(16)
    p.paragraph_format.line_spacing = 1.0
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    text = (num.rstrip(".") + "." if num.strip() else "") + "\u2003\u2003\u2003" + title
    r = p.add_run(text.lstrip("\u2003"))
    r.bold = True
    r.font.size = Pt(14)
    r.font.name = "Times New Roman"
    return p


def section_head(text):
    """'4.1 BACKGROUND INFORMATION:-'   all caps, bold, ends in :-"""
    return line(text.upper() + ":-", size=12.5, bold=True, align="left",
                before=14, after=6, keep=True)


def lettered(letter, title, body):
    """a. Title:  then the paragraph."""
    p = line(f"{letter}. {title}:", size=12, bold=True, align="left",
             before=8, after=4, keep=True)
    line(body)


def numbered_caps(num, title, body):
    """1. CUSTOMER AND CANTEEN OWNER (ADMIN) INTERFACE:  then the paragraph."""
    p = line(f"{num}. {title.upper()}:", size=12, bold=True, align="left",
             before=9, after=4, keep=True)
    line(body)


def dot(text, indent=0.30):
    """The reference's bullet glyph."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(indent)
    p.paragraph_format.first_line_indent = Inches(-0.18)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.35
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run("\u2022  " + text)
    r.font.size = Pt(11.5)
    r.font.name = "Times New Roman"
    return p


def figure(path, caption, width=6.05):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(3)
    p.add_run().add_picture(path, width=Inches(width))
    line(caption, size=10, italic=True, align="center", after=12)


def table(headers, rows, widths, font_size=9):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, txt in enumerate(headers):
        cell = t.rows[0].cells[i]
        cell.text = ""
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run(txt)
        r.bold = True
        r.font.size = Pt(font_size)
        shd = OxmlElement("w:shd")
        shd.set(qn("w:fill"), "E8EDF5")
        cell._tc.get_or_add_tcPr().append(shd)
    for row in rows:
        cells = t.add_row().cells
        for i, txt in enumerate(row):
            cells[i].text = ""
            p = cells[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.0
            r = p.add_run(str(txt))
            r.font.size = Pt(font_size)
    for row in t.rows:
        for i, w in enumerate(widths):
            row.cells[i].width = Inches(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return t


_footer_page_numbers()

# ══════════════════════════════════════════════════════════════════════════════
# TITLE PAGE
# ══════════════════════════════════════════════════════════════════════════════
line(after=40)
line("PROJECT SYNOPSIS", size=16, bold=True, align="center", after=6)
line("ON", size=12, align="center", after=18)
line("REPOSITORY EXPLAINER", size=24, bold=True, align="center", after=8)
line("An AI-Assisted Platform for Understanding Any GitHub Repository in Plain English",
     size=13, italic=True, align="center", after=50)
line("Submitted in partial fulfilment of the requirements for the award of the degree of",
     size=11, italic=True, align="center", after=14)
line("BACHELOR OF TECHNOLOGY", size=14, bold=True, align="center", after=6)
line("in", size=11, align="center", after=6)
line("COMPUTER SCIENCE & ENGINEERING", size=13, bold=True, align="center", after=60)
line("Submitted by", size=11, italic=True, align="center", after=10)
line("UTKARSH AGRAWAL", size=14, bold=True, align="center", after=80)
line("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", size=11.5, bold=True, align="center", after=4)
line("SESSION 2025\u201326", size=11.5, bold=True, align="center")

# ══════════════════════════════════════════════════════════════════════════════
# CONTENTS
# ══════════════════════════════════════════════════════════════════════════════
p = doc.add_paragraph()
p.paragraph_format.page_break_before = True
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(20)
r = p.add_run("CONTENTS")
r.bold = True
r.font.size = Pt(14)

TOC = [
    ("1.", "INTRODUCTION", "1"),
    ("2.", "PROBLEM STATEMENT", "2"),
    ("3.", "OBJECTIVES", "3-4"),
    ("4.", "LITERATURE SURVEY", "5-7"),
    ("4.1", "BACKGROUND INFORMATION", "5-6"),
    ("4.2", "COMPARISON BETWEEN EXISTING SYSTEMS", "6-7"),
    ("4.3", "FINDINGS OF SURVEY (AREAS OF IMPROVEMENT)", "7"),
    ("5.", "METHODOLOGY", "8-15"),
    ("5.1", "PRELIMINARY SYSTEM DESCRIPTION", "8-10"),
    ("5.2", "DATA FLOW DIAGRAM", "10-11"),
    ("5.3", "STATE CHART DIAGRAM", "11"),
    ("5.4", "SEQUENCE DIAGRAM", "12"),
    ("5.5", "SCHEMAS USED", "13"),
    ("5.6", "TECHNOLOGY USED", "14"),
    ("5.7", "SOFTWARE AND HARDWARE REQUIREMENTS", "15"),
    ("6.", "PERT CHART", "16"),
    ("7.", "FUTURE SCOPE", "17"),
    ("8.", "CONCLUSION", "18"),
]

for num, title, page in TOC:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.45
    p.paragraph_format.tab_stops.add_tab_stop(Inches(5.9), WD_ALIGN_PARAGRAPH.RIGHT)
    r = p.add_run(f"{num:<8}{title}")
    r.font.size = Pt(11.5)
    r2 = p.add_run(f"\t{page}")
    r2.font.size = Pt(11.5)

# ══════════════════════════════════════════════════════════════════════════════
# 1. INTRODUCTION
# ══════════════════════════════════════════════════════════════════════════════
chapter_head("1.", "INTRODUCTION")

line("Welcome to Repository Explainer \u2014 an AI-assisted developer tool that reads any public "
     "GitHub repository and explains it in plain English. Built on a React single-page front-end "
     "and three Node.js serverless functions, the project transforms a single pasted URL into a "
     "guided tour of a codebase: what the project does, how it is structured, what it is built "
     "with, and how to run it.")

line("Reading an unfamiliar repository is slow. GitHub hosts more than four hundred million "
     "projects, yet the documentation of most of them is written for people who already "
     "understand the code. A README usually states what a project is, not how its pieces fit "
     "together. A developer who wants to evaluate a dependency, a student who has to present a "
     "reference implementation, or a recruiter assessing a candidate's work faces the same "
     "chore: open dozens of folders, guess the entry point, and try to hold the whole flow in "
     "memory.")

line("Repository Explainer removes that chore. The user pastes a link; the system retrieves the "
     "repository's README and complete file tree directly from GitHub, detects its technology "
     "stack with a rule-based analyser, and then uses a Large Language Model to write two "
     "artefacts \u2014 a structured explanation in five sections, and a machine-readable "
     "architecture graph that is rendered as an interactive, editable diagram. The same "
     "repository context then powers a conversational assistant and a code browser that can "
     "explain any individual file.")

line("A central design decision is provider independence. Rather than depending on a single AI "
     "vendor, the backend implements an ordered cascade across five options \u2014 Grok, Google "
     "Gemini, DeepSeek, OpenRouter, and a deterministic built-in template generator. If a key is "
     "missing, a quota is exhausted, or a request times out, the system silently advances to the "
     "next option. The result is a tool that stays completely functional even when it is "
     "deployed with no API keys at all, which makes it usable in academic settings where paid "
     "credentials are unavailable.")

line("The project is intended for four audiences: students who must understand a reference "
     "implementation before an examination; developers evaluating an unfamiliar dependency; "
     "recruiters and reviewers who need to assess a codebase quickly; and maintainers who want a "
     "second, automatically generated view of their own architecture.")

# ══════════════════════════════════════════════════════════════════════════════
# 2. PROBLEM STATEMENT
# ══════════════════════════════════════════════════════════════════════════════
chapter_head("2.", "PROBLEM STATEMENT")

lettered("a", "Documentation is written for insiders",
         "README files assume prior knowledge of the domain and the stack. They rarely explain "
         "how the parts of a project fit together, which is exactly the information a newcomer "
         "needs first.")

lettered("b", "Architectural understanding requires reading code",
         "To discover how a request travels through an unfamiliar repository, a developer must "
         "open dozens of files and hold the whole flow in memory. There is no automatic summary "
         "of the system's structure.")

lettered("c", "Onboarding is slow and repetitive",
         "The same orientation questions are asked for every new repository: where is the entry "
         "point, how do I run it, which folders matter, what talks to what. Each answer "
         "currently requires manual exploration.")

lettered("d", "Generic AI assistants lack repository context",
         "A general-purpose chatbot has not seen the repository being discussed. Its answers are "
         "generic, and it cannot cite real file paths unless the relevant text is supplied to "
         "it in the prompt.")

lettered("e", "Existing code-intelligence tools are heavyweight",
         "Sourcegraph, GitHub Copilot Chat and similar products require installation, index "
         "building, authentication or a paid subscription. A student who wants to inspect one "
         "repository for ten minutes cannot justify any of that.")

lettered("f", "Dependence on a single AI vendor is fragile",
         "Tools that hard-code one provider stop working the moment that provider's free tier "
         "is withdrawn, its quota is exhausted, or its key expires. A single-vendor design is "
         "therefore a maintenance liability rather than a convenience.")

# ══════════════════════════════════════════════════════════════════════════════
# 3. OBJECTIVES
# ══════════════════════════════════════════════════════════════════════════════
chapter_head("3.", "OBJECTIVES")

lettered("a", "Accept any public repository with one input",
         "Validate and parse a GitHub URL in its several forms \u2014 HTTPS, owner/repo "
         "shorthand, and branch-specific tree URLs \u2014 and reject malformed input with a "
         "clear message.")

lettered("b", "Ingest real repository facts",
         "Retrieve metadata, README text and the complete recursive file tree from the GitHub "
         "REST API and the raw content host, with graceful placeholders when a fetch fails.")

lettered("c", "Generate a plain-English explanation",
         "Produce a structured explanation covering what the project does, how it works step by "
         "step, what it is built with, how to run it, and who should use it, using grounded "
         "repository data rather than the model's general knowledge.")

lettered("d", "Generate an interactive architecture diagram",
         "Produce a machine-readable node-and-edge graph describing the system's components and "
         "data flow, and render it as an editable, zoomable canvas with category filtering and "
         "layout switching.")

lettered("e", "Provide contextual question answering",
         "Answer follow-up questions about the specific repository using its files, technology "
         "stack, architecture graph and documentation as context, so that replies cite real "
         "paths instead of generic advice.")

lettered("f", "Enable code exploration",
         "Allow the user to browse the file tree with live filtering, read any file with line "
         "numbers, copy it, and request an explanation of an individual file.")

lettered("g", "Implement multi-provider resilience",
         "Build an ordered fallback cascade across five LLM providers so that a single failure "
         "\u2014 a missing key, an exhausted quota or a timeout \u2014 never degrades the user "
         "experience.")

lettered("h", "Guarantee zero-configuration operability",
         "Ensure a meaningful result with no API keys at all, by combining a deterministic "
         "technology detector, a template-based explainer and a heuristic architecture "
         "generator.")

lettered("i", "Control cost and abuse",
         "Bound every outbound request with an explicit timeout, cap the volume of context sent "
         "to the model, and avoid persisting any repository data on the server.")

lettered("j", "Deliver an accessible interface",
         "Provide a responsive, keyboard-accessible interface in both light and dark themes, "
         "with no build-time dependency on an external design system.")

# ══════════════════════════════════════════════════════════════════════════════
# 4. LITERATURE SURVEY
# ══════════════════════════════════════════════════════════════════════════════
chapter_head("4.", "LITERATURE SURVEY")

section_head("4.1 Background Information")
line("The problem of helping a developer understand unfamiliar source code has a long research "
     "history. It can be traced through four distinct stages, each supported by published work.")

line("a) Code Summarisation:", size=12, bold=True, align="left", before=8, after=3, keep=True)
dot("The earliest automated approach: a model reads one function and emits a natural-language "
    "comment.")
dot("CodeXGLUE established standard benchmarks for this task and framed summarisation as a "
    "sequence-to-sequence problem.")
dot("Limitation: it summarises a function or a file, never a whole system, and has no notion of "
    "how components interact.")
dot("Reference: Lu et al. (2021) \u2014 arXiv:2102.04664")

line("b) Program Comprehension and Visualisation:", size=12, bold=True, align="left",
     before=8, after=3, keep=True)
dot("Moreno et al. showed that developers benefit substantially from textual and visual "
    "summaries of source code.")
dot("A stereotype-based summary of a class proved more useful to a maintainer than a raw "
    "listing of its methods.")
dot("This finding directly motivates the architecture diagram in the present project: an "
    "abstract visual overview communicates structure faster than code.")
dot("Reference: Moreno et al. (2013) \u2014 DOI: 10.1109/ICPC.2013.6613830")

line("c) Pre-trained Models for Code:", size=12, bold=True, align="left",
     before=8, after=3, keep=True)
dot("CodeBERT and GraphCodeBERT pre-trained transformers on both natural language and "
    "programming languages.")
dot("GraphCodeBERT additionally models data flow, producing representations that transfer well "
    "to code search and summarisation.")
dot("Its explicit data-flow modelling is the conceptual ancestor of the node-and-edge graph "
    "used for the architecture canvas in this project.")
dot("Reference: Feng et al. (2020) \u2014 arXiv:2002.08155; Guo et al. (2021) \u2014 "
    "arXiv:2009.08366")

line("d) Large Language Models for Code:", size=12, bold=True, align="left",
     before=8, after=3, keep=True)
dot("Codex established that large language models scaled on public code can generate working "
    "programs from natural-language descriptions; HumanEval became the standard measure.")
dot("Ahmed and Devanbu showed that supplying project-specific examples in the prompt, rather "
    "than fine-tuning, already surpasses earlier state-of-the-art models with roughly ten "
    "in-context samples.")
dot("This result justifies the prompt-engineering approach taken by Repository Explainer "
    "instead of model training.")
dot("Reference: Chen et al. (2021) \u2014 arXiv:2107.03374; Ahmed & Devanbu (2022) \u2014 "
    "DOI: 10.1145/3551349.3559555")

line("e) Repository-Level Understanding:", size=12, bold=True, align="left",
     before=8, after=3, keep=True)
dot("RepoBench introduced three connected tasks \u2014 cross-file retrieval, next-line "
    "completion and an end-to-end pipeline \u2014 to measure repository-level capability.")
dot("The benchmark formalises the exact capability this project requires: selecting the right "
    "slice of a large codebase as context.")
dot("The companion trend is retrieval-augmented generation, in which the context given to the "
    "model is selected programmatically rather than left to the model's memory.")
dot("Reference: Liu, Xu & McAuley (2023) \u2014 arXiv:2306.03091; Lewis et al. (2020) \u2014 "
    "arXiv:2005.11401")

section_head("4.2 Comparison Between Existing Systems")
line("The following table provides a general comparison among the tools a developer would "
     "realistically consider for the same task. The criteria capture what matters for a "
     "student-facing, low-friction tool.")

table(
    ["Criteria", "GitHub\n(README)", "ChatGPT /\nGemini", "Copilot\nChat", "Sourcegraph", "Repository\nExplainer"],
    [
        ["Repository context", "Raw text only", "None unless pasted", "Indexed per workspace", "Full code index", "README + tree + stack"],
        ["Effort to start", "None", "Copy-paste repo", "Install + auth", "Install + index", "Paste one URL"],
        ["Architecture view", "No", "Text only", "No", "Code graph", "Interactive diagram"],
        ["Per-file explanation", "No", "Only if pasted", "Yes, in editor", "Limited", "Yes, in browser"],
        ["Multi-file Q&A", "No", "No", "Yes", "Yes", "Yes (chat tab)"],
        ["Works with no API key", "Yes, but manual", "No", "No", "No", "Yes (heuristic)"],
        ["Cost to the student", "Free", "Free tier", "Paid", "Paid / self-host", "Free"],
        ["Installation required", "No", "No", "Yes (IDE)", "Yes", "No"],
        ["Works instantly on any public repo", "Yes", "No", "No", "Partially", "Yes"],
    ],
    widths=[1.25, 0.85, 0.95, 0.9, 0.9, 1.05],
    font_size=8.5,
)

line("The comparison shows a clear gap. Heavyweight tools index the code but demand "
     "installation and a subscription; general chat assistants are frictionless but carry no "
     "repository context; and GitHub itself presents raw text without interpretation. "
     "Repository Explainer occupies the unoccupied middle ground: zero installation, a single "
     "URL, and output that is both architectural and explanatory.")

section_head("4.3 Findings of Survey (Areas of Improvement)")
line("The survey exposed five weaknesses in existing practice, each of which shaped a design "
     "decision in this project.", after=4)

line("a) Grounding Beats Eloquence:", size=12, bold=True, align="left", before=7, after=3, keep=True)
dot("The usefulness of an answer depends far more on whether the right context was supplied "
    "than on which model produced it. The project therefore invests in ingestion and prompt "
    "construction before model choice.")
line("b) Explanations Should Be Layered:", size=12, bold=True, align="left", before=7, after=3, keep=True)
dot("A single dense paragraph serves neither a beginner nor an expert. Output is split into an "
    "executive summary, five structured sections and a separate interactive diagram.")
line("c) Visual Structure Is Under-served:", size=12, bold=True, align="left", before=7, after=3, keep=True)
dot("Every surveyed assistant returns prose; none returns a diagram the user can manipulate, "
    "extend and export. The ReactFlow canvas is the response to this gap.")
line("d) Vendor Lock-in Is a Practical Risk:", size=12, bold=True, align="left", before=7, after=3, keep=True)
dot("Free tiers and model names change without warning, which justifies the five-provider "
    "cascade and the offline fallback.")
line("e) Silent Degradation Is the Real Failure Mode:", size=12, bold=True, align="left",
     before=7, after=3, keep=True)
dot("The dangerous outcome is not an error message but a confident-looking answer produced from "
    "incomplete context. Every fetch is therefore time-boxed and the answering provider is "
    "recorded, so degradation stays observable.")

# ══════════════════════════════════════════════════════════════════════════════
# 5. METHODOLOGY
# ══════════════════════════════════════════════════════════════════════════════
chapter_head("5.", "METHODOLOGY")

section_head("5.1 Preliminary System Description")
line("The system is a three-tier web application. The presentation tier is a React single-page "
     "application; the application tier is three serverless functions; the data tier is "
     "entirely external, with GitHub supplying repository content and an AI provider supplying "
     "generated text. The application stores nothing, which keeps deployment cost at zero and "
     "removes every data-retention obligation.", after=8)

numbered_caps(1, "Frontend shell (App.jsx)",
              "Owns all shared state \u2014 repository metadata, explanation, technology stack, "
              "architecture graph and file tree \u2014 and renders the four tab views. It issues "
              "exactly one analysis request per URL and distributes the single response object "
              "to its children.")
numbered_caps(2, "Explanation view (CodeExplanation.jsx)",
              "Parses the model's Markdown response into headings, bullet lists, paragraphs and "
              "fenced code blocks, and renders the executive summary, technology pills and key "
              "takeaways.")
numbered_caps(3, "Architecture canvas (ArchitectureFlow.jsx)",
              "Converts the node-and-edge JSON into a ReactFlow graph with a custom typed node "
              "component, and adds local editing: add component, delete component, connect "
              "components, switch between vertical and horizontal layouts, and filter by "
              "category.")
numbered_caps(4, "Chat interface (Chatbot.jsx)",
              "Maintains the conversation thread and resends the accumulated context with each "
              "question, because the LLM API is stateless. Renders replies with a lightweight "
              "Markdown renderer.")
numbered_caps(5, "Code explorer (CodeExplorer.jsx)",
              "Renders a filterable file tree, fetches file contents on demand, displays them "
              "with line numbers, and offers a per-file AI explanation.")
numbered_caps(6, "Analysis function (api/analyze.js)",
              "The backbone of the system. It parses the URL, performs the three GitHub "
              "fetches, detects the technology stack, runs explanation and architecture "
              "generation in parallel, and assembles the response.")
numbered_caps(7, "Chat function (api/chat.js)",
              "Builds a system prompt from the supplied repository context, runs the provider "
              "cascade for a conversational reply, and falls back to a keyword-driven answer "
              "engine that consults the file tree, the architecture graph and the "
              "documentation.")
numbered_caps(8, "File function (api/file.js)",
              "Serves two purposes: a GET request streams raw file content from the raw content "
              "host, and a POST request with the action 'explain' returns a per-file "
              "explanation.")
numbered_caps(9, "Provider layer (callGrok, callGemini, callDeepSeek, callOpenRouter)",
              "Four thin adapters that translate the same logical prompt into each vendor's "
              "request shape and normalise the reply back to a plain string.")
numbered_caps(10, "Development middleware (vite.config.js)",
              "Reproduces Vercel's serverless routing inside the local development server so "
              "that the same handler files run unchanged in both environments.")

line("The execution flow of a single analysis request is as follows:", before=10, after=4)

numbered_caps(11, "Validation",
              "The request method and the presence of a URL are checked, then the URL is reduced "
              "to an owner, a repository name and an optional branch hint.")
numbered_caps(12, "Ingestion",
              "Three GitHub reads are issued. Metadata and the recursive file tree come from the "
              "REST API; the README is probed across the detected branch, main and master, "
              "against seven candidate file names.")
numbered_caps(13, "Normalisation",
              "Git vocabulary is translated into the application's own vocabulary: tree becomes "
              "directory, blob becomes file, stargazers_count becomes stars, and the tree is "
              "capped at three hundred entries.")
numbered_caps(14, "Stack detection",
              "The README text and all file paths are concatenated and matched against fifteen "
              "signature rules, yielding a list of technologies with categories.")
numbered_caps(15, "Generation",
              "Two prompts run concurrently. The first requests prose in five fixed sections; "
              "the second requests strict JSON describing six to ten components and their "
              "connections.")
numbered_caps(16, "Assembly",
              "The outputs, the metadata and the file tree are combined into a single JSON "
              "response that the client stores in one state update.")

line("Three independent mechanisms keep the tool usable when a dependency fails. Every "
     "outbound request carries an explicit abort timeout, so no single slow partner can hold "
     "the request open. The provider cascade tries each configured model in a fixed order and "
     "silently advances on any error, including a missing key, an exhausted quota or an "
     "unparsable response. Finally, a deterministic fallback exists for every AI-dependent "
     "artefact: a template explainer for the prose and a heuristic graph derived from the file "
     "tree for the diagram. The last tier requires no network access beyond GitHub and no "
     "credentials of any kind.", before=10)

section_head("5.2 Data Flow Diagram")
line("The following diagram presents the system as a single process at level 0, showing the "
     "four conversations the application conducts.", after=4)
figure(os.path.join(FIG, "fig_5_1_dfd_level0.png"),
       "Fig. 5.2 (a) \u2014 Level 0 data flow diagram: browser, serverless tier, GitHub and LLM provider")

line("The level 1 diagram below decomposes the system into six processes and four transient data "
     "stores.", after=4)
figure(os.path.join(FIG, "fig_5_2_dfd_level1.png"),
       "Fig. 5.2 (b) \u2014 Level 1 data flow diagram: six processes and four transient stores")

line("1. Developer:", size=12, bold=True, align="left", before=4, after=3, keep=True)
dot("Initiates the system by submitting a repository URL.")
dot("Represents the external entity interacting with the system.")
line("2. Analysis Function:", size=12, bold=True, align="left", before=6, after=3, keep=True)
dot("Receives and validates the request.")
dot("Performs ingestion, detection and generation, then assembles the response.")
line("3. GitHub:", size=12, bold=True, align="left", before=6, after=3, keep=True)
dot("Supplies repository metadata, the recursive file tree and README text.")
dot("Never receives any credential belonging to the end user.")
line("4. LLM Providers:", size=12, bold=True, align="left", before=6, after=3, keep=True)
dot("Receive a fully constructed prompt and return generated text.")
dot("Contacted one at a time, in the order defined by the fallback cascade.")
line("5. Response Assembly:", size=12, bold=True, align="left", before=6, after=3, keep=True)
dot("Normalises, truncates and packages all artefacts into a single JSON object.")
dot("Provides the client with everything the four tabs require in one message.")

section_head("5.3 State Chart Diagram")
line("The state chart describes the lifecycle of the client application rather than the server, "
     "because the server is stateless and therefore has no lifecycle to model.", after=4)
figure(os.path.join(FIG, "fig_5_3_state_chart.png"),
       "Fig. 5.3 \u2014 State chart diagram of the client application lifecycle")

line("IDLE is the initial state, in which the interface shows an empty prompt and the example "
     "repository shortcuts. SUBMITTING is entered when the form is submitted with a non-empty "
     "URL: the submit button is disabled and the loading indicator appears. INGESTING and "
     "GENERATING correspond to the two halves of the server's work; from the client's point of "
     "view they are a single wait, but the distinction matters for failure diagnosis. ERROR is "
     "entered when the request fails outright, and a retry returns the machine to SUBMITTING. "
     "RESULTS READY exposes four sibling tab states that are purely local: switching tabs never "
     "issues another analysis request, although the Files tab fetches file contents and the Chat "
     "tab posts questions.")

section_head("5.4 Sequence Diagram")
line("The sequence diagram illustrates the ordering of messages for the principal use case, "
     "analysing a repository. Five participants are involved: the developer, the browser, the "
     "analysis function, GitHub and one LLM provider.", after=4)
figure(os.path.join(FIG, "fig_5_4_sequence.png"),
       "Fig. 5.4 \u2014 Sequence diagram for the analyse-a-repository use case", width=5.8)

line("Two properties of this sequence are worth emphasising. First, the browser is absent from "
     "every message after the third: it neither contacts GitHub nor contacts the AI provider, "
     "which is what allows all credentials to remain on the server. Second, the response is a "
     "single message. Because the client performs one state update, there are no partial or "
     "inconsistent renderings, and the whole interaction is trivially retryable. The parallel "
     "region between steps eleven and twelve reflects the implementation: the explanation "
     "prompt and the architecture prompt are dispatched with Promise.all so that the two model "
     "calls overlap.")

section_head("5.5 Schemas Used")
line("The application persists no data, so it defines no database schema. It does, however, pass "
     "structured objects between its own modules, and these contracts are as important as "
     "database tables would be in a conventional system.", after=6)

line("REPOSITORY METADATA SCHEMA:", size=12, bold=True, align="left", before=8, after=4, keep=True)
table(["ATTRIBUTES", "TYPE", "DESCRIPTION"],
      [["owner", "String", "GitHub account that owns the repository"],
       ["repo", "String", "Repository name"],
       ["fullName", "String", "owner/repo, as displayed in the header"],
       ["description", "String", "Short description, empty if none"],
       ["stars / forks / openIssues", "Number", "Social and maintenance counters"],
       ["language", "String", "GitHub's primary-language guess"],
       ["topics", "Array", "Repository topics"],
       ["license", "String", "SPDX identifier or human name"],
       ["defaultBranch", "String", "Branch used for all subsequent fetches"],
       ["avatarUrl / htmlUrl", "String", "Owner avatar and canonical repository URL"]],
      widths=[1.7, 0.9, 3.2])

line("FILE TREE ENTRY SCHEMA:", size=12, bold=True, align="left", before=8, after=4, keep=True)
table(["ATTRIBUTES", "TYPE", "DESCRIPTION"],
      [["path", "String", "Repository-relative path, e.g. src/components/Chatbot.jsx"],
       ["type", "Enum", "file or directory, translated from git's blob / tree"],
       ["size", "Number", "Size in bytes; zero for directories"]],
      widths=[1.7, 0.9, 3.2])

line("ARCHITECTURE GRAPH SCHEMA (REACTFLOW):", size=12, bold=True, align="left",
     before=8, after=4, keep=True)
table(["ATTRIBUTES", "TYPE", "DESCRIPTION"],
      [["nodes[ ].id", "String", "Unique node identifier"],
       ["nodes[ ].type", "Enum", "start, ui, api, service, database, cache, worker, end"],
       ["nodes[ ].position", "Object", "Canvas coordinates {x, y}, recomputed client-side"],
       ["nodes[ ].data.label", "String", "Component name shown on the card"],
       ["nodes[ ].data.tech", "String", "Technology pill, e.g. PostgreSQL"],
       ["nodes[ ].data.description", "String", "One-line responsibility"],
       ["edges[ ].source / target", "String", "Node identifiers the edge connects"],
       ["edges[ ].label", "String", "Verb describing the flow, e.g. Queries"],
       ["edges[ ].animated", "Boolean", "Whether the edge is animated on the canvas"]],
      widths=[1.7, 0.9, 3.2])

line("API REQUEST AND RESPONSE SCHEMA:", size=12, bold=True, align="left", before=8, after=4, keep=True)
table(["ENDPOINT", "METHOD", "REQUEST BODY", "RESPONSE"],
      [["/api/analyze", "POST", "{ url }",
        "{ meta, explanation, highlights, techStack, architecture, fileTree, providerUsed }"],
       ["/api/chat", "POST", "{ messages[ ], repoContext, apiKeys }", "{ message, provider }"],
       ["/api/file", "GET", "Query: owner, repo, path, branch", "{ content, path, branch }"],
       ["/api/file", "POST", "{ action: 'explain', path, content }", "{ explanation }"]],
      widths=[1.05, 0.65, 1.85, 2.25],
      font_size=8.5)

section_head("5.6 Technology Used")
line("React Stack:", size=12, bold=True, align="left", before=4, after=4, keep=True)
dot("A component-based library for building the single-page interface.")
dot("Its declarative model and hooks-based state management allow the entire application state "
    "to live in one component and flow downward as props, keeping the tab views free of shared "
    "mutable state.")
dot("Vite 5 provides the build tooling: fast hot-module replacement in development and an "
    "optimised production bundle. Its plugin API installs the middleware that emulates "
    "serverless routing locally.")
dot("ReactFlow 11 renders the node-and-edge architecture graph, supplying panning, zooming, "
    "minimisation, edge creation and custom node components without a hand-written layout "
    "engine.")

line("Backend Stack:", size=12, bold=True, align="left", before=8, after=4, keep=True)
dot("Node.js serverless functions: the three API endpoints are plain exported handlers that "
    "receive a request and a response object.")
dot("The same signature is understood by Vercel's runtime and reproduced locally by the "
    "development middleware, so one implementation serves both environments.")
dot("GitHub REST API v3 supplies repository metadata and the recursive git tree; conditional "
    "headers, media types and rate-limit headers are all honoured.")
dot("The raw content host serves README and individual file contents as plain text without JSON "
    "wrapping or authentication, which is materially faster for file retrieval.")

line("Generative AI Layer:", size=12, bold=True, align="left", before=8, after=4, keep=True)
dot("Large Language Models: four commercial providers are supported through a common adapter "
    "interface.")
dot("Grok is used for conversational phrasing, Gemini for structured and low-latency output, "
    "DeepSeek for cost-efficient reasoning, and OpenRouter for access to free open-weights "
    "models.")
dot("The architecture prompt additionally asks the model to emit strict JSON, which is "
    "validated and normalised before use; an invalid response simply advances the cascade.")

line("Styling:", size=12, bold=True, align="left", before=8, after=4, keep=True)
dot("The design system is implemented with roughly twenty CSS custom properties and a single "
    "dark-theme override block.")
dot("Theming therefore requires no JavaScript beyond toggling one attribute on the document "
    "element.")

section_head("5.7 Software and Hardware Requirements")

line("HARDWARE REQUIREMENTS:-", size=12, bold=True, align="left", before=4, after=6, keep=True)
line("CLIENT SIDE:-", size=11.5, bold=True, align="left", indent=0.35, before=2, after=4, keep=True)
for k, v in [("Processor", "Dual-core 1.6 GHz or above"),
             ("Ram", "2 GB minimum, 4 GB recommended"),
             ("Storage", "None (fully web-hosted)"),
             ("Display", "1280 \u00d7 720 or above"),
             ("Network", "Broadband connection")]:
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.55)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.3
    p.paragraph_format.tab_stops.add_tab_stop(Inches(2.35), WD_ALIGN_PARAGRAPH.LEFT)
    r = p.add_run("\u2022  " + k)
    r.font.size = Pt(11.5)
    r2 = p.add_run(" : ")
    r2.font.size = Pt(11.5)
    r3 = p.add_run(v)
    r3.font.size = Pt(11.5)

line("DEVELOPER SIDE:-", size=11.5, bold=True, align="left", indent=0.35, before=10, after=4, keep=True)
for k, v in [("Processor", "Intel Core i5 (8th gen) or equivalent"),
             ("Ram", "8 GB or above"),
             ("Storage", "200 GB free"),
             ("Network", "Broadband for dependency install and API calls")]:
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.55)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.3
    r = p.add_run("\u2022  " + k)
    r.font.size = Pt(11.5)
    r2 = p.add_run(" : ")
    r2.font.size = Pt(11.5)
    r3 = p.add_run(v)
    r3.font.size = Pt(11.5)

line("SOFTWARE REQUIREMENTS:-", size=12, bold=True, align="left", before=14, after=6, keep=True)
line("CLIENT SIDE:-", size=11.5, bold=True, align="left", indent=0.35, before=2, after=4, keep=True)
for k, v in [("Operating System", "Windows, macOS, Linux, Android or iOS"),
             ("Browser", "Chrome, Edge, Firefox or Safari (current version)"),
             ("Runtime", "None \u2014 no installation required")]:
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.55)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.3
    r = p.add_run("\u2022  " + k)
    r.font.size = Pt(11.5)
    r2 = p.add_run(" : ")
    r2.font.size = Pt(11.5)
    r3 = p.add_run(v)
    r3.font.size = Pt(11.5)

line("DEVELOPER SIDE:-", size=11.5, bold=True, align="left", indent=0.35, before=10, after=4, keep=True)
for k, v in [("Operating System", "Windows 10/11, macOS or Linux"),
             ("Runtime", "Node.js 18 LTS or above; npm 9 or above"),
             ("Developer Environment", "Visual Studio Code or equivalent"),
             ("Dependencies", "React 18, ReactFlow 11, Vite 5 (installed via npm)"),
             ("Environment Variables", "Optional API keys for Grok, Gemini, DeepSeek and OpenRouter"),
             ("Deployment", "Vercel account (or any Node-capable host)"),
             ("Documentation Tools", "MS Word, MS PowerPoint, draw.io")]:
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.55)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.3
    r = p.add_run("\u2022  " + k)
    r.font.size = Pt(11.5)
    r2 = p.add_run(" : ")
    r2.font.size = Pt(11.5)
    r3 = p.add_run(v)
    r3.font.size = Pt(11.5)

# ══════════════════════════════════════════════════════════════════════════════
# 6. PERT CHART
# ══════════════════════════════════════════════════════════════════════════════
chapter_head("6.", "PERT CHART")

line("GREEN \u2014 COMPLETED TASKS", size=11, bold=True, align="left", after=2)
line("ORANGE \u2014 ONGOING TASK", size=11, bold=True, align="left", after=2)
line("BROWN \u2014 TASKS YET TO BE DONE", size=11, bold=True, align="left", after=12)

line("The project was planned as twelve tasks with explicit dependencies. Earliest start and "
     "finish times were computed by a forward pass, latest start and finish times by a backward "
     "pass, and the float of each task is the difference between the two. Tasks with zero float "
     "form the critical path and therefore determine the project duration.", after=8)

table(["ID", "TASK", "DURATION (WEEKS)", "PREDECESSOR", "ES", "EF", "LS", "LF", "FLOAT"],
      [["A", "Literature survey & requirements", "2.0", "\u2014", "0.0", "2.0", "0.0", "2.0", "0.0"],
       ["B", "System architecture & API contract", "1.0", "A", "2.0", "3.0", "2.0", "3.0", "0.0"],
       ["C", "Frontend scaffold (Vite + React)", "1.0", "B", "3.0", "4.0", "7.0", "8.0", "4.0"],
       ["D", "GitHub ingestion module", "1.5", "B", "3.0", "4.5", "3.0", "4.5", "0.0"],
       ["E", "Tech-stack detector", "1.0", "D", "4.5", "5.5", "10.0", "11.0", "5.5"],
       ["F", "Prompt design & LLM cascade", "2.0", "D", "4.5", "6.5", "4.5", "6.5", "0.0"],
       ["G", "Architecture generator + fallback", "1.5", "F", "6.5", "8.0", "6.5", "8.0", "0.0"],
       ["H", "Interactive ReactFlow diagram", "2.0", "C, G", "8.0", "10.0", "8.0", "10.0", "0.0"],
       ["I", "Chatbot UI + offline answer engine", "1.5", "F", "6.5", "8.0", "8.5", "10.0", "2.0"],
       ["J", "Code explorer + file explainer", "1.5", "D", "4.5", "6.0", "8.5", "10.0", "4.0"],
       ["K", "No-key resilience, theming, responsive", "1.0", "H, I, J", "10.0", "11.0", "10.0", "11.0", "0.0"],
       ["L", "Testing, Vercel deployment, docs", "1.5", "K, E", "11.0", "12.5", "11.0", "12.5", "0.0"]],
      widths=[0.32, 2.3, 0.72, 0.72, 0.42, 0.42, 0.42, 0.42, 0.48],
      font_size=8.0)

line("The critical path is A \u2192 B \u2192 D \u2192 F \u2192 G \u2192 H \u2192 K \u2192 L, giving an estimated "
     "project duration of 12.5 weeks. The largest float belongs to the technology detector "
     "(5.5 weeks), which can be developed alongside the ingestion module without delaying the "
     "schedule.", after=8)

figure(os.path.join(FIG, "fig_6_1_pert_network.png"),
       "Fig. 6.1 \u2014 PERT network with the critical path highlighted")
figure(os.path.join(FIG, "fig_6_2_gantt.png"),
       "Fig. 6.2 \u2014 Gantt chart of the project schedule")

# ══════════════════════════════════════════════════════════════════════════════
# 7. FUTURE SCOPE
# ══════════════════════════════════════════════════════════════════════════════
chapter_head("7.", "FUTURE SCOPE")

SCOPE = [
    ("Semantic Retrieval over the Codebase",
     ["The current system sends only the README, the file tree and the detected stack to the model.",
      "Indexing file contents by embedding and retrieving the most relevant chunks would let the "
      "assistant answer questions about implementation details rather than merely about structure."]),
    ("True Dependency-Graph Extraction",
     ["The architecture graph is currently inferred by the model from file paths.",
      "Parsing import statements to derive the real module graph would raise the ceiling on "
      "accuracy."]),
    ("Persistent Workspaces",
     ["Storing analyses per user would allow side-by-side comparison of two repositories.",
      "It would also enable tracking of architectural drift across successive releases and "
      "exportable reports."]),
    ("Private Repositories",
     ["Supporting GitHub OAuth would extend the tool to any repository the user can already access.",
      "This removes the need to paste a personal access token by hand."]),
    ("Streaming Responses",
     ["Both analysis calls currently resolve as a single response.",
      "Streaming tokens would reduce perceived latency substantially, especially when a provider "
      "is slow."]),
    ("Provider Health and Cost Telemetry",
     ["Recording which provider answered, how long it took and why others failed would turn the "
      "silent cascade into an observable system.",
      "It would also allow the cascade order to be tuned automatically."]),
    ("Multi-Language Entry-Point Detection",
     ["Detecting the true entry point \u2014 main, index, app or a framework-specific convention "
      "\u2014 would improve both the explanation and the architecture graph."]),
    ("Evaluation Harness",
     ["A small benchmark of repositories with hand-written reference explanations would make "
      "changes to the prompts measurable rather than anecdotal."]),
    ("Diagram Exports",
     ["Exporting the architecture canvas to Mermaid, SVG and PNG would let users embed the "
      "generated diagram directly in a README or a report."]),
    ("Rate Limiting and Abuse Protection",
     ["A per-IP quota on the public deployment would prevent an anonymous visitor from "
      "exhausting the owner's provider quota."]),
]
for i, (title, points) in enumerate(SCOPE, 1):
    line(f"{i}. {title}:", size=12, bold=True, align="left", before=8, after=3, keep=True)
    for pt in points:
        dot(pt, indent=0.42)

# ══════════════════════════════════════════════════════════════════════════════
# 8. CONCLUSION
# ══════════════════════════════════════════════════════════════════════════════
chapter_head("8.", "CONCLUSION")

line("In conclusion, Repository Explainer demonstrates that a small, carefully structured "
     "application can deliver a genuinely useful form of developer intelligence. By restricting "
     "itself to three serverless functions, one page of application state and a handful of "
     "well-defined contracts, the system achieves what much larger tools struggle to offer: a "
     "single-input workflow that returns an explanation, an architecture diagram, a "
     "conversational assistant and a code browser for any public repository.")

line("The project's principal engineering contribution is not the use of a large language model "
     "\u2014 that is now commonplace \u2014 but the discipline with which the model is "
     "surrounded. Ingestion is performed against real APIs, vocabulary is translated at the "
     "boundary, prompts are assembled from retrieved facts rather than from the model's memory, "
     "every outbound call is time-boxed, and every AI-dependent artefact has a deterministic "
     "fallback. The consequence is a tool whose behaviour degrades in a predictable and "
     "observable way instead of failing silently.")

line("Equally important is what the system refuses to do. It stores nothing, so it carries no "
     "privacy obligation. It contacts no service with a credential the user has not provided. It "
     "writes to no external system, so it cannot corrupt a repository. And it never hides which "
     "provider produced an answer, giving the user a basis for judging the reliability of the "
     "output.")

line("The project also produced a concrete lesson about grounding. In every configuration "
     "tested, the quality of the output depended far more on whether the right repository "
     "context was supplied than on which model was selected. A three-billion-parameter free "
     "model, given an accurate file tree and a real README, produced a more useful explanation "
     "than a frontier model given an empty prompt. This is the central insight the "
     "implementation encodes: retrieval determines quality, and the model merely renders it.")

line("The immediate next steps are semantic retrieval over file contents, extraction of a "
     "genuine dependency graph, and streaming responses. Together these would move the tool from "
     "explaining a repository's shape to explaining its behaviour, while preserving the "
     "properties that make it useful in an academic setting \u2014 zero cost, zero installation, "
     "and a single URL.")

# ══════════════════════════════════════════════════════════════════════════════
# REFERENCES
# ══════════════════════════════════════════════════════════════════════════════
chapter_head("", "REFERENCES")

REFS = [
    "Chen, M., Tworek, J., Jun, H., Yuan, Q., Pinto, H. P. de O., Kaplan, J., Edwards, H., Burda, "
    "Y., Joseph, N., Brockman, G., et al. (2021). Evaluating Large Language Models Trained on "
    "Code. arXiv:2107.03374.",
    "Liu, T., Xu, C., & McAuley, J. (2023). RepoBench: Benchmarking Repository-Level Code "
    "Auto-Completion Systems. arXiv:2306.03091. Published at ICLR 2024.",
    "Ahmed, T., & Devanbu, P. (2022). Few-shot training LLMs for project-specific "
    "code-summarization. Proceedings of ASE '22. DOI: 10.1145/3551349.3559555.",
    "Feng, Z., Guo, D., Tang, D., Duan, N., Feng, X., Gong, M., et al. (2020). CodeBERT: A "
    "Pre-Trained Model for Programming and Natural Languages. Findings of EMNLP 2020. "
    "arXiv:2002.08155.",
    "Guo, D., Ren, S., Lu, S., Feng, Z., Tang, D., Liu, S., et al. (2021). GraphCodeBERT: "
    "Pre-training Code Representations with Data Flow. ICLR 2021. arXiv:2009.08366.",
    "Moreno, L., Aponte, J., Sridhara, G., Marcus, A., Pollock, L., & Vijay-Shanker, K. (2013). "
    "Automatic generation of natural language summaries for Java classes. ICPC 2013, pp. 23-32. "
    "DOI: 10.1109/ICPC.2013.6613830.",
    "Lu, S., Guo, D., Ren, S., Huang, J., Svyatkovskiy, A., Blanco, A., et al. (2021). "
    "CodeXGLUE: A Machine Learning Benchmark Dataset for Code Understanding and Generation. "
    "NeurIPS Datasets and Benchmarks. arXiv:2102.04664.",
    "Nijkamp, E., Pang, B., Hayashi, M., Tu, L., Wang, H., Zhou, Y., Savarese, S., & Xiong, C. "
    "(2023). CodeGen: An Open Large Language Model for Code with Multi-Turn Program Synthesis. "
    "ICLR 2023. arXiv:2203.13474.",
    "Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., et al. (2020). "
    "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. NeurIPS 33. "
    "arXiv:2005.11401.",
    "GitHub, Inc. (2024). GitHub REST API Documentation \u2014 Repositories and Git Trees. "
    "https://docs.github.com/en/rest",
    "Vercel, Inc. (2025). Vercel Functions: Node.js Runtime Documentation. "
    "https://vercel.com/docs/functions",
    "Meta Open Source (2024). React Flow \u2014 Library Documentation, version 11. "
    "https://reactflow.dev",
]
for i, ref in enumerate(REFS, 1):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.38)
    p.paragraph_format.first_line_indent = Inches(-0.38)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.25
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = p.add_run(f"{i}.  ")
    r.bold = True
    r.font.size = Pt(10.5)
    r2 = p.add_run(ref)
    r2.font.size = Pt(10.5)

doc.save(OUTFILE)
print("WROTE:", os.path.abspath(OUTFILE))
