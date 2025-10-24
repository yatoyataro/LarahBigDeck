export interface Card {
  id: string;
  question: string;
  answer: string;
  options?: string[]; // For multiple choice mode
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  cardCount: number;
  cards: Card[];
  createdAt: string;
}

export const mockDecks: Deck[] = [
  {
    id: "1",
    title: "JavaScript Fundamentals",
    description: "Core concepts and syntax for JavaScript programming",
    cardCount: 5,
    createdAt: "2025-01-15",
    cards: [
      {
        id: "1-1",
        question: "What is a closure in JavaScript?",
        answer: "A closure is a function that has access to variables in its outer (enclosing) lexical scope, even after the outer function has returned.",
        options: [
          "A function that has access to variables in its outer lexical scope",
          "A method to close browser windows",
          "A way to hide private variables",
          "A loop that closes automatically"
        ]
      },
      {
        id: "1-2",
        question: "What is the difference between let and var?",
        answer: "let is block-scoped while var is function-scoped. let also doesn't allow redeclaration in the same scope.",
        options: [
          "let is block-scoped, var is function-scoped",
          "They are exactly the same",
          "let is faster than var",
          "var is newer than let"
        ]
      },
      {
        id: "1-3",
        question: "What is event bubbling?",
        answer: "Event bubbling is when an event propagates from the target element up through its parent elements in the DOM tree.",
        options: [
          "Events propagate from child to parent elements",
          "Events create bubbles on the screen",
          "A way to prevent events",
          "Events propagate from parent to child"
        ]
      },
      {
        id: "1-4",
        question: "What is the purpose of async/await?",
        answer: "async/await provides a cleaner way to work with Promises, making asynchronous code look and behave more like synchronous code.",
        options: [
          "To make asynchronous code easier to read and write",
          "To make code run faster",
          "To create delays in code",
          "To handle errors only"
        ]
      },
      {
        id: "1-5",
        question: "What is the DOM?",
        answer: "The Document Object Model (DOM) is a programming interface for web documents. It represents the page so programs can change the document structure, style, and content.",
        options: [
          "A programming interface for web documents",
          "A database for web pages",
          "A styling framework",
          "A JavaScript library"
        ]
      }
    ]
  },
  {
    id: "2",
    title: "React Hooks",
    description: "Understanding React's built-in Hooks and their usage",
    cardCount: 4,
    createdAt: "2025-01-18",
    cards: [
      {
        id: "2-1",
        question: "What is useState used for?",
        answer: "useState is a Hook that lets you add state to functional components. It returns an array with the current state value and a function to update it.",
        options: [
          "To add state to functional components",
          "To fetch data from APIs",
          "To create routes",
          "To style components"
        ]
      },
      {
        id: "2-2",
        question: "When does useEffect run?",
        answer: "useEffect runs after the component renders. The timing depends on its dependency array: no array means every render, empty array means once, with dependencies means when those change.",
        options: [
          "After the component renders",
          "Before the component renders",
          "Only on component unmount",
          "Never automatically"
        ]
      },
      {
        id: "2-3",
        question: "What is useContext used for?",
        answer: "useContext provides a way to pass data through the component tree without having to pass props down manually at every level.",
        options: [
          "To share data across the component tree",
          "To create context menus",
          "To handle form inputs",
          "To manage routing"
        ]
      },
      {
        id: "2-4",
        question: "What does useMemo do?",
        answer: "useMemo memoizes a computed value, only recalculating it when its dependencies change. This optimizes performance by avoiding expensive calculations on every render.",
        options: [
          "Memoizes computed values for performance",
          "Creates memory leaks",
          "Stores user data",
          "Manages component lifecycle"
        ]
      }
    ]
  },
  {
    id: "3",
    title: "TypeScript Basics",
    description: "Introduction to TypeScript types and interfaces",
    cardCount: 3,
    createdAt: "2025-01-20",
    cards: [
      {
        id: "3-1",
        question: "What is a TypeScript interface?",
        answer: "An interface is a way to define the shape of an object, specifying what properties it should have and their types.",
        options: [
          "A way to define object shapes and types",
          "A UI component library",
          "A database interface",
          "A network protocol"
        ]
      },
      {
        id: "3-2",
        question: "What is the difference between type and interface?",
        answer: "While similar, interfaces can be extended and merged, while types are more flexible and can represent unions, primitives, and more complex types.",
        options: [
          "Interfaces can be extended and merged",
          "They are exactly the same",
          "Types are deprecated",
          "Interfaces are only for classes"
        ]
      },
      {
        id: "3-3",
        question: "What is a generic in TypeScript?",
        answer: "Generics allow you to create reusable components that work with multiple types rather than a single one, providing type safety and flexibility.",
        options: [
          "Reusable components that work with multiple types",
          "A basic variable type",
          "A way to ignore types",
          "An error handling mechanism"
        ]
      }
    ]
  }
];
