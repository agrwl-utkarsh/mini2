#!/usr/bin/env python3
"""
Builds Repository-Explainer-Synopsis.pdf directly from the DOCX, so both
deliverables always carry identical text.

Handles: A4, Times-metric serif (DejaVu Serif surrogate), 1.5 line spacing,
justified body, centred title page, bullet + numbered lists, 8 data tables,
6 figures with captions, and centred page numbers with a real TOC page map.
"""
import os
import re
from docx import Document
from docx.shared import Pt
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, KeepTogether,
)


class FitImage(Image):
    """Image that scales down to the available width, never up."""
    def __init__(self, path, max_w, max_h=None):
        from PIL import Image as PILImage
        with PILImage.open(path) as im:
            iw, ih = im.size
        w, h = max_w, max_w * ih / iw
        if max_h and h > max_h:
            h = max_h
            w = max_h * iw / ih
        super().__init__(path, width=w, height=h)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
DOCX = os.path.join(REPO, "Repository-Explainer-Synopsis.docx")
OUT = os.path.join(REPO, "Repository-Explainer-Synopsis.pdf")

W, H = A4
LM, RM, TM, BM = 1.25 * inch, 1.0 * inch, 1.0 * inch, 1.0 * inch
FRAME_W = W - LM - RM

# ── fonts: DejaVu Serif is metrically close to Times New Roman and ships with matplotlib
CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu",
    "/tmp/pdfvenv/lib/python3.11/site-packages/matplotlib/mpl-data/fonts/ttf",
]


def find_font(name):
    for d in CANDIDATES:
        p = os.path.join(d, name)
        if os.path.isfile(p):
            return p
    raise FileNotFoundError(name)


pdfmetrics.registerFont(TTFont("Serif", find_font("DejaVuSerif.ttf")))
pdfmetrics.registerFont(TTFont("Serif-Bold", find_font("DejaVuSerif-Bold.ttf")))
_italic = find_font("DejaVuSerif-Italic.ttf") if os.path.isfile(
    os.path.join(CANDIDATES[1], "DejaVuSerif-Italic.ttf")) else find_font("DejaVuSerif.ttf")
pdfmetrics.registerFont(TTFont("Serif-Italic", _italic))
_bolditalic = os.path.join(CANDIDATES[1], "DejaVuSerif-BoldItalic.ttf")
pdfmetrics.registerFont(TTFont("Serif-BoldItalic",
                               _bolditalic if os.path.isfile(_bolditalic) else find_font("DejaVuSerif-Bold.ttf")))
addMapping("Serif", 0, 0, "Serif")
addMapping("Serif", 1, 0, "Serif-Bold")
addMapping("Serif", 0, 1, "Serif-Italic")
addMapping("Serif", 1, 1, "Serif-BoldItalic")

BODY = ParagraphStyle("body", fontName="Serif", fontSize=11.5, leading=17.25,
                      alignment=TA_JUSTIFY, spaceAfter=7, textColor=colors.HexColor("#111111"))
BODY_IND = ParagraphStyle("body_ind", parent=BODY, leftIndent=14)
TITLE = ParagraphStyle("title", fontName="Serif-Bold", fontSize=16, leading=20,
                       alignment=TA_CENTER, spaceAfter=6)
TITLE_BIG = ParagraphStyle("titlebig", fontName="Serif-Bold", fontSize=24, leading=30,
                           alignment=TA_CENTER, spaceAfter=8)
CENTER = ParagraphStyle("center", fontName="Serif", fontSize=11.5, leading=16,
                        alignment=TA_CENTER, spaceAfter=4)
CENTER_I = ParagraphStyle("center_i", parent=CENTER, fontName="Serif-Italic")
CENTER_B = ParagraphStyle("center_b", parent=CENTER, fontName="Serif-Bold", fontSize=14)
H1 = ParagraphStyle("h1", fontName="Serif-Bold", fontSize=13.5, leading=18,
                    alignment=TA_CENTER, spaceBefore=6, spaceAfter=14,
                    textColor=colors.HexColor("#111111"))
H2 = ParagraphStyle("h2", fontName="Serif-Bold", fontSize=12.5, leading=17,
                    spaceBefore=14, spaceAfter=7)
H3 = ParagraphStyle("h3", fontName="Serif-Bold", fontSize=11.5, leading=16,
                    spaceBefore=11, spaceAfter=6)
BULLET = ParagraphStyle("bullet", parent=BODY, leftIndent=20, bulletIndent=8,
                        spaceAfter=4, leading=16)
TOC_ROW = ParagraphStyle("toc", fontName="Serif", fontSize=11, leading=17)
TOC_HEAD = ParagraphStyle("tochead", fontName="Serif-Bold", fontSize=13.5, leading=18,
                          alignment=TA_CENTER, spaceAfter=18)
CAPTION = ParagraphStyle("caption", fontName="Serif-Italic", fontSize=9.5, leading=13,
                         alignment=TA_CENTER, spaceBefore=4, spaceAfter=16,
                         textColor=colors.HexColor("#444444"))
REF = ParagraphStyle("ref", fontName="Serif", fontSize=10, leading=14,
                     alignment=TA_JUSTIFY, leftIndent=22, firstLineIndent=-22, spaceAfter=6)
CELL = ParagraphStyle("cell", fontName="Serif", fontSize=8.2, leading=10.6)
CELL_H = ParagraphStyle("cellh", fontName="Serif-Bold", fontSize=8.2, leading=10.6)
CELL_B = ParagraphStyle("cellb", fontName="Serif-Bold", fontSize=9)


def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


# ══════════════════════════════════════════════════════════════════════════════
# Read the DOCX
# ══════════════════════════════════════════════════════════════════════════════
doc = Document(DOCX)

blocks = []
ti = 0
body_iter = iter(doc.element.body)
from docx.table import Table as DTable
from docx.text.paragraph import Paragraph as DParagraph

for child in doc.element.body.iterchildren():
    tag = child.tag.split("}")[-1]
    if tag == "p":
        blocks.append(("p", DParagraph(child, doc)))
    elif tag == "tbl":
        blocks.append(("t", DTable(child, doc)))

# Map images in document order
img_paths = sorted(
    [os.path.join(HERE, "figures", f) for f in os.listdir(os.path.join(HERE, "figures"))
     if f.endswith(".png")],
    key=lambda p: int(os.path.basename(p).split("_")[1]) * 100
                  + (int(os.path.basename(p).split("_")[2]) if len(os.path.basename(p).split("_")) > 2 and os.path.basename(p).split("_")[2][0].isdigit() else 0)
)
# explicit ordering: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2
ORDER = ["fig_5_1_dfd_level0.png", "fig_5_2_dfd_level1.png", "fig_5_3_state_chart.png",
         "fig_5_4_sequence.png", "fig_6_1_pert_network.png", "fig_6_2_gantt.png"]
img_paths = [os.path.join(HERE, "figures", f) for f in ORDER]
img_i = 0

# ══════════════════════════════════════════════════════════════════════════════
# Build the story
# ══════════════════════════════════════════════════════════════════════════════
SIDECAR = os.path.join(HERE, "_toc_pages.json")
TOC_PAGES = {}
if os.path.isfile(SIDECAR):
    import json
    with open(SIDECAR) as fh:
        TOC_PAGES = json.load(fh)


def norm(t):
    return " ".join(t.split()).lower()


story = []
pending_caption = None
is_title_page = True
hit_contents = False

for idx, (kind, obj) in enumerate(blocks):
    if kind == "t":
        rows = []
        for r_i, row in enumerate(obj.rows):
            cells = []
            for cell in row.cells:
                txt = cell.text.strip().replace("\n", "<br/>")
                cells.append(Paragraph(esc(txt) if txt else "&nbsp;",
                                       CELL_H if r_i == 0 else CELL))
            rows.append(cells)
        ncols = len(rows[0]) if rows else 1
        avail = FRAME_W
        # first column of the PERT table is narrow
        if ncols == 9:
            widths = [0.33, 2.05, 0.55, 0.72, 0.4, 0.4, 0.4, 0.4, 0.45]
            scale = avail / (sum(widths) * inch)
            widths = [w * inch * scale for w in widths]
        elif ncols == 6:
            widths = [w * inch for w in (1.05, 0.8, 0.9, 0.9, 0.8, 0.95)]
            scale = avail / sum(widths)
            widths = [w * scale for w in widths]
        elif ncols == 4:
            widths = [w * inch for w in (1.0, 0.62, 1.72, 2.18)]
            scale = avail / sum(widths)
            widths = [w * scale for w in widths]
        else:
            widths = [w * inch for w in (1.6, 1.2, 2.75)]
            scale = avail / sum(widths)
            widths = [w * scale for w in widths]

        t = Table(rows, colWidths=widths, repeatRows=1, hAlign="CENTER")
        t.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9aa3ae")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8edf5")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(Spacer(1, 4))
        story.append(t)
        story.append(Spacer(1, 12))
        continue

    p = obj
    text = p.text.strip()
    runs = p.runs

    # ── figure placeholder paragraph inside the docx
    if not text and p._p.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/main}blip"):
        if img_i < len(img_paths):
            from PIL import Image as PILImage
            path = img_paths[img_i]
            with PILImage.open(path) as im:
                iw, ih = im.size
            target_w = FRAME_W - 6          # small safety gutter
            max_h = H - TM - BM - 1.35 * inch
            story.append(Spacer(1, 6))
            story.append(FitImage(path, target_w, max_h))
            img_i += 1
        continue

    if not text:
        if is_title_page:
            story.append(Spacer(1, 14))
        continue

    # honour an explicit page break carried over from the DOCX
    try:
        if p.paragraph_format.page_break_before:
            story.append(PageBreak())
    except Exception:
        pass

    bold = bool(runs and runs[0].bold)
    italic = bool(runs and runs[0].italic)
    size = runs[0].font.size.pt if (runs and runs[0].font.size) else 12

    # ── captions (italic, centred, start with "Figure")
    if text.startswith("Figure ") and italic:
        story.append(Paragraph(esc(text), CAPTION))
        continue

    if text == "CONTENTS":
        is_title_page = False
        hit_contents = True
        story.append(Paragraph("CONTENTS", TOC_HEAD))
        continue

    if hit_contents and p.paragraph_format and p.paragraph_format.tab_stops \
            and len(list(p.paragraph_format.tab_stops)) > 0:
        # TOC entry: "1.  INTRODUCTION\t1"
        left, _, right = text.partition("\t")
        left = left.strip()
        right = right.strip()
        right = str(TOC_PAGES.get(norm(left), right))
        t = Table(
            [[Paragraph(esc(left), TOC_ROW), Paragraph(esc(right),
              ParagraphStyle("r", parent=TOC_ROW, alignment=2))]],
            colWidths=[FRAME_W - 0.6 * inch, 0.6 * inch], hAlign="LEFT")
        t.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]))
        story.append(t)
        continue

    # ── title page
    if is_title_page:
        if text in ("PROJECT SYNOPSIS",):
            story.append(Paragraph(esc(text), TITLE)); continue
        if text in ("REPOSITORY EXPLAINER",):
            story.append(Paragraph(esc(text), TITLE_BIG)); continue
        if text == "BACHELOR OF TECHNOLOGY":
            story.append(Spacer(1, 4)); story.append(Paragraph(esc(text), CENTER_B)); continue
        if text in ("COMPUTER SCIENCE & ENGINEERING", "UTKARSH AGRAWAL"):
            story.append(Paragraph(esc(text), CENTER_B)); continue
        if text == "ON" or text == "in":
            story.append(Paragraph(esc(text), CENTER)); continue
        if text.startswith("An AI-Assisted"):
            story.append(Paragraph(esc(text).replace("\n", "<br/>"),
                                   ParagraphStyle("tt", parent=CENTER_I, fontSize=12.5))); continue
        if text.startswith("Submitted in partial"):
            story.append(Spacer(1, 10))
            story.append(Paragraph(esc(text), ParagraphStyle("s", parent=CENTER_I, fontSize=10.5)))
            continue
        if text == "Submitted by":
            story.append(Spacer(1, 10))
            story.append(Paragraph(esc(text), ParagraphStyle("s2", parent=CENTER_I, fontSize=10.5)))
            continue
        if text.startswith("DEPARTMENT OF") or text.startswith("SESSION"):
            story.append(Paragraph(esc(text), ParagraphStyle("d", parent=CENTER_B, fontSize=11)))
            continue
        story.append(Paragraph(esc(text), CENTER))
        continue

    # ── references
    if text.startswith("[") and "]" in text[:6]:
        story.append(Paragraph(esc(text), REF))
        continue

    # ── headings
    if bold and size >= 13:
        if "\t" in text:
            # "1.<tab>INTRODUCTION" -> number left, title centred (reference layout)
            left_txt, _, right_txt = text.partition("\t")
            head = Table(
                [[Paragraph(esc(left_txt.strip()),
                            ParagraphStyle("hn", fontName="Serif-Bold", fontSize=13.5,
                                           alignment=TA_LEFT, leading=18)),
                  Paragraph(esc(right_txt.strip()),
                            ParagraphStyle("ht", fontName="Serif-Bold", fontSize=13.5,
                                           alignment=TA_CENTER, leading=18))]],
                colWidths=[0.75 * inch, FRAME_W - 0.75 * inch], hAlign="LEFT")
            head.setStyle(TableStyle([
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
            ]))
            story.append(KeepTogether([head]))
        else:
            story.append(KeepTogether([Paragraph(esc(text), H1)]))
        continue
    if bold and size >= 12.4:
        story.append(KeepTogether([Paragraph(esc(text), H2)]))
        continue
    if bold and text.startswith(("5.1.1", "5.1.2", "5.1.3", "5.1.4",
                                 "5.5.1", "5.5.2", "5.5.3", "5.5.4",
                                 "Hardware Requirements", "Software Requirements")):
        story.append(KeepTogether([Paragraph(esc(text), H3)]))
        continue
    if bold:
        story.append(KeepTogether([Paragraph(esc(text), H2)]))
        continue

    # ── bullets
    if p.style.name == "List Bullet" or text.startswith("•"):
        txt = text.lstrip("• ").strip()
        story.append(Paragraph(esc(txt), BULLET, bulletText="\u2022"))
        continue

    # ── body paragraph, possibly with a bold lead-in
    if runs and len(runs) >= 2 and runs[0].bold and not runs[1].bold:
        lead = runs[0].text
        rest = text[len(lead):]
        story.append(Paragraph("<b>" + esc(lead) + "</b>" + esc(rest), BODY))
        continue

    story.append(Paragraph(esc(text), BODY))


# ══════════════════════════════════════════════════════════════════════════════
# Page furniture
# ══════════════════════════════════════════════════════════════════════════════
class NumberedDoc(BaseDocTemplate):
    def __init__(self, *a, **kw):
        self.heading_pages = {}
        super().__init__(*a, **kw)
        frame = Frame(LM, BM, FRAME_W, H - TM - BM, id="normal",
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate(id="main", frames=[frame],
                                            onPage=self.furniture)])

    def __init_headings(self):
        pass

    def afterFlowable(self, flowable):
        try:
            st = getattr(flowable, "style", None)
            if st is not None and st.name in ("h1", "h2", "h3"):
                txt = flowable.getPlainText().strip()
                if txt:
                    self.heading_pages.setdefault(norm(txt), self.page)
        except Exception:
            pass
        super().afterFlowable(flowable)

    def furniture(self, canv, _doc):
        if canv.getPageNumber() == 1:
            return
        canv.saveState()
        canv.setFont("Serif", 9)
        canv.setFillColor(colors.HexColor("#444444"))
        canv.drawCentredString(W / 2, 0.62 * inch, str(canv.getPageNumber()))
        canv.restoreState()


numbered = NumberedDoc(OUT, pagesize=A4,
                       leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM,
                       title="Repository Explainer — Project Synopsis",
                       author="Utkarsh Agrawal",
                       subject="Project Synopsis: AI-assisted GitHub repository explanation",
                       creator="build_pdf.py")
numbered.build(story)

import json
with open(SIDECAR, "w") as fh:
    json.dump(numbered.heading_pages, fh, indent=1, sort_keys=True)

print("WROTE:", OUT)
print("headings mapped:", len(numbered.heading_pages))
