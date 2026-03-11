import Header from "../components/Header";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { ArrowUp } from "lucide-react";

export default function MainLayout() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main>
        <Outlet />
      </main>

      <Footer />

      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition hover:bg-sky-600"
        aria-label="Quay về đầu trang"
        title="Quay về đầu trang"
      >
        <ArrowUp size={22} />
      </button>
    </div>
  );
}