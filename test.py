from openai import OpenAI

client = OpenAI(
  api_key="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"
)

response = client.responses.create(
  model="gpt-4o-mini",
  input="write a haiku about ai",
  store=True,
)

print(response.output_text);
