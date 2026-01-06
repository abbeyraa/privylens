const STORAGE_KEY = "otomate_templates";

export function getTemplates() {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load templates:", error);
    return [];
  }
}

export function saveTemplates(templates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    return true;
  } catch (error) {
    console.error("Failed to save templates:", error);
    return false;
  }
}

export function saveTemplate(template) {
  const templates = getTemplates();
  templates.unshift(template);
  return saveTemplates(templates);
}

export function deleteTemplateById(templateId) {
  const templates = getTemplates();
  const next = templates.filter((template) => template.id !== templateId);
  return saveTemplates(next);
}
