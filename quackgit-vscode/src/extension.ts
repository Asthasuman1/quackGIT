import * as vscode from "vscode";
import * as http from "http";
import * as https from "https";

type ApiResponse = {
  status?: string;
  result?: unknown;
  message?: string;
  detail?: string;
};

function postJson(
  urlString: string,
  body: unknown
): Promise<{ statusCode: number; text: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const data = JSON.stringify(body);

    const client = url.protocol === "https:" ? https : http;

    const request = client.request(
      {
        hostname: url.hostname,
        port: url.port
          ? Number(url.port)
          : url.protocol === "https:"
            ? 443
            : 80,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (response) => {
        let responseData = "";

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          responseData += chunk;
        });

        response.on("end", () => {
          resolve({
            statusCode: response.statusCode ?? 0,
            text: responseData,
          });
        });
      }
    );

    request.setTimeout(120000, () => {
      request.destroy(
        new Error("Request timed out after 120 seconds.")
      );
    });

    request.on("error", reject);

    request.write(data);
    request.end();
  });
}

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    "quackgit.analyzeFile",
    async () => {
      const editor = vscode.window.activeTextEditor;

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

      // Keep the MVP fast and prevent very large requests.
      const MAX_FILE_SIZE = 30000;

      if (code.length > MAX_FILE_SIZE) {
        vscode.window.showWarningMessage(
          `quackGIT: This file is too large to analyze. ` +
            `Maximum size is ${MAX_FILE_SIZE} characters.`
        );
        return;
      }

      const apiUrl =
        vscode.workspace
          .getConfiguration("quackgit")
          .get<string>("apiUrl") ||
        "https://quackgit.onrender.com";

      const endpoint =
        `${apiUrl.replace(/\/$/, "")}/prediction/`;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "quackGIT is analyzing your file...",
          cancellable: false,
        },
        async () => {
          try {
            const fileName =
              editor.document.uri.fsPath.split(/[\\/]/).pop() ||
              "current-file";

            /*
             * Send the current file to the production
             * quackGIT backend.
             */
            const response = await postJson(endpoint, {
  diff: code,
});

            /*
             * Handle backend errors and show the actual
             * backend response instead of only HTTP status.
             */
            if (
              response.statusCode < 200 ||
              response.statusCode >= 300
            ) {
              let backendMessage = response.text;

              try {
                const parsed = JSON.parse(
                  response.text
                ) as ApiResponse;

                backendMessage =
                  parsed.detail ||
                  parsed.message ||
                  response.text;
              } catch {
                // Keep raw response.
              }

              throw new Error(
                `Backend returned HTTP ${response.statusCode}: ${backendMessage}`
              );
            }

            /*
             * Parse the successful backend response.
             */
            let formatted = response.text;

            try {
              const parsed = JSON.parse(
                response.text
              ) as ApiResponse;

              if (parsed.result !== undefined) {
                formatted =
                  typeof parsed.result === "string"
                    ? parsed.result
                    : JSON.stringify(
                        parsed.result,
                        null,
                        2
                      );
              } else if (parsed.message) {
                formatted = parsed.message;
              } else if (parsed.detail) {
                formatted = parsed.detail;
              } else {
                formatted = JSON.stringify(
                  parsed,
                  null,
                  2
                );
              }
            } catch {
              // Keep plain-text response unchanged.
            }

            if (!formatted.trim()) {
              formatted =
                "The backend returned an empty analysis.";
            }

            /*
             * Create the analysis panel.
             */
            const panel =
              vscode.window.createWebviewPanel(
                "quackgitAnalysis",
                "quackGIT Analysis",
                vscode.ViewColumn.Beside,
                {
                  enableScripts: false,
                }
              );

            /*
             * Escape the backend response before putting
             * it into HTML.
             */
            const escaped = formatted
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");

            panel.webview.html = `
              <!doctype html>
              <html>
                <head>
                  <meta charset="UTF-8">

                  <style>
                    body {
                      font-family:
                        var(--vscode-font-family);

                      color:
                        var(--vscode-foreground);

                      background:
                        var(--vscode-editor-background);

                      padding: 20px;

                      line-height: 1.6;
                    }

                    h2 {
                      margin-top: 0;
                    }

                    .meta {
                      margin-bottom: 20px;
                    }

                    .result {
                      white-space: pre-wrap;
                      overflow-wrap: anywhere;

                      background:
                        var(
                          --vscode-textCodeBlock-background
                        );

                      padding: 16px;

                      border-radius: 8px;

                      border:
                        1px solid
                        var(--vscode-panel-border);
                    }
                  </style>
                </head>

                <body>
                  <h2>quackGIT Analysis</h2>

                  <div class="meta">
                    <div>
                      <strong>File:</strong>
                      ${fileName}
                    </div>

                    <div>
                      <strong>Language:</strong>
                      ${editor.document.languageId}
                    </div>
                  </div>

                  <div class="result">${escaped}</div>
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

  context.subscriptions.push(command);
}

export function deactivate() {}