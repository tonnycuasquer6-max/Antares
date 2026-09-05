export default function Footer() {
  return (
    <footer className="bg-transparent py-8 md:py-12 text-center text-gray-600 text-[10px] tracking-[0.5em] uppercase border-none mt-auto px-4 w-full z-10 relative">
      &copy; {new Date().getFullYear()} ANTARES. Elegancia Atemporal.
    </footer>
  );
}