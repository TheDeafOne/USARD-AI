from pathlib import Path

import nbformat as nbf


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "labs"
DESTINATION = ROOT / "labs_completed"
DESTINATION.mkdir(exist_ok=True)


def replace_all(nb, replacements):
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        for old, new in replacements.items():
            if old in cell.source:
                cell.source = cell.source.replace(old, new)


def explanation_cell(title, text):
    return nbf.v4.new_markdown_cell(
        f"### Solution explanation — {title}\n\n{text}",
        metadata={"tags": ["solution-explanation"]},
    )


def insert_explanations(nb, explanations):
    result = []
    exercise_index = 0
    for cell in nb.cells:
        result.append(cell)
        if "exercise" in cell.metadata.get("tags", []):
            if exercise_index < len(explanations):
                title, text = explanations[exercise_index]
                result.append(explanation_cell(title, text))
            exercise_index += 1
    nb.cells = result


def add_completed_banner(nb, extra=""):
    banner = nbf.v4.new_markdown_cell(
        "> **Completed instructor version.** Exercise values and functions are filled in, "
        "self-checks are executed, and explanations follow each solution. " + extra,
        metadata={"tags": ["completed-version"]},
    )
    nb.cells.insert(1, banner)
    nb.metadata.setdefault("usard_lab", {})["edition"] = "completed-instructor"


def complete_lab_1(nb):
    manual_school_fixes_old = '''MANUAL_SCHOOL_FIXES = {
    # TODO: map these normalized labels:
    # "JEFFRSON HIGH": "JEFFERSON HIGH",
    # "N COUNTY TECHNICAL": "NORTH COUNTY TECH",
    # "LAKESIDE ACAD": "LAKESIDE ACADEMY",
}'''
    manual_school_fixes_new = '''MANUAL_SCHOOL_FIXES = {
    "JEFFRSON HIGH": "JEFFERSON HIGH",
    "N COUNTY TECHNICAL": "NORTH COUNTY TECH",
    "LAKESIDE ACAD": "LAKESIDE ACADEMY",
}'''
    action_aliases_old = '''ACTION_NAME_MAP.update({
    # TODO: add aliases such as "STEM PRESENTATION": "STEM Careers Presentation"
})'''
    action_aliases_new = '''ACTION_NAME_MAP.update({
    "CYBER CAREER EVENT": "Cyber Careers Event",
    "STEM PRESENTATION": "STEM Careers Presentation",
    "STEM CAREER PRESENTATION": "STEM Careers Presentation",
    "MECHANICAL CAREER DEMO": "Mechanical Careers Demo",
    "MECH CAREERS DEMO": "Mechanical Careers Demo",
    "HEALTHCARE CAREER SESSION": "Healthcare Careers Session",
    "HEALTH CAREERS SESSION": "Healthcare Careers Session",
    "EDUCATION BENEFIT SESSION": "Education Benefits Session",
    "BENEFITS SESSION": "Education Benefits Session",
    "GENERAL RECRUITMENT TABLE": "General Recruiting Table",
    "RECRUITING TABLE": "General Recruiting Table",
})'''
    replace_all(nb, {
        manual_school_fixes_old: manual_school_fixes_new,
        action_aliases_old: action_aliases_new,
        'REMOVE_DUPLICATE_IDS = False  # TODO':
            'REMOVE_DUPLICATE_IDS = True  # Keep one record per engagement ID',
        'INVALID_ROW_POLICY = "keep"  # TODO: change to "exclude"':
            'INVALID_ROW_POLICY = "exclude"  # Reject records that fail any validation rule',
    })
    insert_explanations(nb, [
        (
            "entity resolution",
            "The three genuine misspellings map to canonical names through explicit, reviewable rules. Mechanical normalization handles capitalization, whitespace, periods, `HS`, and `High School` without unrestricted fuzzy matching.",
        ),
        (
            "action aliases",
            "All observed aliases map to six canonical engagement actions. This prevents spelling variants from becoming separate columns in the recommender matrix.",
        ),
        (
            "deduplication",
            "Twelve repeated engagement IDs are exact duplicates, so one copy is retained. Legitimate repeated events have different IDs and remain in the history.",
        ),
        (
            "event validation",
            "Rows with missing keys, invalid dates, missing or negative numeric values, or impossible funnel order are excluded from the model-ready artifact. Each rule remains a separate audit flag.",
        ),
    ])
    add_completed_banner(nb)


def complete_lab_2(nb):
    replace_all(nb, {
        'QUALIFIED_NUMERATOR = "appointments"   # TODO':
            'QUALIFIED_NUMERATOR = "qualified"    # downstream qualified applicants',
        'QUALIFIED_DENOMINATOR = "appointments" # TODO':
            'QUALIFIED_DENOMINATOR = "appointments" # appointment opportunities',
        'EFFICIENCY_NUMERATOR = "appointments"  # TODO':
            'EFFICIENCY_NUMERATOR = "contracts"     # downstream outcome',
        'SUCCESS_WEIGHT = .34   # TODO': 'SUCCESS_WEIGHT = .60',
        'QUALIFIED_WEIGHT = .33 # TODO': 'QUALIFIED_WEIGHT = .25',
        'ACCESS_WEIGHT = .33    # TODO': 'ACCESS_WEIGHT = .15',
        'MAX_DISTANCE = 999       # TODO': 'MAX_DISTANCE = 30',
        'MIN_HISTORICAL_EVENTS = 0 # TODO': 'MIN_HISTORICAL_EVENTS = 4',
        'K = 3  # TODO': 'K = 5',
        'MIN_OVERLAP = 1  # TODO': 'MIN_OVERLAP = 3',
        'USE_SIMILARITY_WEIGHTS = False  # TODO': 'USE_SIMILARITY_WEIGHTS = True',
        'COLLABORATIVE_WEIGHT = .50  # TODO': 'COLLABORATIVE_WEIGHT = .60',
        'CONTENT_WEIGHT = .50        # TODO': 'CONTENT_WEIGHT = .40',
    })
    insert_explanations(nb, [
        (
            "downstream measures",
            "`qualified ÷ appointments` measures how often appointments reach qualification. `contracts ÷ recruiter_hours` measures downstream success per constrained resource. These choices deliberately move the objective away from raw activity volume.",
        ),
        (
            "mission weights",
            "The weights encode a human-defined operational objective: 60% downstream efficiency, 25% qualification rate, and 15% access. Normalization puts unlike measures on a common 0–1 scale before the weighted sum.",
        ),
        (
            "operational constraints",
            "Filtering happens before Top-K selection. Liberty is removed because travel exceeds the current limit; Victory is removed because only two historical events are available. A strong score cannot override feasibility or thin evidence.",
        ),
        (
            "Top K",
            "`K = 5` returns a manageable shortlist. Jefferson is the clear winner on the stated weighted objective, so the notebook passes that top-ranked school directly into the action recommender.",
        ),
        (
            "overlap-aware similarity",
            "Cosine similarity is calculated only on actions observed at both schools. Requiring three overlaps prevents a one- or two-action coincidence from dominating the neighborhood and exposes the deliberately different school profiles.",
        ),
        (
            "similarity-weighted prediction",
            "The three nearest behavioral neighbors contribute to the missing Mechanical score. Each neighbor’s outcome is weighted by similarity, making stronger analogues more influential. The result remains labeled `predicted` so it is not confused with direct Jefferson evidence.",
        ),
        (
            "hybrid evidence",
            "The hybrid gives 60% weight to normalized collaborative outcomes and 40% to content fit. The two source scores remain visible beside the final score, and the provenance column still distinguishes Jefferson observations from collaborative predictions.",
        ),
    ])
    add_completed_banner(nb)


def complete_lab_3(nb):
    replace_all(nb, {
        'TOP_K = 1  # TODO: retrieve three chunks for each question':
            'TOP_K = 3  # retrieve a small, inspectable evidence set per question',
        'INCLUDE_SOURCE_IDS = False  # TODO': 'INCLUDE_SOURCE_IDS = True',
        'REFUSE_UNSUPPORTED = False  # TODO': 'REFUSE_UNSUPPORTED = True',
    })
    insert_explanations(nb, [
        (
            "API execution control",
            "The completed notebook keeps `RUN_API_CALLS = False` so opening or rerunning it never creates surprise API usage. Paste a temporary workshop key into the blank `OPENAI_API_KEY` variable, then switch the flag to `True` to run the three ungrounded and three grounded answers. Clear the variable and outputs before saving or sharing. The API call supplies no tools, so it cannot invoke web search.",
        ),
        (
            "retrieval depth",
            "Top 3 balances evidence coverage with prompt focus. Each question retrieves section-level chunks from the larger corpus while preserving source ID, version, heading, and chunk ID for inspection.",
        ),
        (
            "grounding contract",
            "Source IDs make the three answers auditable. Delimiters separate retrieved chunks, the original question is preserved, and the unsupported-information rule prevents local gaps from being silently filled with plausible guesses.",
        ),
    ])
    add_completed_banner(
        nb,
        "Live model calls remain opt-in. Paste a temporary key into the blank `OPENAI_API_KEY` variable, and clear it before saving or sharing; no secret is embedded here.",
    )


def complete_lab_4(nb):
    old = '''def build_plan(hours_available=HOURS_AVAILABLE):
    plan = []
    # TODO: loop over rank_schools(), call the other tools, and add only
    # feasible items. Preserve score, evidence type, and source IDs.
    return plan'''
    new = '''def build_plan(hours_available=HOURS_AVAILABLE):
    plan = []

    for school_result in rank_schools():
        action_result = recommend_actions(school_result["school"])
        if action_result is None:
            continue

        evidence = retrieve_approved_information(
            school_result["school"], action_result["action"]
        )
        candidate = {
            "school": school_result["school"],
            "action": action_result["action"],
            "hours": estimate_hours(school_result["school"], action_result["action"]),
            "historical_events": school_result["historical_events"],
            "recommendation_score": action_result["score"],
            "evidence_type": action_result["evidence"],
            "source_ids": evidence["source_ids"],
            "sources_found": evidence["sources_found"],
        }

        # Candidate-level gates run before the item enters the plan.
        if validate_item(candidate):
            continue
        if sum(item["hours"] for item in plan) + candidate["hours"] > hours_available:
            continue
        plan.append(candidate)

    return plan'''
    replace_all(nb, {old: new})
    insert_explanations(nb, [
        (
            "bounded orchestration",
            "The orchestrator calls narrow deterministic tools, constructs a candidate with provenance, validates it, and then checks the shared hour budget. Candidates with missing sources or too little historical evidence are skipped rather than repaired through invention. The returned plan is still a proposal requiring human approval.",
        ),
    ])
    add_completed_banner(nb)


COMPLETERS = {
    "Lab_1_Data_Cleaning_and_Integrity.ipynb": complete_lab_1,
    "Lab_2_Recommender_Systems.ipynb": complete_lab_2,
    "Lab_3_RAG_Grounded_Briefs.ipynb": complete_lab_3,
    "Lab_4_Agentic_Integration.ipynb": complete_lab_4,
}


for filename, completer in COMPLETERS.items():
    source_path = SOURCE / filename
    destination_path = DESTINATION / filename
    notebook = nbf.read(source_path, as_version=4)
    completer(notebook)
    nbf.write(notebook, destination_path)
    print(f"Wrote {destination_path.relative_to(ROOT)} ({len(notebook.cells)} cells)")
