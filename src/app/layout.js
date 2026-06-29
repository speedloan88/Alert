import './globals.css';

export const metadata = {
  title: 'Internal Alerts',
  description: 'Internal Customer Alert System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
