// document.getElementById('scrapeBtn').addEventListener('click', () => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     chrome.scripting.executeScript({
//       target: { tabId: tabs[0].id },
//       function: () => {
//         chrome.runtime.sendMessage({ action: "scrapeData" }, (response) => {
//           document.getElementById('status').innerText = "Scraping in progress...";
//           if (response && response.status === "Scraping completed") {
//             document.getElementById('status').innerText = "Scraping and download completed!";
//           } else {
//             document.getElementById('status').innerText = "Error: " + (response.error || "Unknown error");
//           }
//         });
//       }
//     });
//   });
// });


document.getElementById('scrapeBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "scrapeData" }, (response) => {
      console.log(response.status);
    });
  });
});
