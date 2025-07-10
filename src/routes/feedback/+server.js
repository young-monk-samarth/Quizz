import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    const { score, totalQuestions } = await request.json();
    
    const percentage = (score / totalQuestions) * 100;
    
    let feedback, quote;
    
    if (percentage < 40) {
        feedback = "Keep practicing! Review the explanations and try again.";
        quote = "Every master was once a beginner. Don't give up!";
    } 
    else if (percentage < 70) {
        feedback = "Good effort! You're on the right track.";
        quote = "Small progress is still progress. Keep going!";
    }
    else if (percentage < 90) {
        feedback = "Well done! You've got strong knowledge in this area!";
        quote = "The more you learn, the more you realize how much there is to know.";
    }
    else {
        feedback = "Perfect score! You're a quiz master!";
        quote = "Knowledge is power. You're clearly very powerful!";
    }
    
    return json({ 
        success: true,
        feedback,
        quote,
        score,
        percentage: percentage.toFixed(0)
    });
}