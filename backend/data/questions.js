const questions = [
  {
    id: 1,
    text: "Какое из следующих утверждений лучше описывает вас?",
    options: [
      { id: "1a", text: "Я обеспечиваю соответствие моей работы высшим стандартам", group: "Perfectionism" },
      { id: "1b", text: "Я делаю все необходимое для достижения моих целей", group: "Reaching Goals" },
      { id: "1c", text: "Я придаю значение социальному взаимодействию с коллегами", group: "Social Contact" }
    ]
  },
  {
    id: 2,
    text: "Какое из следующих утверждений лучше описывает вас?",
    options: [
      { id: "2a", text: "Я основываю свои решения на осязаемых данных", group: "Being Logical" },
      { id: "2b", text: "Мне нравится помогать тем, кто обращается ко мне с проблемами", group: "Bringing Happiness" },
      { id: "2c", text: "Я полагаюсь на интуицию при принятии решений", group: "Intuition" }
    ]
  },
  {
    id: 3,
    text: "Какое из следующих утверждений лучше описывает вас?",
    options: [
      { id: "3a", text: "Конкурентная среда мотивирует меня к совершенству", group: "Success" },
      { id: "3b", text: "Мне нравится работать с целями", group: "Reaching Goals" },
      { id: "3c", text: "Я хотел бы, чтобы мои усилия были признаны", group: "Recognition" }
    ]
  }
  // Add more questions up to 36, then repeat 1-3 as 37-39
];

// Generate remaining questions
for (let i = 4; i <= 36; i++) {
  questions.push({
    id: i,
    text: `Вопрос ${i}: Какое из следующих утверждений лучше описывает вас?`,
    options: [
      { id: `${i}a`, text: `Вариант A для вопроса ${i}`, group: "TestGroup1" },
      { id: `${i}b`, text: `Вариант B для вопроса ${i}`, group: "TestGroup2" },
      { id: `${i}c`, text: `Вариант C для вопроса ${i}`, group: "TestGroup3" }
    ]
  });
}

// Add repeat questions (37-39)
questions.push(...questions.slice(0, 3).map((q, index) => ({
  ...q,
  id: 37 + index,
  isRepeat: true
})));

// Add motivational selection question
questions.push({
  id: 40,
  text: "Выберите 5 наиболее важных для вас мотивационных факторов",
  type: "motivational_selection",
  options: [
    "Intuition", "Success", "Professional Pleasure", "Bringing Happiness",
    "Perfectionism", "Social Contact", "Empathy", "Recognition",
    "Resilience", "Respect", "Efficiency", "Intellectual Discovery",
    "Team Spirit", "Influence", "Responsibility", "Reaching Goals"
  ].map(item => ({ id: item, text: item }))
});

module.exports = {
  getAllQuestions: () => questions,
  getQuestionById: (id) => questions.find(q => q.id === id)
};