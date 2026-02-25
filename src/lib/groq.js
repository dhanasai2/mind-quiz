const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODELS = ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768']

export async function generateQuestions(topic = 'General Knowledge', count = 10, difficulty = 'medium') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ API key is not configured')

  const prompt = `Generate ${count} quiz questions about "${topic}" at ${difficulty} difficulty level.

Return ONLY a valid JSON array with NO additional text, markdown, or formatting. Each object must have:
- "question": the question text
- "options": array of exactly 4 answer choices (strings)
- "correct_answer": the index (0-3) of the correct option
- "explanation": a brief 1-sentence explanation of why the answer is correct
- "category": the topic/category

Example format:
[{"question":"What is 2+2?","options":["3","4","5","6"],"correct_answer":1,"explanation":"Basic addition.","category":"Math"}]

Make sure questions are diverse, interesting, and factually accurate. No duplicate questions.`

  const body = {
    messages: [
      {
        role: 'system',
        content: 'You are a quiz question generator. You ONLY output valid JSON arrays. No markdown, no code fences, no explanatory text. Just the raw JSON array.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.9,
  }

  // Try each model in order until one succeeds
  let lastError = null
  for (const model of MODELS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...body, model }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        const msg = err?.error?.message || `Groq API error: ${response.status}`
        // If model not found, try next model
        if (response.status === 404 || msg.includes('not found') || msg.includes('does not exist')) {
          console.warn(`[Groq] Model ${model} unavailable, trying next...`)
          lastError = new Error(msg)
          continue
        }
        throw new Error(msg)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content?.trim()

      if (!content) throw new Error('Empty response from Groq API')

      return parseQuestions(content, topic)
    } catch (err) {
      lastError = err
      if (err.name === 'AbortError') {
        console.warn(`[Groq] Model ${model} timed out, trying next...`)
        continue
      }
      // For network errors, try next model
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        console.warn(`[Groq] Network error with ${model}, trying next...`)
        continue
      }
      throw err
    }
  }

  throw lastError || new Error('All Groq models failed. Check your API key and network connection.')
}

function parseQuestions(content, topic) {
  // Parse JSON - handle possible markdown code fences
  let jsonStr = content
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) jsonStr = fenceMatch[1].trim()

  try {
    const questions = JSON.parse(jsonStr)
    if (!Array.isArray(questions)) throw new Error('Response is not an array')

    return questions
      .map((q, idx) => {
        // Validate correct_answer is a valid option index (0-3)
        const correctIdx = Number(q.correct_answer)
        if (!Number.isInteger(correctIdx) || correctIdx < 0 || correctIdx >= (q.options?.length || 4)) {
          console.warn(`[Groq] Question ${idx} has invalid correct_answer: ${q.correct_answer}, skipping`)
          return null
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          console.warn(`[Groq] Question ${idx} has invalid options, skipping`)
          return null
        }

        return {
          question_text: q.question,
          options: q.options,
          correct_answer: correctIdx,
          explanation: q.explanation || '',
          category: q.category || topic,
          order_index: idx,
        }
      })
      .filter(Boolean) // Remove any invalid questions
  } catch (parseErr) {
    console.error('Failed to parse Groq response:', content)
    throw new Error('Failed to parse AI response. Please try again.')
  }
}
