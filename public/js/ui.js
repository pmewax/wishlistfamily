import { dom } from "./dom.js";

export function showToast(message, type = "info") {
  if (!dom.toastRoot) {
    console.log(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  const icon = document.createElement("div");
  icon.className = "toast__icon";
  icon.textContent =
    type === "success" ? "✓" :
    type === "error" ? "!" :
    type === "warning" ? "⚠" :
    "i";

  const text = document.createElement("div");
  text.className = "toast__text";
  text.textContent = message;

  const close = document.createElement("button");
  close.className = "toast__close";
  close.type = "button";
  close.textContent = "×";

  close.addEventListener("click", () => {
    toast.classList.add("toast--hide");
    setTimeout(() => toast.remove(), 180);
  });

  toast.append(icon, text, close);
  dom.toastRoot.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast--hide");
    setTimeout(() => toast.remove(), 180);
  }, 3200);
}

export function openPinModal(giverName = "дарителя") {
  return new Promise((resolve) => {
    if (!dom.pinModal) {
      resolve("");
      return;
    }

    let isResolved = false;

    function finish(value) {
      if (isResolved) return;

      isResolved = true;

      dom.pinModal.classList.add("hidden");
      dom.pinModalInput.value = "";

      cleanup();
      resolve(value);
    }

    function submit() {
      const pin = dom.pinModalInput.value.trim();
      finish(pin);
    }

    function cancel() {
      finish("");
    }

    function onKeyDown(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    }

    function onlyDigits() {
      dom.pinModalInput.value = dom.pinModalInput.value
        .replace(/\D/g, "")
        .slice(0, 4);
    }

    function cleanup() {
      dom.pinModalSubmit.removeEventListener("click", submit);
      dom.pinModalCancel.removeEventListener("click", cancel);
      dom.pinModalClose.removeEventListener("click", cancel);
      dom.pinModalBackdrop.removeEventListener("click", cancel);
      dom.pinModalInput.removeEventListener("keydown", onKeyDown);
      dom.pinModalInput.removeEventListener("input", onlyDigits);
    }

    dom.pinModalText.textContent = `Введите PIN-код для дарителя: ${giverName}`;
    dom.pinModal.classList.remove("hidden");

    dom.pinModalSubmit.addEventListener("click", submit);
    dom.pinModalCancel.addEventListener("click", cancel);
    dom.pinModalClose.addEventListener("click", cancel);
    dom.pinModalBackdrop.addEventListener("click", cancel);
    dom.pinModalInput.addEventListener("keydown", onKeyDown);
    dom.pinModalInput.addEventListener("input", onlyDigits);

    setTimeout(() => {
      dom.pinModalInput.focus();
    }, 50);
  });
}