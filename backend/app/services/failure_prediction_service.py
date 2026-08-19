import json

from litellm import acompletion

from app.models.prediction import FailurePredictionResponse


class FailurePredictionService:
    def __init__(self, model: str = "gemini/gemini-3.1-flash-lite"):
        self.model = model

    async def predict(self, diff: str) -> FailurePredictionResponse:
        prompt = f"""
You are an expert software reliability engineer.

Analyze the following pull request diff and identify realistic ways
the changes could cause failures in the future.

Focus on risks that may not immediately appear in existing tests, including:

- scalability and performance problems
- database bottlenecks
- caching inconsistencies
- concurrency or race conditions
- security vulnerabilities
- reliability and availability issues
- resource exhaustion
- backward compatibility problems
- incorrect assumptions that may fail as the system grows

Do not invent problems without evidence from the diff.

For every meaningful prediction provide:

- risk
- probability from 0.0 to 1.0
- time_horizon
- reason
- recommendation

Return ONLY valid JSON in this structure:

{{
  "summary": "short overall assessment",
  "predictions": [
    {{
      "risk": "description of the future failure",
      "probability": 0.0,
      "time_horizon": "e.g. weeks, months, or under increased load",
      "reason": "why the code could cause this",
      "recommendation": "how to reduce or prevent the risk"
    }}
  ]
}}

Pull request diff:

{diff}
"""

        response = await acompletion(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("LLM returned an empty response")

        data = json.loads(content)

        return FailurePredictionResponse.model_validate(data)