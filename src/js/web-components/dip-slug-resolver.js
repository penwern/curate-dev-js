class DipSlugResolver extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.nodes = [];
    this.render();
  }

  setNodes(nodes) {
    this.nodes = nodes;
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
        <style>
          .container {
            border: 1px solid #ccc;
            padding: 16px;
            border-radius: 8px;
            max-width: 600px;
            width:30em;
            margin: 0 auto;
          }
          .header {
            font-size: 18px;
            margin-bottom: 8px;
            color: #333;
          }
          .message {
            margin-bottom: 16px;
            color: #555;
          }
          .file-list {
            border: 1px solid #ddd;
            padding: 8px;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
          }
          .file-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .file-item:last-child {
            border-bottom: none;
          }
          .file-name {
            flex-grow: 1;
          }
          .link-button {
            padding: 4px 8px;
            background: #007BFF;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .link-button:hover {
            background: #0056b3;
          }
          .continue-btn {
            display: block;
            width: 100%;
            padding: 12px;
            font-size: 18px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 16px;
            text-align: center;
          }
          .continue-btn:hover {
            background-color: #45a049;
          }
        </style>
        <div class="container">
          <div class="message">
            The selected preservation configuration has DIP generation enabled. The following items do not have a linked AtoM description, which will cause DIP generation to fail.
          </div>
          <div class="file-list">
            ${this.nodes
              .map(
                (node) => `
              <div class="file-item">
                <span class="file-name">${node._path}</span>
                <button class="link-button" data-path="${node._path}">Add Description</button>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `;

    this.shadowRoot.querySelectorAll(".link-button").forEach((button) => {
      button.addEventListener("click", () => {
        console.log(`Add description for ${button.getAttribute("data-path")}`);
        Curate.ui.modals
          .curatePopup(
            { title: "Connect Selected Node to an AtoM Description" },
            {
              afterLoaded: (c) => {
                const t = document.createElement("atom-search-interface");
                t.setNode(
                  this.nodes.find((node) => node._path == button.getAttribute("data-path")),
                );
                c.querySelector(".config-main-options-container").appendChild(t);
                t.addEventListener("description-linked", () => {
                  console.log("description linked");
                  c.remove();
                  const linked = document.createElement("div");
                  linked.innerHTML =
                    "<div class='linked-item'><span class='linked-item-name'>🔗</span></div>";
                  button.parentElement.querySelector(".file-name").after(linked);
                  button.remove();
                });
              },
              afterClosed: () => {},
            },
          )
          .fire();
      });
    });
  }
}

customElements.define("dip-slug-resolver", DipSlugResolver);
