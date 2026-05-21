class ContextualHelp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    console.log("connected help");
    this.updateContent();
  }

  render() {
    this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            background: #f8f9fa;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 16px;
            font-family: Arial, sans-serif;
            max-width: 300px;
          }
          .help-content {
            color: #333;
            font-size: 14px;
            line-height: 1.5;
          }
        </style>
        <div class="help-content"></div>
      `;
  }

  updateContent() {
    const context = Curate.contextualHelp.context;
    const helpContent = this.shadowRoot.querySelector(".help-content");
    helpContent.textContent = this.getHelpContent(context);
  }

  getHelpContent(context) {
    const { page, selection } = context;
    const hasSelection = selection && selection.length > 0;
    // Series of switch cases to determine the appropriate help content
    switch (true) {
      // Case 1: Has selection
      case hasSelection:
        return `You've selected ${selection.length} item(s). This area allows you to perform actions on your selection.`;

      // Default case when no specific condition is met
      default:
        return `You're on the ${page} page. Right-click on elements to see context-specific help.`;
    }
  }
}

customElements.define("contextual-help", ContextualHelp);
