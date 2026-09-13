export const githubDeploymentFixture = {
  repository: { full_name: "ilindaniel/retention-ai-testing" },
  deployment: {
    id: 42,
    sha: "b".repeat(40),
    environment: "production",
    production_environment: true,
    payload: { retentionai_demo: true as const, base_sha: "a".repeat(40) },
  },
  deployment_status: { state: "success", environment: "production" },
};

export const githubComparisonFixture = {
  status: "ahead",
  total_commits: 1,
  commits: [{ commit: { message: "feat: enable manual CSV export for all plans" } }],
  files: [{
    filename: "features/reporting.json",
    status: "modified",
    patch: [
      "@@ -1,6 +1,6 @@", " {",
      '   "description": "Synthetic feature configuration for RetentionAI tests",',
      '-  "manual_csv_export": false,', '+  "manual_csv_export": true,',
      '   "scheduled_csv_email": false,', '   "available_plans": ["all"]', " }",
    ].join("\n"),
  }],
};
