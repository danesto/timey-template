/**
 * Renders the OpenAPI document with Scalar. Served as a route rather than a
 * page so it stays out of the application's layout and styling.
 */
const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Timey API</title>
  </head>
  <body>
    <script id="api-reference" data-url="/api/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

export async function GET() {
  return new Response(page, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
