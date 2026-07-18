import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: {
    default: "RedChain Malaysia",
    template: "%s | RedChain Malaysia",
  },
  description:
    "A privacy-aware blood donor management and emergency matching platform for Malaysia.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
