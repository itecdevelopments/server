function hideSelect1(selectedElement) {
  const machineType = selectedElement.value;
  const div = document.getElementById("div1");
  const inputs = div.querySelectorAll("input");

  if (machineType === "CIJ") {
    // Show the CIJ-specific fields and add 'required' to each input
    div.style.display = "block";
    inputs.forEach((input) => {
      input.setAttribute("required", "true");
    });
  } else {
    // Hide the CIJ-specific fields and remove 'required' from each input
    div.style.display = "none";
    inputs.forEach((input) => {
      input.removeAttribute("required");
    });
  }
}
function hideSelect2(selectedElement) {
  const machineType = selectedElement.value;
  const div = document.getElementById("div2");
  const inputs = div.querySelectorAll("input");
  if (machineType == "NewInstallation") {
    div.style.display = "flex";
    inputs.forEach((input) => {
      input.setAttribute("required", "true");
    });
  } else {
    div.style.display = "none";
    input.removeAttribute("required");
  }
}
