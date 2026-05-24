exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GOOGLE_KEY = 'AIzaSyBHGCSYZCG4yTDjHgzCbaobxGzCfUvddDo';

  let prompt;
  try {
    prompt = JSON.parse(event.body).prompt;
    if (!prompt) throw new Error('No prompt');
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_KEY}`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 1.1, maxOutputTokens: 2048 }
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: data.error?.message || 'Gemini error' })
      };
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Could not parse AI response' }) };
    }

    const ideas = JSON.parse(match[0]);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideas })
    };

  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
