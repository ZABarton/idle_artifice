# Idle Artifice

An idle game about making magical weapons

## Development Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (package manager)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd idle_artifice
```

2. Install dependencies:
```bash
pnpm install
```

### Development

Start the development server:
```bash
pnpm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:
```bash
pnpm run build
```

Preview production build:
```bash
pnpm run preview
```

### Code Quality

Run ESLint:
```bash
pnpm run lint
```

Format code with Prettier:
```bash
pnpm run format
```

## Tech Stack

- Vue.js 3 (Composition API with `<script setup>`)
- TypeScript
- Vite
- ESLint
- Prettier
