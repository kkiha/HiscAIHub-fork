export function serializeAgentExampleTasks(tasks: readonly string[]): string {
  return JSON.stringify(tasks.map((task) => task.trim()).filter(Boolean));
}

export function parseAgentExampleTasks(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((task) => String(task).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}
