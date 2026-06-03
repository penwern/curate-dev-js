const CurateWorkspaces = {
  /**
   * Get the slug of the currently open workspace.
   * @returns {string} slug of the currently open workspace.
   */
  getOpenWorkspace: function () {
    const wsLabel = pydio._dataModel._rootNode._label
        .toLowerCase()
        .trimStart()
        .replaceAll(" ", "-")

    if (wsLabel == pydio.user.id.toLowerCase()) {
      return "personal-files";
    }
    return wsLabel;
  },
};
export default CurateWorkspaces;
