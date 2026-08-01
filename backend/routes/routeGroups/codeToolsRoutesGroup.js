// backend/routes/routeGroups/codeToolsRoutesGroup.js
//
// Issue #2402 — feature-grouped route registration.
//
// Hosts the two AI "code tool" endpoints added upstream in #3064 (AI-Powered
// Code Explanations) and #3177 (Algorithm Cheat Sheet Generator). Each was
// previously wired as an inline `if (pathname === ...)` block inside
// `setupApiRoutes`. Grouping them here keeps `apiRoutes.js` a pure data
// dispatcher and gives these two sibling endpoints a single registration
// surface for future additions (e.g. complexity analysis, snippet
// formatting) without touching the central registry.
import { explainCode } from '../../services/codeExplainer.service.js';
import cheatSheetHandler from '../../../api/cheat-sheet.js';

// `explainCode` returns a JSON payload; `wrapHandler` invokes its inner
// async handler with `(req, res)`, so we project the response shape inside
// the handler rather than relying on `wrapHandler`'s `sendError` fallback.
const explainCodeRouteHandler = async (req, res) => {
  const { code, language } = req.body || {};
  const result = await explainCode({ code, language });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result));
};

const cheatSheetRouteHandler = async (req, res) => {
  await cheatSheetHandler(req, res);
};

export const codeToolsRoutesGroup = [
  {
    name: 'CodeTools',
    routes: [
      {
        method: 'POST',
        path: '/api/explain-code',
        handler: explainCodeRouteHandler,
        tier: 'default',
        requiresAuth: false,
      },
      {
        method: 'POST',
        path: '/api/cheat-sheet',
        handler: cheatSheetRouteHandler,
        tier: 'default',
        requiresAuth: false,
      },
      {
        method: 'GET',
        path: '/api/cheat-sheet',
        handler: cheatSheetRouteHandler,
        tier: 'default',
        requiresAuth: false,
      },
    ],
  },
];

export default codeToolsRoutesGroup;
