import { Router, Request, Response, NextFunction } from 'express';
import { budgetService } from '../services/budget.service.js';
import { sendSuccess } from '@packages/http';
import { authenticateJwt, AuthenticatedRequest } from '@packages/auth';
import { getConfig } from '@packages/config';

export const budgetRouter = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  authenticateJwt(config.JWT_ACCESS_SECRET)(req, res, next);
};

// CATEGORY ROUTES
budgetRouter.get(
  '/budget-categories',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await budgetService.listCategories(req.user!.userId);
      sendSuccess(res, categories, 200);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.post(
  '/budget-categories',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await budgetService.createCategory(req.user!.userId, req.body);
      sendSuccess(res, category, 201);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.patch(
  '/budget-categories/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const category = await budgetService.updateCategory(id, req.user!.userId, req.body);
      sendSuccess(res, category, 200);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.delete(
  '/budget-categories/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const result = await budgetService.deleteCategory(id, req.user!.userId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);

// BUDGET ROUTES
budgetRouter.post(
  '/budgets',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budget = await budgetService.createBudget(req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, budget, 201);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.get(
  '/budgets',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await budgetService.listBudgets(req.user!.userId, req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.get(
  '/budgets/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const budget = await budgetService.getBudgetDetail(id, req.user!.userId);
      sendSuccess(res, budget, 200);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.patch(
  '/budgets/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const budget = await budgetService.updateBudget(id, req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, budget, 200);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.delete(
  '/budgets/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const result = await budgetService.deleteBudget(id, req.user!.userId, req.correlationId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.get(
  '/budgets/:id/progress',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const progress = await budgetService.getBudgetProgress(id, req.user!.userId);
      sendSuccess(res, progress, 200);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.get(
  '/budgets/:id/summary',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const summary = await budgetService.getBudgetSummary(id, req.user!.userId);
      sendSuccess(res, summary, 200);
    } catch (err) {
      next(err);
    }
  },
);

// EXPENSE ROUTES
budgetRouter.post(
  '/budgets/:budgetId/expenses',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params['budgetId'] as string;
      const expense = await budgetService.createExpense(budgetId, req.user!.userId, req.body, req.correlationId);
      sendSuccess(res, expense, 201);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.get(
  '/budgets/:budgetId/expenses',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params['budgetId'] as string;
      const result = await budgetService.listExpenses(budgetId, req.user!.userId, req.query);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.get(
  '/budgets/:budgetId/expenses/:expenseId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params['budgetId'] as string;
      const expenseId = req.params['expenseId'] as string;
      const expense = await budgetService.getExpenseDetail(budgetId, expenseId, req.user!.userId);
      sendSuccess(res, expense, 200);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.patch(
  '/budgets/:budgetId/expenses/:expenseId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params['budgetId'] as string;
      const expenseId = req.params['expenseId'] as string;
      const expense = await budgetService.updateExpense(budgetId, expenseId, req.user!.userId, req.body);
      sendSuccess(res, expense, 200);
    } catch (err) {
      next(err);
    }
  },
);

budgetRouter.delete(
  '/budgets/:budgetId/expenses/:expenseId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const budgetId = req.params['budgetId'] as string;
      const expenseId = req.params['expenseId'] as string;
      const result = await budgetService.deleteExpense(budgetId, expenseId, req.user!.userId, req.correlationId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  },
);
