import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { title?: string };

function createIcon(path: React.ReactNode) {
  return function Icon({ title, ...props }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={title ? undefined : true}
        role={title ? "img" : "presentation"}
        {...props}
      >
        {title ? <title>{title}</title> : null}
        {path}
      </svg>
    );
  };
}

export const IconBolt = createIcon(
  <>
    <path d="M13 2 4 14h7l-1 8 10-12h-7l0-8Z" />
  </>
);

export const IconSearch = createIcon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </>
);

export const IconSun = createIcon(
  <>
    <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M4.93 19.07l1.41-1.41" />
    <path d="M17.66 6.34l1.41-1.41" />
  </>
);

export const IconMoon = createIcon(
  <>
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />
  </>
);

export const IconGrid = createIcon(
  <>
    <path d="M4 4h7v7H4z" />
    <path d="M13 4h7v7h-7z" />
    <path d="M4 13h7v7H4z" />
    <path d="M13 13h7v7h-7z" />
  </>
);

export const IconTable = createIcon(
  <>
    <path d="M3 5h18v14H3z" />
    <path d="M3 10h18" />
    <path d="M8 5v14" />
    <path d="M16 5v14" />
  </>
);

export const IconChevronRight = createIcon(<path d="m9 18 6-6-6-6" />);
export const IconExternal = createIcon(
  <>
    <path d="M14 3h7v7" />
    <path d="M10 14 21 3" />
    <path d="M21 14v7H3V3h7" />
  </>
);

export const IconShield = createIcon(
  <>
    <path d="M12 2 20 6v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4Z" />
    <path d="M9 12l2 2 4-5" />
  </>
);

export const IconServer = createIcon(
  <>
    <path d="M4 6h16" />
    <path d="M4 10h16" />
    <path d="M4 14h16" />
    <path d="M4 18h16" />
    <path d="M6 6v12" />
    <path d="M18 6v12" />
    <path d="M8 8h.01" />
    <path d="M8 12h.01" />
    <path d="M8 16h.01" />
  </>
);

export const IconStore = createIcon(
  <>
    <path d="M3 9l1-6h16l1 6" />
    <path d="M5 9v10h14V9" />
    <path d="M9 19v-7h6v7" />
  </>
);

export const IconUser = createIcon(
  <>
    <path d="M20 21a8 8 0 1 0-16 0" />
    <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
  </>
);

export const IconCmd = createIcon(
  <>
    <path d="M9 9h6" />
    <path d="M9 15h6" />
    <path d="M7 9a2 2 0 1 1-2 2V9a2 2 0 0 1 4 0" />
    <path d="M17 9a2 2 0 1 0 2 2V9a2 2 0 0 0-4 0" />
    <path d="M7 15a2 2 0 1 0-2-2v2a2 2 0 0 0 4 0" />
    <path d="M17 15a2 2 0 1 1 2-2v2a2 2 0 0 1-4 0" />
  </>
);

export function IconFile({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-4 w-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}
