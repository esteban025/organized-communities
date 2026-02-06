import { useEffect, useRef, useState } from "react";

export const NavbarPage = () => {
  const listNav = [
    {
      name: "parroquias",
      href: "/",
    }, {
      name: "convivencias",
      href: "/retreats"
    },
    {
      name: "Hospedajes",
      href: "/hospedajes"
    }
  ]

  const [activeIndex, setActiveIndex] = useState(0);
  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    translateX: 0,
  });

  // Detectar ruta actual para marcar activo al cargar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname;
    const index = listNav.findIndex((item) => item.href === currentPath);
    // const widthIndicator 
    if (index >= 0) setActiveIndex(index);
  }, []);

  // Calcular ancho y posición del indicador según el li activo
  useEffect(() => {
    const nav = navRef.current;
    const activeItem = itemRefs.current[activeIndex];
    if (!nav || !activeItem) return;

    const navRect = nav.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    setIndicatorStyle({
      width: itemRect.width,
      translateX: itemRect.left - navRect.left,
    });
  }, [activeIndex, listNav.length]);

  return (
    <nav
      ref={navRef}
      className="flex justify-center relative w-max items-center mx-auto no-print"
    >
      <ul className="navbar-page flex items-center bg-neutral-100 rounded-full">
        {listNav.map((navItem, index) => (
          <li
            key={navItem.name}
            className="capitalize z-10"
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
          >
            <a
              href={navItem.href}
              className="nav-link px-5 py-2 block"
              onClick={() => setActiveIndex(index)}
            >
              {navItem.name}
            </a>
          </li>
        ))}
      </ul>

      <div
        className="absolute bg-white rounded-full border border-neutral-300 inset-0 h-full shadow-md transition-all duration-300 pointer-events-none civil-indicator-navbar"
        style={{
          width: indicatorStyle.width,
          transform: `translateX(${indicatorStyle.translateX}px)`,
        }}
      ></div>
    </nav>
  )
}