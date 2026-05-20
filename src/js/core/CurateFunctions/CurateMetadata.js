import getMetadataHierarchies from "../MetadataHierarchies.js";
const CurateMetadata = {
  schemas: {
    /**
     * Gets globally supported descriptive schemas
     * @returns {object} Object containing objects that describe the fields and structure of a schema
     * @param {string} schema Specific schema to get
     *
     */
    getSchemas: function (schema) {
      return getMetadataHierarchies(schema);
    },
  },
};
export default CurateMetadata;
