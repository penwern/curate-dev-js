import MetadataValidationManager from "./MetadataValidationManager.js";
import archivesspaceValidator from "./schemas/archivesspace.js";

const manager = new MetadataValidationManager();
manager.registerValidator(archivesspaceValidator);
manager.attach();

if (typeof window !== "undefined") {
  window.CurateValidation = manager;
  if (window.Curate && typeof window.Curate === "object") {
    window.Curate.validation = manager;
  }
}

export default manager;
