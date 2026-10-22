/**
 * KLEEN — Toast Notification Component
 */

import { icon } from "./icons.js";

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (typeof document === "undefined") return;
    let el = document.getElementById("kleen-toast-container");
    if (!el) {
      el = document.createElement("div");
      el.id = "kleen-toast-container";
      el.className = "toast-container";
      document.body.appendChild(el);
    }
    this.container = el;
  }

  show(title, message = "", type = "success", duration = 4000) {
    this.init();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconMarkup;
    let badgeBg;
    let badgeColor;

    switch (type) {
      case "success":
        iconMarkup = icon("check", { size: 14, strokeWidth: 3 });
        badgeBg = "#DCFCE7";
        badgeColor = "#15803D";
        break;
      case "error":
        iconMarkup = icon("x", { size: 14, strokeWidth: 3 });
        badgeBg = "#FEE2E2";
        badgeColor = "#B91C1C";
        break;
      case "warning":
        iconMarkup = icon("alert-triangle", { size: 14, strokeWidth: 2.5 });
        badgeBg = "#FEF3C7";
        badgeColor = "#B45309";
        break;
      case "info":
      default:
        iconMarkup = icon("info", { size: 14, strokeWidth: 2 });
        badgeBg = "#E0F2FE";
        badgeColor = "#0369A1";
        break;
    }

    toast.innerHTML = `
      <div style="width: 24px; height: 24px; border-radius: 50%; background: ${badgeBg}; color: ${badgeColor}; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem; flex-shrink:0;">
        ${iconMarkup}
      </div>
      <div class="toast-content">
        <h4>${title}</h4>
        ${message ? `<p>${message}</p>` : ""}
      </div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  success(title, message, duration) {
    this.show(title, message, "success", duration);
  }

  error(title, message, duration) {
    this.show(title, message, "error", duration);
  }

  warning(title, message, duration) {
    this.show(title, message, "warning", duration);
  }

  warn(title, message, duration) {
    this.show(title, message, "warning", duration);
  }

  info(title, message, duration) {
    this.show(title, message, "info", duration);
  }
}

export const toast = new ToastManager();
