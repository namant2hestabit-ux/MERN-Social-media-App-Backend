/**
 * @file splitName.test.js
 * @description Unit tests for splitName utility
 */

const { splitName } = require("../../../utils/helper");

describe("splitName Utility", () => {
  it("should return empty first and last names for empty string", () => {
    const result = splitName("");
    expect(result).toEqual({ firstName: "", lastName: "" });
  });

  it("should return empty lastName if only one word", () => {
    const result = splitName("John");
    expect(result).toEqual({ firstName: "John", lastName: "" });
  });

  it("should return first and last names for two words", () => {
    const result = splitName("John Doe");
    expect(result).toEqual({ firstName: "John", lastName: "Doe" });
  });

  it("should trim spaces before splitting", () => {
    const result = splitName("   Alice Smith   ");
    expect(result).toEqual({ firstName: "Alice", lastName: "Smith" });
  });

  it("should take first and last parts even if middle names exist", () => {
    const result = splitName("Mary Ann Johnson");
    expect(result).toEqual({ firstName: "Mary", lastName: "Johnson" });
  });

  it("should handle multiple spaces between words", () => {
    const result = splitName("John     Doe");
    expect(result).toEqual({ firstName: "John", lastName: "Doe" });
  });
});
