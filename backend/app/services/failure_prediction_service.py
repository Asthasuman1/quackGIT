import json
import re

from litellm import acompletion

from app.models.prediction import FailurePredictionResponse


class FailurePredictionService:
    def __init__(self, model: str = "gemini/gemini-3.1-flash-lite"):
        self.model = model

    async def predict(
        self,
        code: str,
        *,
        filename: str = "unknown",
        language: str = "unknown",
        mode: str = "source",
    ) -> FailurePredictionResponse:
        context_label = (
            "pull request patch"
            if mode == "pull_request"
            else "local source file"
        )

        prompt = f"""
You are quackGIT, an expert software reliability, security, and testing
engineer.

Analyze the supplied {context_label}. Your job is to find EVERY meaningful,
evidence-supported issue. Do NOT limit the answer to three findings.

IMPORTANT:
- Never invent a problem without evidence.
- Do not duplicate the same root cause.
- If there are no meaningful findings in a category, return an empty findings
  array for that category.
- A finding must point to the exact location when the input provides enough
  information to do so.
- For a PR patch, use the changed file and the added/changed line numbers
  visible in the patch.
- For a local file, use the supplied filename and the actual source line
  number.
- Severity is a word, never a percentage.
- Do not output probability, confidence percentages, scores, bars, or numeric
  likelihoods.

Every finding MUST follow this reasoning chain:
1. WHAT IS WRONG — the concrete defect or gap.
2. EXACTLY WHERE — file, line range, and function when available.
3. WHY IT IS WRONG — the technical reason.
4. WHY IT HAPPENS — the underlying assumption/mechanism.
5. WHAT IT CAN CAUSE — concrete production/security/testing consequences.
6. HOW SERIOUS — CRITICAL, HIGH, MEDIUM, LOW, or INFO.
7. HOW TO FIX — concrete remediation.

ANALYSIS LAYERS

A) FUTURE FAILURE ANALYSIS
Find realistic future production failures involving correctness,
reliability, scalability, performance, resource exhaustion, concurrency,
data consistency, compatibility, and operational behavior.
Do not call an ordinary code-style issue a future failure.
For each finding also provide a realistic time_horizon such as
"under increased load", "weeks", "months", or "during failure/retry conditions".

B) SECURITY ANALYSIS
Find all meaningful security issues supported by the code, including where
relevant: authentication/authorization, injection, secrets, unsafe
deserialization, SSRF, path traversal, insecure file upload, XSS, sensitive
data exposure, insecure storage/access control, dependency/configuration
risks, and trust-boundary mistakes.
Do not claim a vulnerability merely because a category exists; show evidence.

C) TESTING ANALYSIS
Find all meaningful missing or weak tests caused by the changed behavior or
code.
Do not simply say "add tests". Identify the exact behavior that needs
coverage and explain the failure it would catch.
Consider success, failure, edge, concurrency, permission, validation, and
integration cases when relevant.
If existing test information is not supplied, explicitly base the finding
on the observable behavior and do not pretend you inspected unseen tests.

Return ONLY valid JSON matching this exact structure:

{{
  "summary": "short overall assessment",
  "predictions": [
    {{
      "title": "short finding title",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "location": {{
        "file": "{filename}",
        "line_start": 1,
        "line_end": 1,
        "function": "function name or null"
      }},
      "what_is_wrong": "...",
      "why_it_is_wrong": "...",
      "why_it_happens": "...",
      "what_it_can_cause": "...",
      "how_to_fix": "...",
      "time_horizon": "..."
    }}
  ],
  "security_analysis": {{
    "status": "issues_found|no_meaningful_issues",
    "findings": [
      {{
        "title": "...",
        "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
        "location": {{
          "file": "{filename}",
          "line_start": 1,
          "line_end": 1,
          "function": "function name or null"
        }},
        "what_is_wrong": "...",
        "why_it_is_wrong": "...",
        "why_it_happens": "...",
        "what_it_can_cause": "...",
        "how_to_fix": "..."
      }}
    ]
  }},
  "testing_analysis": {{
    "status": "tests_needed|no_meaningful_gaps",
    "findings": [
      {{
        "title": "...",
        "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
        "location": {{
          "file": "{filename}",
          "line_start": 1,
          "line_end": 1,
          "function": "function name or null"
        }},
        "what_is_wrong": "...",
        "why_it_is_wrong": "...",
        "why_it_happens": "...",
        "what_it_can_cause": "...",
        "how_to_fix": "..."
      }}
    ]
  }}
}}

Filename: {filename}
Language: {language}

SOURCE / PATCH:
{code}
"""

        response = await acompletion(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("LLM returned an empty response")

        content = self._clean_json_response(content)

        try:
            data = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"LLM returned invalid JSON: {exc}. Response: {content[:1000]}"
            ) from exc

        return FailurePredictionResponse.model_validate(data)

    @staticmethod
    def _clean_json_response(content: str) -> str:
        content = content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
            content = re.sub(r"\s*```$", "", content).strip()

        if not content.startswith("{"):
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end > start:
                content = content[start:end + 1]

        return content.strip()
