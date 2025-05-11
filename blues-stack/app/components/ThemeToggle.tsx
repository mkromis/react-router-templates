import { Sun, Moon } from "lucide-react";
import { useLayoutEffect, useState } from "react";

//import { sessionStorage } from "~/session.server";

// This is used from https://weitzel.dev/post/dark-theme-toggle/
const APPLICATION_NAME = "color-theme-toggle";

export default function ThemeToggle() {
  const lightTheme = "light";
  const darkTheme = "dark";

  const getDataTheme = (theme: string) =>
    theme === darkTheme ? darkTheme : lightTheme;
  const getToggledTheme = (theme: string) =>
    theme === darkTheme ? lightTheme : darkTheme;

  const initialTheme = "light"; //localStorage.getItem(APPLICATION_NAME) || lightTheme;
  const [theme, setTheme] = useState(initialTheme);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", getDataTheme(theme));
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = getToggledTheme(theme);
    setTheme(newTheme);
    //localStorage.setItem(APPLICATION_NAME, getDataTheme(newTheme));

    // const data = await sessionStorage.getSession();
    // data.set("theme", newTheme);
    // await sessionStorage.commitSession(data);
  };

  const icons = { dark: Sun, light: Moon };

  return (
    <button
      onClick={toggleTheme}
      className="bg-base flex items-center justify-center rounded-md border border-transparent px-4 py-3 font-medium text-blue-700 shadow-xs hover:bg-blue-50 sm:px-8"
      aria-label="Toggle theme"
    >
      {theme === darkTheme ? (
        <icons.dark className="h-5 w-5 text-blue-500" />
      ) : (
        <icons.light className="h-5 w-5 text-blue-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
