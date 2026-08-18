import fs from "node:fs/promises";
import path from "node:path";
import { Workbook } from "@oai/artifact-tool";


const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const PREVIEW_DIR = "/private/tmp/usard_csv_previews";
await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(PREVIEW_DIR, { recursive: true });


function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260818);
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));


const schoolNames = [
  "Lincoln High", "Jefferson High", "Washington High", "Roosevelt High",
  "North County Tech", "Lakeside Academy", "Madison High", "Franklin High",
  "Central High", "Riverside High", "Eastview High", "Westfield High",
  "Pine Ridge High", "Oak Valley High", "Summit High", "Cedar Grove High",
  "Parkview High", "Liberty High", "Monroe High", "Adams High",
  "Hamilton High", "Kennedy High", "Jackson High", "Grant High",
  "Wilson High", "Heritage High", "Valley Tech", "Mountain View High",
  "Harbor High", "Brookside High", "Greenfield High", "Redstone High",
  "Horizon High", "Pioneer High", "Union High", "Victory High",
];

const anchorOperations = {
  "Lincoln High": [.90, 8],
  "Jefferson High": [.92, 12],
  "Washington High": [.72, 18],
  "Roosevelt High": [.95, 6],
  "North County Tech": [.80, 22],
  "Summit High": [.86, 16],
  "Liberty High": [.82, 44],
  "Victory High": [.74, 14],
};

const groups = ["cyber", "engineering", "health", "education", "balanced", "general"];
const schools = schoolNames.map((name, index) => {
  const [access, distance] = anchorOperations[name] ?? [
    Math.round((.55 + rng() * .41) * 100) / 100,
    randInt(4, 48),
  ];
  return {
    school_id: `S${String(index + 1).padStart(3, "0")}`,
    school_name: name,
    access_score: access,
    distance_miles: distance,
    group: groups[index % groups.length],
    profile_index: index,
  };
});

const actions = [
  "Cyber Careers Event",
  "STEM Careers Presentation",
  "Mechanical Careers Demo",
  "Healthcare Careers Session",
  "Education Benefits Session",
  "General Recruiting Table",
];

const profileDimensions = ["cyber", "engineering", "mechanical", "healthcare", "education"];

// Content metadata is deliberately separate from historical outcomes. These
// fictional 0-1 values describe aggregate program emphasis at each school and
// the subject-matter fit of each action; they do not use protected traits.
const actionProfileValues = {
  "Cyber Careers Event": [.95, .75, .20, .05, .15],
  "STEM Careers Presentation": [.70, .95, .35, .05, .20],
  "Mechanical Careers Demo": [.10, .60, 1.00, .00, .20],
  "Healthcare Careers Session": [.05, .10, .05, 1.00, .15],
  "Education Benefits Session": [.10, .20, .10, .15, 1.00],
  "General Recruiting Table": [.35, .35, .35, .35, .35],
};

const schoolContentBaseProfiles = {
  cyber: [.84, .62, .30, .08, .22],
  engineering: [.34, .86, .72, .08, .24],
  health: [.08, .16, .10, .88, .28],
  education: [.14, .20, .10, .24, .88],
  balanced: [.52, .58, .48, .42, .50],
  general: [.34, .36, .30, .34, .48],
};

const schoolContentAnchors = {
  "Lincoln High": [.45, .58, .72, .12, .28],
  "Jefferson High": [.90, .80, .75, .15, .40],
  "Washington High": [.78, .73, .82, .12, .32],
  "Roosevelt High": [.10, .18, .14, .86, .48],
  "North County Tech": [.58, .88, .92, .08, .22],
  "Lakeside Academy": [.18, .20, .18, .76, .45],
};

const actionProfiles = actions.map((action) => ({
  action,
  ...Object.fromEntries(profileDimensions.map((dimension, index) => [
    dimension,
    actionProfileValues[action][index],
  ])),
}));

const schoolProfiles = schools.map((school) => {
  const base = schoolContentAnchors[school.school_name] ?? schoolContentBaseProfiles[school.group];
  const values = schoolContentAnchors[school.school_name]
    ? base
    : base.map((value, dimensionIndex) => {
        const variation = (((school.profile_index * 13 + dimensionIndex * 7) % 9) - 4) * .02;
        return Math.round(clamp(value + variation, .02, .95) * 100) / 100;
      });
  return {
    school_id: school.school_id,
    school_name: school.school_name,
    ...Object.fromEntries(profileDimensions.map((dimension, index) => [dimension, values[index]])),
  };
});

const baseProfiles = {
  cyber: [.84, .18, .05, .03, .08, .10],
  engineering: [.28, .72, .76, .05, .10, .16],
  health: [.06, .10, .08, .80, .20, .12],
  education: [.07, .10, .07, .14, .78, .36],
  balanced: [.42, .48, .38, .32, .40, .30],
  general: [.12, .16, .10, .16, .38, .72],
};

const anchorProfiles = {
  "Lincoln High": [.22, .34, .78, .05, .14, .15],
  "Jefferson High": [.78, .72, .82, .22, .46, .42],
  "Washington High": [.68, .62, .80, .10, .30, .25],
  "North County Tech": [.55, .48, .86, .08, .20, .18],
  "Roosevelt High": [.08, .12, .14, .78, .50, .22],
  "Lakeside Academy": [.18, .12, .22, .70, .42, .25],
  "Madison High": [.34, .48, .84, .08, .18, .16],
  "Franklin High": [.14, .18, .24, .58, .40, .28],
  "Adams High": [.20, .38, .32, .15, .24, .20],
  "Oak Valley High": [.18, .70, .62, .08, .12, .15],
  "Eastview High": [.18, .22, .20, .65, .35, .18],
  "Harbor High": [.12, .22, .72, .08, .10, .45],
};

const forcedMissing = new Map([
  ["Jefferson High", new Set(["Mechanical Careers Demo"])],
  ["Roosevelt High", new Set(["STEM Careers Presentation", "Education Benefits Session"])],
  ["North County Tech", new Set(["Healthcare Careers Session"])],
  ["Lakeside Academy", new Set(["Cyber Careers Event"])],
  ["Harbor High", new Set(["Healthcare Careers Session"])],
  ["Oak Valley High", new Set(["STEM Careers Presentation"])],
]);

const forcedObserved = new Set([
  "Lincoln High", "Washington High", "North County Tech", "Madison High",
]);

const forcedObservedActions = new Map([
  ["Jefferson High", new Set(["Healthcare Careers Session"])],
  ["Harbor High", new Set(["Mechanical Careers Demo"])],
]);

const actionHours = [7, 6, 8, 6, 5, 4];
const startDate = Date.UTC(2025, 8, 1);
const endDate = Date.UTC(2026, 6, 31);
const dayMs = 24 * 60 * 60 * 1000;

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

let eventCounter = 1001;
const baseEvents = [];

for (const school of schools) {
  const baseProfile = anchorProfiles[school.school_name] ?? baseProfiles[school.group];
  const signatureAction = school.profile_index % actions.length;
  const contrastAction = (school.profile_index * 5 + 2) % actions.length;
  const profile = anchorProfiles[school.school_name]
    ? baseProfile
    : baseProfile.map((value, actionIndex) => {
        const signatureBoost = actionIndex === signatureAction ? .10 : 0;
        const contrastPenalty = actionIndex === contrastAction ? -.06 : 0;
        const deterministicVariation = (((school.profile_index * 17 + actionIndex * 11) % 9) - 4) * .015;
        return clamp(value + signatureBoost + contrastPenalty + deterministicVariation, .01, .88);
      });
  for (let actionIndex = 0; actionIndex < actions.length; actionIndex += 1) {
    const action = actions[actionIndex];
    let observed = rng() > .29;
    if (forcedObserved.has(school.school_name)) observed = true;
    if (forcedObservedActions.get(school.school_name)?.has(action)) observed = true;
    if (forcedMissing.get(school.school_name)?.has(action)) observed = false;
    if (school.school_name === "Victory High") {
      observed = new Set(["Education Benefits Session", "General Recruiting Table"]).has(action);
    }
    if (!observed) continue;

    let eventCount = randInt(2, 4);
    if (school.school_name === "Lincoln High") eventCount = 4;
    if (["Washington High", "North County Tech"].includes(school.school_name)) {
      eventCount = 3;
    }
    if (school.school_name === "Jefferson High") eventCount = 4;
    if (school.school_name === "Victory High") eventCount = 1;

    for (let eventNumber = 0; eventNumber < eventCount; eventNumber += 1) {
      const recruiterHours = clamp(actionHours[actionIndex] + randInt(-1, 2), 3, 10);
      const effectiveness = clamp(profile[actionIndex] + (rng() - .5) * .10, .01, .88);
      const contracts = Math.max(0, Math.round(effectiveness * recruiterHours + (rng() - .5)));
      const qualified = contracts + randInt(2, 7);
      let appointments = qualified + randInt(2, 9);
      let contacts = appointments + randInt(12, 36);
      if (school.school_name === "Lincoln High") {
        appointments += 10;
        contacts += 10;
      }
      const eventDate = new Date(startDate + randInt(0, Math.floor((endDate - startDate) / dayMs)) * dayMs);
      baseEvents.push({
        engagement_id: `E${eventCounter++}`,
        event_date: isoDate(eventDate),
        school_id: school.school_id,
        school_name: school.school_name,
        action,
        recruiter_hours: recruiterHours,
        contacts,
        appointments,
        qualified,
        contracts,
        access_score: school.access_score,
        distance_miles: school.distance_miles,
      });
    }
  }
}


const actionVariants = {
  "Cyber Careers Event": ["Cyber Careers Event", "Cyber Career Event", "CYBER CAREERS EVENT"],
  "STEM Careers Presentation": ["STEM Careers Presentation", "STEM Presentation", "STEM Career Presentation"],
  "Mechanical Careers Demo": ["Mechanical Careers Demo", "Mechanical Career Demo", "Mech Careers Demo"],
  "Healthcare Careers Session": ["Healthcare Careers Session", "Healthcare Career Session", "Health Careers Session"],
  "Education Benefits Session": ["Education Benefits Session", "Education Benefit Session", "Benefits Session"],
  "General Recruiting Table": ["General Recruiting Table", "General Recruitment Table", "Recruiting Table"],
};

function schoolVariant(name) {
  const roll = rng();
  if (name === "Jefferson High" && roll < .06) return "Jeffrson High";
  if (name === "North County Tech" && roll < .08) return "N County Technical";
  if (name === "Lakeside Academy" && roll < .08) return "Lakeside Acad.";
  if (roll < .16) return name.toUpperCase();
  if (roll < .29 && name.endsWith(" High")) return name.replace(/ High$/, " HS");
  if (roll < .39 && name.endsWith(" High")) return name.replace(/ High$/, " High School");
  if (roll < .46) return `  ${name} `;
  if (name === "Washington High" && roll < .53) return "Washington H.S.";
  if (name === "Roosevelt High" && roll < .53) return "Roosevelt HS";
  return name;
}

function rawDateVariant(iso) {
  const [year, month, day] = iso.split("-");
  const roll = rng();
  if (roll < .60) return iso;
  if (roll < .78) return `${month}/${day}/${year}`;
  if (roll < .94) return `${year}/${month}/${day}`;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[Number(month) - 1]} ${Number(day)}, ${year}`;
}

const rawEvents = baseEvents.map((event) => {
  const variants = actionVariants[event.action];
  const action = variants[randInt(0, variants.length - 1)];
  return {
    engagement_id: event.engagement_id,
    event_date: rawDateVariant(event.event_date),
    school_name: schoolVariant(event.school_name),
    action,
    recruiter_hours: event.recruiter_hours,
    contacts: event.contacts,
    appointments: event.appointments,
    qualified: event.qualified,
    contracts: event.contracts,
    access_score: event.access_score,
    distance_miles: event.distance_miles,
  };
});

// Inject a controlled set of data-integrity problems.
const invalidDates = [15, 87, 155, 241];
const badDateValues = ["not recorded", "2026-14-02", "", "TBD"];
invalidDates.forEach((index, i) => { if (rawEvents[index]) rawEvents[index].event_date = badDateValues[i]; });

[31, 104, 178, 253, 321, 399].forEach((index, i) => {
  if (!rawEvents[index]) return;
  if (i % 2 === 0) rawEvents[index].qualified = rawEvents[index].appointments + 3;
  else rawEvents[index].contracts = rawEvents[index].qualified + 2;
});

[49, 132, 288, 410].forEach((index, i) => {
  if (!rawEvents[index]) return;
  if (i % 2 === 0) rawEvents[index].recruiter_hours = -2;
  else rawEvents[index].contacts = -5;
});

[64, 207, 365].forEach((index) => { if (rawEvents[index]) rawEvents[index].engagement_id = ""; });
[93, 347].forEach((index) => { if (rawEvents[index]) rawEvents[index].school_name = ""; });
[118, 376].forEach((index) => { if (rawEvents[index]) rawEvents[index].action = ""; });
[142, 334].forEach((index) => { if (rawEvents[index]) rawEvents[index].contracts = ""; });

// Make Washington a deliberate behavioral analogue for Jefferson on the four
// actions both schools have tried. The Mechanical result remains independent
// and strong, creating a clear collaborative-filtering reveal in Lab 2.
function schoolKeyForTuning(value) {
  if (value == null || String(value).trim() === "") return null;
  let text = String(value).trim().replace(/\./g, "").replace(/\s+/g, " ").toUpperCase();
  if (text === "JEFFRSON HIGH") text = "JEFFERSON HIGH";
  text = text.replace(/ HIGH SCHOOL$/, " HIGH").replace(/ HS$/, " HIGH");
  return text;
}

function actionKeyForTuning(value) {
  if (value == null || String(value).trim() === "") return null;
  const key = String(value).trim().toUpperCase();
  for (const [canonical, aliases] of Object.entries(actionVariants)) {
    if (aliases.some((alias) => alias.toUpperCase() === key)) return canonical;
  }
  return null;
}

for (const action of actions) {
  const jeffersonRows = rawEvents.filter(
    (row) => schoolKeyForTuning(row.school_name) === "JEFFERSON HIGH"
      && actionKeyForTuning(row.action) === action,
  );
  const washingtonRows = rawEvents.filter(
    (row) => schoolKeyForTuning(row.school_name) === "WASHINGTON HIGH"
      && actionKeyForTuning(row.action) === action,
  );
  if (jeffersonRows.length === 0 || washingtonRows.length === 0) continue;

  const jeffersonHours = jeffersonRows.reduce((sum, row) => sum + Number(row.recruiter_hours), 0);
  const jeffersonContracts = jeffersonRows.reduce((sum, row) => sum + Number(row.contracts || 0), 0);
  // Preserve Jefferson's action pattern while keeping Washington slightly
  // lower on the overall WHERE score; Mechanical remains its strong observed action.
  const targetRate = .85 * (jeffersonContracts / jeffersonHours);
  const washingtonHours = washingtonRows.reduce((sum, row) => sum + Number(row.recruiter_hours), 0);
  const targetContracts = Math.round(targetRate * washingtonHours);
  const allocations = washingtonRows.map((row) => {
    const exact = Number(row.recruiter_hours) * targetRate;
    return { row, contracts: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let contractsLeft = targetContracts - allocations.reduce((sum, item) => sum + item.contracts, 0);
  allocations.sort((a, b) => b.remainder - a.remainder);
  for (const item of allocations) {
    if (contractsLeft > 0) {
      item.contracts += 1;
      contractsLeft -= 1;
    }
    item.row.contracts = item.contracts;
  }
}

const duplicateIndexes = [5, 25, 58, 111, 167, 202, 269, 310, 351, 390, 420, 446];
for (const index of duplicateIndexes) {
  if (rawEvents[index]) rawEvents.push({ ...rawEvents[index] });
}

// Deterministic shuffle so duplicate rows do not sit next to their originals.
for (let i = rawEvents.length - 1; i > 0; i -= 1) {
  const j = randInt(0, i);
  [rawEvents[i], rawEvents[j]] = [rawEvents[j], rawEvents[i]];
}


const canonicalByUpper = new Map(schools.map((s) => [s.school_name.toUpperCase(), s]));
const exceptionalSchoolNames = new Map([
  ["JEFFRSON HIGH", "Jefferson High"],
  ["N COUNTY TECHNICAL", "North County Tech"],
  ["LAKESIDE ACAD", "Lakeside Academy"],
]);

function normalizeSchool(value) {
  if (value == null || String(value).trim() === "") return null;
  let text = String(value).trim().replace(/\./g, "").replace(/\s+/g, " ").toUpperCase();
  if (exceptionalSchoolNames.has(text)) text = exceptionalSchoolNames.get(text).toUpperCase();
  text = text.replace(/ HIGH SCHOOL$/, " HIGH").replace(/ HS$/, " HIGH");
  return canonicalByUpper.get(text) ?? null;
}

const canonicalActionByAlias = new Map();
for (const [canonical, aliases] of Object.entries(actionVariants)) {
  for (const alias of aliases) canonicalActionByAlias.set(alias.toUpperCase(), canonical);
}

function normalizeAction(value) {
  if (value == null || String(value).trim() === "") return null;
  return canonicalActionByAlias.get(String(value).trim().toUpperCase()) ?? null;
}

function parseDate(value) {
  if (value == null || String(value).trim() === "") return null;
  const text = String(value).trim();
  let year;
  let month;
  let day;
  let match = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (match) [, year, month, day] = match;
  if (!match) {
    match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) [, month, day, year] = match;
  }
  if (year) {
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return null;
    return isoDate(date);
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : isoDate(parsed);
}

const seenIds = new Set();
const cleanEvents = [];
for (const row of rawEvents) {
  const id = String(row.engagement_id ?? "").trim();
  if (id && seenIds.has(id)) continue;
  if (id) seenIds.add(id);

  const school = normalizeSchool(row.school_name);
  const action = normalizeAction(row.action);
  const eventDate = parseDate(row.event_date);
  const numericFields = ["recruiter_hours", "contacts", "appointments", "qualified", "contracts", "access_score", "distance_miles"];
  const values = Object.fromEntries(numericFields.map((field) => [field, Number(row[field])]));
  const missingNumeric = numericFields.some((field) => row[field] === "" || row[field] == null || !Number.isFinite(values[field]));
  const negativeValue = numericFields.some((field) => Number.isFinite(values[field]) && values[field] < 0);
  const invalidFunnel = !missingNumeric && !(
    values.contacts >= values.appointments
    && values.appointments >= values.qualified
    && values.qualified >= values.contracts
  );

  const valid = Boolean(id && school && action && eventDate) && !missingNumeric && !negativeValue && !invalidFunnel;
  if (!valid) continue;
  cleanEvents.push({
    engagement_id: id,
    event_date: eventDate,
    school_id: school.school_id,
    school_name: school.school_name,
    action,
    recruiter_hours: values.recruiter_hours,
    contacts: values.contacts,
    appointments: values.appointments,
    qualified: values.qualified,
    contracts: values.contracts,
    access_score: values.access_score,
    distance_miles: values.distance_miles,
  });
}

cleanEvents.sort((a, b) => a.event_date.localeCompare(b.event_date) || a.engagement_id.localeCompare(b.engagement_id));

const summaryMap = new Map();
for (const row of cleanEvents) {
  if (!summaryMap.has(row.school_id)) {
    summaryMap.set(row.school_id, {
      school_id: row.school_id,
      school_name: row.school_name,
      historical_events: 0,
      recruiter_hours: 0,
      contacts: 0,
      appointments: 0,
      qualified: 0,
      contracts: 0,
      access_score: row.access_score,
      distance_miles: row.distance_miles,
    });
  }
  const summary = summaryMap.get(row.school_id);
  summary.historical_events += 1;
  summary.recruiter_hours += row.recruiter_hours;
  summary.contacts += row.contacts;
  summary.appointments += row.appointments;
  summary.qualified += row.qualified;
  summary.contracts += row.contracts;
}

const schoolSummary = [...summaryMap.values()].sort((a, b) => a.school_id.localeCompare(b.school_id));


const rawHeaders = [
  "engagement_id", "event_date", "school_name", "action", "recruiter_hours",
  "contacts", "appointments", "qualified", "contracts", "access_score", "distance_miles",
];
const cleanHeaders = [
  "engagement_id", "event_date", "school_id", "school_name", "action", "recruiter_hours",
  "contacts", "appointments", "qualified", "contracts", "access_score", "distance_miles",
];
const summaryHeaders = [
  "school_id", "school_name", "historical_events", "recruiter_hours", "contacts",
  "appointments", "qualified", "contracts", "access_score", "distance_miles",
];
const schoolProfileHeaders = ["school_id", "school_name", ...profileDimensions];
const actionProfileHeaders = ["action", ...profileDimensions];

function csvCell(value) {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(headers, rows) {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n") + "\n";
}

function columnName(index) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

async function authorCsv(filename, sheetName, headers, rows) {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add(sheetName);
  const matrix = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? null))];
  const endColumn = columnName(headers.length - 1);
  const fullRange = sheet.getRange(`A1:${endColumn}${matrix.length}`);
  fullRange.values = matrix;
  sheet.getRange(`A1:${endColumn}1`).format = {
    fill: "#1F4E78",
    font: { bold: true, color: "#FFFFFF" },
  };
  sheet.freezePanes.freezeRows(1);
  sheet.getRange(`A1:${endColumn}${Math.min(matrix.length, 30)}`).format.autofitColumns();
  const dateColumn = filename.includes("events") ? "B" : null;
  if (dateColumn) sheet.getRange(`${dateColumn}2:${dateColumn}${matrix.length}`).format.numberFormat = "yyyy-mm-dd";
  if (filename === "school_profiles.csv") {
    sheet.getRange(`C2:G${matrix.length}`).format.numberFormat = "0.00";
    sheet.getRange(`A1:A${matrix.length}`).format.columnWidth = 12;
    sheet.getRange(`B1:B${matrix.length}`).format.columnWidth = 24;
    sheet.getRange(`C1:G${matrix.length}`).format.columnWidth = 13;
  }
  if (filename === "action_profiles.csv") {
    sheet.getRange(`B2:F${matrix.length}`).format.numberFormat = "0.00";
    sheet.getRange(`A1:A${matrix.length}`).format.columnWidth = 30;
    sheet.getRange(`B1:F${matrix.length}`).format.columnWidth = 13;
  }

  const inspect = await workbook.inspect({
    kind: "table",
    sheetId: sheetName,
    range: `A1:${endColumn}${Math.min(matrix.length, 8)}`,
    include: "values",
    tableMaxRows: 8,
    tableMaxCols: headers.length,
    maxChars: 3500,
  });
  console.log(`\n${filename}: ${rows.length} rows`);
  console.log(inspect.ndjson);

  const preview = await workbook.render({
    sheetName,
    range: `A1:${endColumn}${Math.min(matrix.length, 22)}`,
    scale: 1,
    format: "png",
  });
  await fs.writeFile(path.join(PREVIEW_DIR, filename.replace(".csv", ".png")), new Uint8Array(await preview.arrayBuffer()));
  await fs.writeFile(path.join(DATA_DIR, filename), toCsv(headers, rows), "utf8");
}

await authorCsv("raw_recruiting_events.csv", "Raw Events", rawHeaders, rawEvents);
await authorCsv("clean_recruiting_events.csv", "Clean Events", cleanHeaders, cleanEvents);
await authorCsv("school_summary.csv", "School Summary", summaryHeaders, schoolSummary);
await authorCsv("school_profiles.csv", "School Profiles", schoolProfileHeaders, schoolProfiles);
await authorCsv("action_profiles.csv", "Action Profiles", actionProfileHeaders, actionProfiles);

console.log(
  `\nGenerated ${baseEvents.length} base events, ${rawEvents.length} raw rows, `
  + `${cleanEvents.length} clean rows, ${schoolSummary.length} school summaries, `
  + `${schoolProfiles.length} school profiles, and ${actionProfiles.length} action profiles.`,
);
