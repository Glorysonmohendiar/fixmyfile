const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");
const convertBtn = document.getElementById("convertBtn");
const formatSelect = document.getElementById("formatSelect");
const targetSize = document.getElementById("targetSize");
const status = document.getElementById("status");

fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) fileNameDisplay.innerText = e.target.files[0].name;
});

convertBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please upload a file!");
  status.innerText = "Processing... Please wait.";
  const tool = formatSelect.value;
  const kbLimit = parseInt(targetSize.value);

  try {
    if (tool === "wordToPdf") await convertWordToPdf(file);
    else if (tool === "excelToPdf") await convertExcelToPdf(file);
    else if (tool === "pdfSplit") await splitPdf(file);
    else if (tool === "pdf") await convertImageToPdf(file, kbLimit);
    else await processImageResize(file, tool, kbLimit);
  } catch (err) {
    status.innerText = "Error: " + err.message;
  }
});

async function convertExcelToPdf(file) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data);
  const htmlString = XLSX.utils.sheet_to_html(wb.Sheets[wb.SheetNames[0]]);
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = DOMPurify.sanitize(htmlString);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "pt", "a4");
  await doc.html(tempDiv, {
    callback: (pdf) => pdf.save("Excel_to_PDF.pdf"),
    x: 10,
    y: 10,
    width: 550,
    windowWidth: 800,
  });
  status.innerText = "Success!";
}

async function splitPdf(file) {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(bytes);
  const count = pdfDoc.getPageCount();
  for (let i = 0; i < count; i++) {
    const newPdf = await PDFLib.PDFDocument.create();
    const [page] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(page);
    const newBytes = await newPdf.save();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([newBytes], { type: "application/pdf" })
    );
    link.download = `Page_${i + 1}.pdf`;
    link.click();
  }
  status.innerText = "Success!";
}

async function processImageResize(file, format, targetKb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      let q = 0.95;
      let mime = `image/${format === "jpeg" ? "jpeg" : format}`;
      let dataUrl = canvas.toDataURL(mime, q);
      if (targetKb > 0) {
        while (
          Math.round((dataUrl.length * 3) / 4 / 1024) > targetKb &&
          q > 0.1
        ) {
          q -= 0.05;
          dataUrl = canvas.toDataURL(mime, q);
        }
      }
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `FixedFile.${format}`;
      link.click();
      status.innerText = "Success!";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function convertImageToPdf(file, targetKb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      let q = 0.8;
      let dataUrl = canvas.toDataURL("image/jpeg", q);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      pdf.addImage(dataUrl, "JPEG", 10, 10, 190, 0);
      pdf.save("FixMyFile.pdf");
      status.innerText = "Success!";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
