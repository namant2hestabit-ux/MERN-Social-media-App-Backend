const splitName = (fullName) => {
  const nameParts = fullName.trim().split(" ");

  if (nameParts.length === 0) {
    return { firstName: "", lastName: "" };
  } else if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: "" };
  } else {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    return { firstName, lastName };
  }
};

module.exports = { splitName };
