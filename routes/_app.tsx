import { type PageProps } from "$fresh/server.ts";
export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AiyoungGuru - Nền tảng học tập thông minh</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
        <style>
          {`
          body {
            font-family: 'Be Vietnam Pro', sans-serif;
            font-size: 14px;
          }
          @media (max-width: 768px) {
            body {
              font-size: 12px;
            }
          }
          .shadow-neo {
            box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
          }
          .shadow-neo-sm {
            box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
          }
          .shadow-neo-lg {
            box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
          }
        `}
        </style>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
