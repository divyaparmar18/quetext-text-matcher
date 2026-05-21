import { Router } from 'express';

import { CompareController } from '../controllers/compare.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { compareBodySchema } from '../middlewares/validation.schemas';
import { TextMatcher } from '../services/TextMatcher';

export function buildCompareRouter(matcher: TextMatcher): Router {
  const router = Router();
  const controller = new CompareController(matcher);

  // POST / - Compare two strings
  router.post('/', validateBody(compareBodySchema), controller.compare);

  return router;
}
