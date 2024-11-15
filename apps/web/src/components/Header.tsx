"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, BookText, UserPen, Trophy } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const iconsOne = [
  { id: 1, Icon: Home, href: "/(tabs)/map", label: "Maps" },

  { id: 2, Icon: BookText, href: "/(tabs)/collection", label: "Collection" },
];
const iconsTwo = [
  { id: 4, Icon: Trophy, href: "/(tabs)/bounty", label: "Bounty" },

  { id: 5, Icon: UserPen, href: "/(tabs)/profile", label: "Profile" },
];

export const Header = () => {
  const path = usePathname();
  console.log(path);
  const dockRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <header className="py-6   fixed -bottom-6  w-full  md:w-[30%]  z-50">
      <div className="container">
        <div className="flex justify-between p-2 items-center bg-[#38C02B] md:border  rounded-t-xl ">
          <div className="w-full">
            <nav
              className="flex justify-center gap-8 text-sm bg-[#38C02B] rounded-t-xl p-2 md:p-0 md:rounded-none "
              ref={dockRef}
            >
              {iconsOne.map(({ Icon, href, label, id }) => (
                <motion.div
                  key={id}
                  className="relative group "
                  onMouseEnter={() => setHoveredIndex(id)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  animate={{
                    scale: hoveredIndex === id ? 1.5 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    href={href}
                    aria-label={label}
                    className="block p-2 rounded-full bg-[#38C02B]  transition-colors"
                  >
                    <Icon className="h-6 w-6" />
                  </Link>
                  <AnimatePresence>
                    {hoveredIndex === id && (
                      <motion.span
                        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {path === href && (
                    <motion.div
                      className="absolute -bottom-2 left-1/2 w-1 h-1 bg-white rounded-full"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      layoutId="activeIndicator"
                    />
                  )}
                </motion.div>
              ))}

              <motion.div
                className="relative group "
                onMouseEnter={() => setHoveredIndex(3)}
                onMouseLeave={() => setHoveredIndex(null)}
                animate={{
                  scale: hoveredIndex === 3 ? 2 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link
                  href={"/(tabs)/creator"}
                  aria-label={"brands"}
                  className="block p-2 rounded-full bg-[#38C02B]  transition-colors"
                >
                  <Image
                    alt="brands"
                    src="/assets/images/wadzzo.png"
                    width={24}
                    height={24}
                  />
                </Link>
                <AnimatePresence>
                  {hoveredIndex === 3 && (
                    <motion.span
                      className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      Creator
                    </motion.span>
                  )}
                </AnimatePresence>
                {path === "/(tabs)/creator" && (
                  <motion.div
                    className="absolute -bottom-2 left-1/2 w-1 h-1 bg-white rounded-full"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    layoutId="activeIndicator"
                  />
                )}
              </motion.div>

              {iconsTwo.map(({ Icon, href, label, id }) => (
                <motion.div
                  key={label}
                  className="relative group "
                  onMouseEnter={() => setHoveredIndex(id)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  animate={{
                    scale: hoveredIndex === id ? 1.5 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    href={href}
                    aria-label={label}
                    className="block p-2 rounded-full bg-[#38C02B]  transition-colors"
                  >
                    <Icon className="h-6 w-6" />
                  </Link>
                  <AnimatePresence>
                    {hoveredIndex === id && (
                      <motion.span
                        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {path === href && (
                    <motion.div
                      className="absolute -bottom-2 left-1/2 w-1 h-1 bg-white rounded-full"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      layoutId="activeIndicator"
                    />
                  )}
                </motion.div>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
