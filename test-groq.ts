import { analyzeReviews } from './lib/groq';

const fakeReviews = `
1. Terrible product, broke on day one. Do not buy!
2. Absolute garbage. Stopped working after a week and customer service ignored me.
3. Waste of money. The material feels cheap and it smells weird.
4. Doesn't match the description at all. Very disappointed.
5. Arrived broken. The packaging was fine so it must have been shipped broken.
6. Not worth the price. I've seen better quality at the dollar store.
7. Total scam. The battery lasted 5 minutes.
8. Extremely poor quality control. It was scratched everywhere.
9. Stopped charging after 2 days. Returning it immediately.
10. Do not recommend this to anyone. Worst purchase ever.
`;

async function runTest() {
  console.log('Testing Groq prompt with 10 negative reviews...');
  try {
    const result = await analyzeReviews(fakeReviews);
    console.log('\n--- Result ---');
    console.log('Suggestion (Verdict):', result.suggestion);
    console.log('Confidence:', result.confidence);
    console.log('Confidence Reason:', result.confidenceReason);
    console.log('Review Count:', result.reviewCount);
  } catch (err) {
    console.error('Error during test:', err);
  }
}

runTest();
