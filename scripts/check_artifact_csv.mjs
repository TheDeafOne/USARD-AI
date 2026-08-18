import { Workbook } from "@oai/artifact-tool";

const workbook = Workbook.create();
workbook.worksheets.add("Data");
console.log(workbook.help("export csv", {
  include: "index,examples,notes",
  maxChars: 5000,
}).ndjson);
