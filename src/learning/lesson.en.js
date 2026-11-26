// English lesson content. The structure mirrors lesson.zh.js exactly (same keys, ids and array order);
// only the wording differs. LessonData.js serves whichever language is active.

export const COURSE = {
  title: 'Hello, AI! Step into the World of Artificial Intelligence',
  subtitle: 'A pop-up book about AI that you can explore',
  grade: 'Grade 7 · Introduction to AI literacy',
  duration: '40–45 minutes',
  questions: ['What can AI do?', 'How does AI learn from data?', 'Why does AI make mistakes, and how should we judge what it says?'],
};

/** Key concepts: name / short explanation / everyday example / matching object in the scene / question to think about */
export const CONCEPTS = {
  ai: {
    name: 'Artificial intelligence',
    explain: 'Getting computers to do tasks that normally need human intelligence, such as recognizing images, understanding speech or making sense of text. Many AI systems are not programmed rule by rule; they “learn” their skills from large amounts of data.',
    example: 'Your phone’s photo album can group pictures of the same pet together; a map app predicts your arrival time from traffic conditions.',
    link: { scene: 'city', target: 'speaker', text: 'Smart speaker: turns sound into text' },
    think: 'Which things you used today might involve AI? How can you tell?',
  },
  rule: {
    name: 'Rule-based control (automation)',
    explain: 'The device follows fixed rules that a person wrote in advance: “if … then …”. As long as the rules stay the same, the device behaves the same way. It does not learn anything new from data.',
    example: 'A timer lamp switches on at 19:00; an automatic door opens when it senses someone; a washing machine fills, washes and spins in a set order.',
    link: { scene: 'city', target: 'lamp', text: 'Timer lamp: switches on at a set time' },
    think: 'Is “works automatically” the same thing as “uses AI”?',
  },
  io: {
    name: 'Input and output',
    explain: 'To analyze an information system, look at three things: what information it takes in (input), how it processes that information, and what result it gives (output).',
    example: 'A voice assistant: the input is what you say, the processing is speech recognition and understanding the command, and the output is an answer or an action.',
    link: { scene: 'city', target: 'imaging', text: 'Image recognition kiosk: image → model → category' },
    think: 'What are the input, processing and output of a face-recognition gate?',
  },
  data: {
    name: 'Data',
    explain: 'Data is recorded information. It can be pictures, sounds, text or numbers. Machine learning needs data to train a model. Data is the model’s “study material”.',
    example: 'To teach a computer to recognize cats and dogs, you first need many pictures of cats and dogs.',
    link: { scene: 'lab', target: 'stand', text: 'The 20 pictures on the sample display stand' },
    think: 'If every cat in the study material is orange, what might happen when the model sees a black cat?',
  },
  label: {
    name: 'Label',
    explain: 'A label is the “known answer” that a person attaches to a piece of data. In image classification, the label of each training picture says which category it belongs to.',
    example: 'Labeling a picture “cat” tells the model: the correct category for this picture is cat.',
    link: { scene: 'lab', target: 'label', text: 'The “Cat” and “Dog” trays on the labeling bench' },
    think: 'If a label is wrong, what does the model end up learning?',
  },
  trainset: {
    name: 'Training set',
    explain: 'The part of the data (with labels) used to train the model. The model adjusts itself with these examples to find patterns that separate the categories.',
    example: 'In this experiment, the 20 pictures you label are the training set.',
    link: { scene: 'lab', target: 'stand', text: 'Training samples · 20' },
    think: 'Is a bigger training set always better? Besides size, what else matters?',
  },
  testset: {
    name: 'Test set',
    explain: 'Data set aside just for checking the model. It is never used in training. Only by testing on data the model has not seen can we tell whether it really learned a pattern or just memorized the training pictures.',
    example: 'It is like an exam: the questions cannot be identical to the practice questions, or a high score would not show that you really learned.',
    link: { scene: 'lab', target: 'rack', text: 'The 10 pictures on the test rack' },
    think: 'Why can’t we “grade” the model with pictures it was trained on?',
  },
  classify: {
    name: 'Image classification',
    explain: 'The task of having a model decide which category a picture belongs to. What the model outputs is how likely each category is, not a 100% certain conclusion.',
    example: 'A recycling app identifies the type of waste from a photo; a plant app names a flower from a picture.',
    link: { scene: 'lab', target: 'test', text: 'Test platform and prediction display' },
    think: 'If the model says “90% cat”, is the picture definitely a cat?',
  },
  ml: {
    name: 'Machine learning',
    explain: 'A way of letting computers find patterns in data by themselves. People do not write out the rules for “how to tell a cat from a dog”. Instead they provide labeled data, and an algorithm produces a model through training.',
    example: 'A spam filter learns from many emails marked “spam” or “not spam”, then judges new emails.',
    link: { scene: 'lab', target: 'host', text: 'AI training computer: runs the training algorithm' },
    think: 'How is machine “learning” similar to, and different from, the way you learn?',
  },
  training: {
    name: 'Model training',
    explain: 'The algorithm goes through the training data again and again: the model makes a guess, the guess is compared with the label, and the model’s internal parameters are adjusted a little so the next guess is better. This repeats for many rounds.',
    example: 'The “loss” number on the training computer’s screen shows how far off the model’s guesses are. It usually gets smaller during training.',
    link: { scene: 'lab', target: 'host', text: 'AI training computer: its screen shows real training numbers' },
    think: 'If accuracy on the training set is very high, does that mean the model must be good?',
  },
  model: {
    name: 'Model',
    explain: 'What training produces. You can think of it as a calculation that goes from input to output: a picture goes in, and the likelihood of each category comes out. The patterns it has learned are stored in its many parameters.',
    example: 'The model in this experiment is a very small neural network, trained right inside your browser.',
    link: { scene: 'lab', target: 'model', text: 'The paper “neural network” model' },
    think: 'With the same algorithm but different training data, do you get the same model?',
  },
  predict: {
    name: 'Prediction and confidence',
    explain: 'The judgment a model gives for new data is called a prediction. Confidence shows how sure the model is about that judgment, but being sure is not the same as being right. A model can be confidently wrong.',
    example: 'A weather forecast of “80% chance of rain” does not mean it will definitely rain.',
    link: { scene: 'lab', target: 'test', text: 'Test platform: see the predicted category and confidence' },
    think: 'When should you double-check even if the confidence is very high?',
  },
  bias: {
    name: 'Bias',
    explain: 'If the training data is incomplete, unbalanced or wrongly labeled, the patterns the model learns can lean to one side, and it may judge some cases especially badly.',
    example: 'When the training set has very few dog pictures, the model is more likely to mistake dogs for cats.',
    link: { scene: 'lab', target: 'label', text: 'Compare the number of samples in the two trays' },
    think: 'If a face-recognition system was trained with very few examples of one group of people, what problems could that cause?',
  },
  claim: {
    name: 'Claim',
    explain: 'A specific statement in a text that can be checked as true or false. The first step in verifying information is to break the answer apart and find its claims.',
    example: '“Sound travels through air at about 340 meters per second” is a claim that can be checked. “That’s amazing” is not.',
    link: { scene: 'verify', target: 'screen', text: 'Information screen: key claims in the AI’s answer' },
    think: 'Why do words like “all”, “always” and “has been proved” deserve extra attention?',
  },
  evidence: {
    name: 'Evidence',
    explain: 'Reliable material for judging whether a claim holds, such as textbooks, data published by trusted organizations, or results of repeatable experiments. Advertisements, rumors and material unrelated to the question do not count as evidence.',
    example: 'To check “the speed of light is about 300,000 km per second”, you can look it up in a physics textbook.',
    link: { scene: 'verify', target: 'evidence', text: 'Evidence checking area: evidence cards' },
    think: 'If something “sounds reasonable”, does that make it reliable evidence?',
  },
  verify: {
    name: 'Fact-checking',
    explain: 'The process of checking information: find the claims → look for reliable sources → compare with the evidence → make a judgment (supported, not supported, or not enough evidence). When the evidence is not enough, staying “unsure” is the responsible thing to do.',
    example: 'When you see “this food cures every disease”, check trusted medical sources first instead of sharing it straight away.',
    link: { scene: 'verify', target: 'gauge', text: 'Fact gauge: supported / not enough evidence / not supported' },
    think: 'Why is “not enough evidence” also a valuable judgment?',
  },
  hallucination: {
    name: 'Limits of AI-generated content',
    explain: 'Generative AI produces text from the language patterns it has learned. It can write something fluent and confident that does not match the facts, and it can sound certain about things it has no good basis for.',
    example: 'AI may mix up one scientist’s life story with another’s, or “invent” references that do not exist.',
    link: { scene: 'verify', target: 'desk', text: 'AI information desk' },
    think: 'Why is “sounding fluent” not the same as “being right”?',
  },
  responsible: {
    name: 'Using AI responsibly',
    explain: 'Treat AI as a learning assistant, not a replacement: verify important information, do not copy unverified answers, protect your own and other people’s privacy, think for yourself and take responsibility for your own work.',
    example: 'Ask AI for suggestions on your essay and decide for yourself what to change; do not send classmates’ personal information to AI.',
    link: { scene: 'verify', target: 'char:teacher', text: 'Ask the teacher advisor' },
    think: 'What can you ask AI to help with? Which judgments must you make yourself?',
  },
};

// ---------------------------------------------------------------------------
// Scene 1: AI Smart City
// ---------------------------------------------------------------------------
const CITY = {
  key: 'city',
  unit: 'UNIT 1',
  stage: 'Meet AI',
  title: 'AI Smart City',
  question: 'Where is AI?',
  intro: 'A miniature smart city rises out of the page. Many devices here “work by themselves”. Do they all use AI? Click a device and watch how it handles information.',
  core: 'AI is all around us. But is every device that runs automatically AI?',
  goals: ['Recognize typical uses of AI in everyday life', 'Name the input, processing and output of a device', 'Tell an “AI system” apart from “automatic control with fixed rules”'],
  concepts: ['ai', 'rule', 'io', 'data'],
  steps: [
    { id: 'predict', name: 'Predict' },
    { id: 'explore', name: 'Find the AI' },
    { id: 'match', name: 'In & out' },
    { id: 'wrap', name: 'Wrap-up' },
  ],
  characters: {
    student: { id: 'student', name: 'Xiaohang', role: 'Student explorer', color: '#D9B24C' },
    guide: { id: 'guide', name: 'Xiaozhi', role: 'AI guide', color: '#87B5C9' },
  },
  lines: {
    student: {
      default: 'I notice lots of devices can work by themselves. Does that mean they are all AI?',
      explore: 'I want to open them one by one: what information do they take in, and how do they handle it?',
      match: 'So every device can be described as input, processing and output!',
      wrap: 'Working automatically is not the same as AI. What matters is how it handles information.',
    },
    guide: {
      default: 'Running automatically does not always mean using AI. Let’s look at how each device handles information.',
      explore: 'Try comparing: does it follow fixed rules, or rely on a model trained from lots of data?',
      match: 'Drag each input, process and output to the right place and see if you can pair them up.',
      wrap: 'On the next page we will visit the lab and see how a model actually learns from data.',
    },
  },
  judgeOptions: [
    { id: 'ai', text: 'It mainly relies on a model trained from lots of data to recognize or decide (AI)' },
    { id: 'rule', text: 'It mainly follows fixed rules that people set in advance (rule-based control)' },
  ],
  devices: [
    {
      id: 'speaker',
      no: 1,
      name: 'Smart speaker',
      kind: 'ai',
      input: 'Sound (what you say)',
      process: 'A speech recognition model turns the sound into text, then works out the command',
      output: 'Speaks an answer or carries out an action',
      why: 'Everyone’s accent, speed and wording are different, so a handful of fixed rules could never cover every case. The speech recognition model inside the speaker was trained on huge amounts of speech data, so it mainly works by AI.',
    },
    {
      id: 'lamp',
      no: 2,
      name: 'Timer lamp',
      kind: 'rule',
      input: 'The current time',
      process: 'A fixed rule: on at 19:00, off at 22:00',
      output: 'Light on or light off',
      why: 'It switches on and off by itself, but it is only carrying out fixed rules a person wrote in advance. If the rules do not change, neither does its behavior, and it never learns anything new from data. So it is not AI.',
    },
    {
      id: 'imaging',
      no: 3,
      name: 'Image recognition kiosk',
      kind: 'ai',
      input: 'A picture',
      process: 'A model extracts features from the picture and compares them with patterns it has learned',
      output: 'A predicted category (with how likely it is)',
      why: 'Pictures vary endlessly, and it is very hard to write fixed rules for “which pixels make a leaf”. The recognition model was trained on large numbers of labeled images. In important settings such as medicine it only assists; the final judgment belongs to professionals.',
    },
    {
      id: 'face',
      no: 4,
      name: 'Face-recognition gate',
      kind: 'ai',
      input: 'A face image from the camera',
      process: 'A model extracts facial features and compares them with registered ones',
      output: 'Decides whether the person is registered and whether to open',
      why: 'The same person looks different under different lighting, angles and expressions, so a model trained on large amounts of face data is needed to extract the features. Also, a face is sensitive personal information: collecting and using it must follow the law and protect privacy.',
    },
    {
      id: 'car',
      no: 5,
      name: 'Self-driving car',
      kind: 'ai',
      input: 'Road information from cameras and radar',
      process: 'Models recognize pedestrians, vehicles and other objects, then plan the route',
      output: 'Driving decisions: steer, speed up or brake',
      why: 'Road conditions are complex and always changing. The system depends on models trained on huge amounts of road data to recognize pedestrians, vehicles and traffic lights. It also uses some fixed safety rules, but recognizing the surroundings is mainly done by AI.',
    },
    {
      id: 'signal',
      no: 6,
      name: 'Smart traffic light',
      kind: 'ai',
      input: 'Camera images of traffic at the junction',
      process: 'A model counts the vehicles waiting in each direction, then adjusts the timing',
      output: 'Changes in how long the lights stay red or green',
      why: 'An ordinary traffic light simply switches at fixed times, which is rule-based control. This “smart” one adds a step: it uses an image recognition model to count the vehicles in each direction and adjusts the timing accordingly, so it does use AI.',
    },
    {
      id: 'streetlamp',
      no: 7,
      name: 'Light-sensor street lamp',
      kind: 'rule',
      input: 'Brightness measured by a light sensor',
      process: 'A fixed rule: switch on when brightness falls below a set value',
      output: 'Light on or light off',
      why: '“A sensor plus a fixed threshold” is classic automatic control: on when it gets dark, off when it gets light. It needs no training and never learns from data, so it is not AI.',
    },
  ],
  matchDevices: ['speaker', 'imaging', 'lamp'],
  minJudged: 4,
};

// ---------------------------------------------------------------------------
// Scene 2: AI Training Lab
// ---------------------------------------------------------------------------
const LAB = {
  key: 'lab',
  unit: 'UNIT 2',
  stage: 'Understand AI',
  title: 'AI Training Lab',
  question: 'How does AI learn to recognize things?',
  intro: 'The lab has 20 training pictures and 10 test pictures. Label the data yourself, train a small model, then quiz it with pictures it has never seen.',
  core: 'Why can AI tell cats from dogs? Does it memorize the pictures, or does it learn some patterns from the data?',
  goals: ['Understand how data, labels, training and prediction fit together', 'Tell the training set apart from the test set', 'Use an experiment to see how training data affects predictions'],
  concepts: ['data', 'label', 'trainset', 'testset', 'classify', 'ml', 'training', 'model', 'predict', 'bias'],
  steps: [
    { id: 'know', name: 'Data' },
    { id: 'label', name: 'Label' },
    { id: 'train', name: 'Train' },
    { id: 'test', name: 'Test' },
    { id: 'compare', name: 'Compare' },
    { id: 'wrap', name: 'Wrap-up' },
  ],
  characters: {
    student: { id: 'student', name: 'Xiaohe', role: 'Student researcher', color: '#7FAF8C' },
    mentor: { id: 'mentor', name: 'Ms. Lin', role: 'Lab mentor', color: '#5E6E75' },
  },
  lines: {
    student: {
      default: 'The cats and dogs in these pictures have different colors, poses and backgrounds. How can a model tell them apart?',
      label: 'I will put a label on every picture. If I get one wrong, will I lead the model astray?',
      train: 'The numbers on the screen keep changing. Is the model adjusting itself little by little?',
      test: 'Has the model learned to classify? Why does it still get some new pictures wrong?',
      compare: 'If the training data changes, will the results on the same test pictures change too?',
      wrap: 'So what a model learns depends a lot on the data we give it.',
    },
    mentor: {
      default: 'Look at the data first. The training set is for the model to learn from. The test set is kept back to check it at the end.',
      label: 'A label is the known answer you give the model. Careful labeling is the first step to training a good model.',
      train: 'During training, the algorithm keeps comparing the model’s guesses with your labels and adjusts the model bit by bit.',
      test: 'We need to test it on data that was not used in training to really understand how well the model performs.',
      compare: 'Change the data conditions, then compare using the same test pictures. The results come from real training, so try it more than once.',
      wrap: 'Remember: a model’s prediction is not a perfect understanding of the world. It can be wrong.',
    },
  },
  stations: { stand: 'trainset', label: 'label', host: 'training', model: 'model', test: 'classify', rack: 'testset' },
  predict: {
    q: 'First, a guess: how does a computer learn to tell cats from dogs?',
    options: [
      { id: 'memory', text: 'It memorizes every picture it has seen, and only recognizes one that is exactly the same' },
      { id: 'pattern', text: 'It finds patterns in many labeled pictures, then uses those patterns to judge new pictures' },
      { id: 'rules', text: 'Programmers wrote out all the rules for “what a cat looks like and what a dog looks like” in advance' },
    ],
  },
  conditions: {
    A: { name: 'Run A', title: 'Fairly balanced data', desc: 'Uses all of your current labels: similar numbers of cats and dogs.' },
    B: { name: 'Run B', title: 'Unbalanced data', desc: 'Keeps every “cat” but only 2 “dogs”: one category has far more samples.' },
    C: { name: 'Run C', title: 'Data with wrong labels', desc: 'Starts from your labels and randomly changes 6 of them to the wrong category.' },
  },
  explainOptions: [
    { id: 'data', text: 'Different training data leads the model to learn different patterns, so its predictions for the same test pictures change too.' },
    { id: 'random', text: 'The model’s predictions are completely random and have nothing to do with the training data.' },
    { id: 'test', text: 'Because different pictures are used for each test.' },
  ],
  summary: [
    'Training data gives the model examples to learn from.',
    'Labels describe the known categories in the training task.',
    'The algorithm uses the training data to adjust the model.',
    'The model uses the patterns it has learned to make predictions on new data.',
    'Data quality, how well the data represents reality, and model design can all affect how well it predicts.',
  ],
  emphasis: 'An AI prediction is not a perfect understanding of things. A model can go wrong because of how it was trained or because the input is different from what it has seen.',
};

// ---------------------------------------------------------------------------
// Scene 3: AI Fact-Check Center (all cases are local teaching data reviewed in advance)
// ---------------------------------------------------------------------------
const VERIFY = {
  key: 'verify',
  unit: 'UNIT 3',
  stage: 'Evaluate AI',
  title: 'AI Fact-Check Center',
  question: 'Is everything AI says true?',
  intro: 'Here are three answers given by an AI. Act like a fact-checker: find the claims, look at the evidence, then decide whether to believe it.',
  core: 'AI can answer questions quickly. But are its answers always reliable?',
  goals: ['Find the checkable claims in an AI answer', 'Judge from evidence: supported, not supported, or not enough evidence', 'Explain why you accept or reject an AI suggestion'],
  concepts: ['claim', 'evidence', 'verify', 'hallucination', 'responsible'],
  steps: [
    { id: 'observe', name: 'Observe' },
    { id: 'evidence', name: 'Evidence' },
    { id: 'revise', name: 'Revise' },
    { id: 'usage', name: 'Use AI' },
    { id: 'wrap', name: 'Wrap-up' },
  ],
  characters: {
    student: { id: 'student', name: 'Xiaoyu', role: 'Student fact-checker', color: '#E6A18C' },
    teacher: { id: 'teacher', name: 'Ms. Zhou', role: 'Teacher advisor', color: '#7F9C8A' },
    assistant: { id: 'assistant', name: 'Xiaowen', role: 'AI assistant', color: '#E6A18C' },
  },
  lines: {
    student: {
      default: 'This answer sounds convincing. But how do I know it is true?',
      evidence: 'First I will pick out the statements that can be checked, then compare each one with the evidence.',
      revise: 'I should not copy the parts that have problems. I need to rewrite them to match the evidence.',
      usage: 'AI can help me with a lot, but some things I have to judge for myself.',
      wrap: 'From now on, when I see an AI answer, I will first ask: where is the evidence?',
    },
    teacher: {
      default: 'First find the claims that can be checked, then see what reliable evidence supports them.',
      evidence: 'Notice the difference: which materials really relate to the claim, and which only look related?',
      revise: 'When there is not enough evidence, saying “we cannot be sure yet” is more responsible than forcing a conclusion.',
      usage: 'Verify important information, protect personal privacy, and remember that your learning is your own responsibility.',
      wrap: 'Knowing how to ask, how to check and how to judge is what it really means to use AI well.',
    },
    assistant: {
      default: 'My answers may contain mistakes. For important information, please check reliable sources before you decide.',
      evidence: 'What I say needs to be verified by you. Compare it with the evidence and see where I am right and where I am wrong.',
      revise: 'Thank you for pointing out the problem. Making words like “all” and “has been proved” more precise brings the answer closer to the facts.',
      usage: 'I can help you find leads, explain things another way and suggest edits, but the conclusions and the responsibility are yours.',
      wrap: 'Please keep questioning and keep checking.',
    },
  },
  stations: { screen: 'claim', shelf: 'evidence', search: 'evidence', evidence: 'verify', gauge: 'verify', desk: 'hallucination' },
  verdicts: [
    { id: 'yes', text: 'Supported' },
    { id: 'no', text: 'Not supported' },
    { id: 'unsure', text: 'Not enough evidence' },
  ],
  firstImpression: [
    { id: 'trust', text: 'Reliable' },
    { id: 'unsure', text: 'Not sure' },
    { id: 'doubt', text: 'Unreliable' },
  ],
  cases: [
    {
      id: 'A',
      tag: 'A mostly correct answer',
      question: 'Why do we always see lightning before we hear thunder?',
      answer: [
        { text: 'Lightning and thunder actually happen at the same moment. ' },
        { text: 'Light travels through air at about 300,000 kilometers per second, while sound travels through air at only about 340 meters per second', claim: 0 },
        { text: '. Light is far faster than sound, so we always see the lightning first and hear the thunder afterwards.' },
      ],
      claims: [
        {
          text: 'Light travels at about 300,000 km per second and sound at about 340 m per second (in air).',
          answer: 'yes',
          evidence: [
            { source: 'Physics textbook (Grade 8)', text: 'Sound travels through air at about 340 m/s at 15 °C.', rel: 'support', why: 'It matches the speed of sound in the claim, and the source is reliable.' },
            { source: 'Physics textbook (Grade 8)', text: 'The speed of light in a vacuum is about 3×10⁸ m/s, and its speed in air is very close to that.', rel: 'support', why: '3×10⁸ m/s is 300,000 km per second, which matches the claim.' },
            { source: 'Safety handbook', text: 'In a thunderstorm, do not shelter under a tall tree or hold an umbrella in an open space.', rel: 'irrelevant', why: 'This is lightning safety advice. It has nothing to do with the claim about the speeds of light and sound.' },
            { source: 'Online comment', text: 'I think thunder is faster than lightning. Once I heard the thunder first.', rel: 'weak', why: 'A personal impression is not reliable evidence. What the person saw and heard may also have come from two different strikes.' },
          ],
          feedback: {
            yes: 'Correct. The two textbook items support the figures for light and for sound, so this claim rests on reliable evidence.',
            no: 'Look again at Evidence 1 and Evidence 2: the textbook figures match the claim, so the evidence supports it.',
            unsure: 'The evidence here is actually sufficient: the two textbook items match the two figures in the claim directly.',
          },
        },
      ],
    },
    {
      id: 'B',
      tag: 'An answer containing a factual error',
      question: 'When was the term “artificial intelligence” first proposed?',
      answer: [
        { text: 'The Dartmouth workshop held in 1956 is widely regarded as the birth of artificial intelligence as a field of study', claim: 0 },
        { text: ', and the name “artificial intelligence” spread from there. ' },
        { text: 'The workshop was proposed and chaired by Alan Turing', claim: 1 },
        { text: ', and the participants discussed how machines could be made to simulate human intelligence.' },
      ],
      claims: [
        {
          text: 'The 1956 Dartmouth workshop is widely regarded as the birth of artificial intelligence as a field of study.',
          answer: 'yes',
          evidence: [
            { source: 'Information technology textbook', text: 'In the summer of 1956, a group of scientists held a workshop at Dartmouth College in the United States. “Artificial intelligence” was established there as the name of a research field, which is regarded as the birth of the discipline.', rel: 'support', why: 'The textbook’s wording matches the claim.' },
            { source: 'Workshop proposal (1955)', text: 'In the proposal they wrote in 1955, McCarthy and his colleagues used the term “Artificial Intelligence” to name the workshop.', rel: 'support', why: 'The original document shows the term really is tied directly to this workshop.' },
            { source: 'Sci-fi movie synopsis', text: 'A science-fiction movie tells the story of a robot that has feelings.', rel: 'irrelevant', why: 'A movie plot has nothing to do with when the discipline was born.' },
          ],
          feedback: {
            yes: 'Correct. Both the textbook and the workshop proposal support this claim.',
            no: 'Evidence 1 and Evidence 2 both match the claim, so it is well founded. The real problem in the answer is the other claim.',
            unsure: 'The textbook and the original proposal already give direct support, so this claim can be judged “Supported”.',
          },
        },
        {
          text: 'The Dartmouth workshop was proposed and chaired by Alan Turing.',
          answer: 'no',
          evidence: [
            { source: 'Workshop proposal (1955)', text: 'The workshop was proposed jointly by four people: John McCarthy, Marvin Minsky, Nathaniel Rochester and Claude Shannon.', rel: 'refute', why: 'Turing is not on the list of proposers, which directly contradicts the claim.' },
            { source: 'Scientist biography', text: 'Alan Turing died in 1954.', rel: 'refute', why: 'Turing died two years before the workshop, so he could not have chaired a meeting in 1956.' },
            { source: 'History of science reader', text: 'In 1950 Turing published a paper proposing what later became known as the “Turing test”.', rel: 'irrelevant', why: 'This shows Turing made important contributions to the idea of AI, but not that he proposed or chaired the Dartmouth workshop.' },
          ],
          feedback: {
            yes: 'Check again: the proposal names McCarthy and three others, and Turing died in 1954. The evidence contradicts this claim.',
            no: 'Correct. Both the list of proposers and the date of Turing’s death contradict the claim. The AI confused “someone who contributed greatly to AI” with “the person who proposed the workshop”. It sounds plausible, but it is wrong.',
            unsure: 'The evidence here is actually clear: Turing is not among the proposers, and he had died two years earlier. This can be judged “Not supported”.',
          },
        },
      ],
      revision: {
        target: 'The workshop was proposed and chaired by Alan Turing',
        q: 'This sentence contains a factual error. Which revision is more reasonable?',
        options: [
          { id: 'a', text: 'The workshop was proposed by John McCarthy, Marvin Minsky and others.', ok: true, why: 'It matches the proposers recorded in the workshop proposal and corrects the error.' },
          { id: 'b', text: 'The workshop was chaired jointly by Alan Turing and McCarthy.', ok: false, why: 'It still keeps the wrong information: Turing died in 1954 and did not attend the 1956 workshop.' },
          { id: 'c', text: 'Leave the sentence as it is, because Turing is a famous computer scientist.', ok: false, why: 'Being famous does not make every statement about a person true. Look at the evidence.' },
        ],
      },
    },
    {
      id: 'C',
      tag: 'An answer without enough evidence',
      question: 'Can studying with AI improve my grades?',
      answer: [
        { text: 'Of course it can. ' },
        { text: 'A study has already proved that every student who uses AI gets better grades', claim: 0 },
        { text: ', so as long as you use AI more, your grades are sure to improve.' },
      ],
      note: 'The evidence cards below are simulated teaching materials for practicing fact-checking.',
      claims: [
        {
          text: 'A study has already proved that every student who uses AI gets better grades.',
          answer: 'unsure',
          evidence: [
            { source: 'Study summary (simulated)', text: '86 students in two classes at one school tried an AI tutoring tool for 8 weeks. The average score of the group using it was 5 points higher than the comparison group; some students’ scores did not change, and a few went down.', rel: 'partial', why: 'It only shows that “the average was higher in this small study”, not that “every student improved”.' },
            { source: 'Researchers’ note (simulated)', text: 'The sample in this study is small and the two classes were not randomly assigned. The difference in scores may also be related to the teacher, the class and other factors, so no causal conclusion can be drawn.', rel: 'limit', why: 'The researchers themselves point out that this study cannot prove that using AI caused the higher scores.' },
            { source: 'Product advertisement', text: '“Everyone who has tried it loves it! See your grades go up!”', rel: 'weak', why: 'Advertising slogans are not reliable evidence, and no checkable data is given.' },
            { source: 'Education news', text: 'Many schools have started to offer AI literacy courses.', rel: 'irrelevant', why: 'Schools offering courses has nothing to do with whether using AI improves grades.' },
          ],
          feedback: {
            yes: 'Think again: in Evidence 1 some students’ scores stayed the same or even fell, so “every student” does not hold; Evidence 2 also says the study cannot prove cause and effect.',
            no: 'The evidence does not show the claim is false. One study did find a higher average in the group using AI. It is just far from enough to support words as certain as “every student” and “has already proved”.',
            unsure: 'Correct. The evidence comes from only one small study. It cannot support “every student”, and it cannot prove cause and effect, so the most fitting judgment is “Not enough evidence”.',
          },
        },
      ],
      checks: [
        { q: 'Is the phrase “every student” supported by evidence?', answer: false, why: 'No. Evidence 1 clearly says some students’ scores did not change or even went down.' },
        { q: 'Can this study prove that “using AI causes grades to improve”?', answer: false, why: 'No. The researchers say the sample is small and not randomly assigned, and the difference may come from other factors.' },
        { q: 'To make a more reliable judgment, do we need to check more studies?', answer: true, why: 'Yes. For example, larger and more carefully designed studies, and the effects of different ways of using AI.' },
      ],
      revision: {
        target: 'A study has already proved that every student who uses AI gets better grades',
        q: 'This sentence is far too certain. Which wording fits the evidence better?',
        options: [
          { id: 'a', text: 'Many studies have proved that students who use AI all improve their grades greatly.', ok: false, why: 'This is even more absolute than the original, while the evidence is only one small study.' },
          { id: 'b', text: 'A small study found a higher average score in classes using an AI tutoring tool, but results varied from student to student. It is not yet clear that AI caused the improvement, and more research is needed.', ok: true, why: 'It keeps the uncertainty: it says where the evidence comes from, what it shows and what it cannot yet show.' },
          { id: 'c', text: 'Using AI does not help learning at all.', ok: false, why: 'This is another absolute statement with no evidence behind it. When the evidence is not enough, we should not force a yes or a no.' },
        ],
      },
    },
  ],
  usage: [
    {
      id: 'search',
      title: 'Using AI to help find information',
      situation: 'You have to write a short report on “plastic pollution in the oceans” and want AI to help you find information.',
      options: [
        { id: 'a', text: 'Copy the data and conclusions the AI gives straight into the report.', ok: false, why: 'Data from AI can be inaccurate or even made up. It should not be used without checking.' },
        { id: 'b', text: 'Ask the AI for leads and keywords, then check the data and sources in textbooks and on trusted organizations’ websites.', ok: true, why: 'Treat AI as a helper for finding leads, go back to reliable sources to verify what matters, and cite your sources.' },
        { id: 'c', text: 'AI knows a lot, so what it says must be right. No need to check.', ok: false, why: '“Knowing a lot” is not the same as “never being wrong”. Important information needs to be verified.' },
      ],
    },
    {
      id: 'explain',
      title: 'Using AI to explain a hard concept',
      situation: 'You did not understand “adding and subtracting negative numbers” in math class, and you want to ask AI.',
      options: [
        { id: 'a', text: 'Ask the AI to explain it another way with examples, then do a few textbook exercises to check whether you really understand.', ok: true, why: 'Let AI support your understanding, then test yourself with practice. You are still the one doing the learning.' },
        { id: 'b', text: 'Once the AI has explained it, I have learned it.', ok: false, why: 'Following an explanation is not the same as mastering it. You need to practice to be sure.' },
        { id: 'c', text: 'Just have the AI give me the homework answers and skip the explanation.', ok: false, why: 'Answers alone will not help you understand the concept. You will be stuck again next time.' },
      ],
    },
    {
      id: 'homework',
      title: 'Using AI to help with homework',
      situation: 'Your language arts teacher has set an essay called “My Deskmate”, due tomorrow.',
      options: [
        { id: 'a', text: 'Have the AI write one and hand it in.', ok: false, why: 'It is not your own work. That is dishonest, and you also lose the chance to practice writing.' },
        { id: 'b', text: 'Send the AI your deskmate’s name, photo and home address so the essay sounds more real.', ok: false, why: 'This gives away someone else’s private personal information. Do not give AI sensitive information about yourself or others.' },
        { id: 'c', text: 'Write it yourself first, then ask the AI for suggestions, decide for yourself what to change, and say how you used AI if your teacher requires it.', ok: true, why: 'You do the thinking and the writing, AI only offers suggestions, and you follow your teacher’s rules.' },
      ],
    },
    {
      id: 'conclusion',
      title: 'Using AI to produce research conclusions',
      situation: 'In science class your group ran an experiment on “seed germination and water”, and now you need to write the conclusion.',
      options: [
        { id: 'a', text: 'The experiment is not finished, so have the AI generate some data and a conclusion.', ok: false, why: 'Making up data goes against the basics of scientific inquiry. Conclusions must come from real observations.' },
        { id: 'b', text: 'The AI’s conclusion does not match our data, so change the data to agree with the AI.', ok: false, why: 'Never change real data to fit what AI says. Check how the experiment was done and record it honestly.' },
        { id: 'c', text: 'Draw the conclusion from your group’s real data, then ask the AI to check whether it is clearly written.', ok: true, why: 'You draw the conclusion from the evidence, and AI only helps with wording. The judgment and the responsibility belong to the learner.' },
      ],
    },
  ],
  principles: ['Verify important information.', 'Do not copy answers that have not been checked.', 'Take care with privacy and personal information.', 'Keep thinking for yourself and take responsibility for your learning.'],
};

// ---------------------------------------------------------------------------
// Course summary
// ---------------------------------------------------------------------------
const SUMMARY = {
  key: 'summary',
  unit: 'REPORT',
  stage: 'Summary',
  title: 'My AI Exploration Report',
  question: 'Meet · Understand · Evaluate',
  intro: 'You have completed the learning path “Meet AI → Understand AI → Evaluate AI”. Here is a summary of your exploration.',
  concepts: [],
  characters: {
    student: { id: 'student', name: 'Xiaohang', role: 'Student explorer', color: '#D9B24C' },
    guide: { id: 'guide', name: 'Xiaozhi', role: 'AI guide', color: '#87B5C9' },
  },
  lines: {
    student: { default: 'Looking back, I can now tell AI apart, train a model and check the facts by myself!' },
    guide: { default: 'Congratulations on finishing your exploration. Remember to understand both what AI can do and where its limits are.' },
  },
  reflection: 'If your school plans to use AI to help students learn, what do you think it should be careful about? Why?',
};

export const SCENES = { city: CITY, lab: LAB, verify: VERIFY, summary: SUMMARY };
