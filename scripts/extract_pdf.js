const fs = require('fs');
const path = require('path');
const pdfPath = path.resolve(process.cwd(), 'Group1_Dzonglish_NMT_Final Report.pdf');
const outPath = path.resolve(process.cwd(), 'tmp', 'report.txt');

async function extract() {
  if (!fs.existsSync(pdfPath)) { console.error('PDF not found at', pdfPath); process.exit(2); }
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  let full = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(x => x.str).join(' ');
    full += pageText + '\n\n';
  }
  if (!fs.existsSync(path.dirname(outPath))) fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, full, 'utf8');
  console.log('WROTE', outPath);
}

extract().catch(err => { console.error(err); process.exit(1); });
