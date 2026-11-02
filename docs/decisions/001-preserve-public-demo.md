# Preserve the current public application

Keep the existing route paths, content data and server/client boundaries. Avoid empty feature folders and premature database dependencies. Use Vitest/RTL for synchronous components and pure functions; use production Playwright tests for route rendering and complete user journeys, following the installed Next.js testing guides. CI uses an isolated local server on port 3100 and synthetic contact information.

The public site remains a truthful demonstration until backend and security phases are separately approved. Never infer a booked appointment from a form's frontend completion state.
