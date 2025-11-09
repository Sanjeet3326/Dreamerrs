// dashboard.js — simple demo widgets for the dashboard
(function(){
  // Utilities
  const $ = (id)=> document.getElementById(id);

  // Sample data; in a real app this would come from your tasks/goals store
  function sampleData(){
    return {
      tasks: [
        { title: 'Write report', done: true, due: nextTodayHour(19) },
        { title: 'Email team', done: true, due: nextTodayHour(12) },
        { title: 'Plan sprint', done: false, due: nextDays(2) },
        { title: 'Prepare slides', done: false, due: nextDays(1) }
      ],
      goals: [
        { title: 'Finish course', done: true },
        { title: 'Launch MVP', done: false },
        { title: 'Read 10 books', done: false },
        { title: 'Daily journaling', done: true },
        { title: 'Exercise 3x/week', done: false }
      ]
    };
  }

  function nextTodayHour(hour){
    const d = new Date(); d.setHours(hour,0,0,0); return d;
  }
  function nextDays(n){ const d = new Date(); d.setDate(d.getDate()+n); return d; }

  function formatDate(d){ if(!d) return '—'; return d.toLocaleString(); }

  // Daily quote, persistent per day
  const quotes = [
    "Focus on progress, not perfection.",
    "Small steps every day lead to big results.",
    "Start where you are. Use what you have. Do what you can.",
    "Consistency is the key to mastery.",
    "Protect your time — it's your most valuable resource."
  ];

  function todaysQuote(){
    const key = 'dailyQuote-' + new Date().toDateString();
    const existing = localStorage.getItem(key);
    if(existing) return existing;
    const q = quotes[Math.floor(Math.random()*quotes.length)];
    localStorage.setItem(key, q);
    return q;
  }

  // Pomodoro timer
  let pom = { work:25*60, break:5*60, remaining:25*60, running:false, mode:'work', timerId:null };

  function updatePomDisplay(){
    const timerEl = $('pomodoro-timer');
    if (!timerEl) return;
    const m = Math.floor(pom.remaining/60).toString().padStart(2,'0');
    const s = (pom.remaining%60).toString().padStart(2,'0');
    timerEl.textContent = `${m}:${s}`;
  }

  function pomTick(){
    if(!pom.running) return;
    pom.remaining--;
    if(pom.remaining<=0){
      // switch mode
      if(pom.mode==='work'){ pom.mode='break'; pom.remaining = pom.break; }
      else { pom.mode='work'; pom.remaining = pom.work; }
    }
    updatePomDisplay();
  }

  function startPom(){ if(pom.running) return; pom.running=true; pom.timerId = setInterval(pomTick,1000); }
  function stopPom(){ if(!pom.running) return; pom.running=false; clearInterval(pom.timerId); pom.timerId=null; }
  function resetPom(){ stopPom(); pom.mode='work'; pom.remaining = pom.work; updatePomDisplay(); }

  // Chart.js chart
  let productivityChart = null;
  function renderChart(data){
    const chartEl = $('productivity-chart');
    if (!chartEl || typeof Chart === 'undefined') return;
    const ctx = chartEl.getContext('2d');
    if(productivityChart) productivityChart.destroy();
    productivityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{ label: 'Tasks Completed', data: data.values, backgroundColor: 'rgba(76,175,80,0.6)'}]
      },
      options: { 
        responsive:true, 
        maintainAspectRatio:false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // Populate dashboard
  function populate(){
    const data = sampleData();
    const totalTasks = data.tasks.length;
    const completedTasks = data.tasks.filter(t=>t.done).length;
    const tasksCompletedEl = $('tasks-completed');
    const summaryTasksEl = $('summary-tasks');
    if (tasksCompletedEl) tasksCompletedEl.textContent = `${completedTasks} / ${totalTasks}`;
    if (summaryTasksEl) summaryTasksEl.textContent = `Tasks Completed: ${completedTasks}/${totalTasks}`;

    const totalGoals = data.goals.length;
    const completedGoals = data.goals.filter(g=>g.done).length;
    const progress = totalGoals > 0 ? Math.round((completedGoals/totalGoals)*100) : 0;
    const goalsProgressEl = $('goals-progress');
    const summaryGoalsEl = $('summary-goals');
    if (goalsProgressEl) goalsProgressEl.textContent = `${progress}%`;
    if (summaryGoalsEl) summaryGoalsEl.textContent = `Goals Progress: ${progress}%`;

    // next deadline
    const upcoming = data.tasks.filter(t=>t.due).sort((a,b)=>a.due - b.due)[0];
    const nextText = upcoming ? `${upcoming.title} — ${formatDate(upcoming.due)}` : '—';
    const nextDeadlineEl = $('next-deadline');
    const summaryDeadlineEl = $('summary-deadline');
    if (nextDeadlineEl) nextDeadlineEl.textContent = nextText;
    if (summaryDeadlineEl) summaryDeadlineEl.textContent = `Next Deadline: ${nextText}`;

    // daily quote
    const dailyQuoteEl = $('daily-quote');
    if (dailyQuoteEl) dailyQuoteEl.textContent = todaysQuote();

    // Chart demo: last 7 days tasks completed (sampled)
    const chartEl = $('productivity-chart');
    if (chartEl) {
      const labels = [];
      const values = [];
      for(let i=6;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); labels.push(d.toLocaleDateString()); values.push(Math.floor(Math.random()*6)); }
      renderChart({ labels, values });
    }

    // init pomodoro display
    updatePomDisplay();
  }

  // Wire controls
  document.addEventListener('DOMContentLoaded', ()=>{
    if(!$('productivity-chart')) return; // not on page
    const pomStart = $('pom-start');
    const pomStop = $('pom-stop');
    const pomReset = $('pom-reset');
    
    if (pomStart) pomStart.addEventListener('click', startPom);
    if (pomStop) pomStop.addEventListener('click', stopPom);
    if (pomReset) pomReset.addEventListener('click', resetPom);
    populate();
  });

})();
