"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

const navItems = [
  { name: "Features", href: "#features" },
  { name: "Workflow", href: "#workflow" },
  { name: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const {
    user,
    authenticated,
    loading,
    login,
    logout,
  } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
  try {
    setLoggingOut(true);

    await logout();

    // Make sure the frontend immediately returns
    // to the logged-out state.
    window.location.reload();
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    setLoggingOut(false);
  }
}

  return (
    <motion.header
      initial={{
        y: -80,
        opacity: 0,
      }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      transition={{
        duration: 0.7,
        ease: "easeOut",
      }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-black/65 backdrop-blur-3xl shadow-[0_20px_70px_rgba(0,0,0,0.45)]"
          : "bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[1500px] items-center justify-between px-6 transition-all duration-500 sm:px-8 xl:px-12 ${
          scrolled ? "h-[78px]" : "h-[96px]"
        }`}
      >
        {/* Logo */}
        <motion.a
          href="#"
          whileHover={{
            scale: 1.05,
            rotate: -2,
            y: -2,
          }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 18,
          }}
          className="group relative cursor-pointer text-3xl font-black tracking-tight text-white"
        >
          <span className="transition-colors duration-300 group-hover:text-orange-200">
            quackGIT
          </span>{" "}
          <span className="text-orange-400 transition-colors duration-300 group-hover:text-orange-300">
            
          </span>

          <span className="pointer-events-none absolute -inset-3 -z-10 rounded-xl bg-orange-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        </motion.a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 lg:flex xl:gap-10">
          {navItems.map((item) => (
            <motion.a
              key={item.name}
              href={item.href}
              whileHover={{
                y: -2,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
              }}
              className="group relative py-2 text-base font-medium tracking-wide text-zinc-300 transition-colors duration-300 hover:text-white"
            >
              {item.name}

              <span className="absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-orange-400 transition-all duration-300 group-hover:w-full" />
            </motion.a>
          ))}

          {/* Authentication */}
          {loading ? (
            <div className="h-12 w-28 animate-pulse rounded-2xl bg-white/10" />
          ) : authenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Profile */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-xl">
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="h-9 w-9 rounded-full border border-white/10 object-cover"
                  />
                )}

                <div className="hidden xl:block">
                  <p className="max-w-[150px] truncate text-sm font-semibold text-white">
                    {user.name || user.login}
                  </p>

                  <p className="text-xs text-zinc-500">
                    @{user.login}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <motion.button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 16,
                }}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-wait disabled:opacity-50"
              >
                <LogOut size={17} />

                {loggingOut ? "Logging out..." : "Logout"}
              </motion.button>
            </div>
          ) : (
            /* Login */
            <motion.button
              type="button"
              onClick={login}
              whileHover={{
                scale: 1.05,
                y: -3,
              }}
              whileTap={{
                scale: 0.97,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 16,
              }}
              className="group relative overflow-hidden rounded-2xl bg-orange-500 px-8 py-4 text-base font-semibold text-white shadow-[0_10px_35px_rgba(249,115,22,.35)]"
            >
              <span className="relative z-10">
                Login
              </span>

              <motion.div
                className="absolute inset-0 bg-white/15"
                initial={{
                  x: "-120%",
                }}
                whileHover={{
                  x: "120%",
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeInOut",
                }}
              />
            </motion.button>
          )}
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-3 lg:hidden">
          {loading ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
          ) : authenticated && user ? (
            <>
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="h-10 w-10 rounded-full border border-white/10 object-cover"
                />
              )}

              <motion.button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                whileTap={{
                  scale: 0.95,
                }}
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                title="Logout"
              >
                <LogOut size={18} />
              </motion.button>
            </>
          ) : (
            <motion.button
              type="button"
              onClick={login}
              whileTap={{
                scale: 0.95,
              }}
              className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_25px_rgba(249,115,22,.25)]"
            >
              Login
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{
              scale: 1.08,
              rotate: 5,
            }}
            whileTap={{
              scale: 0.95,
            }}
            transition={{
              type: "spring",
              stiffness: 350,
            }}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white backdrop-blur transition-colors hover:border-orange-500/40 hover:bg-orange-500/10"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}