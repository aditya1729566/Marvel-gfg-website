export interface EventConfig {
  name: string;
  workingTitle: boolean;
  tagline: string;
  organizer: string;
  date: string | null;
  venue: string | null;
  registrationUrl: string | null;
  prizePool: string | null;
  contactEmail: string | null;
  format: string | null;
  eligibility: string | null;
  teamSize: string | null;
  deadline: string | null;
  schedule: { title: string; time: string; description: string }[];
  faqs: { question: string; answer: string }[];
}

// Replace null values with confirmed organizer information. Never infer event facts.
export const eventData: EventConfig = {
  name: "Enter the Multiverse",
  workingTitle: true,
  tagline: "A new reality. Built by you.",
  organizer: "GeeksForGeeks Student Chapter, Bennett University",
  date: null,
  venue: null,
  registrationUrl: null,
  prizePool: null,
  contactEmail: null,
  format: null,
  eligibility: null,
  teamSize: null,
  deadline: null,
  schedule: [],
  faqs: [
    {
      question: "Who can enter the multiverse?",
      answer:
        "Participant eligibility will be announced by the GFG Student Chapter, Bennett University. Check this page once the event details are released.",
    },
    {
      question: "Do I need a team?",
      answer:
        "Team requirements and team size are to be announced. The final event rules will be published here.",
    },
    {
      question: "When and where is the event?",
      answer:
        "The event date and venue are to be announced. Bennett University is the organizer’s institution; a venue has not yet been confirmed.",
    },
    {
      question: "How do I register?",
      answer:
        "Registration details are coming soon. Once registration opens, the registration buttons on this page will take you directly to the official registration page.",
    },
    {
      question: "Is there a registration fee?",
      answer:
        "Registration fees, if any, are to be announced. No payment is being collected on this website.",
    },
  ],
};

// Creative experience themes, not confirmed competition tracks or schedule stages.
export const experiences = [
  {
    id: "learn",
    title: "Learn",
    label: "A different perspective",
    description:
      "Every great idea starts with a question. Explore the unfamiliar. Find a new way to think.",
    accent: "#e74b42",
    symbol: "⌁",
  },
  {
    id: "build",
    title: "Build",
    label: "An idea made real",
    description:
      "Turn a blank canvas into something that works. Bring your curiosity, your code, and your own point of view.",
    accent: "#77d8dc",
    symbol: "◇",
  },
  {
    id: "compete",
    title: "Compete",
    label: "A reason to go further",
    description:
      "Meet the challenge with your own approach. The format and rules will be revealed with the official event announcement.",
    accent: "#e74b42",
    symbol: "△",
  },
] as const;
