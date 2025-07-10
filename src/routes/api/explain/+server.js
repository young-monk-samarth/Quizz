import { json } from '@sveltejs/kit';
import { Groq } from 'groq-sdk';
import { env } from '$env/dynamic/private';

const groq = new Groq({
  apiKey: env.GROQ_API_KEY
});

// Helper function to underline the entire correct answer
const underlineAnswer = (text, correctAnswer) => {
  // Escape special regex characters in the correctAnswer
  const escapedAnswer = correctAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create regex that matches the exact correct answer as a whole word
  const regex = new RegExp(`\\b${escapedAnswer}\\b`, 'gi');
  
  // Replace all occurrences with underlined version
  return text.replace(regex, `__${correctAnswer}__`);
};

export async function POST({ request }) {
  try {
    const requestData = await request.json();
    console.log("Received data:", requestData);
    
    const { question, selectedOption, correctAnswer } = requestData;
    
    // Validation
    if (!question?.trim()) return json({ error: 'Question is required' }, { status: 400 });
    if (!selectedOption?.trim()) return json({ error: 'Selected option is required' }, { status: 400 });
    if (!correctAnswer?.trim()) return json({ error: 'Correct answer is required' }, { status: 400 });

    const wasCorrect = selectedOption === correctAnswer;
    
    const prompt = `Explain why "${correctAnswer}" is the correct answer for:
Question: ${question}
User's selection: "${selectedOption}" (${wasCorrect ? 'correct' : 'incorrect'})

Provide a 2-3 sentence explanation. 
IMPORTANT: Underline EVERY occurrence of "${correctAnswer}" with double underscores like __this__.`;

    console.log("Sending to Groq:", { prompt });

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a quiz expert. Provide clear explanations and ALWAYS underline:
          1. The FULL correct answer ("${correctAnswer}") using double underscores (__)
          2. Every occurrence of the correct answer in your explanation
          
          Example: "The right answer is __Titan__ because __Titan__ has..."`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 250
    });

    let explanation = response.choices[0]?.message?.content?.trim() || "";
    
    // Triple protection to ensure underlining:
    // 1. First check if AI did it correctly
    if (!explanation.includes(`__${correctAnswer}__`)) {
      // 2. Try to underline ourselves
      explanation = underlineAnswer(explanation, correctAnswer);
      
      // 3. Final fallback - prepend underlined answer if still missing
      if (!explanation.includes(`__${correctAnswer}__`)) {
        explanation = `The correct answer is __${correctAnswer}__. ${explanation}`;
      }
    }

    console.log("Final explanation:", explanation);
    return json({ 
      explanation,
      wasCorrect,
      correctAnswer: `__${correctAnswer}__` // Also return underlined version
    });

  } catch (error) {
    console.error("Error:", error);
    return json(
      { 
        error: "Explanation generation failed",
        details: error.message.includes("API") ? "API error" : "Processing error"
      },
      { status: 500 }
    );
  }
}