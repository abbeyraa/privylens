/**
 * Inspector Event Recorder
 * Mencatat events dari browser Playwright untuk Interactive Automation Inspector
 */

export const EVENT_TYPES = {
  NAVIGATION: "navigation",
  LOADING: "loading",
  NETWORK_IDLE: "network_idle",
  ELEMENT_APPEAR: "element_appear",
  ELEMENT_DISAPPEAR: "element_disappear",
  CLICK: "click",
  INPUT: "input",
  SUBMIT: "submit",
  MODAL_OPEN: "modal_open",
  MODAL_CLOSE: "modal_close",
  TOAST: "toast",
  SPINNER: "spinner",
  CONSOLE_MESSAGE: "console_message",
  NETWORK_REQUEST: "network_request",
  NETWORK_RESPONSE: "network_response",
};

/**
 * Setup event listeners untuk page
 */
export async function setupInspectorListeners(page, onEvent) {
  const startTime = Date.now();
  let eventIdCounter = 0;

  const createEvent = (type, data) => {
    const event = {
      id: `event-${eventIdCounter++}`,
      type,
      timestamp: Date.now() - startTime,
      createdAt: new Date().toISOString(),
      ...data,
    };
    onEvent(event);
    return event;
  };

  // Navigation events
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      createEvent(EVENT_TYPES.NAVIGATION, {
        label: "Navigasi ke halaman",
        description: `Mengakses ${frame.url()}`,
        url: frame.url(),
        important: true,
      });
    }
  });

  // Loading events
  page.on("load", () => {
    createEvent(EVENT_TYPES.LOADING, {
      label: "Halaman selesai dimuat",
      description: "Event 'load' fired",
      important: true,
    });
  });

  page.on("domcontentloaded", () => {
    createEvent(EVENT_TYPES.LOADING, {
      label: "DOM Content Loaded",
      description: "DOM sudah siap",
    });
  });

  // Network idle detection
  let networkIdleTimeout;
  let activeRequests = 0;

  page.on("request", (request) => {
    activeRequests++;
    clearTimeout(networkIdleTimeout);
  });

  page.on("response", (response) => {
    activeRequests--;
    if (activeRequests === 0) {
      networkIdleTimeout = setTimeout(() => {
        createEvent(EVENT_TYPES.NETWORK_IDLE, {
          label: "Network Idle",
          description: "Tidak ada request network aktif selama 500ms",
          important: true,
        });
      }, 500);
    }
  });

  // Element visibility monitoring
  const observeElements = async () => {
    await page.evaluate(() => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // Element node
              const element = node;
              // Check for common UI patterns
              if (
                element.classList.contains("modal") ||
                element.getAttribute("role") === "dialog" ||
                element.classList.contains("toast") ||
                element.classList.contains("notification")
              ) {
                window.__inspectorEvent?.({
                  type: "element_appear",
                  selector: element.className || element.id || element.tagName,
                  label: "Elemen UI muncul",
                  description: `Modal/Toast/Notification muncul`,
                });
              }
            }
          });

          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const element = node;
              if (
                element.classList.contains("modal") ||
                element.getAttribute("role") === "dialog"
              ) {
                window.__inspectorEvent?.({
                  type: "element_disappear",
                  selector: element.className || element.id || element.tagName,
                  label: "Modal ditutup",
                  description: `Modal/Dialog ditutup`,
                });
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  };

  // Monitor user interactions (click, input)
  await page.evaluate(() => {
    // Click events
    document.addEventListener(
      "click",
      (e) => {
        const target = e.target;
        window.__inspectorEvent?.({
          type: "click",
          selector: target.id
            ? `#${target.id}`
            : target.className
            ? `.${target.className.split(" ")[0]}`
            : target.tagName.toLowerCase(),
          text: target.textContent?.trim().substring(0, 50),
          label: `Klik: ${target.textContent?.trim().substring(0, 30) || target.tagName}`,
          description: `User mengklik elemen`,
        });
      },
      true
    );

    // Input events
    document.addEventListener(
      "input",
      (e) => {
        const target = e.target;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT"
        ) {
          window.__inspectorEvent?.({
            type: "input",
            selector: target.id
              ? `#${target.id}`
              : target.name
              ? `[name="${target.name}"]`
              : target.tagName.toLowerCase(),
            fieldName: target.name || target.id || target.placeholder,
            label: `Input: ${target.name || target.id || "field"}`,
            description: `User memasukkan data ke field`,
          });
        }
      },
      true
    );

    // Submit events
    document.addEventListener(
      "submit",
      (e) => {
        const form = e.target;
        window.__inspectorEvent?.({
          type: "submit",
          selector: form.id ? `#${form.id}` : "form",
          label: "Form Submit",
          description: `Form dikirim`,
          important: true,
        });
      },
      true
    );
  });

  // Expose event handler to page
  await page.exposeFunction("__inspectorEvent", (eventData) => {
    createEvent(eventData.type, eventData);
  });

  await observeElements();

  // Monitor console messages
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("error") || text.includes("warning")) {
      createEvent(EVENT_TYPES.CONSOLE_MESSAGE, {
        label: "Console Message",
        description: text.substring(0, 100),
        level: msg.type(),
        text,
      });
    }
  });

  return {
    stop: () => {
      clearTimeout(networkIdleTimeout);
    },
  };
}

/**
 * Convert events to action flow draft
 */
export function convertEventsToActionFlow(events, options = {}) {
  const { onlyImportant = false, selectedIds = [] } = options;

  let filteredEvents = events;
  if (onlyImportant) {
    filteredEvents = filteredEvents.filter((e) => e.important);
  }
  if (selectedIds.length > 0) {
    filteredEvents = filteredEvents.filter((e) => selectedIds.includes(e.id));
  }

  const actions = [];

  filteredEvents.forEach((event) => {
    switch (event.type) {
      case EVENT_TYPES.NAVIGATION:
        actions.push({
          type: "navigate",
          target: event.url,
          label: `Navigate to ${new URL(event.url).hostname}`,
          description: event.description,
        });
        break;

      case EVENT_TYPES.CLICK:
        actions.push({
          type: "click",
          target: event.selector || event.text,
          label: `Click ${event.text || event.selector || "element"}`,
          description: event.description,
        });
        break;

      case EVENT_TYPES.INPUT:
        actions.push({
          type: "fill",
          target: event.fieldName || event.selector,
          label: `Fill ${event.fieldName || "field"}`,
          description: event.description,
        });
        break;

      case EVENT_TYPES.NETWORK_IDLE:
      case EVENT_TYPES.ELEMENT_APPEAR:
        actions.push({
          type: "wait",
          target: event.selector || "page ready",
          label: `Wait for ${event.description || "condition"}`,
          description: event.description,
          waitFor: event.selector
            ? { type: "selector", value: event.selector }
            : null,
        });
        break;

      case EVENT_TYPES.SUBMIT:
        actions.push({
          type: "click",
          target: event.selector || 'button[type="submit"]',
          label: "Submit form",
          description: event.description,
        });
        break;
    }
  });

  return {
    name: "Draft Action Flow dari Inspector",
    description: `Dibuat dari ${filteredEvents.length} event`,
    actions,
    source: "inspector",
    createdAt: new Date().toISOString(),
    metadata: {
      totalEvents: events.length,
      selectedEvents: filteredEvents.length,
      url: events.find((e) => e.type === EVENT_TYPES.NAVIGATION)?.url,
    },
  };
}

