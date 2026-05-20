window.addEventListener("load", tour);
var newTour = {
  "ajax_gui.tour.welcomemodal.title": "Welcome to Curate",
  "ajax_gui.tour.welcomemodal.subtitle":
    "Drag'n'drop a photo of you for your profile! This quick tour will guide you through the web interface.",
  "ajax_gui.tour.welcomemodal.start": "Start the tour",
  "ajax_gui.tour.workspaces.1":
    "Workspaces are top-level folders that help you manage your archiving workflow and organise your data. The Personal Files workspace can only be accessed by you and the Quarantine, Appraisal and Archive workspaces are shared with your workgroup. The Package Templates workspace is common to all accounts and is read only.",
  "ajax_gui.tour.workspaces.2":
    "You can upload into the Personal Files and Quarantine workspaces, move files to Appraisal to work on them and deposit packages in the Archive when you are finished.",
  "ajax_gui.tour.globsearch.title": "Global Search",
  "ajax_gui.tour.globsearch.1":
    "Use this search form to find files or folders in any workspace. Only the first 5 results are shown, enter a workspace to get more results, and more search options. Tip: you can use an asterisk as a wild card.",
  "ajax_gui.tour.globsearch.2":
    "When no search is entered, the history of your recently accessed files and folder is displayed instead.",
  "ajax_gui.tour.openworkspace.title": "Open a workspace",
  "ajax_gui.tour.openworkspace":
    "At the first connection, your history is probably empty. Enter the Personal or Quarantine workspaces to start adding files. Tip: files are virus checked when they are uploaded and should be kept in Quarantine for 30 days, after which they are scanned again.",
  "ajax_gui.tour.create-menu.title": "Add files",
  "ajax_gui.tour.create-menu": "Start adding new files or folders to the current workspace.",
  "ajax_gui.tour.display-bar.title": "Display Options",
  "ajax_gui.tour.display-bar":
    "This toolbar allows you to change the display: switch to thumbnails or detail mode depending on your usage, and sort files by name, date, etc...",
  "ajax_gui.tour.infopanel.title": "Info Panel",
  "ajax_gui.tour.infopanel.1":
    "Here, you will find a preview and comprehensive information about your current selection: file information, virus scan status, metadata, etc.",
  "ajax_gui.tour.infopanel.2":
    "You can close this panel by using the info button in the display toolbar",
  "ajax_gui.tour.uwidget.title": "User Settings",
  "ajax_gui.tour.uwidget.addressbook":
    "Directory of all the users accessing to the platform. Create your own users, and constitute teams that can be used to share resources",
  "ajax_gui.tour.uwidget.alerts":
    "Alerts panel will inform you when a user with whom you shared some resources did access it. They can be sent to you directly by email.",
  "ajax_gui.tour.uwidget.menu":
    "Access to other options : manage your profile and password, view all of the public links you have created, send a support message, configure the Archivematica Connector and sign out of the platform.",
  "ajax_gui.tour.uwidget.home": "Go back to the welcome panel with this button",
};
function tour() {
  var msgs = Object.fromEntries(pydioBootstrap.parameters).i18nMessages;
  Object.entries(newTour).forEach(function (msgPair) {
    msgs[msgPair[0]] = msgPair[1];
  });
}
