import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Guftagu...');

  // Trivia questions - curated 15
  const questions = [
    {
      category: 'General',
      question: 'Which city is known as the City of Joy in India?',
      options: ['Mumbai', 'Kolkata', 'Delhi', 'Chennai'],
      correctIndex: 1,
    },
    {
      category: 'Cricket',
      question: 'Who scored the first double century in ODI cricket?',
      options: ['Sachin Tendulkar', 'Virender Sehwag', 'Rohit Sharma', 'Chris Gayle'],
      correctIndex: 0,
    },
    {
      category: 'Tech',
      question: 'What does HTTP stand for?',
      options: ['Hyper Text Transfer Protocol', 'High Text Transfer Path', 'Hyperlink Transfer Protocol', 'Host Text Transfer Protocol'],
      correctIndex: 0,
    },
    {
      category: 'Geography',
      question: 'Which is the longest river in India?',
      options: ['Yamuna', 'Ganga', 'Godavari', 'Brahmaputra'],
      correctIndex: 1,
    },
    {
      category: 'Bollywood',
      question: 'Who directed the movie 3 Idiots?',
      options: ['Karan Johar', 'Rajkumar Hirani', 'Sanjay Leela Bhansali', 'Anurag Kashyap'],
      correctIndex: 1,
    },
    {
      category: 'Science',
      question: 'What is the chemical symbol for Gold?',
      options: ['Go', 'Gd', 'Au', 'Ag'],
      correctIndex: 2,
    },
    {
      category: 'History',
      question: 'In which year did India gain independence?',
      options: ['1945', '1947', '1950', '1942'],
      correctIndex: 1,
    },
    {
      category: 'Sports',
      question: 'How many players are on a cricket team on field?',
      options: ['10', '11', '12', '9'],
      correctIndex: 1,
    },
    {
      category: 'General',
      question: 'What is the capital of Bihar?',
      options: ['Gaya', 'Patna', 'Bhagalpur', 'Muzaffarpur'],
      correctIndex: 1,
    },
    {
      category: 'Tech',
      question: 'Which company developed Flutter?',
      options: ['Meta', 'Google', 'Apple', 'Microsoft'],
      correctIndex: 1,
    },
    {
      category: 'Food',
      question: 'Which dish is famous in Hyderabad?',
      options: ['Dhokla', 'Biryani', 'Idli', 'Vada Pav'],
      correctIndex: 1,
    },
    {
      category: 'General',
      question: 'Guftagu means?',
      options: ['Fight', 'Conversation', 'Silence', 'Journey'],
      correctIndex: 1,
    },
    {
      category: 'Math',
      question: 'What is 12 x 12?',
      options: ['124', '144', '132', '156'],
      correctIndex: 1,
    },
    {
      category: 'Space',
      question: 'Which planet is known as Red Planet?',
      options: ['Venus', 'Jupiter', 'Mars', 'Saturn'],
      correctIndex: 2,
    },
    {
      category: 'Cricket',
      question: 'IPL stands for?',
      options: ['Indian Premier League', 'International Premier League', 'Indian Players League', 'International Players League'],
      correctIndex: 0,
    },
  ];

  for (const q of questions) {
    await prisma.triviaQuestion.upsert({
      where: { id: `seed_${q.question.slice(0,20).replace(/\s/g,'_')}` },
      update: {},
      create: {
        id: `seed_${Math.random().toString(36).slice(2,9)}`,
        category: q.category,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        difficulty: 'MEDIUM',
      },
    });
  }

  // Dev users
  const devUsers = [
    { username: 'saad', displayName: 'Saad Hussain', phone: '+910000000001', phoneHash: 'hash1' },
    { username: 'ashad', displayName: 'Ashad Ahamad', phone: '+910000000002', phoneHash: 'hash2' },
    { username: 'test1', displayName: 'Test User 1', phone: '+910000000003', phoneHash: 'hash3' },
    { username: 'test2', displayName: 'Test User 2', phone: '+910000000004', phoneHash: 'hash4' },
  ];

  for (const u of devUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        displayName: u.displayName,
        phone: u.phone,
        phoneHash: u.phoneHash,
        bio: `Dev user ${u.displayName} for Guftagu testing`,
      },
    });
  }

  console.log('Seed done');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
