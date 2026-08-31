import json
import re

from litellm import acompletion

from app.models.prediction import FailurePredictionResponse


class FailurePredictionService:
    def __init__(self, model: str = "gemini/gemini-3.1-flash-lite"):
        self.model = model

    async def predict(self, code: str) -> FailurePredictionResponse:
        prompt = f"""
You are an expert software reliability engineer performing a code review.

Analyze the source code provided below.

This code may come from:
- a local VS Code file
- a GitHub repository
- a GitLab repository
- a pull request

Do NOT assume that the input is a pull request diff.

Focus only on realistic risks that are supported by the code.

Look for meaningful issues such as:

- scalability and performance problems
- database bottlenecks
- caching inconsistencies
- concurrency or race conditions
- security vulnerabilities
- reliability and availability issues
- resource exhaustion
- backward compatibility problems
- incorrect assumptions that may fail as the system grows
- obvious bugs that could cause production failures

Do not invent problems without evidence from the provided code.

For every meaningful prediction provide:

- risk
- probability from 0.0 to 1.0
- time_horizon
- reason
- recommendation

If there are no meaningful risks, return an empty predictions array.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{{
  "summary": "short overall assessment",
  "predictions": [
    {{
      "risk": "description of the potential failure",
      "probability": 0.0,
      "time_horizon": "weeks, months, or under increased load",
      "reason": "why the code could cause this",
      "recommendation": "how to reduce or prevent the risk"
    }}
  ]
}}

SOURCE CODE:

{code}
"""

        response = await acompletion(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("LLM returned an empty response")

        # LiteLLM/model responses can occasionally contain markdown
        # code fences even when JSON was requested.
        content = self._clean_json_response(content)

        try:
            data = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"LLM returned invalid JSON: {exc}. "
                f"Response: {content[:1000]}"
            ) from exc

        return FailurePredictionResponse.model_validate(data)

    @staticmethod
    def _clean_json_response(content: str) -> str:
        content = content.strip()

        # Remove ```json ... ``` or ``` ... ```
        if content.startswith("```"):
            content = re.sub(
                r"^```(?:json)?\s*",
                "",
                content,
                flags=re.IGNORECASE,
            )

            content = re.sub(
                r"\s*```$",
                "",
                content,
            )

            content = content.strip()

        # If the model added text before/after the JSON,
        # extract the outer JSON object.
        if not content.startswith("{"):
            start = content.find("{")
            end = content.rfind("}")

            if start != -1 and end != -1 and end > start:
                content = content[start : end + 1]

        return content.strip()