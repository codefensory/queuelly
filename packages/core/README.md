# Queuelly

Queuelly is a TypeScript library designed to manage asynchronous operations in a sequential and orderly manner. It allows you to create queues of asynchronous tasks with dependencies and execution constraints, ensuring that tasks are executed in the correct order while handling dependencies and errors gracefully.

## Installation

You can install Queuelly via npm or yarn:

```bash
npm install queuelly
```

or

```bash
yarn add queuelly
```

## Basic usage

### Creating a Queuelly Instance

To start using Queuelly, you first need to create a Queuelly instance:

```TS
import { createQueuelly } from 'queuelly';

const queuelly = createQueuelly<void>();
```

### Adding Tasks to the Queue

You can add tasks to the queue using the add method

```TS
queuelly.add({
  name: 'Task 1',
  action: async () => {
    console.log('Executing Task 1');
    // Simulating asynchronous action
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
});
```

### Handling Events

Queuelly provides events for tracking the start and end of the queue processing. You can add event listeners to execute custom logic when these events occur.

```TS
queuelly.addEventListener('startProcess', () => {
  // Logic to execute when the queue processing starts
});

queuelly.addEventListener('endProcess', () => {
  // Logic to execute when the queue processing ends
});
```

## Basic example

```TS
import { createQueuelly } from 'queuelly';

// Create a Queuelly instance
const queuelly = createQueuelly<void>();

// Define a simple task
const task1 = {
  name: 'Task 1',
  action: async () => {
    console.log('Executing Task 1');
    // Simulating asynchronous action
    await new Promise(resolve => setTimeout(resolve, 1000));
  },
  onComplete: (value, { isLast }) => {
    console.log('Task 1 completed with value:', value);
    if (isLast) {
      console.log('All tasks completed');
    }
  },
  onError: (error, { isLast }) => {
    console.error('Task 1 failed:', error.message);
    if (isLast) {
      console.log('All tasks completed with errors');
    }
  }
};

// Define another task
const task2 = {
  name: 'Task 2',
  action: async () => {
    console.log('Executing Task 2');
    // Simulating asynchronous action
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulating an error for demonstration
    throw new Error('Task 2 encountered an error');
  },
  onComplete: (value, { isLast }) => {
    console.log('Task 2 completed with value:', value);
    if (isLast) {
      console.log('All tasks completed');
    }
  },
  onError: (error, { isLast }) => {
    console.error('Task 2 failed:', error.message);
    if (isLast) {
      console.log('All tasks completed with errors');
    }
  }
};

// Add tasks to the queue
queuelly.add(task1);
queuelly.add(task2);
```

## Debugging

Queuelly utilizes the debug module for logging and debugging purposes. To enable debug logs in the browser, you can use the following steps:

1. Install the debug package:

```bash
npm install debug
```

2. Import and enable debug in your application code:

```TS
import debug from 'debug';

// Enable debug for Queuelly
debug.enable('queuelly:*');
```

3. View debug logs in the browser console by setting the localStorage variable:

```TS
localStorage.debug = 'queuelly:*';
```

This will enable logging for Queuelly and its sub-modules, allowing you to debug your Queuelly implementation effectively.

## API Reference

### `createQueuelly()`

Creates a new instance of Queuelly.

Returns: `Queuelly`

### `Queuelly`

#### Methods

- `add(options: AddOptions<V>): Promise<V | R | null | undefined>`

  Adds a new task to the queue with the specified options.

#### Events

- `startProcess`

  Triggered when the queue processing starts.

- `endProcess`

  Triggered when the queue processing ends.

#### Properties

- `isPending: boolean`

  Indicates whether the queue is currently processing tasks.

### `AddOptions<V>`

#### Properties

- `name: string`

  The name of the task.

- `action: () => Promise<V>`

  A function that returns a promise representing the asynchronous action to perform for the task.

- `depends?: string[]`

  An array of task names that this task depends on. The task will fail if any dependent task fails.

- `waitFor?: string[]`

  An array of task names that this task is waiting for. The task will start after all tasks it is waiting for have completed, regardless of their success or failure.

- `canReplace?: boolean`

  A flag indicating whether this task can replace a previously added task with the same name if conditions are met.

- `onComplete?(value: V, ctx: { isLast: boolean }): void`

  A callback function called when the task is successfully completed. It receives the value returned by the asynchronous action and a context object indicating whether it's the last task in the queue.

- `onError?(reason: any, ctx: { isLast: boolean; lastValue: V | undefined }): void`

  A callback function called when an error occurs during the execution of the task. It receives the error reason and a context object indicating whether it's the last task in the queue and the value returned by the last successfully completed task.

## Development Status and Future Plans

**Queuelly** is currently in active development, and while it provides powerful features for managing asynchronous tasks, there are plans to further enhance its capabilities and integrations.

### Future Plans

- **Zustand Integration**: One upcoming feature is the creation of a dedicated package for integrating Queuelly seamlessly with Zustand, a small, fast, and scalable state management library for React. This integration will enable developers to manage asynchronous operations alongside state management using Zustand's simple and efficient API.

### Contributions and Feedback

Contributions to Queuelly are welcome! If you're interested in contributing to the development of Queuelly or have any feedback or suggestions for improvements, please feel free to open an issue or pull request on the GitHub repository.

### Stay Updated

To stay updated on the latest developments and releases of Queuelly, be sure to watch the GitHub repository and follow the official social media channels for announcements and updates.
