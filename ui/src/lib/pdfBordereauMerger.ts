import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';

/**
 * Génère le HTML du bordereau EXACTEMENT comme fourni
 */
export function generateBordereauHTML(
  signature: string,
  numero: string,
  date: string,
  essaisRealises: string,
  demandePar: string,
  compteDe: string,
  dateEssais: string,
  lieuEssais: string,
  natureEssais: string,
  adresseRecepteur: string,
  observations: string
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bordereau de transmission – SNERTP</title>
<style>
body {
font-family: "Times New Roman", serif;
background: #fff;
color: #000;
}
.container {
width: 800px;
margin: auto;
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
    N° : ${numero}<br>
    <br>
    Y. le ${date}
</div>

<div class="title">
    Bordereau de transmission
</div>

<table>
    <tr>
        <td class="label">ESSAIS RÉALISÉS SUR :</td>
        <td>${essaisRealises}</td>
    </tr>
    <tr>
        <td class="label">À la demande de :</td>
        <td>${demandePar}</td>
    </tr>
    <tr>
        <td class="label">Pour le compte de :</td>
        <td>${compteDe}</td>
    </tr>
    <tr>
        <td class="label">DATE ET LIEU DES ESSAIS :</td>
        <td>${dateEssais} au ${lieuEssais}</td>
    </tr>
    <tr>
        <td class="label">NATURE DES ESSAIS :</td>
        <td>${natureEssais}</td>
    </tr>
    <tr>
        <td class="label">ADRESSE DU RÉCEPTEUR DU RAPPORT DES ESSAIS :</td>
        <td>${adresseRecepteur}</td>
    </tr>
    <tr>
        <td class="label">OBSERVATIONS :</td>
        <td>${observations}</td>
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
}

/**
 * Convertit HTML en PDF et fusionne avec le PDF existant
 */
export async function mergeBordereauWithPDF(
  bordereauHTML: string,
  originalPdfUrl: string
): Promise<Blob> {
  // Créer un iframe caché pour convertir HTML en PDF
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.left = '-9999px';
  document.body.appendChild(iframe);

  // Charger le HTML dans l'iframe
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) throw new Error('Impossible de créer le document');
  
  iframeDoc.open();
  iframeDoc.write(bordereauHTML);
  iframeDoc.close();

  // Attendre que le contenu soit chargé
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Convertir en PDF via print
  const canvas = await html2canvas(iframeDoc.body);
  const imgData = canvas.toDataURL('image/png');

  // Charger le PDF original
  const originalPdfBytes = await fetch(originalPdfUrl).then(res => res.arrayBuffer());
  const originalPdf = await PDFDocument.load(originalPdfBytes);

  // Créer un nouveau PDF avec le bordereau
  const mergedPdf = await PDFDocument.create();
  
  // Ajouter la page du bordereau
  const bordereauPage = mergedPdf.addPage([595.28, 841.89]); // A4
  const pngImage = await mergedPdf.embedPng(imgData);
  bordereauPage.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
  });

  // Copier toutes les pages du PDF original
  const pages = await mergedPdf.copyPages(originalPdf, originalPdf.getPageIndices());
  pages.forEach(page => mergedPdf.addPage(page));

  // Nettoyer
  document.body.removeChild(iframe);

  // Retourner le PDF fusionné
  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Prévisualise le document complet (bordereau + PDF original)
 */
export async function previewMergedDocument(
  bordereauHTML: string,
  originalPdfUrl: string
): Promise<string> {
  const mergedBlob = await mergeBordereauWithPDF(bordereauHTML, originalPdfUrl);
  return URL.createObjectURL(mergedBlob);
}
