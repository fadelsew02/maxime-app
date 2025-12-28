import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';

export async function addBordereauPage(
  pdfUrl: string, 
  signature: string,
  data?: {
    numero?: string;
    date?: string;
    essaisRealises?: string;
    demandePar?: string;
    compteDe?: string;
    dateEssais?: string;
    lieuEssais?: string;
    natureEssais?: string;
    adresseRecepteur?: string;
    observations?: string;
    directeurNom?: string;
  }
): Promise<string> {
  console.log('=== DEBUT addBordereauPage ===');
  console.log('PDF URL:', pdfUrl);
  console.log('Signature:', signature ? 'Présente' : 'Absente');
  console.log('Data:', data);
  
  // Valeurs par défaut
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }).toUpperCase();
  
  const bordereau = {
    numero: data?.numero || `${Math.floor(Math.random() * 10000)} / CNER-TP/DG`,
    date: data?.date || dateStr,
    essaisRealises: data?.essaisRealises || 'Échantillon de sol',
    demandePar: data?.demandePar || 'Client',
    compteDe: data?.compteDe || 'Client',
    dateEssais: data?.dateEssais || now.toLocaleDateString('fr-FR'),
    lieuEssais: data?.lieuEssais || 'Laboratoire Essais Spéciaux',
    natureEssais: data?.natureEssais || 'Essais géotechniques',
    adresseRecepteur: data?.adresseRecepteur || 'Client',
    observations: data?.observations || 'R.A.S.',
    directeurNom: data?.directeurNom || 'Kpadon C. MOUSSOUGAN'
  };
  
  // VOTRE HTML EXACT
  const html = `<!DOCTYPE html>
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
    N° : ${bordereau.numero}<br>
    <br>
    Y. le ${bordereau.date}
</div>

<div class="title">
    Bordereau de transmission
</div>

<table>
    <tr>
        <td class="label">ESSAIS RÉALISÉS SUR :</td>
        <td>${bordereau.essaisRealises}</td>
    </tr>
    <tr>
        <td class="label">À la demande de :</td>
        <td>${bordereau.demandePar}</td>
    </tr>
    <tr>
        <td class="label">Pour le compte de :</td>
        <td>${bordereau.compteDe}</td>
    </tr>
    <tr>
        <td class="label">DATE ET LIEU DES ESSAIS :</td>
        <td>${bordereau.dateEssais} au ${bordereau.lieuEssais}</td>
    </tr>
    <tr>
        <td class="label">NATURE DES ESSAIS :</td>
        <td>${bordereau.natureEssais}</td>
    </tr>
    <tr>
        <td class="label">ADRESSE DU RÉCEPTEUR DU RAPPORT DES ESSAIS :</td>
        <td>${bordereau.adresseRecepteur}</td>
    </tr>
    <tr>
        <td class="label">OBSERVATIONS :</td>
        <td>${bordereau.observations}</td>
    </tr>
</table>

<div class="signature">
    Le Directeur Général<br><br>
    <img src="${signature}" style="max-width: 300px; margin: 10px auto; display: block;" /><br>
    <strong>${bordereau.directeurNom}</strong>
</div>

<div class="footer">
    Le présent rapport compte 1 page.
</div>

</div>

</body>
</html>`;

  // Créer div temporaire
  const div = document.createElement('div');
  div.innerHTML = html;
  div.style.position = 'absolute';
  div.style.left = '-9999px';
  div.style.width = '210mm';
  document.body.appendChild(div);

  // Convertir en image avec une hauteur suffisante
  const canvas = await html2canvas(div, { 
    scale: 2, 
    backgroundColor: '#ffffff',
    width: 794,
    height: 1400,  // Augmenté pour capturer tout le contenu
    windowWidth: 794,
    windowHeight: 1400
  });
  document.body.removeChild(div);

  const imgData = canvas.toDataURL('image/png');

  // Charger PDF original
  console.log('Chargement du PDF original...');
  const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
  console.log('PDF chargé, taille:', pdfBytes.byteLength, 'bytes');
  const originalPdf = await PDFDocument.load(pdfBytes);
  const pageCount = originalPdf.getPageCount();
  console.log('PDF original a', pageCount, 'pages');

  // Créer nouveau PDF
  console.log('Création du nouveau PDF...');
  const newPdf = await PDFDocument.create();

  // Page 1: Bordereau
  console.log('Ajout de la page bordereau...');
  const page1 = newPdf.addPage([595.28, 841.89]);  // A4 en points
  const img = await newPdf.embedPng(imgData);
  
  // Calculer les dimensions pour remplir la page en gardant le ratio
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const imgAspectRatio = img.width / img.height;
  const pageAspectRatio = pageWidth / pageHeight;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (imgAspectRatio > pageAspectRatio) {
    // Image plus large que la page
    drawWidth = pageWidth * 0.9;  // 90% de la largeur
    drawHeight = drawWidth / imgAspectRatio;
    drawX = (pageWidth - drawWidth) / 2;
    drawY = pageHeight - drawHeight - 20;  // 20 points de marge en haut
  } else {
    // Image plus haute que la page
    drawHeight = pageHeight * 0.95;  // 95% de la hauteur
    drawWidth = drawHeight * imgAspectRatio;
    drawX = (pageWidth - drawWidth) / 2;
    drawY = pageHeight - drawHeight - 10;  // 10 points de marge en haut
  }
  
  page1.drawImage(img, { 
    x: drawX, 
    y: drawY, 
    width: drawWidth, 
    height: drawHeight 
  });
  console.log('Page bordereau ajoutée');

  // Pages suivantes: TOUTES les pages du PDF original
  console.log('Copie des', pageCount, 'pages du PDF original...');
  for (let i = 0; i < pageCount; i++) {
    const [copiedPage] = await newPdf.copyPages(originalPdf, [i]);
    newPdf.addPage(copiedPage);
    console.log('Page', i + 1, '/', pageCount, 'copiée');
  }
  
  console.log('Total pages dans le nouveau PDF:', newPdf.getPageCount());

  // Retourner URL
  console.log('Génération du blob final...');
  const bytes = await newPdf.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  console.log('=== FIN addBordereauPage ===');
  console.log('URL générée:', url);
  return url;
}
