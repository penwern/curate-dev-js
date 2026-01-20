import { create, enforce, test } from "vest";

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  return String(value).trim().length > 0;
}

const validatedFields = new Set([
  "DigitalObjectTitle",
  "DateLabel",
  "DateType",
  "DateBegin",
  "DateEnd",
  "DateExpression",
  "ExtentNumber",
  "ExtentType",
  "ExtentPortion"
]);

const watchFields = new Set([
  ...validatedFields,
  "DigitalObjectLevel",
  "DigitalObjectType",
  "DigitalObjectComponentId",
  "Publish",
  "ExtentContainerSummary",
  "ExtentPhysicalDetails",
  "ExtentDimensions"
]);

const suite = create((data = {}) => {
  const hasAnyDateGroupField =
    isFilled(data.DateLabel) ||
    isFilled(data.DateType) ||
    isFilled(data.DateBegin) ||
    isFilled(data.DateEnd) ||
    isFilled(data.DateExpression);

  const hasAnyExtentGroupField =
    isFilled(data.ExtentNumber) ||
    isFilled(data.ExtentType) ||
    isFilled(data.ExtentPortion) ||
    isFilled(data.ExtentContainerSummary) ||
    isFilled(data.ExtentPhysicalDetails) ||
    isFilled(data.ExtentDimensions);

  test("DigitalObjectTitle", "Title is required", () => {
    enforce(data.DigitalObjectTitle).isNotEmpty();
  });

  test("DateLabel", "Date label is required when date fields are used", () => {
    if (!hasAnyDateGroupField) return;
    enforce(data.DateLabel).isNotEmpty();
  });

  test("DateType", "Date type is required when date fields are used", () => {
    if (!hasAnyDateGroupField) return;
    enforce(data.DateType).isNotEmpty();
  });

  test("DateBegin", "At least one of begin, end, or expression is required", () => {
    if (!hasAnyDateGroupField) return;
    enforce(
      isFilled(data.DateBegin) ||
        isFilled(data.DateEnd) ||
        isFilled(data.DateExpression)
    ).isTruthy();
  });

  test("ExtentNumber", "Extent number is required when extent is specified", () => {
    if (!hasAnyExtentGroupField) return;
    enforce(data.ExtentNumber).isNotEmpty();
  });

  test("ExtentType", "Extent type is required when extent is specified", () => {
    if (!hasAnyExtentGroupField) return;
    enforce(data.ExtentType).isNotEmpty();
  });

  test("ExtentPortion", "Extent portion is required when extent is specified", () => {
    if (!hasAnyExtentGroupField) return;
    enforce(data.ExtentPortion).isNotEmpty();
  });
});

const archivesspaceValidator = {
  id: "ArchivesSpace",
  watchFields,
  validatedFields,
  shouldValidate: ({ touchedFields, values } = {}) => {
    if (!(touchedFields instanceof Set)) return false;
    const hasAnyTouched = Array.from(watchFields).some((fieldName) =>
      touchedFields.has(fieldName)
    );
    if (hasAnyTouched) return true;

    return Array.from(validatedFields).some((fieldName) => isFilled(values?.[fieldName]));
  },
  validate: (data) => suite(data),
  getFirstError: (fieldName, result) => {
    if (!result?.hasErrors?.(fieldName)) return null;
    const errors = result.getErrors?.(fieldName) ?? [];
    return errors[0] ?? null;
  },
};

export default archivesspaceValidator;
