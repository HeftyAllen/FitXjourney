// =============================
// Chatbot Toggle Functionality
// =============================
const chatToggle = document.getElementById('chat-toggle');
const chatBot = document.getElementById('ai-chatbot');
const closeChat = document.getElementById('close-chat');

chatToggle.addEventListener('click', () => {
  chatBot.classList.toggle('hidden');
});
closeChat.addEventListener('click', () => {
  chatBot.classList.add('hidden');
});

// =============================
// Chatbot Helper Functions
// =============================
function appendChatMessage(message, sender) {
  const chatBody = document.getElementById("chat-body");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("chat-message", sender);
  messageDiv.textContent = message;
  chatBody.appendChild(messageDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// =============================
// Chatbot Command Implementations
// =============================

// Workout Overview Commands
function getWorkoutOverview() {
  const plan = localStorage.getItem("workoutPlan");
  return plan ? "Here is your workout overview:\n" + plan : "No custom workout plan found.";
}
function getWorkoutDetailedSummary() {
  return "Detailed summary: Your workout includes multiple exercises with varying intensity levels.";
}
function getExercisesWithIntensity() {
  return "Today's exercises with intensity levels: Squats (8/10), Bench Press (7/10), Deadlift (9/10).";
}

// Progress Tracking & Analytics
function getProgressChart() {
  return "Progress chart created: [Imagine a chart here].";
}
function getWeeklyWorkoutReport() {
  return "Weekly Report: 4 workouts completed, average intensity 7/10.";
}
function compareTodayAndLastWeek() {
  return "Comparison: Today's performance is 10% higher than last week's.";
}

// Data Export & Sync
function exportWorkoutHistoryCSV() {
  const history = JSON.parse(localStorage.getItem("workoutHistory") || "[]");
  if (history.length === 0) return "No workout history to export.";
  let csvContent = "data:text/csv;charset=utf-8,Exercise,Duration,Intensity\n";
  history.forEach(item => {
    csvContent += `${item.exercise},${item.duration},${item.intensity}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "workout_history.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  return "Workout history exported as CSV.";
}

// Workout Recommendations
async function recommendWorkoutModifications() {
  const alternatives = await fetchExercises("upper-body");
  if (alternatives.length > 0) {
    return `Recommendation: Try replacing one exercise with ${alternatives[0].name} for variety.`;
  }
  return "No modifications available.";
}
function getRecoveryExercises() {
  return "Recovery exercises recommended: Light stretching, foam rolling, and yoga.";
}
function createWorkoutChallenge() {
  return "Your personalized challenge: Increase your squat weight by 5% over the next 2 weeks.";
}

// Nutrition & Recipe Commands
async function downloadRecipeCard(recipeName) {
  const recipe = await fetchRecipe(recipeName);
  if (recipe) {
    const cardHTML = `
      <html>
        <head>
          <title>${recipe.title} Recipe Card</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .recipe-card { border: 2px solid var(--primary); padding: 20px; border-radius: 8px; }
            h1 { color: var(--accent); }
          </style>
        </head>
        <body>
          <div class="recipe-card">
            <h1>${recipe.title}</h1>
            <p>Source: <a href="${recipe.sourceUrl}" target="_blank">${recipe.sourceUrl}</a></p>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([cardHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${recipe.title.replace(/\s+/g, "_")}_recipe.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return `Recipe card for ${recipe.title} downloaded.`;
  }
  return "Recipe not found.";
}
function getPrintableNutritionRecipe() {
  return "Printable nutrition recipe generated: [Recipe details here].";
}
function getWeeklyMealPlan() {
  return "Weekly meal plan created: Breakfast, lunch, and dinner suggestions based on your dietary goals.";
}
function getNutritionalInfo(ingredient) {
  return `Nutritional info for ${ingredient}: 100 calories, 3g protein, 2g fat (simulated).`;
}
function getShoppingList() {
  return "Shopping list: Milk, eggs, chicken, broccoli, quinoa, and fruits.";
}

// Diet Recommendations
function getHealthySnacks() {
  return "Recommended healthy snacks: Greek yogurt, almonds, and berries.";
}
function getNutritionalTips() {
  return "Nutritional tips: Prioritize protein and whole foods for muscle building and fat loss.";
}

// Scheduling & Calendar Commands
function scheduleNextWorkout(dateTime) {
  localStorage.setItem("nextWorkout", dateTime);
  return `Workout session scheduled for ${dateTime}.`;
}
function addSessionToCalendar() {
  return "Workout session added to your calendar (simulated).";
}
function getUpcomingEvents() {
  return "Upcoming events: 5K run on Saturday, CrossFit challenge on Sunday.";
}

// Reminder & Notifications
function setDailyReminder() {
  localStorage.setItem("dailyWorkoutReminder", "true");
  return "Daily workout reminder set.";
}
function notifyUpcomingChallenges() {
  return "You will be notified about upcoming fitness challenges.";
}

// =============================
// Process Chatbot Commands
// =============================
async function processChatCommand(message) {
  // Navigation Commands
  if (/take me to (.+)/i.test(message)) {
    const match = message.match(/take me to (.+)/i);
    const pageName = match[1];
    navigateToPage(pageName);
    return;
  }
  
  // Workout Overview Commands
  if (/overview.*custom workout/i.test(message)) {
    appendChatMessage(getWorkoutOverview(), "bot");
    return;
  }
  if (/detailed summary/i.test(message)) {
    appendChatMessage(getWorkoutDetailedSummary(), "bot");
    return;
  }
  if (/exercises with intensity/i.test(message)) {
    appendChatMessage(getExercisesWithIntensity(), "bot");
    return;
  }

  // Progress Tracking & Analytics
  if (/progress chart/i.test(message)) {
    appendChatMessage(getProgressChart(), "bot");
    return;
  }
  if (/weekly workout report/i.test(message)) {
    appendChatMessage(getWeeklyWorkoutReport(), "bot");
    return;
  }
  if (/compare today and last week/i.test(message)) {
    appendChatMessage(compareTodayAndLastWeek(), "bot");
    return;
  }

  // Data Export & Sync
  if (/export workout history/i.test(message)) {
    appendChatMessage(exportWorkoutHistoryCSV(), "bot");
    return;
  }

  // Workout Recommendations
  if (/recommend workout modifications/i.test(message)) {
    appendChatMessage(await recommendWorkoutModifications(), "bot");
    return;
  }
  if (/recovery exercises/i.test(message)) {
    appendChatMessage(getRecoveryExercises(), "bot");
    return;
  }
  if (/create workout challenge/i.test(message)) {
    appendChatMessage(createWorkoutChallenge(), "bot");
    return;
  }

  // Nutrition & Recipe Commands
  if (/download recipe card for (.+)/i.test(message)) {
    const match = message.match(/download recipe card for (.+)/i);
    const recipeName = match[1];
    appendChatMessage(await downloadRecipeCard(recipeName), "bot");
    return;
  }
  if (/printable nutrition recipe/i.test(message)) {
    appendChatMessage(getPrintableNutritionRecipe(), "bot");
    return;
  }
  if (/weekly meal plan/i.test(message)) {
    appendChatMessage(getWeeklyMealPlan(), "bot");
    return;
  }
  if (/nutritional info for (.+)/i.test(message)) {
    const match = message.match(/nutritional info for (.+)/i);
    const ingredient = match[1];
    appendChatMessage(getNutritionalInfo(ingredient), "bot");
    return;
  }
  if (/shopping list/i.test(message)) {
    appendChatMessage(getShoppingList(), "bot");
    return;
  }

  // Diet Recommendations
  if (/healthy snacks/i.test(message)) {
    appendChatMessage(getHealthySnacks(), "bot");
    return;
  }
  if (/nutritional tips/i.test(message)) {
    appendChatMessage(getNutritionalTips(), "bot");
    return;
  }

  // Scheduling & Calendar Commands
  if (/schedule next workout for (.+)/i.test(message)) {
    const match = message.match(/schedule next workout for (.+)/i);
    const dateTime = match[1];
    appendChatMessage(scheduleNextWorkout(dateTime), "bot");
    return;
  }
  if (/add session to calendar/i.test(message)) {
    appendChatMessage(addSessionToCalendar(), "bot");
    return;
  }
  if (/upcoming events/i.test(message)) {
    appendChatMessage(getUpcomingEvents(), "bot");
    return;
  }

  // Reminder & Notifications
  if (/set daily reminder/i.test(message)) {
    appendChatMessage(setDailyReminder(), "bot");
    return;
  }
  if (/notify upcoming challenges/i.test(message)) {
    appendChatMessage(notifyUpcomingChallenges(), "bot");
    return;
  }

  // Default response if no command matches
  appendChatMessage("I'm sorry, I didn't understand that command.", "bot");
}