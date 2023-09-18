import { Page } from "@playwright/test";
import { PageFunction } from "playwright-core/types/structs";

/**
 * Evaluates a function expression in the left iframe
 * @param page Page
 * @param fn Function to evaluate
 * @param args Function arguments
 */
export const evaluate = async <T, Arg>(
  page: Page,
  fn: PageFunction<Arg, T>,
  args: Arg = undefined as unknown as Arg
): Promise<T> => (await page.frame("left")?.evaluate<T, Arg>(fn, args)) as T;
