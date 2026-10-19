# PDF-Testdateien

Bytegleiche Testabhängigkeiten aus `lausiklauskn-png/Workflow-PDF`, Commit
`7227c543d4a536cf8f3354a56fbba7574645703e`:

- `vendor/pdfjs/pdf.min.js` und `pdf.worker.min.js`: PDF.js 3.11.174, Apache-2.0.
- `vendor/pdf-lib.min.js`: pdf-lib 1.17.1, MIT.

Nur für bestehende Regressionstests (`WFPDF_KLON=tests/fixtures/Workflow-PDF`).
Diese Dateien werden nicht in die Android-App gepackt. PDF.js 3.x ist historisch;
die Anwendung nutzt `isEvalSupported: false`. Kein Nachweis, dass dieser alte
PDF-Parser für beliebige neue Produktionsfunktionen geeignet ist.
