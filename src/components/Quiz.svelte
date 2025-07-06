<script>
  import { onMount } from 'svelte';

  // Quiz state
  let activeQuestion = 0;
  let selectedQuestions = [];
  let finalScore = 0;
  let isDone = false;
  let isLoading = true;
  let allQuestions = [];
  let error = null;
  let retryCount = 0;
  const MAX_RETRIES = 3;

  // Fetch questions with retry logic
  const fetchQuestions = async () => {
    try {
      isLoading = true;
      error = null;
      
      // Add a delay if this is a retry
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
          answer: decodeHtmlEntities(question.correct_answer)
        }));
        retryCount = 0; // Reset retry count on success
      } else {
        throw new Error('Failed to load questions. Please try again.');
      }
    } catch (err) {
      error = err.message;
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        await fetchQuestions(); // Auto-retry
      }
    } finally {
      isLoading = false;
    }
  };

  onMount(fetchQuestions);

  // Helper functions
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

  // Quiz logic
  const calculateScore = () => selectedQuestions.filter(q => q.answer === q.selectedAnswer).length;

  const handleNext = () => {
    if (activeQuestion < allQuestions.length - 1) {
      activeQuestion++;
    } else {
      finalScore = calculateScore();
      isDone = true;
    }
  };

  const handleBack = () => activeQuestion > 0 && activeQuestion--;

  const selectOption = (selectedAnswer) => {
    const question = allQuestions[activeQuestion];
    const index = selectedQuestions.findIndex(q => q.question === question.question);
    
    if (index !== -1) {
      selectedQuestions[index].selectedAnswer = selectedAnswer;
    } else {
      selectedQuestions = [...selectedQuestions, { ...question, selectedAnswer }];
    }
  };

  const handleReset = () => {
    activeQuestion = 0;
    selectedQuestions = [];
    isDone = false;
    finalScore = 0;
    retryCount = 0;
    fetchQuestions();
  };
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-transparent">
  <div class="w-full max-w-[500px] bg-gradient-to-br from-black via-[#0a0a0a] to-gray-900 rounded-2xl border border-gray-800 shadow-2xl flex flex-col" style="max-height: 90vh;">
    
    <!-- Header -->
    <div class="p-6">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">Quiz App</h1>
      <hr class="w-24 border border-gray-700 my-4" />
    </div>

    <!-- Main Content - Flexible height container -->
    <div class="px-6 pb-4 flex-1 overflow-y-auto">
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

      {:else if isDone}
        <div class="flex flex-col justify-between h-full">
          <div class="py-4">
            <p class="text-2xl mb-4 font-semibold text-green-400">🌟 Quiz Completed!</p>
            <p class="text-lg text-white">
              You answered <span class="text-violet-400 font-semibold">{finalScore}</span> 
              out of <span class="text-violet-400 font-semibold">{allQuestions.length}</span> correctly.
            </p>
            <p class="text-base text-white mt-2">
              {finalScore === allQuestions.length 
                ? 'Perfect! 🎉' 
                : finalScore >= allQuestions.length * 0.7 
                  ? 'Good job! 👍' 
                  : 'Keep practicing! 💪'}
            </p>
            <p class="mt-16 text-center text-gray-600 font-medium italic text-sm sm:text-base tracking-wide leading-relaxed">
  "Efforts don't always show results immediately, but they always shape outcomes silently."
</p>

          </div>
          <div class="flex justify-between gap-2 mt-6 pb-4">
            <button
              on:click={handleReset}
              class="flex-1 py-2 px-3 rounded-md text-sm text-white bg-gray-700 font-medium hover:bg-gray-600 transition"
            >
              Restart
            </button>
            <button
              on:click={fetchQuestions}
              class="flex-1 py-2 px-3 rounded-md text-sm text-white bg-violet-600 hover:bg-violet-700 transition"
            >
              New Questions
            </button>
          </div>
        </div>

      {:else}
        <!-- Question -->
        <div class="mb-6">
          <p class="text-gray-300 text-lg">{allQuestions[activeQuestion].question}</p>
          <p class="text-gray-400 text-sm mt-1 mb-4">Question {activeQuestion + 1} of {allQuestions.length}</p>
          
          <!-- Options -->
          <div class="space-y-3">
            {#each allQuestions[activeQuestion].options as option (option)}
              <button
                class="w-full py-3 px-4 border border-gray-700 text-gray-200 text-left rounded-lg hover:bg-gray-800/50 transition-colors
                  {selectedQuestions.find(q => q.question === allQuestions[activeQuestion].question)?.selectedAnswer === option ? 
                   'bg-blue-900/50 border-blue-500' : ''}"
                on:click={() => selectOption(option)}
              >
                {option}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Navigation Buttons -->
    {#if !isLoading && !error && !isDone}
      <div class="p-4 ">
        <div class="flex justify-between">
          <button
            class="py-2 px-4 text-white font-medium hover:text-purple-400 transition-colors"
            on:click={handleBack}
            disabled={activeQuestion === 0}
            class:opacity-30={activeQuestion === 0}
          >
            ← Back
          </button>
          <button
            class="py-2 px-6 rounded-xl text-white bg-gradient-to-r from-violet-600 to-purple-700 font-medium hover:opacity-90 transition-opacity"
            on:click={handleNext}
          >
            {activeQuestion === allQuestions.length - 1 ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

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
  
  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }
  .animate-spin-slower {
    animation: spin-slower 4s linear infinite;
  }
  .animate-spin-slowest {
    animation: spin-slowest 6s linear infinite;
  }

  /* Prevent scrolling on the body */
  :global(body) {
    overflow: hidden;
  }
</style>
