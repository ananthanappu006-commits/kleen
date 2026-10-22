/**
 * KLEEN — Reusable Modal & Drawer Controller
 */

class ModalController {
  /**
   * Opens a modal with custom HTML content
   * @param {string} title
   * @param {string} bodyHtml
   * @param {string} footerHtml
   * @param {Function} onOpen
   * @returns {HTMLElement} modalBackdrop element
   */
  open({ title, bodyHtml, footerHtml = "", maxWidth = "540px", onOpen = null }) {
    this.close(); // Close any currently open modal

    const backdrop = document.createElement("div");
    backdrop.id = "kleen-active-modal";
    backdrop.className = "modal-backdrop";

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: ${maxWidth};">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body">
          ${bodyHtml}
        </div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ""}
      </div>
    `;

    document.body.appendChild(backdrop);

    // Trigger animation next tick
    requestAnimationFrame(() => {
      backdrop.classList.add("active");
    });

    const closeBtn = backdrop.querySelector(".modal-close");
    closeBtn.onclick = () => this.close();

    // Close on backdrop click (outside modal-content)
    backdrop.onclick = (e) => {
      if (e.target === backdrop) {
        this.close();
      }
    };

    if (typeof onOpen === "function") {
      onOpen(backdrop);
    }

    return backdrop;
  }

  close() {
    const existing = document.getElementById("kleen-active-modal");
    if (existing) {
      existing.classList.remove("active");
      setTimeout(() => existing.remove(), 250);
    }
  }
}

export const modal = new ModalController();
