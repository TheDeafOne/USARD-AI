(() => {
  "use strict";

  const eventFields = {
    engagement_id: "Stable identifier for one engagement record; repeated IDs signal a duplicate.",
    event_date: "Date the school engagement occurred.",
    school_id: "Canonical school identifier added after entity resolution.",
    school_name: "School label; raw values intentionally include aliases and misspellings.",
    action: "Engagement format, such as a careers event, presentation, or recruiting table.",
    recruiter_hours: "Total recruiter labor hours invested in the event.",
    contacts: "Students reached during the engagement.",
    appointments: "Follow-up appointments produced by those contacts.",
    qualified: "Appointments that met the fictional qualification criteria.",
    contracts: "Downstream contracts attributed to the engagement.",
    access_score: "Operational ease-of-access score from 0 to 1; higher values mean easier access.",
    distance_miles: "One-way travel distance to the school in miles.",
    historical_events: "Count of validated engagements available as evidence for the school.",
  };

  const profileFields = {
    school_id: "Stable identifier shared with the event and summary tables.",
    school_name: "Canonical school name.",
    action: "Canonical name of one historical engagement format.",
    cyber: "Relative emphasis on cyber topics, from 0 to 1.",
    engineering: "Relative emphasis on engineering topics, from 0 to 1.",
    mechanical: "Relative emphasis on mechanical topics, from 0 to 1.",
    healthcare: "Relative emphasis on healthcare topics, from 0 to 1.",
    education: "Relative emphasis on education-benefit topics, from 0 to 1.",
  };

  const documentFields = {
    source_id: "Stable citation key preserved in every retrieved chunk.",
    version: "Document edition used to distinguish current classroom evidence.",
    owner: "Fictional organization responsible for the source.",
    section: "Markdown section heading used as the semantic chunk boundary.",
    sample: "Short preview of the section content available to retrieval.",
  };

  const toolFields = {
    school: "Canonical school name passed between tools.",
    score: "Model or ranking score on a 0-to-1 scale.",
    historical_events: "Number of past events supporting the ranking.",
    action: "Recommended or estimated engagement format.",
    evidence: "Whether the recommendation is observed historically or predicted.",
    source_ids: "Stable IDs for the approved evidence returned by retrieval.",
    sources_found: "Count of approved sources available to ground the plan.",
    hours: "Estimated field hours required for the action.",
  };

  const pick = (dictionary, keys) => Object.fromEntries(keys.map((key) => [key, dictionary[key]]));

  const labs = {
    "1": {
      kicker: "Lab 01 / Pipeline integrity",
      title: "Can we trust the data?",
      summary: "Meet the messy CRM export, then follow it into two reusable data products with auditable lineage.",
      mission: "Resolve identities, remove true duplicates, validate the recruiting funnel, and produce model-ready event and school tables.",
      mode: "CSV pipeline",
      outcome: "The lab turns one intentionally imperfect input into a clean event table and an aggregated school table for Lab 2.",
      sources: [
        {
          title: "Raw recruiting events",
          filename: "raw_recruiting_events.csv",
          role: "Input",
          path: "data/raw_recruiting_events.csv",
          rowCount: 494,
          purpose: "The starting point for profiling, entity resolution, duplicate handling, date parsing, and row-level validation.",
          description: "One row represents a reported school engagement. The export deliberately preserves inconsistent school and action names, mixed dates, missing keys, duplicate IDs, and impossible funnel values.",
          fields: pick(eventFields, ["engagement_id", "event_date", "school_name", "action", "recruiter_hours", "contacts", "appointments", "qualified", "contracts", "access_score", "distance_miles"]),
          note: "<strong>Integrity rule:</strong> valid rows must satisfy contacts ≥ appointments ≥ qualified ≥ contracts; repeated events are allowed, repeated engagement IDs are not.",
        },
        {
          title: "Clean recruiting events",
          filename: "clean_recruiting_events.csv",
          role: "Output",
          path: "data/clean_recruiting_events.csv",
          rowCount: 459,
          purpose: "The validated event-level artifact used downstream for school-action history and collaborative filtering.",
          description: "One row remains for each accepted engagement. School and action labels are canonical, dates and numbers are typed, and a stable school ID makes joins dependable.",
          fields: pick(eventFields, ["engagement_id", "event_date", "school_id", "school_name", "action", "recruiter_hours", "contacts", "appointments", "qualified", "contracts", "access_score", "distance_miles"]),
          note: "<strong>Lineage:</strong> every row comes from the raw export after explicit cleaning and rejection rules; no synthetic quality score is added.",
        },
        {
          title: "School summary",
          filename: "school_summary.csv",
          role: "Output",
          path: "data/school_summary.csv",
          rowCount: 36,
          purpose: "The school-level artifact that Lab 2 uses to compare downstream value, access, travel, and evidence volume.",
          description: "Each row rolls validated engagements up to one school. Counts and recruiter hours are summed; access and distance remain stable school characteristics.",
          fields: pick(eventFields, ["school_id", "school_name", "historical_events", "recruiter_hours", "contacts", "appointments", "qualified", "contracts", "access_score", "distance_miles"]),
          note: "<strong>Grain change:</strong> event rows become one row per school. Lab 2 calculates rates rather than storing them here.",
        },
      ],
    },
    "2": {
      kicker: "Lab 02 / Recommender systems",
      title: "Where should we focus—and what should we try?",
      summary: "Four small, explainable datasets support school ranking, collaborative filtering, content matching, and a final hybrid recommendation.",
      mission: "Rank schools by downstream value and feasibility, then combine behavioral and content evidence to recommend an engagement.",
      mode: "4 CSV tables",
      outcome: "The collaborative and content scores are normalized and combined into the final hybrid recommendation.",
      sources: [
        {
          title: "School summary",
          filename: "school_summary.csv",
          role: "Where to focus",
          path: "data/school_summary.csv",
          rowCount: 36,
          purpose: "Aggregated school outcomes, access, distance, and event volume. Used to rank where recruiters should focus.",
          description: "One row per school preserves the outcomes and operational constraints needed for a transparent opportunity score.",
          fields: pick(eventFields, ["school_id", "school_name", "historical_events", "recruiter_hours", "contacts", "appointments", "qualified", "contracts", "access_score", "distance_miles"]),
          note: "<strong>Lab A:</strong> contracts per hour, qualification rate, and access are normalized and weighted; distance and history thresholds filter infeasible or thinly supported options.",
        },
        {
          title: "Clean recruiting events",
          filename: "clean_recruiting_events.csv",
          role: "Collaborative",
          path: "data/clean_recruiting_events.csv",
          rowCount: 459,
          purpose: "Historical results for each school-action combination. Used for collaborative filtering—identifying what worked at behaviorally similar schools.",
          description: "The event-level history is aggregated into a school-by-action matrix so missing combinations can be estimated from neighboring schools.",
          fields: pick(eventFields, ["engagement_id", "event_date", "school_id", "school_name", "action", "recruiter_hours", "contacts", "appointments", "qualified", "contracts", "access_score", "distance_miles"]),
          note: "<strong>Evidence type:</strong> observed values come from actual classroom history; predicted values are inferred from similar schools and remain labeled as predictions.",
        },
        {
          title: "School profiles",
          filename: "school_profiles.csv",
          role: "Content vector",
          path: "data/school_profiles.csv",
          rowCount: 36,
          purpose: "School emphasis across cyber, engineering, mechanical, healthcare, and education. Used as the school vector for content-based filtering.",
          description: "One vector per school describes aggregate program emphasis. Scores are fictional, bounded from 0 to 1, and exclude protected characteristics.",
          fields: pick(profileFields, ["school_id", "school_name", "cyber", "engineering", "mechanical", "healthcare", "education"]),
          note: "<strong>Shared space:</strong> the five dimensions have the same order and meaning as the action-profile dimensions.",
        },
        {
          title: "Action profiles",
          filename: "action_profiles.csv",
          role: "Content match",
          path: "data/action_profiles.csv",
          rowCount: 6,
          purpose: "The same five dimensions for each historical action type. Used to measure how well an action fits a school profile.",
          description: "Each engagement format is represented as a content vector. Cosine similarity compares it with the target school vector without mixing in outcome history.",
          fields: pick(profileFields, ["action", "cyber", "engineering", "mechanical", "healthcare", "education"]),
          note: "<strong>Hybrid step:</strong> normalized collaborative and content scores are combined only after both evidence streams have been inspected separately.",
        },
      ],
    },
    "3": {
      kicker: "Lab 03 / Retrieval-augmented generation",
      title: "What changes when the model gets the evidence?",
      summary: "Lab 2 chose Jefferson High. Lab 3 carries that decision forward and uses six fictional Markdown documents to plan a grounded Mechanical Careers Demo.",
      mission: "Retrieve question-specific, authoritative evidence for Jefferson High while avoiding irrelevant or unsupported details.",
      mode: "Markdown corpus",
      outcome: "Together, the sources demonstrate how RAG retrieves question-specific, authoritative evidence while avoiding irrelevant or unsupported details.",
      sources: [
        {
          title: "Jefferson Visitor Handbook",
          filename: "jefferson_high_handbook.md",
          role: "Local rules",
          purpose: "Local scheduling, visitor, room, network, capacity, and privacy rules.",
          description: "School-specific procedures cover scheduling, visitor access, room capacity, offline technology, privacy, safety, accessibility, and approval.",
          fields: documentFields,
          fieldLabel: "Metadata carried into each chunk",
          snippet: {
            section: "Career event hosting checklist",
            text: "Jefferson career events use the Tuesday or Thursday window from 10:30 a.m. to 12:30 p.m. Requests are due at least ten school days in advance, and the school must receive every adult visitor's full name 48 hours before arrival.",
          },
          note: "<strong>Precedence:</strong> this local handbook can impose narrower rules than the district policy.",
        },
        {
          title: "Jefferson CTE Guide",
          filename: "jefferson_cte_program_guide.md",
          role: "Program fit",
          purpose: "Connects event content to Jefferson’s programs and interests.",
          description: "The guide describes engineering design, robotics, transportation systems, logistics, workplace behaviors, and preferred event design.",
          fields: documentFields,
          fieldLabel: "Metadata carried into each chunk",
          snippet: {
            section: "Engineering design pathway",
            text: "Students in the engineering design pathway practice measurement, computer-aided design, prototyping, documentation, and iterative problem solving.",
          },
          note: "<strong>Boundary:</strong> the guide supports content alignment, not claims about jobs, qualifications, compensation, or benefits.",
        },
        {
          title: "Technical Careers Guide",
          filename: "army_technical_careers_guide.md",
          role: "Approved topics",
          purpose: "Supplies approved mechanical and technical-career themes.",
          description: "The source covers maintenance, diagnostics, electrical fundamentals, logistics, safety, teamwork, training, and civilian-learning connections.",
          fields: documentFields,
          fieldLabel: "Metadata carried into each chunk",
          snippet: {
            section: "Mechanical maintenance",
            text: "Mechanical maintenance work can involve inspecting systems, identifying abnormal wear, using technical references, replacing or adjusting components, documenting completed work, and confirming that a system operates as intended.",
          },
          note: "<strong>Guardrail:</strong> it is not a vacancy list and establishes no eligibility, assignment, training date, or contract term.",
        },
        {
          title: "Education Benefits Guide",
          filename: "army_education_benefits_guide.md",
          role: "Approved wording",
          purpose: "Provides accurate, non-promissory benefits language.",
          description: "The guide allows high-level categories and caveated language while omitting dollar amounts, personal eligibility decisions, and promises.",
          fields: documentFields,
          fieldLabel: "Metadata carried into each chunk",
          snippet: {
            section: "General discussion categories",
            text: "Recruiters may explain that education support can include several broad categories: assistance with eligible coursework while serving, support for approved credentials or certifications, programs associated with qualifying service, and counseling that helps individuals compare education goals with service obligations.",
          },
          note: "<strong>Grounding goal:</strong> retrieved wording replaces plausible-sounding guesses with bounded, citable statements.",
        },
        {
          title: "District Career Policy",
          filename: "district_career_engagement_policy.md",
          role: "District policy",
          purpose: "Adds district-wide approval and engagement requirements.",
          description: "This cross-school policy applies to external career activities. When it conflicts with a narrower school rule, the stricter requirement controls until clarified.",
          fields: documentFields,
          fieldLabel: "Metadata carried into each chunk",
          snippet: {
            section: "Approval timeline",
            text: "External partners should submit an event request at least ten school days in advance. The school identifies a faculty host, reviews the proposed content, confirms the space, and determines whether additional safety review is required.",
          },
          note: "<strong>Why retrieve it:</strong> local logistics are incomplete without the district’s policy constraints.",
        },
        {
          title: "Regional Program Catalog",
          filename: "regional_programs_and_event_catalog.md",
          role: "Distractor",
          purpose: "Distractor content used to test retrieval relevance.",
          description: "The catalog contains useful regional context alongside deliberate distractors such as Roosevelt scheduling and cyber-event network rules.",
          fields: documentFields,
          fieldLabel: "Metadata carried into each chunk",
          snippet: {
            section: "Roosevelt High health sciences",
            text: "The school prefers healthcare career sessions and allows events on Wednesday afternoons. Its simulation room has a capacity of 24 students. These requirements apply to Roosevelt High, not Jefferson High.",
          },
          note: "<strong>Retrieval lesson:</strong> lexical similarity is not the same as operational relevance.",
        },
      ],
    },
    "4": {
      kicker: "Lab 04 / Agentic integration",
      title: "Coordinate, validate, escalate",
      summary: "The scaffold uses deterministic mock tools so every input, decision boundary, and failure state stays inspectable.",
      mission: "Build a bounded plan in the sequence rank → recommend → estimate → retrieve → validate → request human review.",
      mode: "Mock tool data",
      outcome: "A plan may proceed only when history, confidence, approved evidence, citations, and the 16-hour field budget all pass validation.",
      sources: [
        {
          title: "School ranking response",
          filename: "rank_schools(top_k=3)",
          role: "Rank",
          purpose: "Returns the ordered school candidates that start the orchestration loop.",
          description: "The mock response carries both a ranking score and the historical event count needed by the evidence-volume gate.",
          fields: pick(toolFields, ["school", "score", "historical_events"]),
          headers: ["school", "score", "historical_events"],
          rows: [
            ["Jefferson High", "0.91", "19"],
            ["Washington High", "0.83", "17"],
            ["North County Tech", "0.80", "14"],
          ],
          note: "<strong>Failure injection:</strong> reducing a candidate below four historical events should trigger escalation.",
        },
        {
          title: "Action recommendation response",
          filename: "recommend_actions(school)",
          role: "Recommend",
          purpose: "Returns one recommended engagement, its confidence, and whether its support is observed or predicted.",
          description: "The recommendation tool has one narrow job and returns no plan, schedule, or approval decision.",
          fields: pick(toolFields, ["school", "action", "score", "evidence"]),
          headers: ["school", "action", "score", "evidence"],
          rows: [
            ["Jefferson High", "Mechanical Careers Demo", "0.72", "predicted"],
            ["Washington High", "Cyber Careers Event", "0.70", "observed"],
            ["North County Tech", "STEM Careers Presentation", "0.66", "observed"],
          ],
          note: "<strong>Confidence gate:</strong> recommendations below 0.60 do not enter a proposed plan.",
        },
        {
          title: "Approved-information response",
          filename: "retrieve_approved_information(school, action)",
          role: "Retrieve",
          purpose: "Returns evidence identifiers and a count without asking the agent to invent missing support.",
          description: "Only Jefferson’s Mechanical Careers Demo has enough mock evidence in the first-pass scaffold; other combinations return an explicit empty result.",
          fields: pick(toolFields, ["school", "action", "source_ids", "sources_found"]),
          headers: ["school", "action", "source_ids", "sources_found"],
          rows: [
            ["Jefferson High", "Mechanical Careers Demo", "SCHOOL_PROFILE_2026_08 · MECH_PLAYBOOK_V3", "2"],
            ["Washington High", "Cyber Careers Event", "—", "0"],
          ],
          note: "<strong>Evidence gate:</strong> fewer than two approved sources or missing IDs produces a stop, not improvisation.",
        },
        {
          title: "Field-hour estimate",
          filename: "estimate_hours(school, action)",
          role: "Estimate",
          purpose: "Supplies deterministic resource costs for the plan’s 16-hour budget check.",
          description: "Each supported action maps to a field-hour estimate. The orchestrator may include only feasible items whose combined cost stays within budget.",
          fields: pick(toolFields, ["action", "hours"]),
          headers: ["action", "hours"],
          rows: [
            ["Mechanical Careers Demo", "6"],
            ["Cyber Careers Event", "5"],
            ["STEM Careers Presentation", "4"],
          ],
          note: "<strong>Resource gate:</strong> a 20-hour injected estimate must fail against the 16-hour budget. Even a valid plan still requires human approval.",
        },
      ],
    },
  };

  const escapeHTML = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function parseCSV(text) {
    const parsed = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (quoted) {
        if (character === '"' && text[index + 1] === '"') {
          value += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          value += character;
        }
      } else if (character === '"') {
        quoted = true;
      } else if (character === ",") {
        row.push(value);
        value = "";
      } else if (character === "\n") {
        row.push(value.replace(/\r$/, ""));
        parsed.push(row);
        row = [];
        value = "";
      } else {
        value += character;
      }
    }

    if (value.length || row.length) {
      row.push(value.replace(/\r$/, ""));
      parsed.push(row);
    }
    return parsed.filter((parsedRow) => parsedRow.some((cell) => cell !== ""));
  }

  function numericValue(value) {
    return /^-?(?:\d+\.?\d*|\.\d+)$/.test(String(value).trim());
  }

  function renderTable(table, headers, rows) {
    const head = headers.map((header) => `<th scope="col">${escapeHTML(header.replaceAll("_", " "))}</th>`).join("");
    const body = rows.map((row) => `<tr>${headers.map((_, index) => {
      const value = row[index] ?? "";
      const classes = [numericValue(value) ? "is-number" : "", value === "" || value === "—" ? "is-empty" : ""].filter(Boolean).join(" ");
      return `<td class="${classes}">${escapeHTML(value || "—")}</td>`;
    }).join("")}</tr>`).join("");
    table.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
  }

  function sourceMarkup(source, index) {
    const fields = Object.entries(source.fields);
    const preview = source.snippet
      ? `
          <div class="snippet-preview">
            <div class="snippet-chrome" aria-hidden="true"><span></span><span></span><span></span></div>
            <p class="snippet-section">## ${escapeHTML(source.snippet.section)}</p>
            <blockquote>${escapeHTML(source.snippet.text)}</blockquote>
            <p class="snippet-caption">Excerpt from ${escapeHTML(source.filename)}</p>
          </div>
        `
      : `
          <div class="preview-bar">
            <p class="preview-label">Sample rows</p>
            <p class="preview-count" data-preview-count>${source.path ? "Loading…" : `${source.rows.length} representative rows`}</p>
          </div>
          <div class="sample-table-wrap">
            <div class="table-loading" data-table-state>Reading source…</div>
            <table class="sample-table" data-sample-table hidden></table>
          </div>
        `;
    return `
      <section class="source-section" id="source-${index + 1}">
        <header class="source-heading">
          <div class="source-heading-main">
            <span class="source-index">${String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>${escapeHTML(source.title)}</h2>
              <p class="source-file">${escapeHTML(source.filename)}</p>
            </div>
          </div>
          <span class="source-role">${escapeHTML(source.role)}</span>
        </header>
        <div class="source-layout">
          <div class="source-preview">
            ${preview}
            <div class="column-strip">
              <p>${escapeHTML(source.fieldLabel || "Columns in this source")}</p>
              <div class="column-list">${fields.map(([field]) => `<code>${escapeHTML(field)}</code>`).join("")}</div>
            </div>
          </div>
          <div class="source-copy">
            <div class="copy-block">
              <p class="copy-label">Purpose</p>
              <h3>How the lab uses it</h3>
              <p>${escapeHTML(source.purpose)}</p>
            </div>
            <div class="copy-block">
              <p class="copy-label">What it is</p>
              <h3>Source shape &amp; meaning</h3>
              <p>${escapeHTML(source.description)}</p>
            </div>
            <div class="copy-block">
              <p class="copy-label">Field guide</p>
              <h3>What the variables mean</h3>
              <dl class="field-list">
                ${fields.map(([field, definition]) => `<div><dt>${escapeHTML(field)}</dt><dd>${escapeHTML(definition)}</dd></div>`).join("")}
              </dl>
            </div>
            <div class="source-note">${source.note}</div>
          </div>
        </div>
      </section>
    `;
  }

  async function loadCSVSource(section, source) {
    const table = section.querySelector("[data-sample-table]");
    const state = section.querySelector("[data-table-state]");
    const count = section.querySelector("[data-preview-count]");
    try {
      const response = await fetch(source.path);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const parsed = parseCSV(await response.text());
      const headers = parsed[0];
      const rows = parsed.slice(1, 4).map((row) => headers.map((_, index) => row[index] ?? ""));
      renderTable(table, headers, rows);
      count.textContent = `${rows.length} of ${source.rowCount.toLocaleString()} rows`;
      state.hidden = true;
      table.hidden = false;
    } catch (error) {
      state.textContent = `Could not load sample. ${error.message}`;
      count.textContent = "Unavailable";
    }
  }

  function loadStaticSource(section, source) {
    const table = section.querySelector("[data-sample-table]");
    const state = section.querySelector("[data-table-state]");
    renderTable(table, source.headers, source.rows);
    state.hidden = true;
    table.hidden = false;
  }

  function init() {
    const lab = labs[document.body.dataset.lab] || labs["1"];
    document.querySelector("#lab-kicker").textContent = lab.kicker;
    document.querySelector("#lab-title").textContent = lab.title;
    document.querySelector("#lab-summary").textContent = lab.summary;
    document.querySelector("#lab-mission").textContent = lab.mission;
    document.querySelector("#source-count").textContent = String(lab.sources.length).padStart(2, "0");
    document.querySelector("#lab-mode").textContent = lab.mode;
    document.querySelector("#lab-outcome").textContent = lab.outcome;

    const jump = document.querySelector("#source-jump");
    jump.innerHTML = lab.sources.map((source, index) =>
      `<a href="#source-${index + 1}">${String(index + 1).padStart(2, "0")} · ${escapeHTML(source.title)}</a>`
    ).join("");

    const list = document.querySelector("#source-list");
    list.innerHTML = lab.sources.map(sourceMarkup).join("");
    const sections = [...list.querySelectorAll(".source-section")];
    lab.sources.forEach((source, index) => {
      if (source.path) loadCSVSource(sections[index], source);
      else if (!source.snippet) loadStaticSource(sections[index], source);
    });
  }

  init();
})();
