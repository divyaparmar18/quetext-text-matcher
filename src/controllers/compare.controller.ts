import { Request, Response, NextFunction } from 'express';

import { TextMatcher } from '../services/TextMatcher';
import { CompareBody } from '../middlewares/validation.schemas';
import { sendSuccess } from '../utils/response';

export class CompareController {
  private readonly matcher: TextMatcher;

  // Inject TextMatcher service via constructor
  constructor(matcher: TextMatcher) {
    this.matcher = matcher;
  }

  // Controller handler for text comparison API
  public compare = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { source, candidate } = req.body as CompareBody;
      const result = this.matcher.compare(source, candidate);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };
}
