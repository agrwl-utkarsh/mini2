#!/usr/bin/env python3
"""Generates the diagrams used in Repository-Explainer-Synopsis.docx"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
from matplotlib.lines import Line2D
from matplotlib.patches import Patch

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figures")
os.makedirs(OUT, exist_ok=True)

INK = "#1f2937"; GREY = "#6b7280"; LINE = "#9ca3af"
BLUE = "#1d4ed8"; BLUE_BG = "#eff6ff"
GREEN = "#047857"; GREEN_BG = "#ecfdf5"
AMBER = "#b45309"; AMBER_BG = "#fffbeb"
RED = "#b91c1c"; RED_BG = "#fef2f2"
SLATE_BG = "#f1f5f9"

plt.rcParams["font.family"] = "DejaVu Sans"


def box(ax, x, y, w, h, text, fc=SLATE_BG, ec=INK, fs=9, bold=False, rounded=True,
        lw=1.2, style="round,pad=0.004,rounding_size=0.012"):
    if rounded:
        p = FancyBboxPatch((x, y), w, h, boxstyle=style, linewidth=lw, edgecolor=ec,
                           facecolor=fc, zorder=3)
    else:
        p = Rectangle((x, y), w, h, linewidth=lw, edgecolor=ec, facecolor=fc, zorder=3)
    ax.add_patch(p)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs,
            color=INK, fontweight="bold" if bold else "normal", zorder=4, linespacing=1.35)


def arrow(ax, p1, p2, color=INK, ls="-", rad=0.0, lw=1.1, conn=None):
    a = FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=11, linewidth=lw,
                        color=color, linestyle=ls, zorder=2,
                        connectionstyle=conn or f"arc3,rad={rad}", shrinkA=1, shrinkB=1)
    ax.add_patch(a)


def arrow2(ax, p1, p2, color=INK, lw=1.1, conn=None, style="<|-|>"):
    a = FancyArrowPatch(p1, p2, arrowstyle=style, mutation_scale=10, linewidth=lw,
                        color=color, zorder=2,
                        connectionstyle=conn or "arc3,rad=0", shrinkA=1, shrinkB=1)
    ax.add_patch(a)


def label(ax, x, y, t, fs=7.2, color=GREY, ha="center", va="center", bg=True, style="normal"):
    kw = dict(boxstyle="round,pad=0.18", fc="white", ec="none", alpha=0.95) if bg else None
    ax.text(x, y, t, ha=ha, va=va, fontsize=fs, color=color, zorder=6,
            linespacing=1.3, bbox=kw, style=style)


def canvas(w=10, h=6.4):
    fig, ax = plt.subplots(figsize=(w, h), dpi=200)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis("off")
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
    return fig, ax


def title(ax, t, sub=None):
    ax.text(0.5, 0.99, t, ha="center", va="top", fontsize=11.5, fontweight="bold", color=INK)
    if sub:
        ax.text(0.5, 0.945, sub, ha="center", va="top", fontsize=8.4, color=RED, fontweight="bold")


# ─────────────────────────── FIG 5.1 : DFD Level 0 ───────────────────────────
def fig_dfd0():
    fig, ax = canvas(10, 5.9)
    title(ax, "REPOSITORY EXPLAINER  —  LEVEL 0 DATA FLOW DIAGRAM (CONTEXT DIAGRAM)")

    box(ax, 0.360, 0.345, 0.28, 0.20,
        "0\nREPOSITORY EXPLAINER\nSYSTEM\n(React SPA + Serverless API)",
        fc=BLUE_BG, ec=BLUE, fs=9.5, bold=True, lw=1.6)
    box(ax, 0.035, 0.395, 0.18, 0.13, "DEVELOPER\n(Web Browser)", fc=SLATE_BG, fs=9, bold=True)
    box(ax, 0.775, 0.640, 0.20, 0.115, "GITHUB REST API\napi.github.com", fc=GREEN_BG, ec=GREEN, fs=8.3)
    box(ax, 0.775, 0.430, 0.20, 0.115, "RAW FILE SERVER\nraw.githubusercontent.com", fc=GREEN_BG, ec=GREEN, fs=8.3)
    box(ax, 0.760, 0.115, 0.225, 0.150, "LLM PROVIDERS\nGrok · Gemini\nDeepSeek · OpenRouter", fc=AMBER_BG, ec=AMBER, fs=8.3)

    arrow(ax, (0.215, 0.495), (0.360, 0.495), lw=1.3)
    label(ax, 0.288, 0.552, "repository URL\n(POST /api/analyze)", fs=7.0)
    arrow(ax, (0.360, 0.408), (0.215, 0.408), lw=1.3)
    label(ax, 0.288, 0.348, "explanation, tech stack,\narchitecture JSON, file tree", fs=7.0)

    arrow(ax, (0.640, 0.505), (0.775, 0.700), lw=1.3)
    label(ax, 0.708, 0.630, "GET /repos/{o}/{r}\nGET /git/trees/{b}", fs=6.9)
    arrow(ax, (0.775, 0.660), (0.640, 0.500), lw=1.0, color=GREY)
    label(ax, 0.905, 0.485, "metadata JSON\ntree[ ]", fs=6.9, color=GREY)

    arrow(ax, (0.640, 0.455), (0.775, 0.487), lw=1.3)
    label(ax, 0.700, 0.452, "GET /{branch}/README.md", fs=6.9)
    arrow(ax, (0.775, 0.462), (0.640, 0.438), lw=1.0, color=GREY)
    label(ax, 0.905, 0.400, "README text", fs=6.9, color=GREY)

    arrow(ax, (0.585, 0.345), (0.760, 0.230), lw=1.3)
    label(ax, 0.712, 0.315, "prompt =\nsystem instruction\n+ repo context", fs=6.9)
    arrow(ax, (0.760, 0.192), (0.575, 0.345), lw=1.0, color=GREY)
    label(ax, 0.905, 0.150, "completion\ntext", fs=6.9, color=GREY)

    label(ax, 0.5, 0.055, "Arrow labels show the payload; the system is read-only toward every external service.",
          fs=7.2, style="italic")
    fig.savefig(f"{OUT}/fig_5_1_dfd_level0.png", bbox_inches="tight", facecolor="white")
    plt.close(fig)


# ─────────────────────────── FIG 5.2 : DFD Level 1 ───────────────────────────
def fig_dfd1():
    fig, ax = canvas(10, 7.4)
    title(ax, "LEVEL 1 DATA FLOW DIAGRAM  —  INTERNAL PROCESSES")

    PX, PW, PH = 0.315, 0.265, 0.062
    ys = {"1": 0.885, "2": 0.780, "3": 0.675, "4": 0.570, "5": 0.465, "6": 0.360}
    names = {
        "1": "1.0  Validate & Parse GitHub URL",
        "2": "2.0  GitHub Ingestion\n(metadata · README · file tree)",
        "3": "3.0  Tech-Stack Detection  (15 rules)",
        "4": "4.0  Explanation Generation\n(LLM cascade → template)",
        "5": "5.0  Architecture Generation\n(JSON prompt → heuristic)",
        "6": "6.0  Assemble Response\n(normalise · cap 300 files)",
    }
    for k, y in ys.items():
        box(ax, PX, y, PW, PH, names[k], fc=BLUE_BG, ec=BLUE, fs=7.9, lw=1.3)

    # external entities
    box(ax, 0.020, 0.880, 0.175, 0.070, "DEVELOPER\n(Web Browser)", fc=SLATE_BG, fs=8.2, bold=True)
    box(ax, 0.760, 0.790, 0.220, 0.058, "GITHUB REST API", fc=GREEN_BG, ec=GREEN, fs=8.2)
    box(ax, 0.760, 0.700, 0.220, 0.058, "RAW FILE SERVER", fc=GREEN_BG, ec=GREEN, fs=8.2)
    box(ax, 0.760, 0.400, 0.220, 0.085, "LLM PROVIDERS\nGrok · Gemini ·\nDeepSeek · OpenRouter", fc=AMBER_BG, ec=AMBER, fs=7.6)
    box(ax, 0.760, 0.270, 0.220, 0.062, "DEVELOPER\n(Response UI)", fc=SLATE_BG, fs=7.8, bold=True)

    # data stores (open-ended)
    SX, SW, SH = 0.020, 0.175, 0.052
    sy = {"D1": 0.785, "D2": 0.680, "D3": 0.575, "D4": 0.330}
    snames = {"D1": "D1   README_TEXT", "D2": "D2   FILE_TREE",
              "D3": "D3   TECH_STACK", "D4": "D4   API_KEY_ENV"}
    for k, y in sy.items():
        box(ax, SX, y, SW, SH, snames[k], fc="white", ec=GREY, fs=7.4, rounded=False, lw=1.0)

    # vertical spine
    for a, b in [("1", "2"), ("2", "3"), ("3", "4"), ("4", "5"), ("5", "6")]:
        arrow(ax, (PX + PW / 2, ys[a]), (PX + PW / 2, ys[b] + PH), lw=1.2)

    arrow(ax, (0.195, 0.915), (PX, 0.915), lw=1.2)
    label(ax, 0.252, 0.940, "url string", fs=6.8)

    # store links (orthogonal, in the empty gutter)
    arrow2(ax, (SX + SW, sy["D1"] + SH / 2), (PX, sy["D1"] + SH / 2), lw=1.0)
    label(ax, 0.255, sy["D1"] + SH / 2 + 0.030, "README text", fs=6.6)
    arrow2(ax, (SX + SW, sy["D2"] + SH / 2), (PX, sy["D2"] + SH / 2), lw=1.0)
    label(ax, 0.255, sy["D2"] + SH / 2 + 0.030, "tree[ ]", fs=6.6)
    arrow2(ax, (SX + SW, sy["D3"] + SH / 2), (PX, sy["D3"] + SH / 2), lw=1.0)
    label(ax, 0.255, sy["D3"] + SH / 2 + 0.030, "techStack[ ]", fs=6.6)
    arrow2(ax, (SX + SW, sy["D4"] + SH / 2), (PX, sy["D4"] + SH / 2), lw=1.0)
    label(ax, 0.255, sy["D4"] + SH / 2 + 0.030, "API keys", fs=6.6)

    # GitHub calls
    arrow2(ax, (PX + PW, ys["2"] + PH * 0.72), (0.760, 0.819), lw=1.0)
    label(ax, 0.672, 0.858, "GET metadata", fs=6.6)
    arrow2(ax, (PX + PW, ys["2"] + PH * 0.28), (0.760, 0.729), lw=1.0)
    label(ax, 0.668, 0.688, "GET README / tree", fs=6.6)

    # LLM calls
    arrow2(ax, (PX + PW, ys["4"] + PH * 0.70), (0.760, 0.463), lw=1.0)
    label(ax, 0.668, 0.545, "prompt ~7k chars", fs=6.6)
    arrow2(ax, (PX + PW, ys["5"] + PH * 0.62), (0.760, 0.425), lw=1.0)
    label(ax, 0.664, 0.425, "JSON prompt", fs=6.6)

    # response to the UI
    arrow(ax, (PX + PW / 2, ys["6"]), (PX + PW / 2, 0.302), lw=1.3)
    arrow(ax, (PX + PW / 2, 0.302), (0.760, 0.302), lw=1.3)
    label(ax, 0.545, 0.325, "single JSON response  { meta, explanation, techStack, architecture, fileTree }", fs=6.8)

    label(ax, 0.5, 0.185,
          "Processes 4.0 and 5.0 run in parallel (Promise.all).   D1–D4 are intermediate in-memory\n"
          "buffers and environment values — the system keeps no database, so every store is request-scoped.",
          fs=7.0, style="italic")
    label(ax, 0.5, 0.095,
          "Fallback path:  if every provider fails, 4.0 returns a built-in template and 5.0 returns a heuristic graph.",
          fs=7.0, style="italic")
    fig.savefig(f"{OUT}/fig_5_2_dfd_level1.png", bbox_inches="tight", facecolor="white")
    plt.close(fig)


# ─────────────────────────── FIG 5.3 : State chart ───────────────────────────
def fig_state():
    fig, ax = canvas(10.4, 6.6)
    ax.text(0.5, 0.992, "STATE CHART DIAGRAM  —  CLIENT APPLICATION LIFECYCLE",
            ha="center", va="top", fontsize=11.5, fontweight="bold", color=INK)

    SX, SW, SH = 0.190, 0.290, 0.070
    ys = {"idle": 0.735, "sub": 0.595, "ing": 0.455, "gen": 0.315, "ready": 0.175}

    def st(y, t, fc=BLUE_BG, ec=BLUE):
        box(ax, SX, y, SW, SH, t, fc=fc, ec=ec, fs=8.4, bold=True, lw=1.5)

    st(ys["idle"], "IDLE   (empty state)")
    st(ys["sub"],  "SUBMITTING   URL validated")
    st(ys["ing"],  "INGESTING   GitHub data")
    st(ys["gen"],  "GENERATING   LLM cascade")
    st(ys["ready"], "RESULTS READY", fc=GREEN_BG, ec=GREEN)

    LX = SX - 0.045
    for a, b, lbl in [("idle", "sub", "submit"),
                      ("sub", "ing", "POST /api/analyze"),
                      ("ing", "gen", "facts collected"),
                      ("gen", "ready", "200 OK")]:
        y1, y2 = ys[a], ys[b] + SH
        arrow(ax, (LX, y1), (LX, y2), lw=1.3)
        ax.plot([LX, SX], [y2 + 0.004, ys[b] + 0.004], color=INK, lw=1.3, zorder=2)
        ax.text(LX - 0.014, (y1 + y2) / 2, lbl, ha="right", va="center",
                fontsize=7.4, color=INK)

    # error state to the right
    EX, EW = 0.585, 0.195
    box(ax, EX, ys["ing"], EW, SH, "ERROR\n(banner shown)", fc=RED_BG, ec=RED, fs=8.2, bold=True, lw=1.5)
    arrow(ax, (SX + SW, ys["ing"] + SH / 2), (EX, ys["ing"] + SH / 2), color=RED, lw=1.3)
    ax.text((SX + SW + EX) / 2, ys["ing"] + SH / 2 + 0.012, "GitHub\nunreachable",
            ha="center", va="bottom", fontsize=6.6, color=RED)

    arrow(ax, (SX + SW, ys["gen"] + SH * 0.60), (EX + EW * 0.38, ys["ing"]),
          color=RED, lw=1.3, rad=-0.22)
    ax.text(0.512, ys["gen"] + SH * 0.52, "all providers\nfailed", ha="right", va="center",
            fontsize=6.6, color=RED)

    arrow(ax, (EX + EW * 0.58, ys["ing"] + SH), (SX + SW * 0.80, ys["sub"]),
          color=GREY, lw=1.3, rad=0.32)
    ax.text(0.545, ys["sub"] + 0.058, "retry", ha="left", va="center",
            fontsize=7.0, color=GREY, style="italic")

    # theme toggle (left of IDLE)
    box(ax, 0.020, ys["idle"], 0.135, SH, "THEME\nTOGGLE", fc="#fafafa", ec=GREY, fs=6.9, lw=1.0)
    arrow(ax, (0.155, ys["idle"] + 0.020), (SX, ys["idle"] + 0.020), color=GREY, lw=1.0)
    arrow(ax, (SX, ys["idle"] + 0.048), (0.155, ys["idle"] + 0.048), color=GREY, lw=1.0)
    ax.text(0.020, ys["idle"] - 0.016, "data-theme on <html>, persisted in localStorage",
            ha="left", va="top", fontsize=6.4, color=GREY, style="italic")

    # tab states
    TX, TW = 0.815, 0.175
    ax.text(TX + TW / 2, 0.900, "TAB STATES", ha="center", va="center", fontsize=7.8,
            color=GREY, fontweight="bold")
    ax.text(TX + TW / 2, 0.870, "(local state · no refetch)", ha="center", va="center",
            fontsize=6.3, color=GREY, style="italic")
    for i, t in enumerate(["Explanation", "Architecture", "Chat", "Files"]):
        yy = 0.775 - i * 0.095
        box(ax, TX, yy, TW, 0.060, t, fc="white", ec=GREY, fs=7.4, lw=1.0)
    arrow(ax, (SX + SW + 0.015, ys["ready"] + SH / 2), (TX, 0.805),
          ls=":", color=GREY, lw=1.0, rad=0.10)
    ax.text(TX + TW / 2, 0.300, "Files  →  GET /api/file\nChat  →  POST /api/chat",
            ha="center", va="center", fontsize=6.9, color=GREY, style="italic")

    ax.plot([0.030, 0.970], [0.118, 0.118], color="#e5e7eb", lw=0.8)
    ax.text(0.5, 0.086, "new URL submitted  →  state resets and the cycle repeats",
            ha="center", fontsize=7.6, color=GREY, style="italic")
    ax.text(0.5, 0.038,
            "App.jsx holds one state bundle (repoMeta, explanation, techStack, architecture, fileTree); "
            "the tab views read it and never call /api/analyze again.",
            ha="center", fontsize=7.2, color=GREY, style="italic")
    fig.savefig(f"{OUT}/fig_5_3_state_chart.png", bbox_inches="tight", facecolor="white")
    plt.close(fig)


# ─────────────────────────── FIG 5.4 : Sequence ───────────────────────────
def fig_sequence():
    fig, ax = canvas(10.6, 9.6)
    ax.text(0.5, 0.992, "SEQUENCE DIAGRAM  —  \"ANALYSE A REPOSITORY\" USE CASE",
            ha="center", va="top", fontsize=11.5, fontweight="bold", color=INK)

    lanes = [("Developer", 0.072, "Developer"),
             ("Browser", 0.255, "Browser\n(React SPA)"),
             ("Fn", 0.460, "Serverless Function\n/api/analyze"),
             ("GH", 0.672, "GitHub\nAPI / Raw"),
             ("LLM", 0.885, "LLM Provider")]
    X = {k: x for k, x, _ in lanes}
    TOP = 0.915
    BOT = 0.055
    for k, x, lbl in lanes:
        box(ax, x - 0.068, TOP, 0.136, 0.052, lbl, fc=SLATE_BG, fs=7.6, bold=True, lw=1.2)
        ax.plot([x, x], [BOT, TOP], color=LINE, lw=0.9, ls=(0, (4, 3)), zorder=1)

    GAP = 0.0432
    BAND = 0.052
    y0 = TOP - 0.052 - 0.045

    steps = [
        ("Developer", "Browser", "1   enter  https://github.com/owner/repo   and click  Explain", None),
        ("Browser", "Browser", "2   setLoading(true) · previous results cleared", None),
        ("Browser", "Fn", "3   POST /api/analyze    { url }", None),
        ("Fn", "Fn", "4   parseGithubUrl()  →  owner, repo, branch", None),
        ("Fn", "GH", "5   GET /repos/{owner}/{repo}      (Accept: vnd.github.v3+json)", None),
        ("GH", "Fn", "6   200 metadata JSON       |       404 → placeholder object", None),
        ("Fn", "GH", "7   GET /git/trees/{branch}?recursive=1", None),
        ("GH", "Fn", "8   tree[ ]     (blob → file,  tree → directory)", None),
        ("Fn", "GH", "9   GET /{branch}/README.md      (up to 21 attempts)", None),
        ("GH", "Fn", "10  README text", None),
        ("Fn", "Fn", "11  detectTechStack()  →  techStack[ ]", None),
        ("Fn", "LLM", "12  POST /chat/completions   { prompt, temperature, max_tokens }",
         "AbortSignal.timeout(20000) per attempt"),
        ("LLM", "Fn", "13  completion text      (or provider error → next provider)", None),
        ("Fn", "LLM", "14  POST /chat/completions   { architecture JSON prompt }", None),
        ("LLM", "Fn", "15  JSON nodes/edges      |      invalid → next provider → heuristic", None),
        ("Fn", "Browser", "16  200  { meta, explanation, highlights, techStack, architecture, fileTree }", None),
        ("Browser", "Developer", "17  render four tabs  (Explanation · Architecture · Chat · Files)", None),
    ]

    ys = []
    yy = y0
    for i, _ in enumerate(steps):
        ys.append(yy)
        yy -= GAP
        if i == 10:          # extra room for the parallel annotation
            yy -= BAND
        if i == 14:          # extra room for the fallback chain box
            yy -= BAND + 0.012

    for (frm, to, text, note), yy in zip(steps, ys):
        if frm == to:
            cx = X[frm]
            ax.plot([cx, cx + 0.026, cx + 0.026, cx], [yy, yy, yy - 0.019, yy - 0.019],
                    color=INK, lw=1.1, zorder=2)
            arrow(ax, (cx + 0.023, yy - 0.019), (cx + 0.003, yy - 0.019), color=INK, lw=1.1)
            ax.text(cx + 0.036, yy - 0.009, text, fontsize=6.9, color=INK, va="center", zorder=6)
        else:
            arrow(ax, (X[frm], yy), (X[to], yy), color=INK, lw=1.1)
            ax.text((X[frm] + X[to]) / 2, yy + 0.0110, text, ha="center", va="bottom",
                    fontsize=6.9, color=INK, zorder=6,
                    bbox=dict(boxstyle="round,pad=0.10", fc="white", ec="none", alpha=0.92))
        if note:
            ax.text((X[frm] + X[to]) / 2, yy - 0.0120, note, ha="center", va="top",
                    fontsize=6.2, color=GREY, style="italic", zorder=6)

    # parallel band, centred in the extra gap after step 11
    y_par = (ys[10] + ys[11]) / 2 + 0.006
    ax.plot([0.030, 0.930], [y_par, y_par], color=BLUE, lw=0.8, ls=":", zorder=1)
    ax.text(0.460, y_par, "parallel:  Promise.all([ explanation, architecture ])",
            ha="center", va="center", fontsize=6.9, color=BLUE, style="italic", zorder=7,
            bbox=dict(boxstyle="round,pad=0.16", fc="white", ec="none", alpha=0.97))

    # fallback box, centred in the extra gap after step 15
    y_fb = (ys[14] + ys[15]) / 2 - 0.002
    box(ax, 0.222, y_fb - 0.019, 0.478, 0.038,
        "FALLBACK CHAIN   Grok → Gemini (×3 models) → DeepSeek → OpenRouter → built-in template",
        fc=AMBER_BG, ec=AMBER, fs=6.6, lw=1.1)

    ax.text(0.5, 0.022,
            "Budget per request: 30 s on Vercel.   Every outbound call is time-boxed at 6–20 s.",
            ha="center", fontsize=7.0, color=GREY, style="italic")
    fig.savefig(f"{OUT}/fig_5_4_sequence.png", bbox_inches="tight", facecolor="white")
    plt.close(fig)


# ─────────────────────────── PERT / Gantt data ───────────────────────────
TASKS = [
    ("A", "Literature survey & requirements", 2.0, []),
    ("B", "System architecture & API contract", 1.0, ["A"]),
    ("C", "Frontend scaffold (Vite + React)", 1.0, ["B"]),
    ("D", "GitHub ingestion module", 1.5, ["B"]),
    ("E", "Tech-stack detector", 1.0, ["D"]),
    ("F", "Prompt design & LLM cascade", 2.0, ["D"]),
    ("G", "Architecture generator + fallback", 1.5, ["F"]),
    ("H", "Interactive ReactFlow diagram", 2.0, ["C", "G"]),
    ("I", "Chatbot UI + offline answer engine", 1.5, ["F"]),
    ("J", "Code explorer + file explainer", 1.5, ["D"]),
    ("K", "No-key resilience, theming, responsive", 1.0, ["H", "I", "J"]),
    ("L", "Testing, Vercel deployment, docs", 1.5, ["K", "E"]),
]


def compute_pert():
    dur = {t[0]: t[2] for t in TASKS}
    preds = {t[0]: t[3] for t in TASKS}
    succs = {t[0]: [] for t in TASKS}
    for tid, _, _, ps in TASKS:
        for p in ps:
            succs[p].append(tid)
    order = [t[0] for t in TASKS]
    ES, EF = {}, {}
    for tid in order:
        ES[tid] = max([EF[p] for p in preds[tid]], default=0)
        EF[tid] = ES[tid] + dur[tid]
    proj = max(EF.values())
    LF, LS = {}, {}
    for tid in reversed(order):
        LF[tid] = min([LS[s] for s in succs[tid]], default=proj)
        LS[tid] = LF[tid] - dur[tid]
    slack = {t: round(LS[t] - ES[t], 2) for t in order}
    crit = [t for t in order if abs(slack[t]) < 1e-9]
    return dur, preds, ES, EF, LS, LF, slack, crit, proj


# ─────────────────────────── FIG 6.1 : PERT network ───────────────────────────
def fig_pert():
    dur, preds, ES, EF, LS, LF, slack, crit, proj = compute_pert()

    col = {"A": 0, "B": 1, "D": 2, "F": 3, "G": 4, "H": 5, "K": 6, "L": 7,
           "C": 2, "J": 2, "E": 3, "I": 4}
    row = {"A": 1.0, "B": 1.0, "C": 0.10, "D": 1.0, "J": 2.05, "E": 2.05,
           "F": 1.0, "G": 1.0, "I": 0.10, "H": 1.0, "K": 1.0, "L": 1.0}
    X0, DX, W, H = 0.030, 0.1175, 0.103, 0.100
    Y0, DY = 0.235, 0.190
    POS = {t: (X0 + col[t] * DX, Y0 + row[t] * DY) for t in col}

    fig, ax = canvas(10.4, 5.5)
    ax.text(0.5, 0.985, f"PERT NETWORK DIAGRAM   —   CRITICAL PATH = {proj:.1f} WEEKS",
            ha="center", va="top", fontsize=11.5, fontweight="bold", color=INK)
    ax.text(0.5, 0.930, "A  →  B  →  D  →  F  →  G  →  H  →  K  →  L",
            ha="center", va="top", fontsize=8.6, color=RED, fontweight="bold")

    for tid, (x, y) in POS.items():
        on = tid in crit
        box(ax, x, y, W, H, f"{tid}\n{dur[tid]:g} w\n{ES[tid]:g} | {EF[tid]:g}",
            fc=RED_BG if on else SLATE_BG, ec=RED if on else GREY,
            fs=6.9, lw=2.0 if on else 1.0, bold=on)

    for tid, ps in preds.items():
        for p in ps:
            x1, y1 = POS[p]; x2, y2 = POS[tid]
            on = p in crit and tid in crit and abs(EF[p] - ES[tid]) < 1e-9
            arrow(ax, (x1 + W, y1 + H / 2), (x2, y2 + H / 2),
                  color=RED if on else LINE, lw=1.7 if on else 1.0,
                  rad=0.20 if (col[tid] - col[p]) > 1 else 0.0)

    ax.add_patch(Rectangle((0.030, 0.055), 0.024, 0.026, fc=RED_BG, ec=RED, lw=1.8))
    ax.text(0.062, 0.068, "Critical task (zero float)", fontsize=7.2, va="center", color=INK)
    ax.add_patch(Rectangle((0.245, 0.055), 0.024, 0.026, fc=SLATE_BG, ec=GREY, lw=1.0))
    ax.text(0.277, 0.068, "Task with float", fontsize=7.2, va="center", color=INK)
    ax.text(0.420, 0.068, "cells show  duration | earliest start | earliest finish  (weeks)",
            fontsize=7.2, va="center", color=GREY, style="italic")
    ax.text(0.975, 0.068, "Project completes in 12.5 weeks",
            fontsize=7.2, va="center", color=RED, ha="right", style="italic")
    fig.savefig(f"{OUT}/fig_6_1_pert_network.png", bbox_inches="tight", facecolor="white")
    plt.close(fig)


# ─────────────────────────── FIG 6.2 : Gantt ───────────────────────────
def fig_gantt():
    dur, preds, ES, EF, LS, LF, slack, crit, proj = compute_pert()
    fig, ax = plt.subplots(figsize=(10.4, 5.9), dpi=200)
    fig.subplots_adjust(left=0.315, right=0.975, top=0.885, bottom=0.14)

    order = [t[0] for t in TASKS][::-1]
    name = {t[0]: t[1] for t in TASKS}
    bar_colors = {"A": GREEN, "B": GREEN, "C": GREEN, "D": GREEN, "E": GREEN,
                  "F": AMBER, "G": AMBER, "H": AMBER,
                  "I": "#795548", "J": "#795548", "K": "#795548", "L": "#795548"}

    for i, tid in enumerate(order):
        ax.barh(i, dur[tid], left=ES[tid], height=0.54, color=bar_colors[tid],
                alpha=0.93, edgecolor="white", linewidth=0.8, zorder=3)
        ax.text(ES[tid] + dur[tid] / 2, i, f"{dur[tid]:g} w", va="center", ha="center",
                fontsize=6.9, color="white", fontweight="bold", zorder=5)
        if tid in crit:
            ax.plot([ES[tid], EF[tid]], [i + 0.34, i + 0.34], color=RED, lw=1.9, zorder=4)
        if slack[tid] > 0:
            ax.plot([EF[tid], LF[tid]], [i - 0.33, i - 0.33], color=GREY, lw=1.1,
                    ls=":", zorder=4)
            ax.text(LF[tid] + 0.12, i - 0.33, f"float {slack[tid]:g}w", va="center",
                    fontsize=6.2, color=GREY, zorder=5)

    ax.set_yticks(range(len(order)))
    ax.set_yticklabels([f"{tid}.  {name[tid]}" for tid in order], fontsize=7.4)
    ax.set_xlabel("Week", fontsize=7.8)
    ax.set_xlim(0, proj + 1.9)
    ax.set_ylim(-0.75, len(order) - 0.25)
    ax.set_xticks(range(0, int(proj) + 2))
    ax.tick_params(axis="x", labelsize=7.2)
    ax.grid(axis="x", color="#e5e7eb", lw=0.7, zorder=0)
    ax.set_axisbelow(True)
    for sp in ("top", "right"):
        ax.spines[sp].set_visible(False)
    for sp in ("left", "bottom"):
        ax.spines[sp].set_color("#d1d5db")

    ax.axvline(proj, color=RED, lw=1.0, ls="--", zorder=2)
    ax.text(proj + 0.12, len(order) - 1.35, f"completion\n{proj:.1f} weeks", fontsize=6.9,
            color=RED, va="center", ha="left")

    ax.set_title("GANTT CHART  —  PROJECT SCHEDULE BY WEEK", fontsize=10.5,
                 fontweight="bold", color=INK, pad=10)

    handles = [Patch(color=GREEN, label="Completed"),
               Patch(color=AMBER, label="Ongoing"),
               Patch(color="#795548", label="Yet to be done"),
               Line2D([0], [0], color=RED, lw=1.9, label="Critical path"),
               Line2D([0], [0], color=GREY, lw=1.1, ls=":", label="Available float")]
    fig.legend(handles=handles, loc="lower center", ncol=5, frameon=False,
               fontsize=7.2, bbox_to_anchor=(0.5, 0.005))
    fig.savefig(f"{OUT}/fig_6_2_gantt.png", bbox_inches="tight", facecolor="white")
    plt.close(fig)


if __name__ == "__main__":
    fig_dfd0(); fig_dfd1(); fig_state(); fig_sequence(); fig_pert(); fig_gantt()
    d, p, ES, EF, LS, LF, slack, crit, proj = compute_pert()
    print("DURATION:", proj, "weeks  |  CRITICAL PATH:", " -> ".join(crit))
    print("FIGURES:", sorted(os.listdir(OUT)))
