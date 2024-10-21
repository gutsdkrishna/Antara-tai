// const proxies = [
//   { ip: "74.208.245.106", port: 8888 },
//   { ip: "159.65.245.255", port: 80 },
//   { ip: "138.68.235.51", port: 80 },
//   { ip: "172.173.132.85", port: 80 },
//   { ip: "71.19.146.218", port: 80 },
//   { ip: "23.94.136.205", port: 80 },
//   { ip: "192.73.244.36", port: 80 },
//   { ip: "198.49.68.80", port: 80 },
// ];

// async function useProxy(proxy) {
//   return new Promise((resolve, reject) => {
//     chrome.runtime.sendMessage({ action: "setProxy", proxy }, (response) => {
//       if (response.status === "Proxy set") {
//         resolve();
//       } else {
//         reject("Failed to set proxy");
//       }
//     });
//   });
// }

// (async () => {
//   for (const proxy of proxies) {
//     try {
//       await useProxy(proxy);
//       const doctors = await scrapeDoctors();
//       if (doctors.length > 0) {
//         chrome.runtime.sendMessage({ action: "downloadData", data: doctors });
//       }
//       break; // Exit the loop after a successful scrape and download
//     } catch (error) {
//       console.error("Error with proxy or scraping:", error);
//     } finally {
//       chrome.runtime.sendMessage({ action: "clearProxy" });
//     }
//   }
// })();

// function parseDoctorInfo(doctorEl) {
//   const doctor = {};

//   const nameEl = doctorEl.querySelector('[data-qa-id="doctor_name"]');
//   doctor.name = nameEl ? nameEl.textContent.trim() : 'XXX';

//   const experienceEl = doctorEl.querySelector('[data-qa-id="doctor_experience"]');
//   doctor.experience = experienceEl ? parseInt(experienceEl.textContent.trim().replace(/\D+/g, ''), 10) : 'XXX';

//   const feesEl = doctorEl.querySelector('[data-qa-id="consultation_fee"]');
//   doctor.fees = feesEl ? parseInt(feesEl.textContent.trim().replace('₹', '').replace(',', ''), 10) : 'XXX';

//   const recommendationEl = doctorEl.querySelector('[data-qa-id="doctor_recommendation"]');
//   doctor.recommendation = recommendationEl ? parseFloat(recommendationEl.textContent.trim().replace('%', '')) : 'XXX';

//   const totalFeedbackEl = doctorEl.querySelector('[data-qa-id="total_feedback"]');
//   doctor.totalFeedback = totalFeedbackEl ? parseInt(totalFeedbackEl.textContent.trim().replace(/\D+/g, ''), 10) : 'XXX';

//   const availabilityEl = doctorEl.querySelector('[data-qa-id="availability_text"]');
//   doctor.availability = availabilityEl ? availabilityEl.textContent.trim() : 'XXX';

//   return doctor;
// }

// function scrollToBottom() {
//   return new Promise((resolve) => {
//     const distance = 100;
//     const delay = 100;
//     const scrollInterval = setInterval(() => {
//       window.scrollBy(0, distance);
//       if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
//         clearInterval(scrollInterval);
//         resolve();
//       }
//     }, delay);
//   });
// }

// async function scrapeDoctors() {
//   await scrollToBottom();

//   const doctorElements = document.querySelectorAll('[data-qa-id="doctor_card"]');
//   const doctors = Array.from(doctorElements).map(parseDoctorInfo);

//   console.log('Scraped doctors:', doctors);

//   return doctors.length > 0 ? doctors : [];
// }




// Parse doctor information from the page
function parseDoctorInfo(doctorEl) {
  const doctor = {};

  const nameEl = doctorEl.querySelector('[data-qa-id="doctor_name"]');
  doctor.name = nameEl ? nameEl.textContent.trim() : 'XXX';

  const experienceEl = doctorEl.querySelector('[data-qa-id="doctor_experience"]');
  doctor.experience = experienceEl ? parseInt(experienceEl.textContent.trim().replace(/\D+/g, ''), 10) : 'XXX';

  const feesEl = doctorEl.querySelector('[data-qa-id="consultation_fee"]');
  doctor.fees = feesEl ? parseInt(feesEl.textContent.trim().replace('₹', '').replace(',', ''), 10) : 'XXX';

  const recommendationEl = doctorEl.querySelector('[data-qa-id="doctor_recommendation"]');
  doctor.recommendation = recommendationEl ? parseFloat(recommendationEl.textContent.trim().replace('%', '')) : 'XXX';

  const totalFeedbackEl = doctorEl.querySelector('[data-qa-id="total_feedback"]');
  doctor.totalFeedback = totalFeedbackEl ? parseInt(totalFeedbackEl.textContent.trim().replace(/\D+/g, ''), 10) : 'XXX';

  const availabilityEl = doctorEl.querySelector('[data-qa-id="availability_text"]');
  doctor.availability = availabilityEl ? availabilityEl.textContent.trim() : 'XXX';

  return doctor;
}

// Function to scroll down the page to load all doctor cards
function scrollToBottom() {
  return new Promise((resolve) => {
    const distance = 100;
    const delay = 100;
    const scrollInterval = setInterval(() => {
      window.scrollBy(0, distance);
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        clearInterval(scrollInterval);
        resolve();
      }
    }, delay);
  });
}

// Scrape doctor data from the page
async function scrapeDoctors() {
  await scrollToBottom();

  const doctorElements = document.querySelectorAll('[data-qa-id="doctor_card"]');
  const doctors = Array.from(doctorElements).map(parseDoctorInfo);

  console.log('Scraped doctors:', doctors);

  return doctors.length > 0 ? doctors : [];
}

// Function to download scraped data as a JSON file
function downloadJSON(data, filename = 'doctors_data.json') {
  const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

// Listen for the message to trigger scraping
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeData") {
    scrapeDoctors().then(doctors => {
      console.log('Scraped doctors:', doctors);
      if (doctors.length > 0) {
        downloadJSON(doctors); // Download scraped data as JSON
      } else {
        console.error('No doctor data found.');
      }
      sendResponse({ status: "Scraping completed" });
    }).catch(error => {
      console.error('Error during scraping:', error);
      sendResponse({ status: "Scraping failed", error });
    });
    return true;
  }
});
