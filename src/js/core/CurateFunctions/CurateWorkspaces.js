const CurateWorkspaces = {
    /**
     * Get the slug of the currently open workspace.
     * @returns {string} slug of the currently open workspace.
     */
    getOpenWorkspace : function() {
        if (pydio._dataModel._rootNode._label.toLowerCase() == pydio.user.id.toLowerCase()) {
            return ("personal-files");
        }
        return (pydio._dataModel._rootNode._label.toLowerCase().replace(/^\d+\.\s*/, '').replace(" ", "-"));
    }
};
export default CurateWorkspaces