#!/usr/bin/env python3
"""Builds Repository-Explainer-Synopsis.docx following the supplied template format."""
import os
from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

HERE = os.path.dirname(os.path.abspath(__file__))
FIG = os.path.join(HERE, "figures")
OUTFILE = os.path.join(os.path.dirname(HERE), "..", "Repository-Explainer-Synopsis.docx")

INK = RGBColor(0x11, 0x11, 0x11)
MUTED = RGBColor(0x44, 0x44, 0x44)

doc = Document()

# ── page setup ────────────────────────────────────────────────────────────────
for s in doc.sections:
    s.page_width = Inches(8.27)      # A4
    s.page_height = Inches(11.69)
    s.top_margin = Inches(1.0)
    s.bottom_margin = Inches(1.0)
    s.left_margin = Inches(1.25)
    s.right_margin = Inches(1.0)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Times New Roman"
normal.font.size = Pt(12)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.5
rpr = normal.element.get_or_add_rPr()
rfonts = rpr.get_or_add_rFonts()
rfonts.set(qn("w:eastAsia"), "Times New Roman")


def _page_number_footer():
    footer = doc.sections[0].footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    run._r.addnext(fld)


def h(text, level=1, space_before=18, space_after=8, page_break=False):
    p = doc.add_paragraph()
    if page_break:
        p.paragraph_format.page_break_before = True
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.keep_with_next = True
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(text)
    r.bold = True
    r.font.name = "Times New Roman"
    if level == 1:
        r.font.size = Pt(14)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif level == 2:
        r.font.size = Pt(12.5)
    else:
        r.font.size = Pt(12)
    r.font.color.rgb = INK
    return p


def para(text, bold_lead=None, justify=True, indent=0.0, space_after=6, size=12, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.5
    if indent:
        p.paragraph_format.left_indent = Inches(indent)
    if justify:
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if bold_lead:
        r = p.add_run(bold_lead)
        r.bold = True
        r.font.size = Pt(size)
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.italic = italic
    return p


def bullet(text, bold_lead=None, indent=0.28):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.left_indent = Inches(indent)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.35
    if bold_lead:
        r = p.add_run(bold_lead)
        r.bold = True
    p.add_run(text)
    for run in p.runs:
        run.font.size = Pt(11.5)
        run.font.name = "Times New Roman"
    return p


def figure(path, caption, width=6.0):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.add_run().add_picture(path, width=Inches(width))
    c = doc.add_paragraph()
    c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    c.paragraph_format.space_after = Pt(14)
    r = c.add_run(caption)
    r.italic = True
    r.font.size = Pt(10)
    r.font.color.rgb = MUTED


def table(headers, rows, widths=None, font_size=9.5, header_fill="E8EDF5"):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t.rows[0].cells
    for i, txt in enumerate(headers):
        hdr[i].text = ""
        p = hdr[i].paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(txt)
        r.bold = True
        r.font.size = Pt(font_size)
        shd = OxmlElement("w:shd")
        shd.set(qn("w:fill"), header_fill)
        hdr[i]._tc.get_or_add_tcPr().append(shd)
    for row in rows:
        cells = t.add_row().cells
        for i, txt in enumerate(row):
            cells[i].text = ""
            p = cells[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(str(txt))
            r.font.size = Pt(font_size)
    if widths:
        for row in t.rows:
            for i, w in enumerate(widths):
                row.cells[i].width = Inches(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return t


# ══════════════════════════════════════════════════════════════════════════════
# TITLE PAGE
# ══════════════════════════════════════════════════════════════════════════════
for _ in range(2):
    doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("PROJECT SYNOPSIS")
r.bold = True
r.font.size = Pt(16)
r.font.name = "Times New Roman"

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(6)
r = p.add_run("ON")
r.font.size = Pt(12)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(14)
p.paragraph_format.space_after = Pt(6)
r = p.add_run("REPOSITORY EXPLAINER")
r.bold = True
r.font.size = Pt(24)
r.font.name = "Times New Roman"

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("An AI-Assisted Platform for Understanding Any GitHub Repository\nin Plain English")
r.italic = True
r.font.size = Pt(13)

for _ in range(3):
    doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("Submitted in partial fulfilment of the requirements for the award of the degree of")
r.font.size = Pt(11)
r.italic = True

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(10)
r = p.add_run("BACHELOR OF TECHNOLOGY")
r.bold = True
r.font.size = Pt(14)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("in")
r.font.size = Pt(11)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("COMPUTER SCIENCE & ENGINEERING")
r.bold = True
r.font.size = Pt(13)

for _ in range(3):
    doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("Submitted by")
r.font.size = Pt(11)
r.italic = True

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(8)
r = p.add_run("UTKARSH AGRAWAL")
r.bold = True
r.font.size = Pt(14)

for _ in range(4):
    doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING")
r.bold = True
r.font.size = Pt(11.5)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("SESSION 2025–26")
r.bold = True
r.font.size = Pt(11.5)

# ══════════════════════════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ══════════════════════════════════════════════════════════════════════════════
p = doc.add_paragraph()
p.paragraph_format.page_break_before = True
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("CONTENTS")
r.bold = True
r.font.size = Pt(14)
p.paragraph_format.space_after = Pt(18)

toc = [
    ("1.", "INTRODUCTION", "1"),
    ("2.", "PROBLEM STATEMENT", "2"),
    ("3.", "OBJECTIVE", "3"),
    ("", "3.1  Primary Objectives", "3"),
    ("", "3.2  Secondary Objectives", "4"),
    ("4.", "LITERATURE SURVEY", "5"),
    ("4.1", "Background Information", "5"),
    ("4.2", "Comparison Between Existing Systems", "6"),
    ("4.3", "Findings of Survey (Areas of Improvement)", "7"),
    ("5.", "METHODOLOGY", "8"),
    ("5.1", "Preliminary System Description", "8"),
    ("5.2", "Data Flow Diagram", "11"),
    ("5.3", "State Chart Diagram", "13"),
    ("5.4", "Sequence Diagram", "14"),
    ("5.5", "Schemas Used", "15"),
    ("5.6", "Technology Used", "16"),
    ("5.7", "Hardware and Software Requirements", "17"),
    ("6.", "PERT CHART", "18"),
    ("7.", "FUTURE SCOPE", "19"),
    ("8.", "CONCLUSION", "20"),
    ("", "REFERENCES", "21"),
]

for num, title, page in toc:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.4
    p.paragraph_format.tab_stops.add_tab_stop(Inches(5.85), WD_ALIGN_PARAGRAPH.RIGHT)
    r = p.add_run(f"{num:<6}{title}")
    r.font.size = Pt(11.5)
    r2 = p.add_run(f"\t{page}")
    r2.font.size = Pt(11.5)

# ══════════════════════════════════════════════════════════════════════════════
# 1. INTRODUCTION
# ══════════════════════════════════════════════════════════════════════════════
h("1.  INTRODUCTION", page_break=True)

para("Modern software development is built on top of open-source code. GitHub alone hosts more than "
     "four hundred million repositories, and a student, a recruiter, or an engineer who wants to "
     "evaluate one of them faces the same obstacle every time: the codebase is large, the "
     "documentation is written for people who already understand the project, and the README often "
     "describes what the project is rather than how it works. Reading an unfamiliar repository "
     "end-to-end is slow, and most people abandon the attempt after a few minutes.")

para("Repository Explainer is a web-based developer-intelligence tool that solves this problem. A "
     "user pastes a single public GitHub URL into the application. The system retrieves the "
     "repository's README and its complete file tree directly from GitHub, performs a rule-based "
     "analysis of its technology stack, and then uses a Large Language Model to produce two "
     "different artefacts: a structured plain-English explanation of the project and a visual "
     "architecture diagram of how its components interact. The same repository context is then "
     "reused to power a conversational question-and-answer assistant and an interactive file "
     "browser with per-file explanations.")

para("The application is implemented as a React single-page application served together with three "
     "serverless API functions. A central design decision is provider independence: instead of "
     "committing to one AI vendor, the backend contains an ordered cascade of five providers — "
     "Grok, Google Gemini, DeepSeek, OpenRouter, and a deterministic built-in template generator. "
     "If a key is missing, a quota is exhausted, or a request times out, the system silently "
     "advances to the next provider. The result is a tool that remains completely functional even "
     "when it is deployed with no API keys at all, which makes it usable in academic settings where "
     "paid credentials are unavailable.")

para("Repository Explainer targets four audiences: students who need to understand a reference "
     "implementation before an examination or project; developers evaluating an unfamiliar "
     "dependency before adopting it; recruiters and reviewers who need to assess a candidate's "
     "codebase quickly; and maintainers who want a second, automatically generated view of their "
     "own architecture. The project demonstrates how retrieval of real repository data can be "
     "coupled with generative AI to produce an explanation that is grounded in the actual files "
     "rather than produced from the model's general knowledge.")

# ══════════════════════════════════════════════════════════════════════════════
# 2. PROBLEM STATEMENT
# ══════════════════════════════════════════════════════════════════════════════
h("2.  PROBLEM STATEMENT", page_break=True)

problems = [
    ("a.  Documentation is written for insiders. ",
     "README files assume prior knowledge of the domain and the stack. They rarely explain how the "
     "parts of a project fit together, which is exactly the information a newcomer needs first."),
    ("b.  Architectural understanding requires reading code. ",
     "To discover how a request travels through an unfamiliar repository, a developer must open "
     "dozens of files and hold the whole flow in memory. There is no automatic summary of the "
     "system's structure."),
    ("c.  Onboarding is slow and repetitive. ",
     "The same orientation questions are asked for every new repository: where is the entry point, "
     "how do I run it, which folders matter, what talks to what. Each answer currently requires "
     "manual exploration."),
    ("d.  Generic AI assistants lack repository context. ",
     "A general-purpose chatbot has not seen the repository being discussed. Answers it produces "
     "are generic, and it cannot cite real file paths unless the relevant text is supplied to it."),
    ("e.  Existing code-intelligence tools are heavyweight. ",
     "Sourcegraph, GitHub Copilot Chat, and similar products require installation, index building, "
     "authentication, or a paid subscription. A student who wants to inspect one repository for "
     "ten minutes cannot justify any of that."),
    ("f.  Dependence on a single AI vendor is fragile. ",
     "Tools that hard-code one provider stop working the moment that provider's free tier is "
     "withdrawn, its quota is exhausted, or its key expires."),
]
for lead, body in problems:
    para(body, bold_lead=lead)

# ══════════════════════════════════════════════════════════════════════════════
# 3. OBJECTIVE
# ══════════════════════════════════════════════════════════════════════════════
h("3.  OBJECTIVE", page_break=True)
h("3.1  Primary Objectives", level=2)

primary = [
    ("a.  Accept any public repository with one input. ",
     "Validate and parse a GitHub URL in its several forms, including HTTPS, owner/repo shorthand, "
     "and branch-specific tree URLs, and reject malformed input with a clear message."),
    ("b.  Ingest real repository facts. ",
     "Retrieve metadata, README text, and the complete recursive file tree from the GitHub REST API "
     "and the raw content host, with graceful placeholders when a fetch fails."),
    ("c.  Generate a plain-English explanation. ",
     "Produce a structured explanation covering what the project does, how it works step by step, "
     "what it is built with, how to run it, and who should use it, using grounded repository data."),
    ("d.  Generate an interactive architecture diagram. ",
     "Produce a machine-readable node-and-edge graph describing the system's components and data "
     "flow, and render it as an editable, zoomable canvas."),
    ("e.  Provide contextual question answering. ",
     "Answer follow-up questions about the specific repository using its files, technology stack, "
     "architecture, and documentation as context."),
    ("f.  Enable code exploration. ",
     "Allow the user to browse the file tree, read any file with line numbers, and request an "
     "explanation of an individual file."),
]
for lead, body in primary:
    para(body, bold_lead=lead)

h("3.2  Secondary Objectives", level=2)
secondary = [
    ("g.  Multi-provider resilience. ",
     "Implement an ordered fallback cascade across five LLM providers so that a single failure "
     "never degrades the user experience."),
    ("h.  Zero-configuration operability. ",
     "Guarantee a meaningful result with no API keys by combining a deterministic technology "
     "detector, a template-based explainer, and a heuristic architecture generator."),
    ("i.  Cost and abuse control. ",
     "Bound every outbound request with an explicit timeout, cap the volume of context sent to the "
     "model, and avoid persisting any repository data on the server."),
    ("j.  Accessibility and usability. ",
     "Deliver a responsive, keyboard-accessible interface in both light and dark themes with no "
     "build-time dependency on an external design system."),
]
for lead, body in secondary:
    para(body, bold_lead=lead)

# ══════════════════════════════════════════════════════════════════════════════
# 4. LITERATURE SURVEY
# ══════════════════════════════════════════════════════════════════════════════
h("4.  LITERATURE SURVEY", page_break=True)
h("4.1  Background Information", level=2)

para("The problem of helping a developer understand unfamiliar source code has a long research "
     "history, and it can be traced through four distinct stages.")

para("The earliest automated approach was source-code summarisation, in which a model reads a single "
     "function and emits a natural-language comment. CodeXGLUE established standard benchmarks for "
     "this task and framed it as a sequence-to-sequence problem. The limitation of this family of "
     "work is granularity: it summarises a function or a file, never a whole system, and it has no "
     "notion of how components interact.", bold_lead="a.  Code summarisation. ")

para("Moreno et al. demonstrated that developers benefit substantially from textual and visual "
     "summaries of source code, and that a stereotype-based summary of a class is more useful to a "
     "maintainer than a raw listing of its methods. This finding motivates the architecture diagram "
     "in the present project: an abstract visual overview communicates structure faster than code.",
     bold_lead="b.  Program comprehension and visualisation. ")

para("CodeBERT and GraphCodeBERT showed that pre-training a transformer on both natural language and "
     "programming languages, augmented with data-flow information, produces representations that "
     "transfer well to code search and summarisation. GraphCodeBERT's explicit modelling of data "
     "flow is the conceptual ancestor of the node-and-edge representation used for the architecture "
     "graph in this project.", bold_lead="c.  Pre-trained models for code. ")

para("Codex established that large language models scaled on public code can generate working "
     "programs from natural-language descriptions, and HumanEval became the standard measure of that "
     "capability. A parallel line of work on code summarisation by Ahmed and Devanbu found that "
     "providing project-specific examples in the prompt, rather than fine-tuning, already surpasses "
     "earlier state-of-the-art models, with roughly ten in-context samples sufficient.",
     bold_lead="d.  Large language models for code. ")

para("The most recent stage recognises that real understanding must span a repository rather than a "
     "single file. RepoBench introduced three connected tasks — cross-file retrieval, next-line "
     "completion, and an end-to-end pipeline — to measure whether a system can locate relevant code "
     "elsewhere in the repository and then use it. The benchmark formalises the exact capability this "
     "project requires: the ability to select the right slice of a large codebase as context. A "
     "companion trend is retrieval-augmented generation, in which the context supplied to the model "
     "is selected programmatically instead of being left to the model's memory.",
     bold_lead="e.  Repository-level understanding. ")

para("Repository Explainer sits at the intersection of stages (b) and (e). It does not attempt "
     "next-line code completion; instead it performs coarse retrieval over a repository's README, "
     "file tree, and detected stack, and then asks the model to synthesise a human-oriented summary "
     "and a structural diagram. This is a deliberately lighter-weight goal than repository-level "
     "completion, and it is achievable without training a model or indexing the codebase.")

h("4.2  Comparison Between Existing Systems", level=2, space_before=16)

para("The following table compares the tools that a developer would realistically consider for the "
     "same task. The columns capture the criteria that matter for a student-facing, low-friction "
     "tool.")

table(
    ["Criteria", "GitHub\n(README)", "ChatGPT /\nGemini (web)", "GitHub Copilot\nChat", "Sourcegraph", "Repository\nExplainer"],
    [
        ["Repository context", "Raw text only", "None unless pasted", "Indexed per workspace", "Full code index", "README + tree +\nstack"],
        ["Effort to start", "None", "Copy-paste repo", "Install + auth", "Install + index", "Paste one URL"],
        ["Architecture view", "No", "Text only", "No", "Code graph", "Interactive\ndiagram"],
        ["Per-file explanation", "No", "Only if pasted", "Yes, in editor", "Limited", "Yes, in browser"],
        ["Multi-file question\nanswering", "No", "No", "Yes", "Yes", "Yes (chat tab)"],
        ["Runs with no API key", "Yes, but manual", "No", "No", "No", "Yes (heuristic\nfallback)"],
        ["Cost to the student", "Free", "Free tier", "Paid", "Paid / self-host", "Free"],
        ["Installation required", "No", "No", "Yes (IDE)", "Yes", "No"],
        ["Works on any public\nrepo instantly", "Yes", "No", "No", "Partially", "Yes"],
    ],
    widths=[1.15, 0.85, 0.95, 0.95, 0.85, 1.0],
    font_size=8.5,
)

para("The comparison shows a clear gap. Heavyweight tools index the code but demand installation and "
     "a subscription; general chat assistants are frictionless but have no repository context; and "
     "GitHub itself presents raw text without interpretation. Repository Explainer occupies the "
     "unoccupied middle ground: zero installation, a single URL, and output that is both "
     "architectural and explanatory.")

h("4.3  Findings of Survey (Areas of Improvement)", level=2, space_before=16)

findings = [
    ("a.  Grounding beats eloquence. ",
     "Across the surveyed systems, the usefulness of an answer depends far more on whether the right "
     "context was supplied than on which model produced it. This finding directly shaped the design: "
     "the project invests in ingestion and prompt construction before it invests in model choice."),
    ("b.  Explanations should be layered. ",
     "A single dense paragraph does not serve either a beginner or an expert. The output is therefore "
     "split into an executive summary, five structured sections, and a separate interactive diagram, "
     "so that a reader can stop at their preferred depth."),
    ("c.  Visual structure is under-served. ",
     "Every surveyed code assistant returns prose. None returns a diagram that the user can "
     "manipulate, extend, and export. The ReactFlow canvas is the project's response to this gap."),
    ("d.  Vendor lock-in is a practical risk. ",
     "Free tiers and model names change without warning. A single-provider design is therefore a "
     "maintenance liability, which justifies the five-provider cascade and the offline fallback."),
    ("e.  Silent degradation is the real failure mode. ",
     "The dangerous outcome is not an error message but a confident-looking answer produced from "
     "incomplete context. The project therefore reports which provider answered and bounds every "
     "fetch with an explicit timeout so that degradation is observable."),
]
for lead, body in findings:
    para(body, bold_lead=lead)

# ══════════════════════════════════════════════════════════════════════════════
# 5. METHODOLOGY
# ══════════════════════════════════════════════════════════════════════════════
h("5.  METHODOLOGY", page_break=True)
h("5.1  Preliminary System Description", level=2)

para("The system is a three-tier web application. The presentation tier is a React single-page "
     "application. The application tier consists of three serverless functions. The data tier is "
     "entirely external: GitHub supplies repository content and an AI provider supplies generated "
     "text. The application stores nothing; it is stateless by design, which keeps deployment costs "
     "at zero and removes every data-retention obligation.")

h("5.1.1  Architecture Overview", level=3)
para("The diagram below shows the four conversations the system conducts. The user's browser speaks "
     "only to the application's own server; the server, in turn, speaks to GitHub and to exactly one "
     "AI provider per request.")

figure(os.path.join(FIG, "fig_5_1_dfd_level0.png"),
       "Figure 5.1 — System context: the browser, the serverless tier, GitHub, and the LLM provider",
       width=6.1)

h("5.1.2  Module Description", level=3)
para("Each module has a single responsibility and a narrow interface to the next module. The "
     "responsibilities are enumerated below.")

modules = [
    ("Frontend shell (App.jsx). ",
     "Owns all shared state — repository metadata, explanation, technology stack, architecture graph, "
     "and file tree — and renders the four tab views. It issues exactly one analysis request per URL "
     "and distributes the single response object to its children."),
    ("Explanation view (CodeExplanation.jsx). ",
     "Parses the model's Markdown response into headings, bullet lists, paragraphs, and fenced code "
     "blocks, and renders the executive summary, technology pills, and key takeaways."),
    ("Architecture canvas (ArchitectureFlow.jsx). ",
     "Converts the node-and-edge JSON into a ReactFlow graph with a custom typed node component, and "
     "adds local editing operations: add component, delete component, connect components, switch "
     "between vertical and horizontal layouts, and filter by component category."),
    ("Chat interface (Chatbot.jsx). ",
     "Maintains the conversation thread and resends the accumulated context with each question, "
     "since the LLM API is stateless. Renders the reply with a lightweight Markdown renderer."),
    ("Code explorer (CodeExplorer.jsx). ",
     "Renders a filterable file tree, fetches file contents on demand, displays them with line "
     "numbers, and offers a per-file AI explanation."),
    ("Analysis function (api/analyze.js). ",
     "The backbone of the system. It parses the URL, performs the three GitHub fetches, detects the "
     "technology stack, runs the explanation and architecture generation in parallel, and assembles "
     "the response."),
    ("Chat function (api/chat.js). ",
     "Builds a system prompt from the supplied repository context, runs the provider cascade for a "
     "conversational reply, and falls back to a keyword-driven answer engine that consults the file "
     "tree, the architecture graph, and the documentation."),
    ("File function (api/file.js). ",
     "Serves two purposes: a GET request streams raw file content from the raw content host, and a "
     "POST request with the action 'explain' returns a per-file explanation."),
    ("Provider layer (callGrok, callGemini, callDeepSeek, callOpenRouter). ",
     "Four thin adapters that translate the same logical prompt into each vendor's request shape and "
     "normalise the reply back to a plain string."),
    ("Development middleware (vite.config.js). ",
     "Reproduces Vercel's serverless routing in the local development server so that the same handler "
     "files run unchanged in both environments."),
]
for lead, body in modules:
    para(body, bold_lead=lead)

h("5.1.3  Execution Flow", level=3)
para("A single analysis request passes through the following stages in order.")

steps = [
    "Validation — the request method and the presence of a URL are checked, then the URL is reduced "
    "to an owner, a repository name, and an optional branch hint.",
    "Ingestion — three GitHub reads are issued. Metadata and the recursive file tree come from the "
    "REST API; the README is probed across the detected branch, main, and master, against seven "
    "candidate file names.",
    "Normalisation — git vocabulary is translated into the application's own vocabulary: tree "
    "becomes directory, blob becomes file, stargazers_count becomes stars, and the tree is capped at "
    "three hundred entries.",
    "Stack detection — the README text and all file paths are concatenated and matched against "
    "fifteen signature rules, yielding a list of technologies with categories.",
    "Generation — two prompts run concurrently. The first requests prose in five fixed sections; the "
    "second requests strict JSON describing six to ten components and their connections.",
    "Assembly — the outputs, the metadata, and the file tree are combined into a single JSON "
    "response that the client stores in one state update.",
]
for i, s in enumerate(steps, 1):
    para(s, bold_lead=f"Stage {i}. ")

h("5.1.4  Resilience Strategy", level=3)
para("Three independent mechanisms keep the tool usable when a dependency fails. First, every "
     "outbound request carries an explicit abort timeout, so no single slow partner can hold the "
     "request open. Second, the provider cascade tries each configured model in a fixed order and "
     "silently advances on any error, including a missing key, an exhausted quota, or an unparsable "
     "response. Third, a deterministic fallback path exists for every AI-dependent artefact: a "
     "template explainer for the prose and a heuristic graph derived from the file tree for the "
     "diagram. The final tier requires no network access beyond GitHub and no credentials of any "
     "kind.")

# ══════════════════════════════════════════════════════════════════════════════
# 5.2 DATA FLOW DIAGRAM
# ══════════════════════════════════════════════════════════════════════════════
h("5.2  Data Flow Diagram", level=2, page_break=True)

para("The level 0 diagram in Figure 5.1 presents the system as a single process. The level 1 diagram "
     "below decomposes it into six processes and four transient data stores.")

para("The external entities are the developer, GitHub, the LLM providers, and — in the return path — "
     "the developer's browser acting as the presentation layer.")

para("Process 1.0 validates and parses the URL. Process 2.0 performs ingestion and is the only "
     "process that communicates with GitHub. Process 3.0 applies the technology signature rules. "
     "Processes 4.0 and 5.0 both consume the same context and run concurrently, which is why they are "
     "drawn as siblings rather than sequentially. Process 6.0 assembles and truncates the response.")

para("The data stores D1 to D4 deserve a note. Because the system maintains no database, every store "
     "is request-scoped: D1, D2, and D3 are in-memory buffers that exist only for the duration of one "
     "invocation, and D4 represents the environment variables from which API keys are read. The "
     "client-side React state that receives the final response is the only store that outlives a "
     "request, and it lives in the browser rather than on the server.")

figure(os.path.join(FIG, "fig_5_2_dfd_level1.png"),
       "Figure 5.2 — Level 1 data flow diagram, showing six processes and four transient stores",
       width=6.2)

# ══════════════════════════════════════════════════════════════════════════════
# 5.3 STATE CHART
# ══════════════════════════════════════════════════════════════════════════════
h("5.3  State Chart Diagram", level=2, page_break=True)

para("The state chart describes the lifecycle of the client application rather than of the server, "
     "because the server is stateless and therefore has no lifecycle to model. Five states are "
     "distinguished, together with an error state and a set of local tab states.")

figure(os.path.join(FIG, "fig_5_3_state_chart.png"),
       "Figure 5.3 — State chart of the client application lifecycle", width=6.2)

para("IDLE is the initial state, in which the interface shows an empty prompt and the example "
     "repository shortcuts. SUBMITTING is entered when the form is submitted with a non-empty URL: "
     "the submit button is disabled and the loading indicator appears.")

para("INGESTING and GENERATING correspond to the two halves of the server's work. From the client's "
     "point of view they are a single wait, but the distinction matters for failure diagnosis: an "
     "ingestion failure means GitHub was unreachable or the repository does not exist, whereas a "
     "generation failure means every provider was unavailable and the built-in template was used "
     "instead. In the latter case the user still reaches RESULTS READY, which is the intended "
     "behaviour of the resilience design.")

para("ERROR is entered when the request fails outright — a malformed URL, a missing repository, or a "
     "server-side exception. A retry returns the machine to SUBMITTING. RESULTS READY exposes four "
     "sibling tab states that are purely local: switching tabs never issues another analysis request, "
     "although the Files tab fetches file contents and the Chat tab posts questions. The theme toggle "
     "is orthogonal to this lifecycle; it writes to local storage and re-renders without any state "
     "transition.")

# ══════════════════════════════════════════════════════════════════════════════
# 5.4 SEQUENCE DIAGRAM
# ══════════════════════════════════════════════════════════════════════════════
h("5.4  Sequence Diagram", level=2, page_break=True)

para("The sequence diagram details the ordering of messages for the principal use case, analysing a "
     "repository. Five participants are involved: the developer, the browser, the analysis function, "
     "GitHub, and one LLM provider.")

figure(os.path.join(FIG, "fig_5_4_sequence.png"),
       "Figure 5.4 — Sequence diagram for the analyse-a-repository use case", width=5.9)

para("Two properties of this sequence are worth emphasising. First, the browser is absent from every "
     "message after step three: it neither contacts GitHub nor contacts the AI provider, which is what "
     "allows all credentials to remain on the server. Second, the response is a single message. "
     "Because the client performs one state update, there are no partial or inconsistent renderings, "
     "and the whole interaction is trivially retryable.")

para("The parallel region between steps eleven and twelve reflects the implementation: the "
     "explanation prompt and the architecture prompt are dispatched with Promise.all so that the two "
     "model calls overlap. The fallback chain is drawn as an annotation rather than as a loop because, "
     "in the successful path, exactly one provider is contacted; the remaining providers are "
     "contacted only when an earlier one raises an error.")

# ══════════════════════════════════════════════════════════════════════════════
# 5.5 SCHEMAS USED
# ══════════════════════════════════════════════════════════════════════════════
h("5.5  Schemas Used", level=2, page_break=True)

para("The application persists no data, so it defines no database schema. It does, however, pass "
     "structured objects between its own modules, and these contracts are as important as database "
     "tables would be in a conventional system. The following tables document the four principal "
     "contracts.")

h("5.5.1  Repository Metadata Schema (GitHub → Client)", level=3)
table(
    ["Attribute", "Type", "Description"],
    [
        ["owner", "String", "GitHub account that owns the repository"],
        ["repo", "String", "Repository name"],
        ["fullName", "String", "owner/repo, as displayed in the header"],
        ["description", "String", "Short description, empty if none"],
        ["stars / forks / openIssues", "Number", "Social and maintenance counters"],
        ["language", "String", "GitHub's primary-language guess"],
        ["topics", "Array of String", "Repository topics"],
        ["license", "String", "SPDX identifier or human name"],
        ["defaultBranch", "String", "Branch used for all subsequent fetches"],
        ["avatarUrl / htmlUrl", "String", "Owner avatar and canonical repository URL"],
    ],
    widths=[1.75, 1.35, 3.0],
)

h("5.5.2  File Tree Entry Schema", level=3)
table(
    ["Attribute", "Type", "Description"],
    [
        ["path", "String", "Repository-relative path, e.g. src/components/Chatbot.jsx"],
        ["type", "Enum", "file or directory, translated from git's blob / tree"],
        ["size", "Number", "Size in bytes; zero for directories"],
    ],
    widths=[1.75, 1.35, 3.0],
)

h("5.5.3  Architecture Graph Schema (ReactFlow)", level=3)
table(
    ["Attribute", "Type", "Description"],
    [
        ["nodes[].id", "String", "Unique node identifier"],
        ["nodes[].type", "Enum", "start, ui, api, service, database, cache, worker, end"],
        ["nodes[].position", "{x, y}", "Canvas coordinates, recomputed client-side"],
        ["nodes[].data.label", "String", "Component name shown on the card"],
        ["nodes[].data.tech", "String", "Technology pill, e.g. PostgreSQL"],
        ["nodes[].data.description", "String", "One-line responsibility"],
        ["edges[].source / target", "String", "Node identifiers the edge connects"],
        ["edges[].label", "String", "Verb describing the flow, e.g. Queries"],
        ["edges[].animated", "Boolean", "Whether the edge is animated on the canvas"],
    ],
    widths=[1.75, 1.35, 3.0],
)

h("5.5.4  API Request and Response Contract", level=3)
table(
    ["Endpoint", "Method", "Request Body", "Response"],
    [
        ["/api/analyze", "POST", "{ url }",
         "{ meta, explanation, highlights, techStack, architecture, fileTree, providerUsed }"],
        ["/api/chat", "POST", "{ messages[], repoContext, apiKeys }",
         "{ message, provider }"],
        ["/api/file", "GET", "Query: owner, repo, path, branch",
         "{ content, path, branch }"],
        ["/api/file", "POST", "{ action: 'explain', path, content }",
         "{ explanation }"],
    ],
    widths=[1.1, 0.7, 1.9, 2.4],
    font_size=8.5,
)

# ══════════════════════════════════════════════════════════════════════════════
# 5.6 TECHNOLOGY USED
# ══════════════════════════════════════════════════════════════════════════════
h("5.6  Technology Used", level=2, page_break=True)

techs = [
    ("React 18. ",
     "A component-based library for building the single-page interface. Its declarative model and "
     "hooks-based state management allow the entire application state to live in one component and "
     "flow downward as props, which keeps the tab views free of shared mutable state."),
    ("Vite 5. ",
     "The build tool and development server. Vite provides fast hot-module replacement during "
     "development and produces an optimised, code-split production bundle. Its plugin API is used to "
     "install a middleware that emulates serverless routing locally."),
    ("ReactFlow 11. ",
     "A library for rendering node-and-edge graphs in React. It supplies panning, zooming, "
     "minimisation, edge creation, and custom node components, which is precisely the feature set the "
     "architecture canvas requires without writing a layout engine from scratch."),
    ("Node.js serverless functions. ",
     "The three API endpoints are written as plain exported handlers that receive a request and a "
     "response object. This signature is understood by Vercel's runtime and is reproduced locally by "
     "the development middleware, so one implementation serves both environments."),
    ("GitHub REST API v3. ",
     "Supplies repository metadata and the recursive git tree. Conditional headers, media types, and "
     "rate-limit headers are all honoured by the ingestion layer."),
    ("Raw content host. ",
     "Serves README and individual file contents as plain text without JSON wrapping or "
     "authentication, which is materially faster and simpler for file retrieval than the API."),
    ("Large Language Models. ",
     "Four commercial providers are supported through a common adapter interface: Grok for "
     "conversational phrasing, Gemini for structured and low-latency output, DeepSeek for "
     "cost-efficient reasoning, and OpenRouter for access to free open-weights models. The "
     "architecture prompt additionally asks the model to emit strict JSON, which is validated and "
     "normalised before use."),
    ("CSS custom properties. ",
     "The design system is implemented with roughly twenty custom properties and a single dark-theme "
     "override block. Theming therefore requires no JavaScript beyond toggling one attribute on the "
     "document element."),
]
for lead, body in techs:
    para(body, bold_lead=lead)

# ══════════════════════════════════════════════════════════════════════════════
# 5.7 HARDWARE AND SOFTWARE REQUIREMENTS
# ══════════════════════════════════════════════════════════════════════════════
h("5.7  Hardware and Software Requirements", level=2, page_break=True)

h("Hardware Requirements", level=3)
table(
    ["Component", "Client Side (End User)", "Developer Side"],
    [
        ["Processor", "Any dual-core CPU, 1.6 GHz or above", "Intel Core i5 (8th gen) or equivalent"],
        ["RAM", "2 GB minimum, 4 GB recommended", "8 GB or above"],
        ["Storage", "No local storage required", "200 GB free (tooling, Node modules, caches)"],
        ["Display", "1280 × 720 or above", "1920 × 1080 recommended"],
        ["Network", "Broadband; the app is fully web-hosted", "Broadband for dependency install and API calls"],
    ],
    widths=[1.15, 2.45, 2.5],
)
para("Because the application is deployed on a serverless platform, the end user requires no "
     "installation, no local database, and no compute beyond a modern browser.", italic=True, size=11)

h("Software Requirements", level=3)
table(
    ["Component", "Client Side (End User)", "Developer Side"],
    [
        ["Operating System", "Windows, macOS, Linux, Android, or iOS", "Windows 10/11, macOS, or Linux"],
        ["Browser", "Chrome, Edge, Firefox, or Safari (current)", "Same, with developer tools"],
        ["Runtime", "None", "Node.js 18 LTS or above; npm 9 or above"],
        ["Editor", "None", "Visual Studio Code or equivalent"],
        ["Dependencies", "None", "React 18, ReactFlow 11, Vite 5 (installed via npm)"],
        ["Environment", "None", "Optional API keys for Grok, Gemini, DeepSeek, OpenRouter; optional GitHub token"],
        ["Deployment", "None", "Vercel account (or any Node-capable host)"],
        ["Documentation", "None", "MS Word / Google Docs, draw.io or equivalent"],
    ],
    widths=[1.15, 2.45, 2.5],
)

# ══════════════════════════════════════════════════════════════════════════════
# 6. PERT CHART
# ══════════════════════════════════════════════════════════════════════════════
h("6.  PERT CHART", page_break=True)

para("The project was planned as twelve tasks with explicit dependencies. Earliest start and finish "
     "times were computed by a forward pass, latest start and finish times by a backward pass, and "
     "the float of each task is the difference between the two. Tasks with zero float form the "
     "critical path and therefore determine the project duration.")

table(
    ["ID", "Task", "Duration\n(weeks)", "Predecessor", "ES", "EF", "LS", "LF", "Float"],
    [
        ["A", "Literature survey & requirements", "2.0", "—", "0.0", "2.0", "0.0", "2.0", "0.0"],
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
        ["L", "Testing, Vercel deployment, docs", "1.5", "K, E", "11.0", "12.5", "11.0", "12.5", "0.0"],
    ],
    widths=[0.35, 2.35, 0.65, 0.75, 0.45, 0.45, 0.45, 0.45, 0.5],
    font_size=8.2,
)

para("The critical path is A → B → D → F → G → H → K → L, giving an estimated project duration of "
     "12.5 weeks. The largest float belongs to the technology detector (5.5 weeks), which can be "
     "developed alongside the ingestion module without delaying the schedule. Tasks C, I, and J have "
     "between two and four weeks of float, giving genuine scheduling slack.")

figure(os.path.join(FIG, "fig_6_1_pert_network.png"),
       "Figure 6.1 — PERT network with the critical path highlighted", width=6.2)

para("The Gantt chart below converts the same network into a calendar view. Green bars represent "
     "completed work, amber bars the tasks in progress at the time of writing, and brown bars the "
     "tasks still to be completed. A red rule above a bar marks it as critical; a dotted tail marks "
     "the available float.")

figure(os.path.join(FIG, "fig_6_2_gantt.png"),
       "Figure 6.2 — Gantt chart of the project schedule", width=6.2)

# ══════════════════════════════════════════════════════════════════════════════
# 7. FUTURE SCOPE
# ══════════════════════════════════════════════════════════════════════════════
h("7.  FUTURE SCOPE", page_break=True)

future = [
    ("1.  Semantic retrieval over the codebase. ",
     "The current system sends only the README, the file tree, and the detected stack to the model. "
     "Indexing file contents by embedding and retrieving the most relevant chunks would let the chat "
     "assistant answer questions about implementation details rather than merely about structure."),
    ("2.  True dependency-graph extraction. ",
     "The architecture graph is currently inferred by the model from file paths. Parsing import "
     "statements to derive the real module graph, and accepting cross-file imports as edges, would "
     "raise the ceiling on accuracy."),
    ("3.  Persistent workspaces. ",
     "Storing analyses per user would allow side-by-side comparison of two repositories, tracking of "
     "architectural drift over successive releases, and exportable reports."),
    ("4.  Private repositories. ",
     "Supporting GitHub OAuth would extend the tool from public repositories to any repository the "
     "user can already access, without asking them to paste a personal access token."),
    ("5.  Streaming responses. ",
     "Both analysis calls currently resolve as a single response. Streaming tokens would reduce "
     "perceived latency substantially, especially when a provider is slow."),
    ("6.  Provider health and cost telemetry. ",
     "Recording which provider answered, how long it took, and why others failed would turn the "
     "silent cascade into an observable system and would allow the order to be tuned automatically."),
    ("7.  Multi-language entry-point detection. ",
     "Detecting the true entry point — main, index, app, or a framework-specific convention — would "
     "improve both the explanation and the architecture graph."),
    ("8.  Evaluation harness. ",
     "A small benchmark of repositories with hand-written reference explanations would make changes to "
     "the prompts measurable rather than anecdotal."),
    ("9.  Diagram exports. ",
     "Exporting the architecture canvas to Mermaid, SVG, and PNG would let users embed the generated "
     "diagram directly in a README or a report."),
    ("10.  Rate limiting and abuse protection. ",
     "A per-IP quota on the public deployment would prevent an anonymous visitor from exhausting the "
     "owner's provider quota."),
]
for lead, body in future:
    para(body, bold_lead=lead)

# ══════════════════════════════════════════════════════════════════════════════
# 8. CONCLUSION
# ══════════════════════════════════════════════════════════════════════════════
h("8.  CONCLUSION", page_break=True)

para("Repository Explainer demonstrates that a small, carefully structured application can deliver a "
     "genuinely useful form of developer intelligence. By restricting itself to three serverless "
     "functions, one page of application state, and a handful of well-defined contracts, the system "
     "achieves what much larger tools struggle to offer: a single-input workflow that returns an "
     "explanation, an architecture diagram, a conversational assistant, and a code browser for any "
     "public repository.")

para("The project's principal engineering contribution is not the use of a large language model — that "
     "is now commonplace — but the discipline with which the model is surrounded. Ingestion is "
     "performed against real APIs, vocabulary is translated at the boundary, prompts are assembled "
     "from retrieved facts rather than from the model's memory, every outbound call is time-boxed, "
     "and every AI-dependent artefact has a deterministic fallback. The consequence is a tool whose "
     "behaviour degrades in a predictable and observable way instead of failing silently.")

para("Equally important is what the system refuses to do. It stores nothing, so it carries no privacy "
     "obligation. It contacts no service with a credential the user has not provided. It writes to no "
     "external system, so it cannot corrupt a repository. And it never hides which provider produced "
     "an answer, which gives the user a basis for judging the output's reliability.")

para("The project also produced a concrete lesson about grounding. In every configuration tested, the "
     "quality of the output depended far more on whether the right repository context was supplied "
     "than on which model was selected. A three-billion-parameter free model, given an accurate file "
     "tree and a real README, produced a more useful explanation than a frontier model given an empty "
     "prompt. This is the central insight the implementation encodes: retrieval determines quality, "
     "and the model merely renders it.")

para("The immediate next steps are semantic retrieval over file contents, extraction of a genuine "
     "dependency graph, and streaming responses. Together these would move the tool from explaining a "
     "repository's shape to explaining its behaviour, while preserving the properties that make it "
     "useful in an academic setting — zero cost, zero installation, and a single URL.")

# ══════════════════════════════════════════════════════════════════════════════
# REFERENCES
# ══════════════════════════════════════════════════════════════════════════════
h("REFERENCES", page_break=True)

refs = [
    "Chen, M., Tworek, J., Jun, H., Yuan, Q., Pinto, H. P. de O., Kaplan, J., Edwards, H., Burda, Y., "
    "Joseph, N., Brockman, G., et al. (2021). Evaluating Large Language Models Trained on Code. "
    "arXiv:2107.03374.",

    "Liu, T., Xu, C., & McAuley, J. (2023). RepoBench: Benchmarking Repository-Level Code "
    "Auto-Completion Systems. arXiv:2306.03091. Published at ICLR 2024.",

    "Ahmed, T., & Devanbu, P. (2022). Few-shot training LLMs for project-specific code-summarization. "
    "Proceedings of the 37th IEEE/ACM International Conference on Automated Software Engineering "
    "(ASE '22). DOI: 10.1145/3551349.3559555.",

    "Feng, Z., Guo, D., Tang, D., Duan, N., Feng, X., Gong, M., Shou, L., Qin, B., Liu, T., Jiang, D., "
    "& Zhou, M. (2020). CodeBERT: A Pre-Trained Model for Programming and Natural Languages. Findings "
    "of EMNLP 2020. arXiv:2002.08155.",

    "Guo, D., Ren, S., Lu, S., Feng, Z., Tang, D., Liu, S., Zhou, L., Duan, N., Svyatkovskiy, A., Fu, "
    "S., Tufano, M., Deng, S. K., Clement, C., Drain, D., Sundaresan, N., Yin, J., Jiang, D., & Zhou, "
    "M. (2021). GraphCodeBERT: Pre-training Code Representations with Data Flow. ICLR 2021. "
    "arXiv:2009.08366.",

    "Moreno, L., Aponte, J., Sridhara, G., Marcus, A., Pollock, L., & Vijay-Shanker, K. (2013). "
    "Automatic generation of natural language summaries for Java classes. Proceedings of the 21st "
    "International Conference on Program Comprehension (ICPC), pp. 23–32. "
    "DOI: 10.1109/ICPC.2013.6613830.",

    "Lu, S., Guo, D., Ren, S., Huang, J., Svyatkovskiy, A., Blanco, A., Clement, C., Drain, D., Jiang, "
    "D., Tang, D., Li, G., Zhou, L., Fu, S., & Liu, S. (2021). CodeXGLUE: A Machine Learning "
    "Benchmark Dataset for Code Understanding and Generation. NeurIPS Datasets and Benchmarks Track. "
    "arXiv:2102.04664.",

    "Nijkamp, E., Pang, B., Hayashi, M., Tu, L., Wang, H., Zhou, Y., Savarese, S., & Xiong, C. (2023). "
    "CodeGen: An Open Large Language Model for Code with Multi-Turn Program Synthesis. ICLR 2023. "
    "arXiv:2203.13474.",

    "Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., "
    "Yih, W., Rocktäschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-Augmented Generation for "
    "Knowledge-Intensive NLP Tasks. Advances in Neural Information Processing Systems 33 (NeurIPS). "
    "arXiv:2005.11401.",

    "GitHub, Inc. (2024). GitHub REST API Documentation — Repositories and Git Trees. "
    "https://docs.github.com/en/rest",

    "Vercel, Inc. (2025). Vercel Functions: Node.js Runtime Documentation. "
    "https://vercel.com/docs/functions",

    "Meta Open Source (2024). ReactFlow (React Flow) — Library Documentation, version 11. "
    "https://reactflow.dev",
]
for i, ref in enumerate(refs, 1):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.35)
    p.paragraph_format.first_line_indent = Inches(-0.35)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.25
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = p.add_run(f"[{i}]  ")
    r.bold = True
    r.font.size = Pt(10.5)
    r2 = p.add_run(ref)
    r2.font.size = Pt(10.5)

doc.save(OUTFILE)
print("WROTE:", os.path.abspath(OUTFILE))
