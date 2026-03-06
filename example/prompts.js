'use strict';

async function runExamples(openai, client, anthropic, model, ai) {
  await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'You are a strict analyst.' },
      {
        role: 'user',
        content: 'Explain quarterly revenue shifts and output JSON with key drivers and risks.'
      }
    ]
  });

  await client.chat.completions.create({
    model: 'gpt-4o-mini',
    prompt: 'help me'
  });

  await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages: [
      {
        role: 'user',
        content: 'Be concise but extremely detailed when summarizing this transcript.'
      }
    ]
  });

  await model.generateContent({
    prompt: 'Classify each ticket by severity and return a numbered list with rationale.'
  });

  await ai.generateText({
    content: 'Short but comprehensive response for this dataset.'
  });
}

module.exports = { runExamples };
