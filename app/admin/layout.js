import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Admin Portal | The Nawab Sahab",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#18181f",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "12px",
            fontWeight: "600",
            borderRadius: "12px",
          },
          success: {
            iconTheme: {
              primary: "#f59e0b",
              secondary: "#000000",
            },
          },
        }}
      />
      {children}
    </div>
  );
}
