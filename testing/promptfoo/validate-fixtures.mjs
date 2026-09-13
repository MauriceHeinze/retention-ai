import { readFileSync } from "node:fs";

const file = new URL("./feature-detection-tests.yaml", import.meta.url);
const source = readFileSync(file, "utf8");
const tests = source.split(/(?=^- description:)/m).filter(Boolean);
const ids = new Set();
const embeddedCases = [];

if (tests.length === 0) {
  throw new Error("The fixture file must contain at least one test");
}

for (const [index, test] of tests.entries()) {
  const label = test.match(/^- description: "([^"]+)"/m)?.[1] ?? `test ${index + 1}`;
  const diff = test.match(/^    diff: \|\n([\s\S]*)$/m)?.[1].replace(/^      /gm, "");
  const expectedJson = test.match(/^    expected_features: >-\n      (.+)$/m)?.[1];
  const customersJson = test.match(/^    customers: >-\n      (.+)$/m)?.[1];
  const matchesJson = test.match(/^    expected_matches: >-\n      (.+)$/m)?.[1];
  let features;
  let customers;
  let expectedMatches;
  try {
    features = JSON.parse(expectedJson);
    customers = JSON.parse(customersJson);
    expectedMatches = JSON.parse(matchesJson);
  } catch {
    throw new Error(`${label}: expected_features, customers, and expected_matches must be valid JSON`);
  }
  if (typeof diff !== "string" || !diff.startsWith("diff --git ")) {
    throw new Error(`${label}: diff must be a unified git diff`);
  }
  if (!Array.isArray(features) || features.length < 1 || features.length > 3) {
    throw new Error(`${label}: expected between 1 and 3 features`);
  }
  for (const feature of features) {
    if (!feature.id || !feature.name || !feature.description) {
      throw new Error(`${label}: every feature needs id, name, and description`);
    }
    if (ids.has(feature.id)) throw new Error(`${label}: duplicate feature id ${feature.id}`);
    ids.add(feature.id);
  }
  if (!Array.isArray(customers) || customers.length < 10 || customers.length > 15) {
    throw new Error(`${label}: expected between 10 and 15 embedded customers`);
  }
  const caseCustomerIds = customers.map(customer => customer.customer_id);
  if (new Set(caseCustomerIds).size !== customers.length || customers.some(customer => !customer.cancellation_reason)) {
    throw new Error(`${label}: embedded customers need unique IDs and cancellation reasons`);
  }
  if (!Array.isArray(expectedMatches) || expectedMatches.length !== customers.length
    || expectedMatches.some(match => !caseCustomerIds.includes(match.customer_id)
      || !features.some(feature => feature.id === match.feature_id))) {
    throw new Error(`${label}: expected matches must cover customers with valid feature IDs`);
  }
  if (new Set(expectedMatches.map(match => match.customer_id)).size !== customers.length) {
    throw new Error(`${label}: every customer must have exactly one expected match`);
  }
  embeddedCases.push({ customers, expectedMatches });
}

console.log(`Validated ${tests.length} diffs with ${ids.size} expected features.`);

function parseCsvLine(line) {
  const fields = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  fields.push(value);
  return fields;
}

const customerFile = new URL("../fixtures/retentionai-stripe-customers.csv", import.meta.url);
const customerLines = readFileSync(customerFile, "utf8").trim().split("\n");
const header = parseCsvLine(customerLines.shift());
const expectedHeader = [
  "customer_id", "email", "subscription_id", "demo_case", "status",
  "cancellation_reason", "marketing_consent", "previously_contacted_releases",
];
if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
  throw new Error("Customer CSV header does not match the expected import schema");
}

const generatedCustomers = customerLines
  .map(parseCsvLine)
  .filter(row => row[1]?.startsWith("feature-eval-"));
const customersByTest = new Map();
const customerIds = new Set();

for (const row of generatedCustomers) {
  if (row.length !== expectedHeader.length) throw new Error(`Invalid CSV row: ${row[0]}`);
  const [customerId, email, subscriptionId, demoCase, status, reason, consent, contacted] = row;
  const match = demoCase.match(/^feature-(\d{2})__(.+)$/);
  if (!match || !ids.has(match[2])) throw new Error(`${customerId}: invalid feature ground truth ${demoCase}`);
  if (status !== "canceled" || !reason || consent !== "true" || contacted !== "") {
    throw new Error(`${customerId}: invalid synthetic cancellation data`);
  }
  if (!email || !subscriptionId || customerIds.has(customerId)) {
    throw new Error(`${customerId}: missing or duplicate customer identity`);
  }
  customerIds.add(customerId);
  customersByTest.set(match[1], (customersByTest.get(match[1]) ?? 0) + 1);
}

if (generatedCustomers.length !== 100) {
  throw new Error(`Expected 100 generated customers, received ${generatedCustomers.length}`);
}
for (let testNumber = 1; testNumber <= tests.length; testNumber++) {
  const key = String(testNumber).padStart(2, "0");
  const count = customersByTest.get(key) ?? 0;
  if (count < 10 || count > 15) throw new Error(`Test ${key}: expected 10-15 customers, received ${count}`);
  const rows = generatedCustomers.filter(row => row[3].startsWith(`feature-${key}__`));
  const csvCustomers = rows.map(row => ({ customer_id: row[0], cancellation_reason: row[5] }));
  const csvMatches = rows.map(row => ({ customer_id: row[0], feature_id: row[3].split("__", 2)[1] }));
  if (JSON.stringify(embeddedCases[testNumber - 1].customers) !== JSON.stringify(csvCustomers)
    || JSON.stringify(embeddedCases[testNumber - 1].expectedMatches) !== JSON.stringify(csvMatches)) {
    throw new Error(`Test ${key}: embedded Promptfoo data is out of sync with the customer CSV`);
  }
}

console.log(`Validated ${generatedCustomers.length} generated customers across ${customersByTest.size} tests.`);
