import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';

export async function addBordereauToPDF(
  pdfUrl: string,
  signature: string,
  data: {
    numero: string;
    date: string;
    essaisRealises: string;
    demandePar: string;
    compteDe: string;
    dateEssais: string;
    lieuEssais: string;
    natureEssais: string;
    adresseRecepteur: string;
    observations: string;
  }
): Promise<Blob> {
  // Créer le HTML du bordereau
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
body {
font-family: "Times New Roman", serif;
background: #fff;
color: #000;
margin: 0;
padding: 20px;
width: 210mm;
height: 297mm;
}
.container {
width: 100%;
border: 1px solid #000;
padding: 20px;
}
.header {
display: flex;
justify-content: space-between;
align-items: center;
}
.logo {
font-weight: bold;
font-size: 24px;
}
.org {
text-align: center;
font-size: 14px;
font-weight: bold;
}
.meta {
margin-top: 10px;
font-size: 12px;
}
.title {
text-align: center;
font-weight: bold;
margin: 20px 0;
text-transform: uppercase;
}
table {
width: 100%;
border-collapse: collapse;
font-size: 14px;
}
table, td {
border: 1px solid #000;
}
td {
padding: 8px;
vertical-align: top;
}
.label {
width: 30%;
font-weight: bold;
}
.signature {
margin-top: 40px;
text-align: center;
font-size: 14px;
}
.signature-img {
max-width: 300px;
margin: 10px auto;
display: block;
}
.footer {
margin-top: 20px;
font-size: 12px;
text-align: left;
}
</style>
</head>
<body>
<div class="container">
<div class="header">
    <div class="logo">SNERTP</div>
    <div class="org">
        CENTRE NATIONAL D'ESSAIS ET DE<br>
        RECHERCHES DES TRAVAUX PUBLICS
    </div>
</div>
<div class="meta">
    N° : ${data.numero}<br><br>
    Y. le ${data.date}
</div>
<div class="title">
    Bordereau de transmission
</div>
<table>
    <tr>
        <td class="label">ESSAIS RÉALISÉS SUR :</td>
        <td>${data.essaisRealises}</td>
    </tr>
    <tr>
        <td class="label">À la demande de :</td>
        <td>${data.demandePar}</td>
    </tr>
    <tr>
        <td class="label">Pour le compte de :</td>
        <td>${data.compteDe}</td>
    </tr>
    <tr>
        <td class="label">DATE ET LIEU DES ESSAIS :</td>
        <td>${data.dateEssais} au ${data.lieuEssais}</td>
    </tr>
    <tr>
        <td class="label">NATURE DES ESSAIS :</td>
        <td>${data.natureEssais}</td>
    </tr>
    <tr>
        <td class="label">ADRESSE DU RÉCEPTEUR DU RAPPORT DES ESSAIS :</td>
        <td>${data.adresseRecepteur}</td>
    </tr>
    <tr>
        <td class="label">OBSERVATIONS :</td>
        <td>${data.observations}</td>
    </tr>
</table>
<div class="signature">
    Le Directeur Général<br><br>
    <img src="${signature}" alt="Signature" class="signature-img" /><br>
    <strong>Kpadon C. MOUSSOUGAN</strong>
</div>
<div class="footer">
    Le présent rapport compte 1 page.
</div>
</div>
</body>
</html>`;

  // Créer un div temporaire
  const div = document.createElement('div');
  div.innerHTML = html;
  div.style.position = 'absolute';
  div.style.left = '-9999px';
  div.style.width = '210mm';
  div.style.height = '297mm';
  document.body.appendChild(div);

  // Convertir en canvas
  const canvas = await html2canvas(div.firstElementChild as HTMLElement, {
    scale: 2,
    width: 794,
    height: 1123,
    backgroundColor: '#ffffff'
  });

  document.body.removeChild(div);

  // Convertir canvas en PNG
  const imgData = canvas.toDataURL('image/png');

  // Charger le PDF original
  const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
  const originalPdf = await PDFDocument.load(pdfBytes);

  // Créer nouveau PDF
  const newPdf = await PDFDocument.create();

  // Ajouter page du bordereau
  const bordereauPage = newPdf.addPage([595.28, 841.89]);
  const pngImage = await newPdf.embedPng(imgData);
  const pngDims = pngImage.scale(0.75);
  
  bordereauPage.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
  });

  // Copier toutes les pages du PDF original
  const pages = await newPdf.copyPages(originalPdf, originalPdf.getPageIndices());
  pages.forEach(page => newPdf.addPage(page));

  // Sauvegarder
  const mergedPdfBytes = await newPdf.save();
  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
}
