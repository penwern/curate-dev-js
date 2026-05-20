Curate.ui.modals
  .curatePopup(
    { title: "Harvesting OAI Repository", content: "<oai-harvest-status></oai-harvest-status>" },
    {
      afterLoaded: (c) => {
        c.querySelector("oai-harvest-status").processAllNodes(pydio._dataModel._selectedNodes);
      },
    },
  )
  .fire();
