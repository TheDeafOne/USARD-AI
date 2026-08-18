(() => {
  "use strict";

  const datasets = {
    raw: {
      title: "Raw recruiting events",
      description: "Original engagement records with real-world inconsistencies preserved for data-cleaning practice.",
      path: "data/raw_recruiting_events.csv",
    },
    clean: {
      title: "Clean recruiting events",
      description: "Validated, standardized engagement records with stable school identifiers and analysis-ready values.",
      path: "data/clean_recruiting_events.csv",
    },
    summary: {
      title: "School summary",
      description: "School-level recruiting activity, outcomes, access scores, and travel distance used by the recommendation workflow.",
      path: "data/school_summary.csv",
    },
    "school-profiles": {
      title: "School profiles",
      description: "Fictional school program emphasis scored across five shared career-interest dimensions for content-based matching.",
      path: "data/school_profiles.csv",
    },
    "action-profiles": {
      title: "Action profiles",
      description: "The six classroom engagement formats scored across the same dimensions as the school profiles.",
      path: "data/action_profiles.csv",
    },
  };

  const params = new URLSearchParams(window.location.search);
  const datasetKey = params.get("dataset") || "raw";
  const dataset = datasets[datasetKey] || datasets.raw;
  const elements = {
    title: document.querySelector("#dataset-title"),
    description: document.querySelector("#dataset-description"),
    download: document.querySelector("#download-csv"),
    copy: document.querySelector("#copy-url"),
    search: document.querySelector("#table-search"),
    count: document.querySelector("#row-count"),
    path: document.querySelector("#file-path"),
    table: document.querySelector("#csv-table"),
    head: document.querySelector("#csv-table thead"),
    body: document.querySelector("#csv-table tbody"),
    state: document.querySelector("#table-state"),
  };

  let headers = [];
  let rows = [];
  let visibleRows = [];
  let sortColumn = -1;
  let sortDirection = 1;

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
    const normalized = value.trim().replace(/,/g, "");
    return /^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized) ? Number(normalized) : null;
  }

  function compareValues(left, right, columnIndex) {
    if (left === "" && right !== "") return 1;
    if (right === "" && left !== "") return -1;

    if (headers[columnIndex].toLocaleLowerCase().includes("date")) {
      const leftDate = Date.parse(left);
      const rightDate = Date.parse(right);
      if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) return leftDate - rightDate;
    }

    const leftNumber = numericValue(left);
    const rightNumber = numericValue(right);
    if (leftNumber !== null && rightNumber !== null) return leftNumber - rightNumber;

    return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
  }

  function renderHead() {
    const tableRow = document.createElement("tr");

    headers.forEach((header, columnIndex) => {
      const cell = document.createElement("th");
      const button = document.createElement("button");
      const label = document.createElement("span");
      const indicator = document.createElement("span");
      const active = sortColumn === columnIndex;

      button.className = "sort-button";
      button.type = "button";
      button.dataset.column = String(columnIndex);
      button.title = `Sort by ${header}`;
      label.textContent = header.replaceAll("_", " ");
      indicator.className = "sort-indicator";
      indicator.setAttribute("aria-hidden", "true");
      button.append(label, indicator);
      cell.scope = "col";
      cell.setAttribute("aria-sort", active ? (sortDirection === 1 ? "ascending" : "descending") : "none");
      cell.append(button);
      tableRow.append(cell);
    });

    elements.head.replaceChildren(tableRow);
  }

  function renderBody() {
    const fragment = document.createDocumentFragment();

    visibleRows.forEach((row) => {
      const tableRow = document.createElement("tr");
      row.forEach((value) => {
        const cell = document.createElement("td");
        const number = numericValue(value);
        cell.textContent = value || "—";
        if (number !== null) cell.classList.add("is-number");
        if (value === "") cell.classList.add("is-empty");
        tableRow.append(cell);
      });
      fragment.append(tableRow);
    });

    elements.body.replaceChildren(fragment);
    const noun = visibleRows.length === 1 ? "row" : "rows";
    elements.count.textContent = visibleRows.length === rows.length
      ? `${rows.length.toLocaleString()} ${noun}`
      : `${visibleRows.length.toLocaleString()} of ${rows.length.toLocaleString()} rows`;

    if (visibleRows.length === 0) {
      showState("No rows match that search.", false);
    } else {
      elements.state.hidden = true;
    }
  }

  function showState(message, loading) {
    elements.state.hidden = false;
    elements.state.replaceChildren();
    if (loading) {
      const loader = document.createElement("span");
      loader.className = "loader";
      loader.setAttribute("aria-hidden", "true");
      elements.state.append(loader);
    }
    const text = document.createElement("p");
    text.textContent = message;
    elements.state.append(text);
  }

  function applySearch() {
    const query = elements.search.value.trim().toLocaleLowerCase();
    visibleRows = query
      ? rows.filter((row) => row.some((value) => value.toLocaleLowerCase().includes(query)))
      : [...rows];
    applySort();
    renderBody();
  }

  function applySort() {
    if (sortColumn < 0) return;
    visibleRows.sort((left, right) => compareValues(left[sortColumn], right[sortColumn], sortColumn) * sortDirection);
  }

  function sortBy(columnIndex) {
    if (sortColumn === columnIndex) {
      if (sortDirection === 1) {
        sortDirection = -1;
      } else {
        sortColumn = -1;
        sortDirection = 1;
      }
    } else {
      sortColumn = columnIndex;
      sortDirection = 1;
    }
    renderHead();
    applySearch();
  }

  async function copyCSVUrl() {
    const csvUrl = new URL(dataset.path, window.location.href).href;
    try {
      await navigator.clipboard.writeText(csvUrl);
      elements.copy.textContent = "URL copied";
      window.setTimeout(() => { elements.copy.textContent = "Copy CSV URL"; }, 1800);
    } catch {
      window.prompt("Copy this CSV URL:", csvUrl);
    }
  }

  async function loadData() {
    document.title = `${dataset.title} | USARD Concepts`;
    elements.title.textContent = dataset.title;
    elements.description.textContent = dataset.description;
    elements.download.href = dataset.path;
    elements.path.textContent = dataset.path;

    try {
      const response = await fetch(dataset.path);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const parsed = parseCSV(await response.text());
      if (parsed.length < 2) throw new Error("The CSV contains no data rows");

      headers = parsed[0];
      rows = parsed.slice(1).map((row) => headers.map((_, index) => row[index] ?? ""));
      visibleRows = [...rows];
      renderHead();
      renderBody();
    } catch (error) {
      elements.count.textContent = "Unable to load";
      showState(`Could not load this CSV. ${error.message}`, false);
    }
  }

  elements.head.addEventListener("click", (event) => {
    const button = event.target.closest(".sort-button");
    if (button) sortBy(Number(button.dataset.column));
  });
  elements.search.addEventListener("input", applySearch);
  elements.copy.addEventListener("click", copyCSVUrl);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== elements.search) {
      event.preventDefault();
      elements.search.focus();
    }
  });

  loadData();
})();
