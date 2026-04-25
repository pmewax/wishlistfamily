export class FancyDropdown {
  constructor({ mount, placeholder = "Выбрать", options = [], onChange }) {
    this.mount = mount;
    this.placeholder = placeholder;
    this.options = options;
    this.onChange = onChange;
    this.value = "";
    this.label = "";

    this.render();
    this.bindOutside();
  }

  render() {
    this.mount.innerHTML = `
      <div class="fancy-dropdown">
        <button type="button" class="fancy-dropdown__trigger">
          <span class="fancy-dropdown__value">${this.placeholder}</span>
          <span class="fancy-dropdown__arrow">⌄</span>
        </button>
        <div class="fancy-dropdown__menu"></div>
      </div>
    `;

    this.root = this.mount.querySelector(".fancy-dropdown");
    this.trigger = this.mount.querySelector(".fancy-dropdown__trigger");
    this.valueNode = this.mount.querySelector(".fancy-dropdown__value");
    this.menu = this.mount.querySelector(".fancy-dropdown__menu");

    this.renderOptions();

    this.trigger.addEventListener("click", () => {
      this.root.classList.toggle("open");
    });
  }

  renderOptions() {
    this.menu.innerHTML = "";

    this.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fancy-dropdown__option";
      btn.textContent = option.label;

      btn.addEventListener("click", () => {
        this.setValue(option.value, option.label);
        this.root.classList.remove("open");
        this.onChange?.(option.value, option);
      });

      this.menu.appendChild(btn);
    });
  }

  setOptions(options) {
    this.options = options;
    this.renderOptions();
  }

  setValue(value, label) {
    this.value = value;
    this.label = label;
    this.valueNode.textContent = label || this.placeholder;
  }

  getValue() {
    return this.value;
  }

  bindOutside() {
    document.addEventListener("click", (event) => {
      if (!this.mount.contains(event.target)) {
        this.root?.classList.remove("open");
      }
    });
  }
}