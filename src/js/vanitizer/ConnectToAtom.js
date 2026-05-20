const p = Curate.ui.modals.curatePopup(
  { title: "Connect to Your AtoM Instance" },
  {
    afterLoaded: (c) => {
      const t = document.createElement("connect-to-atom");
      c.querySelector(".config-main-options-container").appendChild(t);
    },
  },
);
p.fire();
