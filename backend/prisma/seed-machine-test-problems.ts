import { PrismaClient, QuestionDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

const problemsData = [
  {
    "id": 1,
    "title": "Reverse a String",
    "description": "Write a function that reverses a string. The input string is given as a character array. Return the reversed string.",
    "inputFormat": "A string s",
    "outputFormat": "The reversed string",
    "constraints": ["1 <= s.length <= 10^5", "s consists of printable ASCII characters"],
    "difficulty": "Easy",
    "tags": ["google", "amazon", "startup"],
    "sampleTestCases": [
      { "input": "hello", "output": "olleh" },
      { "input": "world", "output": "dlrow" }
    ],
    "hiddenTestCases": [
      { "input": "xAI", "output": "IAx" },
      { "input": "coding", "output": "gnidoc" }
    ]
  },
  {
    "id": 2,
    "title": "Two Sum",
    "description": "Given an array of integers and a target sum, find two numbers that add up to the target. Return their indices as a comma-separated string.",
    "inputFormat": "A string in the format 'nums=[a,b,c,...],target=x'",
    "outputFormat": "A string in the format '[i,j]'",
    "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists"],
    "difficulty": "Medium",
    "tags": ["amazon", "microsoft", "startup"],
    "sampleTestCases": [
      { "input": "nums=[2,7,11,15],target=9", "output": "[0,1]" },
      { "input": "nums=[3,2,4],target=6", "output": "[1,2]" }
    ],
    "hiddenTestCases": [
      { "input": "nums=[3,3],target=6", "output": "[0,1]" },
      { "input": "nums=[1,5,5,3],target=10", "output": "[1,2]" }
    ]
  },
  {
    "id": 3,
    "title": "Valid Parentheses",
    "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order. Every close bracket has a corresponding open bracket of the same type.",
    "inputFormat": "A string s",
    "outputFormat": "A string 'true' or 'false'",
    "constraints": ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'"],
    "difficulty": "Medium",
    "tags": ["amazon", "accenture", "startup"],
    "sampleTestCases": [
      { "input": "()", "output": "true" },
      { "input": "()[]{}", "output": "true" }
    ],
    "hiddenTestCases": [
      { "input": "(]", "output": "false" },
      { "input": "{[]}", "output": "true" }
    ]
  },
  {
    "id": 4,
    "title": "Maximum Subarray",
    "description": "Given an integer array nums, find the contiguous subarray with the largest sum and return its sum.",
    "inputFormat": "A string in the format 'nums=[a,b,c,...]'",
    "outputFormat": "A string representing the maximum sum",
    "constraints": ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    "difficulty": "Medium",
    "tags": ["google", "tcs", "startup"],
    "sampleTestCases": [
      { "input": "nums=[-2,1,-3,4,-1,2,1,-5,4]", "output": "6" },
      { "input": "nums=[1]", "output": "1" }
    ],
    "hiddenTestCases": [
      { "input": "nums=[5,-1,2,-3,4]", "output": "7" },
      { "input": "nums=[-1,-2,-3]", "output": "-1" }
    ]
  },
  {
    "id": 5,
    "title": "Palindrome Number",
    "description": "Given an integer x, return true if x is a palindrome, and false otherwise.",
    "inputFormat": "A string representing an integer x",
    "outputFormat": "A string 'true' or 'false'",
    "constraints": ["-2^31 <= x <= 2^31 - 1"],
    "difficulty": "Easy",
    "tags": ["capgemini", "accenture", "startup"],
    "sampleTestCases": [
      { "input": "121", "output": "true" },
      { "input": "-121", "output": "false" }
    ],
    "hiddenTestCases": [
      { "input": "12321", "output": "true" },
      { "input": "10", "output": "false" }
    ]
  },
  {
    "id": 6,
    "title": "Merge Two Sorted Lists",
    "description": "Merge two sorted linked lists and return the merged list as a comma-separated string of values.",
    "inputFormat": "A string in the format 'list1=[a,b,c,...],list2=[x,y,z,...]'",
    "outputFormat": "A string in the format '[a,b,c,...]'",
    "constraints": ["The number of nodes in both lists is in the range [0, 50]", "-100 <= Node.val <= 100"],
    "difficulty": "Easy",
    "tags": ["amazon", "google", "startup"],
    "sampleTestCases": [
      { "input": "list1=[1,2,4],list2=[1,3,4]", "output": "[1,1,2,3,4,4]" },
      { "input": "list1=[],list2=[]", "output": "[]" }
    ],
    "hiddenTestCases": [
      { "input": "list1=[1],list2=[2]", "output": "[1,2]" },
      { "input": "list1=[2,4],list2=[1]", "output": "[1,2,4]" }
    ]
  },
  {
    "id": 7,
    "title": "Climbing Stairs",
    "description": "You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. Return the number of distinct ways to climb to the top.",
    "inputFormat": "A string representing an integer n",
    "outputFormat": "A string representing the number of ways",
    "constraints": ["1 <= n <= 45"],
    "difficulty": "Easy",
    "tags": ["google", "accenture", "startup"],
    "sampleTestCases": [
      { "input": "2", "output": "2" },
      { "input": "3", "output": "3" }
    ],
    "hiddenTestCases": [
      { "input": "4", "output": "5" },
      { "input": "5", "output": "8" }
    ]
  },
  {
    "id": 8,
    "title": "Container With Most Water",
    "description": "Given an array of non-negative integers representing heights, find two lines that form a container with the most water. Return the maximum area.",
    "inputFormat": "A string in the format 'height=[a,b,c,...]'",
    "outputFormat": "A string representing the maximum area",
    "constraints": ["2 <= height.length <= 10^5", "0 <= height[i] <= 10^4"],
    "difficulty": "Medium",
    "tags": ["amazon", "tcs", "startup"],
    "sampleTestCases": [
      { "input": "height=[1,8,6,2,5,4,8,3,7]", "output": "49" },
      { "input": "height=[1,1]", "output": "1" }
    ],
    "hiddenTestCases": [
      { "input": "height=[4,3,2,1,4]", "output": "16" },
      { "input": "height=[1,2,1]", "output": "2" }
    ]
  },
  {
    "id": 9,
    "title": "Longest Palindromic Substring",
    "description": "Given a string s, return the longest palindromic substring in s.",
    "inputFormat": "A string s",
    "outputFormat": "The longest palindromic substring",
    "constraints": ["1 <= s.length <= 1000", "s consists of lowercase or uppercase letters"],
    "difficulty": "Hard",
    "tags": ["google", "capgemini", "startup"],
    "sampleTestCases": [
      { "input": "babad", "output": "bab" },
      { "input": "cbbd", "output": "bb" }
    ],
    "hiddenTestCases": [
      { "input": "racecar", "output": "racecar" },
      { "input": "abcd", "output": "a" }
    ]
  }
];

async function main() {
  console.log('🌱 Seeding machine test problems...');

  // Map difficulty strings to enum values
  const difficultyMap: Record<string, QuestionDifficulty> = {
    'Easy': QuestionDifficulty.EASY,
    'Medium': QuestionDifficulty.MEDIUM,
    'Hard': QuestionDifficulty.HARD,
  };

  for (const problemData of problemsData) {
    try {
      // Transform the data to match the schema
      const problem = await prisma.machineTestProblem.upsert({
        where: { id: problemData.id },
        update: {
          title: problemData.title,
          description: {
            description: problemData.description,
            inputFormat: problemData.inputFormat,
            outputFormat: problemData.outputFormat,
            constraints: problemData.constraints,
          },
          difficulty: difficultyMap[problemData.difficulty],
          testCases: {
            sampleTestCases: problemData.sampleTestCases,
            hiddenTestCases: problemData.hiddenTestCases,
          },
          isPublic: true,
        },
        create: {
          id: problemData.id,
          title: problemData.title,
          description: {
            description: problemData.description,
            inputFormat: problemData.inputFormat,
            outputFormat: problemData.outputFormat,
            constraints: problemData.constraints,
          },
          difficulty: difficultyMap[problemData.difficulty],
          testCases: {
            sampleTestCases: problemData.sampleTestCases,
            hiddenTestCases: problemData.hiddenTestCases,
          },
          isPublic: true,
        },
      });

      console.log(`✅ Created/Updated: ${problem.title} (ID: ${problem.id})`);
    } catch (error) {
      console.error(`❌ Error with problem ${problemData.id} (${problemData.title}):`, error.message);
    }
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });