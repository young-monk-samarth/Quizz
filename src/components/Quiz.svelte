<script>
  import { onMount } from 'svelte';

  // ======================
  // STATE INITIALIZATION
  // ======================
  let activeQuestion = 0;
  let finalScore = 0;
  let isDone = false;
  let isLoading = true;
  let allQuestions = [];
  let error = null;
  let retryCount = 0;
  let showExplanation = false;
  let isCheckingAnswer = false;
  let feedbackMessage = '';
  let motivationalQuote = '';
  let percentage = 0;
  const MAX_RETRIES = 3;


  // ======================
  // API FETCH FUNCTIONS
  // ======================
  const fetchQuestions = async () => {
    try {
      isLoading = true;
      error = null;
      
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
      
      const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
      
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      const data = await response.json();
      
      if (data.response_code === 0) {
        allQuestions = data.results.map(question => ({
          question: decodeHtmlEntities(question.question),
          options: shuffleArray([
            ...question.incorrect_answers.map(decodeHtmlEntities),
            decodeHtmlEntities(question.correct_answer)
          ]),
          answer: decodeHtmlEntities(question.correct_answer),
          userAnswer: null,
          isCorrect: null,
          explanation: ''
        }));
        retryCount = 0;
      } else {
        throw new Error('Failed to load questions. Please try again.');
      }
    } catch (err) {
      error = err.message;
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        await fetchQuestions();
      }
    } finally {
      isLoading = false;
    }
  };

  onMount(fetchQuestions);


  // ======================
  // HELPER FUNCTIONS
  // ======================
  function decodeHtmlEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }


  // ======================
  // QUIZ LOGIC
  // ======================
  const calculateScore = () => allQuestions.filter(q => q.isCorrect).length;

  const handleNext = () => {
    showExplanation = false;
    if (activeQuestion < allQuestions.length - 1) {
      activeQuestion++;
    } else {
      finalScore = calculateScore();
      generateFeedback();
      isDone = true;
    }
  };

  const handleBack = () => {
    showExplanation = false;
    if (activeQuestion > 0) activeQuestion--;
  };

  const selectOption = (selectedAnswer) => {
    allQuestions[activeQuestion].userAnswer = selectedAnswer;
  };

  const handleReset = () => {
    activeQuestion = 0;
    isDone = false;
    finalScore = 0;
    retryCount = 0;
    showExplanation = false;
    feedbackMessage = '';
    motivationalQuote = '';
    fetchQuestions();
  };


  // ======================
  // FEEDBACK GENERATION
  // ======================
  const generateFeedback = async () => {
    try {
      const response = await fetch('/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: finalScore,
          totalQuestions: allQuestions.length
        })
      });
      
      const data = await response.json();
      feedbackMessage = data.feedback || "";
      motivationalQuote = data.quote || "";
      percentage = data.percentage || 0;
      
    } catch (err) {
      console.error('Feedback error:', err);
      // Fallback messages
      percentage = Math.round((finalScore / allQuestions.length) * 100);
      if (percentage < 40) {
        feedbackMessage = "Don't worry! Review the questions and try again.";
        motivationalQuote = "Every expert was once a beginner.";
      } else if (percentage < 70) {
        feedbackMessage = "Good effort! You're making progress.";
        motivationalQuote = "Practice makes perfect!";
      } else {
        feedbackMessage = "Great job! You know your stuff!";
        motivationalQuote = "Knowledge is power!";
      }
    }
  };


  // ======================
  // ANSWER CHECKING
  // ======================
  const checkAnswer = async () => {
    if (!allQuestions[activeQuestion].userAnswer || isCheckingAnswer) return;
    
    isCheckingAnswer = true;
    const currentQ = allQuestions[activeQuestion];
    
    try {
      currentQ.isCorrect = currentQ.userAnswer === currentQ.answer;
      
      // Get explanation
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQ.question,
          selectedOption: currentQ.userAnswer,
          correctAnswer: currentQ.answer
        })
      });
      
      const data = await response.json();
      currentQ.explanation = data.explanation || "No explanation available";
      showExplanation = true;
      
    } catch (err) {
      currentQ.explanation = "Error fetching explanation";
      console.error('Explanation error:', err);
    } finally {
      isCheckingAnswer = false;
    }
  };
</script>


<!-- ====================== -->
<!-- MAIN QUIZ COMPONENT    -->
<!-- ====================== -->
<div class="min-h-screen flex items-center justify-center p-4 bg-transparent">
  <div class="w-full max-w-[500px] bg-gradient-to-br from-black via-[#0a0a0a] to-gray-900 rounded-2xl border border-gray-800 shadow-2xl flex flex-col" style="max-height: 90vh;">
    
    <!-- ====================== -->
    <!-- HEADER SECTION         -->
    <!-- ====================== -->
    <div class="p-6">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">Quiz App</h1>
      <hr class="w-24 border border-gray-700 my-4" />
    </div>


    <!-- ====================== -->
    <!-- MAIN CONTENT AREA      -->
    <!-- ====================== -->
    <div class="px-6 pb-4 flex-1 overflow-y-auto" class:overflow-hidden={!showExplanation && !isDone} style="scrollbar-width: none; -ms-overflow-style: none;">
      <style>
        .overflow-y-auto::-webkit-scrollbar {
          display: none;
        }
      </style>

      <!-- ====================== -->
      <!-- LOADING STATE         -->
      <!-- ====================== -->
      {#if isLoading}
        <div class="h-full flex justify-center items-center">
          <div class="flex flex-col items-center space-y-8">
            <div class="relative w-24 h-24">
              <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 border-r-violet-600 animate-spin-slow"></div>
              <div class="absolute inset-2 rounded-full border-4 border-transparent border-b-violet-400 border-l-violet-400 animate-spin-slower"></div>
              <div class="absolute inset-4 rounded-full border-4 border-transparent border-t-violet-300 border-r-violet-300 animate-spin-slowest"></div>
            </div>
            <div class="text-center space-y-2">
              <p class="text-white font-medium text-lg">Preparing Your Quiz</p>
              <p class="text-gray-400 text-sm">Loading questions...</p>
            </div>
          </div>
        </div>


      <!-- ====================== -->
      <!-- ERROR STATE           -->
      <!-- ====================== -->
      {:else if error}
        <div class="h-full flex flex-col justify-center">
          <p class="text-red-400 text-center">{error}</p>
          <button
            on:click={handleReset}
            class="mt-6 py-3 px-6 rounded-xl text-white bg-gradient-to-r from-violet-600 to-purple-700 font-medium hover:opacity-90 transition-opacity self-center"
          >
            Try Again
          </button>
        </div>


      <!-- ====================== -->
      <!-- COMPLETED STATE       -->
      <!-- ====================== -->
      {:else if isDone}
        <div class="flex flex-col justify-between h-full">
          <div class="py-4 space-y-6">
            <div>
              <p class="text-2xl mb-4 font-semibold text-green-400">🌟 Quiz Completed!</p>
              <p class="text-lg text-white">
                Score: <span class="text-violet-400 font-semibold">{finalScore}/{allQuestions.length}</span>
                ({percentage}%)
              </p>
            </div>
            
            <div class="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
              <h3 class="text-violet-400 font-medium mb-2">Feedback:</h3>
              <p class="text-gray-300 text-sm mb-4">{feedbackMessage}</p>
              <div class="italic text-gray-400 text-sm">"{motivationalQuote}"</div>
            </div>
            
            <div class="grid grid-cols-5 gap-2 mt-4">
              {#each allQuestions as question, i (i)}
                <div class="h-2 rounded-full 
                  {question.isCorrect ? 'bg-green-500' : 'bg-white/50'}"></div>
              {/each}
            </div>
          </div>
          
          <div class="flex justify-center gap-2 mt-6 pb-4">
            <button
              on:click={handleReset}
              class="py-2 px-6 rounded-md text-white bg-violet-600 hover:bg-violet-700 transition"
            >
              Restart Quiz
            </button>
          </div>
        </div>


      <!-- ====================== -->
      <!-- QUIZ IN PROGRESS      -->
      <!-- ====================== -->
      {:else}
        <!-- Question -->
        <div class="mb-6">
          <p class="text-gray-300 text-lg">{allQuestions[activeQuestion].question}</p>
          <p class="text-gray-400 text-sm mt-1 mb-4">Question {activeQuestion + 1} of {allQuestions.length}</p>
          
          <!-- Options -->
          <div class="space-y-3">
            {#each allQuestions[activeQuestion].options as option (option)}
              <button
                class="w-full py-3 px-4 border text-left rounded-lg transition-colors
                  {allQuestions[activeQuestion].userAnswer === option ?
                   (allQuestions[activeQuestion].isCorrect ? 
                    'bg-green-900/50 border-green-500 text-white' : 
                    'bg-white/10 border-white/30 text-white') : 
                   'border-gray-700 text-gray-200 hover:bg-gray-800/50'}
                  {showExplanation && option === allQuestions[activeQuestion].answer ? 
                   'border-yellow-400 bg-yellow-900/20' : ''}"
                on:click={() => selectOption(option)}
                disabled={showExplanation}
              >
                {option}
                {#if showExplanation && option === allQuestions[activeQuestion].answer}
                  <span class="float-right text-yellow-400">✓</span>
                {/if}
              </button>
            {/each}
          </div>

          <!-- Result and Explanation -->
          {#if showExplanation}
            <div class="mt-6">
              <div class="mb-4 p-3 rounded-lg text-center font-medium
                {allQuestions[activeQuestion].isCorrect ? 
                 'bg-green-900/30 text-green-300 border border-green-700/50' : 
                 'bg-white/10 text-white border border-white/30'}">
                {allQuestions[activeQuestion].isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </div>
              
              <div class="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <h3 class="text-violet-400 font-medium mb-2">Explanation:</h3>
                <p class="text-gray-300 text-sm">{allQuestions[activeQuestion].explanation}</p>
              </div>
              
              <button
                on:click={handleNext}
                class="mt-4 w-full py-3 px-4 rounded-xl text-white bg-gradient-to-r from-violet-600 to-purple-700 font-medium hover:opacity-90 transition-opacity"
              >
                {activeQuestion === allQuestions.length - 1 ? 'See Results' : 'Next Question →'}
              </button>
            </div>
          {:else if allQuestions[activeQuestion].userAnswer}
            <button
              on:click={checkAnswer}
              class="mt-6 w-full py-3 px-4 rounded-xl text-white bg-gradient-to-r from-violet-600 to-purple-700 font-medium hover:opacity-90 transition-opacity"
              disabled={isCheckingAnswer}
            >
              {#if isCheckingAnswer}
                <svg class="animate-spin h-5 w-5 text-white inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking...
              {:else}
                Submit Answer
              {/if}
            </button>
          {/if}
        </div>
      {/if}
    </div>


    <!-- ====================== -->
    <!-- NAVIGATION CONTROLS    -->
    <!-- ====================== -->
    {#if !isLoading && !error && !isDone && !showExplanation}
      <div class="p-4 border-t border-gray-800">
        <div class="flex justify-between">
          <button
            class="py-2 px-4 text-white font-medium hover:text-purple-400 transition-colors {activeQuestion === 0 ? 'opacity-30' : ''}"
            on:click={handleBack}
            disabled={activeQuestion === 0}
          >
            ← Back
          </button>
          
          <div class="text-gray-400 text-sm">
            Question {activeQuestion + 1}/{allQuestions.length}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>


<!-- ====================== -->
<!-- ANIMATION STYLES      -->
<!-- ====================== -->
<style>
  @keyframes spin-slow {
    to { transform: rotate(360deg); }
  }
  @keyframes spin-slower {
    to { transform: rotate(360deg); }
  }
  @keyframes spin-slowest {
    to { transform: rotate(360deg); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }
  .animate-spin-slower {
    animation: spin-slower 4s linear infinite;
  }
  .animate-spin-slowest {
    animation: spin-slowest 6s linear infinite;
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>