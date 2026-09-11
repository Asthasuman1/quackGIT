import * as vscode from "vscode";
import * as https from "https";

type BackendResponse = {
  status?: string;
  result?: unknown;
  message?: string;
  detail?: string;
};

function postToBackend(
  urlString: string,
  code: string,
  filename: string,
  language: string
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);

    const payload = JSON.stringify({
      diff: code,
      filename,
      language,
      mode: "source",
    });

    const request = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Accept: "application/json",
        },
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          resolve({
            statusCode: response.statusCode ?? 0,
            body,
          });
        });
      }
    );

    request.on("error", (error) => {
      reject(error);
    });

    request.setTimeout(120000, () => {
      request.destroy(
        new Error("Backend request timed out.")
      );
    });

    request.write(payload);
    request.end();
  });
}

export function activate(
  context: vscode.ExtensionContext
) {
  const analyzeCommand =
    vscode.commands.registerCommand(
      "quackgit.analyzeFile",
      async () => {
        const editor =
          vscode.window.activeTextEditor;

        if (!editor) {
          vscode.window.showErrorMessage(
            "quackGIT: Open a file first."
          );
          return;
        }

        const code = editor.document.getText();

        if (!code.trim()) {
          vscode.window.showWarningMessage(
            "quackGIT: The current file is empty."
          );
          return;
        }

        const MAX_FILE_SIZE = 30000;

        if (code.length > MAX_FILE_SIZE) {
          vscode.window.showWarningMessage(
            "quackGIT: File is too large. " +
              "Maximum size is 30,000 characters."
          );
          return;
        }

        const fileName =
          editor.document.fileName.split(/[\\/]/).pop() ||
          "current-file";

        const language =
          editor.document.languageId;

        const endpoint =
          "https://quackgit.onrender.com/prediction/";

        await vscode.window.withProgress(
          {
            location:
              vscode.ProgressLocation.Notification,
            title:
              "quackGIT is analyzing your file...",
            cancellable: false,
          },
          async () => {
            try {
              const response =
                await postToBackend(
                  endpoint,
                  code,
                  fileName,
                  language
                );

              /*
               * ALWAYS log the raw backend response.
               * This lets us diagnose the exact problem
               * instead of guessing.
               */
              console.log(
                "quackGIT HTTP status:",
                response.statusCode
              );

              console.log(
                "quackGIT raw response:",
                response.body
              );

              if (
                response.statusCode < 200 ||
                response.statusCode >= 300
              ) {
                throw new Error(
                  `Backend returned HTTP ${response.statusCode}: ${response.body}`
                );
              }

              let analysis =
                response.body;

              /*
               * Parse JSON only if the backend actually
               * returned JSON.
               */
              try {
                const parsed =
                  JSON.parse(
                    response.body
                  ) as BackendResponse;

                if (
                  parsed.result !== undefined
                ) {
                  if (
                    typeof parsed.result ===
                    "string"
                  ) {
                    analysis =
                      parsed.result;
                  } else {
                    analysis =
                      JSON.stringify(
                        parsed.result,
                        null,
                        2
                      );
                  }
                } else {
                  analysis =
                    JSON.stringify(
                      parsed,
                      null,
                      2
                    );
                }
              } catch {
                /*
                 * Do NOT throw an error here.
                 *
                 * If the backend returns plain text,
                 * display that text directly.
                 */
                analysis =
                  response.body;
              }

              if (!analysis.trim()) {
                analysis =
                  "The backend returned an empty analysis.";
              }

              const panel =
                vscode.window.createWebviewPanel(
                  "quackgitAnalysis",
                  "quackGIT Analysis",
                  vscode.ViewColumn.Beside,
                  {
                    enableScripts: false,
                  }
                );

              let analysisHtml = "";
              try {
                const result = JSON.parse(analysis) as {
                  summary?: string;
                  predictions?: Array<Record<string, unknown>>;
                  security_analysis?: { findings?: Array<Record<string, unknown>> };
                  testing_analysis?: { findings?: Array<Record<string, unknown>> };
                };
                const escape = (value: unknown) =>
                  String(value ?? "")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");

                const renderFinding = (finding: Record<string, unknown>, index: number) => {
                  const location = (finding.location ?? {}) as Record<string, unknown>;
                  const severity = escape(finding.severity ?? "INFO");
                  const lineStart = location.line_start ? `:${escape(location.line_start)}` : "";
                  const lineEnd =
                    location.line_end && location.line_end !== location.line_start
                      ? `-${escape(location.line_end)}`
                      : "";
                  return `
                    <article class="finding">
                      <div class="finding-head">
                        <div>
                          <div class="finding-number">Finding ${index + 1}</div>
                          <h3>${escape(finding.title)}</h3>
                        </div>
                        <span class="severity">${severity}</span>
                      </div>
                      <div class="location"><strong>Where:</strong> ${escape(location.file)}${lineStart}${lineEnd}${location.function ? ` • ${escape(location.function)}` : ""}</div>
                      <p><strong>What is wrong</strong><br>${escape(finding.what_is_wrong)}</p>
                      <p><strong>Why it is wrong</strong><br>${escape(finding.why_it_is_wrong)}</p>
                      <p><strong>Why it happens</strong><br>${escape(finding.why_it_happens)}</p>
                      <p><strong>What it can cause</strong><br>${escape(finding.what_it_can_cause)}</p>
                      ${finding.time_horizon ? `<p><strong>Time horizon</strong><br>${escape(finding.time_horizon)}</p>` : ""}
                      <div class="fix"><strong>How to fix</strong><br>${escape(finding.how_to_fix)}</div>
                    </article>`;
                };

                const predictions = result.predictions ?? [];
                const security = result.security_analysis?.findings ?? [];
                const testing = result.testing_analysis?.findings ?? [];

                const renderSection = (title: string, findings: Array<Record<string, unknown>>) =>
                  `<section><div class="section-head"><h2>${escape(title)}</h2><span>${findings.length} finding${findings.length === 1 ? "" : "s"}</span></div>${
                    findings.length
                      ? findings.map(renderFinding).join("")
                      : `<div class="empty">No meaningful findings.</div>`
                  }</section>`;

                analysisHtml =
                  `<div class="summary">${escape(result.summary ?? "")}</div>` +
                  renderSection("Future Failure Analysis", predictions) +
                  renderSection("Security Analysis", security) +
                  renderSection("Testing Analysis", testing);
              } catch {
                analysisHtml = `<div class="analysis">${analysis.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
              }

              const escapedFileName =
                fileName
                  .replace(
                    /&/g,
                    "&amp;"
                  )
                  .replace(
                    /</g,
                    "&lt;"
                  )
                  .replace(
                    />/g,
                    "&gt;"
                  );

              panel.webview.html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

body {
  font-family: var(--vscode-font-family);
  color: var(--vscode-foreground);
  background: var(--vscode-editor-background);
  padding: 24px;
  line-height: 1.6;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.meta {
  margin-bottom: 24px;
  opacity: 0.9;
}

.meta div {
  margin-bottom: 6px;
}

.analysis {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  background: var(--vscode-textCodeBlock-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 8px;
  padding: 20px;
}


section { margin-top: 28px; }
.section-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 12px; }
.section-head h2 { font-size: 18px; margin: 0; }
.section-head span { opacity: .7; font-size: 12px; }
.summary { background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 16px; }
.finding { background: var(--vscode-textCodeBlock-background); border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 16px; margin: 12px 0; }
.finding-head { display: flex; justify-content: space-between; gap: 12px; }
.finding-number { font-size: 11px; opacity: .6; text-transform: uppercase; letter-spacing: .08em; }
.finding h3 { margin: 3px 0 0; font-size: 15px; }
.severity { font-weight: 700; font-size: 12px; }
.location { margin-top: 12px; padding: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; }
.finding p { margin: 12px 0 0; }
.fix { margin-top: 14px; padding: 12px; border-radius: 6px; border: 1px solid var(--vscode-testing-iconPassed); }
.empty { opacity: .7; padding: 12px 0; }

</style>
</head>

<body>

<h1>quackGIT Analysis</h1>

<div class="meta">

<div>
<strong>File:</strong>
${escapedFileName}
</div>

<div>
<strong>Language:</strong>
${language}
</div>

</div>

<div class="analysis">
${analysisHtml}
</div>

</body>
</html>
`;

              vscode.window.showInformationMessage(
                "quackGIT analysis completed."
              );
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : String(error);

              console.error(
                "quackGIT analysis failed:",
                error
              );

              vscode.window.showErrorMessage(
                `quackGIT analysis failed: ${message}`
              );
            }
          }
        );
      }
    );

  context.subscriptions.push(
    analyzeCommand
  );
}

export function deactivate() {}