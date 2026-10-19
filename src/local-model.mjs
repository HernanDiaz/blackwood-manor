// The local model (llama.cpp on port 1235, started by local-play.mjs), asked for JSON that
// follows a schema. Used only by the server for questions the offline routing cannot place.
export async function requestLocalJson(
  messages,
  schema,
  maxTokens = 80,
  signal,
  temperature = 0,
  seed = 42,
) {
  const send = thinking =>
    fetch('http://127.0.0.1:1235/v1/chat/completions', {
      method: 'POST',
      signal: signal || AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'local',
        temperature,
        seed,
        max_tokens: maxTokens + 160,
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'result', strict: true, schema },
        },
        ...(thinking ? {} : { chat_template_kwargs: { enable_thinking: false } }),
      }),
    });
  let response = await send(true);
  // With reasoning on, llama.cpp sometimes cannot fit the answer to the schema (HTTP 500,
  // "does not match the expected peg-native format"); the same request without reasoning works.
  if (response.status === 500) response = await send(false);
  if (!response.ok) throw Error('Modelo local no disponible (HTTP ' + response.status + ')');
  const data = await response.json();
  if (data.choices?.[0]?.finish_reason === 'length') throw Error('Respuesta local incompleta');
  return JSON.parse(data.choices[0].message.content);
}
