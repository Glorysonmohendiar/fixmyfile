const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");
const convertBtn = document.getElementById("convertBtn");
const formatSelect = document.getElementById("formatSelect");
const targetSize = document.getElementById("targetSize");
const status = document.getElementById("status");

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) fileNameDisplay.innerText = file.name;
});

convertBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please upload a file!");

  status.innerText = "Processing... Wait a moment.";
  const format = formatSelect.value;
  const kbLimit = parseInt(targetSize.value);

  if (file.type === "application/pdf") {
    if (format === "pdf") return alert("Already a PDF!");
    await convertPdfToImage(file, format);
  } else {
    if (format === "pdf") {
      await convertImageToPdf(file);
    } else {
      await processImageResize(file, format, kbLimit);
    }
  }
});

async function processImageResize(file, format, targetKb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width = img.width;
      let height = img.height;
      // Scale down if massive
      if (width > 1600) {
        const ratio = 1600 / width;
        width = 1600;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.95;
      let dataUrl = canvas.toDataURL(`image/jpeg`, quality);

      if (targetKb > 0) {
        let currentKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        while (currentKb > targetKb && quality > 0.1) {
          quality -= 0.05;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          currentKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        }
      }

      download(dataUrl, `FixMyFile.${format}`);
      status.innerText = "Success! File Downloaded.";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function convertImageToPdf(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.addImage(e.target.result, "JPEG", 10, 10, 190, 0);
    pdf.save("FixMyFile.pdf");
    status.innerText = "Success! PDF Saved.";
  };
  reader.readAsDataURL(file);
}

async function convertPdfToImage(file, format) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport })
    .promise;
  download(canvas.toDataURL(`image/${format}`), `FixMyFile.${format}`);
  status.innerText = "Success! Page converted.";
}

function download(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}
