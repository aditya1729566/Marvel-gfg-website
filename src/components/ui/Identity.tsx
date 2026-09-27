import { ArrowUpRight } from "lucide-react";
import { eventData } from "@/data/event";
export function Brand() {
  return (
    <a className="brand" href="#top" aria-label="GFG Bennett — Back to top">
      <span className="brand-mark">
        gfg<span className="brand-dot">.</span>
      </span>
      <span className="brand-copy">
        STUDENT CHAPTER<span>BENNETT UNIVERSITY</span>
      </span>
    </a>
  );
}
export function RegistrationLink({
  className = "button primary",
  label = "Registration details",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={eventData.registrationUrl || "#registration"}
      className={className}
    >
      {eventData.registrationUrl ? "Register now" : label}
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}
