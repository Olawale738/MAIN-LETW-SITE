"""
Keyword-based prayer request classifier.
Deterministic, fast, no external API. Returns one category from a fixed set
plus optional secondary tags. Falls back to 'other'.
"""

import re

CATEGORIES = {
    "health": [
        r"\bheal", r"\bsick", r"\bill\b", r"\billness", r"\bdisease", r"\bcancer", r"\btumou?r",
        r"\bsurgery", r"\bhospital", r"\bdoctor", r"\bpain", r"\bdiabet", r"\bbp\b", r"\bblood pressure",
        r"\binfect", r"\bvirus", r"\bcovid", r"\bmedic", r"\brecover", r"\bbody\b", r"\bphysic",
        r"\bmental", r"\bdepress", r"\banxiet", r"\bdying", r"\bdeath\b",
    ],
    "family": [
        r"\bfamily\b", r"\bspouse", r"\bhusband", r"\bwife", r"\bmarriage", r"\bmarried", r"\bdivor",
        r"\bchild\b", r"\bchildren", r"\bson\b", r"\bdaughter\b", r"\bbaby\b", r"\bbabies\b",
        r"\bparent", r"\bmother", r"\bfather", r"\bmom\b", r"\bdad\b", r"\bsibling",
        r"\bbrother\b", r"\bsister\b", r"\brelativ", r"\bin-law",
    ],
    "work": [
        r"\bjob\b", r"\bwork\b", r"\bcareer", r"\bemploy", r"\bunemploy", r"\bjobless",
        r"\bboss\b", r"\binterview", r"\bpromotion", r"\bbusiness", r"\bcompany",
        r"\bsalary", r"\bfired", r"\blaid off", r"\bclient", r"\bcontract\b",
    ],
    "salvation": [
        r"\bsalvation", r"\bsalvat", r"\bsav(e|ed)\b", r"\bunsaved", r"\bborn[ -]?again",
        r"\bunbeliev", r"\baccept (christ|jesus)", r"\bgive (his|her|their) life",
        r"\brepent", r"\bconvers(ion|t)", r"\beternal life", r"\bsoul\b",
    ],
    "finance": [
        r"\bmoney", r"\bdebt\b", r"\bbills\b", r"\brent\b", r"\bloan", r"\bfinanc",
        r"\bafford", r"\bbroke\b", r"\bpoverty\b", r"\bpaying\b", r"\bschool fees",
        r"\btuition", r"\bfees\b", r"\bincome\b", r"\bbankrupt",
    ],
    "relationship": [
        r"\brelationship", r"\bfriend", r"\bboyfriend", r"\bgirlfriend", r"\bdating",
        r"\blonely", r"\balone\b", r"\bcompanion", r"\bsuitable spouse", r"\blife partner",
        r"\bbetrayal", r"\bbroken heart",
    ],
    "spiritual": [
        r"\bfaith\b", r"\bspirit(ual|ually)?\b", r"\bdiscipline\b", r"\bgrowth\b",
        r"\bgrow in\b", r"\bword\b", r"\bbible\b", r"\bscripture", r"\bdevotion",
        r"\bbackslid", r"\bdry season", r"\brevival", r"\banointing", r"\bvision\b",
        r"\bcalling\b", r"\bministry\b",
    ],
    "education": [
        r"\bschool\b", r"\buniversity", r"\bcollege", r"\bexam", r"\btest\b",
        r"\bgrade", r"\badmission", r"\bstudent\b", r"\bstud(y|ies|ying)\b", r"\bsemester",
        r"\bjamb\b", r"\bgce\b", r"\bwaec\b", r"\bgcse\b",
    ],
    "protection": [
        r"\bsafe(ty)?\b", r"\bprotect", r"\bdanger\b", r"\baccident", r"\bcrash\b",
        r"\bjourney mercies", r"\btravel", r"\btrip\b", r"\brobber", r"\battack",
        r"\bkidnap", r"\bwar\b", r"\bviolence",
    ],
}

PRIORITY = ["salvation", "health", "family", "finance", "education", "work", "relationship", "protection", "spiritual"]


def classify(text: str) -> tuple[str, list[str]]:
    """Return (primary_category, all_matched_tags) for the given prayer text."""
    if not text:
        return "other", []
    t = text.lower()
    matched: list[str] = []
    for cat, patterns in CATEGORIES.items():
        for p in patterns:
            if re.search(p, t):
                matched.append(cat)
                break
    if not matched:
        return "other", []
    # Pick the highest-priority match as primary
    for cat in PRIORITY:
        if cat in matched:
            return cat, matched
    return matched[0], matched
