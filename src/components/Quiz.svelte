<script>
  import { onMount } from 'svelte';

  // ===== STATE MANAGEMENT =====
  let activeQuestion = 0;
  let selectedQuestions = [];
  let finalScore = 0;
  let isDone = false;
  let isLoading = true;
  let allQuestions = [];
  let error = null;

  // ===== CONSTANTS =====
  const questionAreaHeight = 'min-h-[200px]';

  // ===== DATA FETCHING =====
  const fetchQuestions = async () => {
    try {
      isLoading = true;
      error = null;
      const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      if (data.response_code === 0) {
        // Simulate loading for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        allQuestions = data.results.map(question => ({
          question: decodeHtmlEntities(question.question),
          options: shuffleArray([
            ...question.incorrect_answers.map(decodeHtmlEntities),
            decodeHtmlEntities(question.correct_answer)
          ]),
          answer: decodeHtmlEntities(question.correct_answer)
        }));
      } else {
        throw new Error('Failed to load questions from API');
      }
    } catch (err) {
      error = err.message || 'Failed to load questions';
    } finally {
      isLoading = false;
    }
  };

  // ===== LIFECYCLE =====
  onMount(fetchQuestions);

  // ===== UTILITIES =====
  function decodeHtmlEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // ===== QUIZ LOGIC =====
  const calculateScore = () => {
    return selectedQuestions.filter(({ answer, selectedAnswer }) => 
      answer === selectedAnswer
    ).length;
  };

  const handleNext = () => {
    if (activeQuestion < allQuestions.length - 1) {
      activeQuestion += 1;
    } else {
      finalScore = calculateScore();
      isDone = true;
    }
  };

  const handleBack = () => {
    if (activeQuestion > 0) activeQuestion -= 1;
  };

  const selectOption = (selectedAnswer, question) => {
    const existingIndex = selectedQuestions.findIndex(
      item => item.question === question.question
    );
    
    if (existingIndex !== -1) {
      selectedQuestions[existingIndex].selectedAnswer = selectedAnswer;
    } else {
      selectedQuestions = [
        ...selectedQuestions,
        { ...question, selectedAnswer }
      ];
    }
  };

  const handleReset = () => {
    activeQuestion = 0;
    selectedQuestions = [];
    isDone = false;
    finalScore = 0;
    fetchQuestions();
  };
</script>

<!-- ===== MAIN UI ===== -->
<div class="min-h-screen flex items-center justify-center p-4">
  <div class="border border-gray-800 w-full max-w-[500px] min-h-[500px] bg-gradient-to-br from-black via-[#0a0a0a] to-gray-900 rounded-2xl p-6 shadow-2xl flex flex-col">

    <h1 class="text-white text-3xl font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">Quiz App</h1>
    <hr class="w-24 border border-gray-700 my-4" />

    {#if isLoading}
      <!-- Loading State -->
      <div class="flex-1 flex justify-center items-center">
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
      <!-- Error State -->
      <div class="flex-1 flex flex-col justify-center">
        <p class="text-red-400 text-center">{error}</p>
        <button
          on:click={handleReset}
          class="mt-6 py-3 px-6 rounded-xl text-white bg-gradient-to-r from-violet-600 to-purple-700 font-medium hover:opacity-90 transition-opacity self-center"
        >
          Try Again
        </button>
      </div>

    {:else if isDone}
      <!-- Results State -->
      <div class="flex-1 flex flex-col justify-between">
        <div class="text-white text-center">
          <p class="text-3xl mb-4 font-semibold text-green-400">🌟 Quiz Completed!</p>
          <p class="text-xl text-white">
            You answered <span class="text-violet-400 font-semibold">{finalScore}</span> 
            out of <span class="text-violet-400 font-semibold">{allQuestions.length}</span> correctly.
          </p>
          <p class="text-lg text-white mt-2">
            {finalScore === allQuestions.length 
              ? 'Perfect! 🎉' 
              : finalScore >= allQuestions.length * 0.7 
                ? 'Good job! 👍' 
                : 'Keep practicing! 💪'}
          </p>
        </div>
        <div class="flex justify-between gap-2 mt-4">
          <button
            on:click={handleReset}
            class="flex-1 py-1.5 px-3 rounded-md text-xs text-white bg-gray-700 font-medium hover:bg-gray-600 transition"
          >
            Restart
          </button>
          <button
            on:click={fetchQuestions}
            class="flex-1 py-1.5 px-3 rounded-md text-xs text-white bg-violet-600 hover:bg-violet-700 transition"
          >
            New Questions
          </button>
        </div>
      </div>

    {:else}
      <!-- Quiz Interface -->
      <div class="flex-1 flex flex-col">
        <div class={questionAreaHeight + " mb-6"}>
          <p class="text-gray-300 text-lg">{allQuestions[activeQuestion].question}</p>
          <p class="text-gray-400 text-sm mt-1 mb-4">Question {activeQuestion + 1} of {allQuestions.length}</p>
          
          <div class="space-y-3">
            {#each allQuestions[activeQuestion].options as option (option)}
              {@const isSelected = selectedQuestions.some(
                item => item.question === allQuestions[activeQuestion].question && 
                        item.selectedAnswer === option
              )}
              <button
                class="w-full py-3 px-4 border border-gray-700 text-gray-200 text-left rounded-lg hover:bg-gray-800/50 transition-colors"
                class:selected-option={isSelected}
                on:click={() => selectOption(option, allQuestions[activeQuestion])}
              >
                {option}
              </button>
            {/each}
          </div>
        </div>

        <div class="mt-auto flex justify-between pt-6">
          <button
            class="py-2 px-4 text-white font-medium hover:text-purple-400 transition-colors"
            on:click={handleBack}
            class:hidden={activeQuestion < 1}
          >
            ← Back
          </button>
          <button
            class="py-3 px-6 rounded-xl text-white bg-gradient-to-r from-violet-600 to-purple-700 font-medium hover:opacity-90 transition-opacity"
            on:click={handleNext}
          >
            {activeQuestion === allQuestions.length - 1 ? 'Finish Quiz' : 'Next →'}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .selected-option {
    background-color: rgba(22, 78, 99, 0.5);
    border-color: #38bdf8;
    box-shadow: 0 0 0 1px #38bdf8;
  }
  
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
</style>