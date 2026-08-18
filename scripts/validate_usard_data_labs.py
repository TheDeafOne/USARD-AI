from pathlib import Path

import nbformat
from nbclient import NotebookClient


ROOT = Path(__file__).resolve().parents[1]
NOTEBOOKS = [
    "Lab_1_Data_Cleaning_and_Integrity.ipynb",
    "Lab_2_Recommender_Systems.ipynb",
    "Lab_3_RAG_Grounded_Briefs.ipynb",
    "Lab_4_Agentic_Integration.ipynb",
]


def execute(path: Path, save: bool) -> tuple[int, int]:
    notebook = nbformat.read(path, as_version=4)
    client = NotebookClient(
        notebook,
        timeout=180,
        kernel_name="python3",
        resources={"metadata": {"path": str(path.parent)}},
    )
    client.execute()

    passed = 0
    failed = 0
    for cell in notebook.cells:
        for output in cell.get("outputs", []):
            text = output.get("text", "")
            passed += text.count("✅")
            failed += text.count("❌")

    if save:
        nbformat.write(notebook, path)
    return passed, failed


for filename in NOTEBOOKS:
    student_path = ROOT / "labs" / filename
    completed_path = ROOT / "labs_completed" / filename

    student_passed, student_failed = execute(student_path, save=False)
    completed_passed, completed_failed = execute(completed_path, save=True)

    print(
        f"{filename}: student starter ran ({student_passed} checks already pass, "
        f"{student_failed} await student edits); completed ran "
        f"({completed_passed} passed, {completed_failed} failed)."
    )
    if completed_failed:
        raise SystemExit(f"Completed notebook has failing checks: {completed_path}")
