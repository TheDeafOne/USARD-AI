# USARD AI Technical Track — Completed Instructor Notebooks

These notebooks contain the completed exercise values, solution explanations, self-checks, and saved offline outputs.

They correspond directly to the student notebooks in `../labs/`.

## RAG API calls

The RAG notebook keeps `RUN_API_CALLS = False` by default. This prevents accidental API charges when the notebook is opened or rerun.

For a live demonstration:

1. Revoke any key that has been pasted into chat or another shared surface.
2. Create a replacement project key.
3. Store it in the `OPENAI_API_KEY` environment variable or an approved secret manager.
4. Restart Jupyter and change `RUN_API_CALLS = True`.

No API key is stored in these files.

Official guidance: [OpenAI production best practices — API keys](https://developers.openai.com/api/docs/guides/production-best-practices#api-keys)
