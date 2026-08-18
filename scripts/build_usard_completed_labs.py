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
    name_map_old = '''NAME_MAP = {
    # TODO: add the known variants.
    # "Jefferson HS": "Jefferson High",
}'''
    name_map_new = '''NAME_MAP = {
    "Jefferson HS": "Jefferson High",
    "JEFFERSON HIGH": "Jefferson High",
    "Jefferson High School": "Jefferson High",
    "LINCOLN HS": "Lincoln High",
    "Washington H.S.": "Washington High",
}'''
    replace_all(nb, {
        name_map_old: name_map_new,
        'REMOVE_DUPLICATE_IDS = False  # TODO: change after inspecting E002':
            'REMOVE_DUPLICATE_IDS = True  # Remove the verified duplicate E002 record',
        'INVALID_DATE_POLICY = "keep"  # TODO: choose "flag" for this lab':
            'INVALID_DATE_POLICY = "flag"  # Preserve the row and its audit flag',
        '# TODO: complete this section in the final Lab 1 build.':
            '# Aggregate valid records while retaining quality evidence from the raw source.',
    })
    insert_explanations(nb, [
        (
            "entity resolution",
            "Known variants map to a canonical school name before aggregation. This is an explicit, auditable mapping rather than an automatic fuzzy merge, because similarly named schools may be distinct entities.",
        ),
        (
            "deduplication and validation",
            "The repeated `E002` identifier is a verified duplicate, so one copy is retained. Invalid dates, missing keys, negative values, and impossible funnel order are stored as separate flags. The original problem remains visible for audit and remediation.",
        ),
        (
            "model-ready aggregation",
            "Only valid engagement rows contribute to outcome totals. `data_quality` is calculated from all source rows for the school, including rejected records, so cleaning does not hide upstream reliability problems.",
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
        'MAX_DISTANCE = 999      # TODO': 'MAX_DISTANCE = 30',
        'MIN_DATA_QUALITY = 0.00 # TODO': 'MIN_DATA_QUALITY = 0.70',
        'K = 3  # TODO': 'K = 5',
        'MIN_OVERLAP = 1  # TODO': 'MIN_OVERLAP = 2',
        'USE_SIMILARITY_WEIGHTS = False  # TODO': 'USE_SIMILARITY_WEIGHTS = True',
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
            "Filtering happens before Top-K selection. Summit is removed because its history is unreliable; Liberty is removed because travel exceeds the current constraint. A strong score cannot override feasibility or evidence quality.",
        ),
        (
            "Top K",
            "`K = 5` returns a manageable shortlist, not an automated assignment. The displayed component measures let a human see why each school ranked highly.",
        ),
        (
            "overlap-aware similarity",
            "Cosine similarity is calculated only on actions observed at both schools. Requiring two overlaps avoids declaring two schools similar because of a single shared event result.",
        ),
        (
            "similarity-weighted prediction",
            "The three nearest behavioral neighbors contribute to the missing Mechanical score. Each neighbor’s outcome is weighted by similarity, making stronger analogues more influential. The result remains labeled `predicted` so it is not confused with direct Jefferson evidence.",
        ),
    ])
    add_completed_banner(nb)


def complete_lab_3(nb):
    replace_all(nb, {
        'TOP_K = 1  # TODO: retrieve three sources for the main exercise':
            'TOP_K = 3  # retrieve a small, inspectable evidence set',
        'INCLUDE_SOURCE_IDS = False  # TODO': 'INCLUDE_SOURCE_IDS = True',
        'REFUSE_UNSUPPORTED = False  # TODO': 'REFUSE_UNSUPPORTED = True',
    })
    insert_explanations(nb, [
        (
            "API execution control",
            "The completed notebook keeps `RUN_API_CALLS = False` so opening or rerunning it never creates surprise API usage. Paste a temporary workshop key into the blank `OPENAI_API_KEY` variable, then switch the flag to `True` to run both model comparisons. Clear the variable and outputs before saving or sharing. The API call supplies no tools, so it cannot invoke web search.",
        ),
        (
            "retrieval depth",
            "Top 3 balances evidence coverage with prompt focus. The query retrieves the Mechanical playbook and Jefferson profile because their terms match the requested action, school, timing, and equipment needs. Retrieval relevance is still not authority; every selected document must come from an approved corpus.",
        ),
        (
            "grounding contract",
            "Source IDs make claims auditable. The refusal rule tells the model to expose missing evidence instead of filling gaps. Delimiters separate documents, while the original question remains intact below the evidence.",
        ),
        (
            "unsupported-claim test",
            "The red-team question asks for an exact incentive and guaranteed qualification—facts absent from the corpus and inappropriate to infer. A correct answer refuses those specifics and directs the issue to current authoritative channels.",
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
            "data_quality": school_result["data_quality"],
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
            "The orchestrator calls narrow deterministic tools, constructs a candidate with provenance, validates it, and then checks the shared hour budget. Candidates with missing sources or weak data are skipped rather than repaired through invention. The returned plan is still a proposal requiring human approval.",
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
