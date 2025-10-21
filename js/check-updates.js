// Script manual para verificar updates
async function checkCDNUpdates() {
  const response = await fetch("https://api.cdnjs.com/libraries/bootstrap");
  const data = await response.json();
  console.log("Última versión Bootstrap:", data.version);
}
