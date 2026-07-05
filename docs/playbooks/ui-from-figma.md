# PAWJAI UI From Figma Playbook

Use this when implementing or updating screens from the PAWJAI Figma Make file.

## Source

- File key: `cfYww0U2M4xAkvHv3Gbvss`
- URL: `https://www.figma.com/make/cfYww0U2M4xAkvHv3Gbvss/PAWJAI-Currently`

## Flow

1. Get the target screen/node from Figma.
2. Fetch design context or screenshot for only the needed screen.
3. Map the screen to existing app route and components.
4. Reuse existing components before adding new ones.
5. Keep data loading and authorization in server components or server actions.
6. Verify in browser at the actual route.

## UI Rules

- Match the existing PAWJAI visual language and navigation.
- Do not add landing-page sections where an app workflow is expected.
- Use real app states: empty, loading, signed out, unauthorized, error, and success.
- Keep mobile layout first for adopter flows.
- Make admin screens dense, scannable, and operational.

## Verification

- Run `npm run verify`.
- Start the dev server when needed.
- Inspect the actual route in browser and check for overlap, broken images, unusable forms, and mobile issues.
