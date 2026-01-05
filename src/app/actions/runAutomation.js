"use server";

import { executeAutomationPlan } from "@/lib/playwright-runner";

export async function runAutomation(plan, safeRun = false) {
  return await executeAutomationPlan(plan, safeRun);
}
