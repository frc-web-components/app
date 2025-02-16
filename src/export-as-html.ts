import { getDashboard, getLayout } from "@frc-web-components/app";

function getHtmlFromTemplate(title: string, layout: string) {
  return `
  <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FRC Web Components</title>


  <script type="module" crossorigin src="./index.js"></script>
  <script type="module">
    window.fwcApp.setAssetBasePath('/public');
    window.fwcApp.setWebMode(true);
    setTimeout(() => {
      window.fwcApp.getDashboard().setTitle("${title}");
    }, 500);
    window.fwcApp.setLayout(${layout});
  </script>
  <link rel="stylesheet" crossorigin href="./index.css">
</head>

<body>
  <div id="root"></div>
  <dashboard-plugins-dialog></dashboard-plugins-dialog>
</body>

</html>
  
  `;
}

export function exportAsHtml() {
  const title = getDashboard().getTitle().replace(/\.json$/, '');
  const layout = JSON.stringify(getLayout());
  return getHtmlFromTemplate(title, layout);
}
