"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Crosshair,
  Menu,
  Pause,
  Play,
  X,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { eventData, experiences } from "@/data/event";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { Brand, RegistrationLink } from "./ui/Identity";
import JourneyStage from "./journey/JourneyStage";
import { createMasterTimeline, initialMotion } from "./journey/timeline";
import { armorParts } from "./journey/armor";
import {
  chapterNames,
  chapterIds,
  chapterColors,
  armorChanged,
  inspectArmor,
  backFromArmor,
  type JourneyState,
} from "./journey/state";

function ChapterLabel({
  number,
  name,
  code,
}: {
  number: string;
  name: string;
  code: string;
}) {
  return (
    <div className="chapter-label">
      <span className="chapter-number">{number}</span>
      <span>
        {name}
        <small>{code}</small>
      </span>
    </div>
  );
}
export default function Experience() {
  const root = useRef<HTMLDivElement>(null);
  const state = useRef<JourneyState>({
    progress: 0,
    targetProgress: 0,
    armor: { open: false, selected: "", isolate: false, rotation: 0 },
    pointer: [0, 0],
    paused: false,
    reduced: false,
    action: 0,
    actionTime: 0,
    node: 0,
    hovering: false,
    motion: initialMotion(),
  });
  const reduced = useMotionPreference();
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);
  const [armorOpen, setArmorOpen] = useState(false);
  const [armorSelected, setArmorSelected] = useState("");
  const [node, setNode] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [impact, setImpact] = useState(0);
  const menuRef = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const notify = () => window.dispatchEvent(new Event("journey-update"));
  useEffect(() => {
    const sync = () => {
      setArmorOpen(Boolean(state.current.armor?.open));
      setArmorSelected(state.current.armor?.selected || "");
    };
    window.addEventListener("armor-change", sync);
    return () => window.removeEventListener("armor-change", sync);
  }, []);
  useEffect(() => {
    state.current.reduced = reduced;
    state.current.paused = paused || document.hidden;
    notify();
    const visibility = () => {
      state.current.paused = paused || document.hidden;
      notify();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [reduced, paused]);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const sections = Array.from(
      root.current!.querySelectorAll<HTMLElement>(".chapter"),
    );
    let offsets = sections.map((el) => el.offsetTop);
    let previous = -1;
    const master = createMasterTimeline(state.current.motion!);
    const journey = state.current;
    journey.score = master;
    const update = () => {
      const y = window.scrollY;
      let index = offsets.findLastIndex((top) => y >= top - 1);
      index = Math.max(0, index);
      const length =
        index < 5
          ? offsets[index + 1] - offsets[index]
          : sections[index].offsetHeight - window.innerHeight;
      const phase = Math.max(
        0,
        Math.min(
          index === 5 ? 0.99 : 0.999,
          (y - offsets[index]) / Math.max(1, length),
        ),
      );
      state.current.targetProgress = index + phase;
      sections.forEach((section, i) => {
        const current = i === index;
        section.dataset.current = String(current);
        const travel = !state.current.reduced && i < 4;
        const opacity = current ? (travel ? Math.max(0, 1 - Math.max(0, phase - 0.48) / 0.12) : 1) : 0;
        section.style.setProperty("--copy-opacity", String(opacity));
        section.style.setProperty("--copy-shift", `${travel ? Math.max(0, phase - 0.48) * -100 : 0}px`);
        // Inactive fixed panels must never intercept pointer/keyboard navigation.
        section.querySelector<HTMLElement>(".chapter-shell")!.inert = !current || opacity === 0;
      });
      if (previous !== index) {
        previous = index;
        setActive(index);
      }
      if (root.current) {
        root.current.dataset.portal = String(index === 3 && phase > 0.46);
        root.current.style.setProperty(
          "--journey-progress",
          `${((index + phase) / 5.99) * 100}%`,
        );
        root.current.style.setProperty("--accent", chapterColors[index]);
        root.current.style.setProperty("--chapter-drift", String(phase));
      }
      notify();
    };
    const refresh = () => {
      offsets = sections.map((el) => el.offsetTop);
      update();
    };
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: update,
      onRefresh: refresh,
    });
    const pointer = (e: PointerEvent) => {
      state.current.pointer = [
        (e.clientX / window.innerWidth - 0.5) * 2,
        -(e.clientY / window.innerHeight - 0.5) * 2,
      ];
      root.current?.style.setProperty("--cursor-x", `${e.clientX}px`);
      root.current?.style.setProperty("--cursor-y", `${e.clientY}px`);
      if (state.current.reduced || state.current.paused) notify();
    };
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("resize", refresh, { passive: true });
    update();
    const deepLink = requestAnimationFrame(() => {
      const id = window.location.hash.slice(1);
      if (id && window.scrollY < 2) document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
    });
    return () => {
      trigger.kill();
      master.kill();
      journey.score = undefined;
      cancelAnimationFrame(deepLink);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("resize", refresh);
    };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const oldOverflow = document.body.style.overflow;
    const button = menuButton.current;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key !== "Tab") return;
      const items = menuRef.current?.querySelectorAll<HTMLElement>("a,button");
      if (!items?.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", keydown);
      button?.focus({ preventScroll: true });
    };
  }, [menuOpen]);
  const action = (type: number) => {
    state.current.action = type;
    // Event-only timestamp: action is invoked by button handlers, never during render.
    // eslint-disable-next-line react-hooks/purity
    state.current.actionTime = performance.now();
    notify();
    if (type === 3) setImpact((count) => count + 1);
  };
  const activateNode = (index: number) => {
    setNode(index);
    state.current.node = index;
    action(2);
  };
  return (
    <div
      ref={root}
      id="journey-experience"
      className="experience"
      data-world={active}
      data-reduced={reduced}
      data-paused={paused}
    >
      <a href="#mission" className="skip-link">
        Skip to event information
      </a>
      <JourneyStage state={state} reduced={reduced} paused={paused} />
      <div className="universe-cursor" aria-hidden="true"><i /><b /><span /></div>
      <header className="site-header">
        <Brand />
        <nav aria-label="Main navigation" className="desktop-nav">
          <a href="#iron-man">Explore the worlds</a>
          <a href="#mission">Mission briefing</a>
        </nav>
        <RegistrationLink className="nav-cta" label="Registration" />
        <button
          ref={menuButton}
          className="menu-toggle icon-button"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={23} />
        </button>
      </header>
      {menuOpen && (
        <nav
          id="mobile-navigation"
          ref={menuRef}
          className="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="mobile-nav-top">
            <span>GFG / BENNETT</span>
            <button
              className="icon-button"
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
            >
              <X />
            </button>
          </div>
          {chapterNames.map((name, i) => (
            <a
              href={`#${chapterIds[i]}`}
              key={name}
              onClick={() => setMenuOpen(false)}
            >
              <small>0{i}</small>
              {name}
              <ArrowUpRight size={22} />
            </a>
          ))}
        </nav>
      )}
      <nav className="chapter-nav" aria-label="Journey chapters">
        {chapterNames.map((name, i) => (
          <a
            href={`#${chapterIds[i]}`}
            key={name}
            aria-current={active === i ? "step" : undefined}
            aria-label={`Chapter ${i}: ${name}`}
          >
            <span>0{i}</span>
            <b>{name}</b>
            <i />
          </a>
        ))}
      </nav>
      <main id="main">
        <section id="top" className="chapter assembly">
          <div className="chapter-shell">
            <div className="chapter-grid">
              <div className="intro-meta">
                <span className="eyebrow">GFG BENNETT PRESENTS</span>
                <span className="micro">
                  AN INTERACTIVE MULTIVERSE EXPERIENCE
                </span>
              </div>
              <div className="intro-title">
                {eventData.workingTitle ? (
                  <h1>
                    <span>ENTER THE</span>
                    <strong>
                      MULTI<span className="outlined">VERSE</span>
                    </strong>
                  </h1>
                ) : (
                  <h1 className="official-title">{eventData.name}</h1>
                )}
                <div className="intro-rule">
                  <span>THREE WORLDS.</span>
                  <span>ONE MISSION.</span>
                  <Crosshair size={17} />
                </div>
              </div>
              <div className="intro-bottom">
                <p>
                  A new reality.
                  <br />
                  Built by you.
                </p>
                <a
                  className="journey-link"
                  href="#iron-man"
                  onMouseEnter={() => {
                    state.current.hovering = true;
                  }}
                  onMouseLeave={() => {
                    state.current.hovering = false;
                  }}
                >
                  Enter the first world <ArrowDown size={18} />
                </a>
                <small>
                  {eventData.workingTitle ? "WORKING EVENT TITLE · " : ""}
                  DETAILS TO BE ANNOUNCED
                </small>
              </div>
              <span className="artifact-caption">
                GATEWAY 00 / THE MULTIVERSE
                <small>SCROLL TO OPEN THE GATEWAY</small>
              </span>
            </div>
          </div>
        </section>
        <section id="iron-man" className="chapter iron" data-inspecting={armorOpen} data-selected-part={armorSelected}>
          <div className="chapter-shell">
            <div className="chapter-grid">
              <ChapterLabel
                number="01"
                name="IRON MAN"
                code="STARK-INSPIRED / ENGINEERING BAY"
              />
              <div className="world-copy">
                <span className="world-kicker">PRECISION IS A SUPERPOWER.</span>
                <h2>
                  ENGINEER
                  <br />
                  THE <span>IMPOSSIBLE.</span>
                </h2>
                <p>
                  Every breakthrough begins with a build.
                  <br />
                  Take the idea apart. Make something extraordinary.
                </p>
                <div className="armor-gesture-guide" role="group" aria-label="Interactive Iron Man suit" tabIndex={0}
                  onKeyDown={e => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inspectArmor(state.current, ""); }
                    if (e.key === "Escape") { e.preventDefault(); backFromArmor(state.current); }
                    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); state.current.armor!.rotation += e.key === "ArrowLeft" ? -.2 : .2; notify(); }
                  }}>
                  <span className="armor-gesture-title"><Crosshair size={17} aria-hidden="true" />
                    {armorSelected ? armorParts.find(part => part.id === armorSelected)?.label.replace(" — obscured", "") : armorOpen ? "Select an armor part" : "Click the suit to disassemble"}
                  </span>
                  <p aria-live="polite">{armorSelected ? "Drag to rotate. Click empty space to return." : armorOpen ? "Click a part to isolate it. Drag to rotate." : "One click. Twenty parts. Explore the engineering."}</p>
                  <small>KEYBOARD: ENTER TO OPEN · ← → ROTATE · ESC TO RETURN</small>
                  <div className="armor-keyboard-controls">
                    <label htmlFor="armor-part">Inspect a component</label>
                    <select id="armor-part" value={armorSelected} onChange={e => {
                      if (!state.current.armor!.open) state.current.armor!.open = true;
                      state.current.armor!.selected = e.target.value; state.current.armor!.isolate = Boolean(e.target.value);
                      state.current.armor!.rotation = 0; state.current.armor!.rotationX = 0; armorChanged();
                    }}>
                      <option value="">Complete assembly</option>
                      {armorParts.map(part => <option key={part.id} value={part.id}>{part.label.replace(" — obscured", "")}</option>)}
                    </select>
                    <label htmlFor="armor-angle">Viewing angle</label>
                    <input id="armor-angle" type="range" min="-180" max="180" defaultValue="0" onChange={e => { state.current.armor!.rotation = Number(e.target.value)*Math.PI/180; notify(); }} />
                  </div>
                </div>
              </div>
              <div className="world-insignia" aria-hidden="true">
                <span>MARK</span>
                <strong>01</strong>
                <span>ARC SYSTEM / ONLINE</span>
              </div>
              <div className="chapter-footer">
                <span>DESIGN. CODE. ITERATE.</span>
                <a href="#spider-man">
                  Follow the reactor <ArrowDown size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
        <section id="spider-man" className="chapter spider">
          <div className="chapter-shell">
            <div className="chapter-grid">
              <ChapterLabel
                number="02"
                name="SPIDER-MAN"
                code="THE CITY / CONNECTION NETWORK"
              />
              <div className="world-copy">
                <span className="world-kicker">
                  NO GREAT IDEA EXISTS ALONE.
                </span>
                <h2>
                  MAKE THE
                  <br />
                  <span>CONNECTION.</span>
                </h2>
                <p>
                  Curiosity meets possibility.
                  <br />
                  Find your thread. Follow it somewhere new.
                </p>
                <div
                  className="web-nodes"
                  role="group"
                  aria-label="Explore creative themes"
                >
                  {experiences.map((item, i) => (
                    <button
                      key={item.id}
                      aria-pressed={node === i}
                      onClick={() => activateNode(i)}
                    >
                      <span>0{i + 1}</span>
                      {item.title}
                      <i />
                    </button>
                  ))}
                </div>
                <div className="node-detail" aria-live="polite">
                  <span>{experiences[node].label}</span>
                  <p>{experiences[node].description}</p>
                </div>
                <span className="interaction-note">
                  CREATIVE THEMES / OFFICIAL TRACKS TO BE ANNOUNCED
                </span>
              </div>
              <div className="city-coordinate" aria-hidden="true">
                40° 42′
                <br />
                <span>WEB NETWORK ACTIVE</span>
              </div>
              <div className="chapter-footer">
                <span>A DIFFERENT PERSPECTIVE.</span>
                <a href="#hulk">
                  Break through the web <ArrowDown size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
        <section id="hulk" className="chapter hulk">
          <div className="chapter-shell">
            <div className="chapter-grid">
              <ChapterLabel
                number="03"
                name="HULK"
                code="GAMMA ZONE / HIGH IMPACT"
              />
              <div className="world-copy">
                <span className="world-kicker">
                  SMALL IDEAS. MASSIVE POTENTIAL.
                </span>
                <h2>
                  MAKE AN
                  <br />
                  <span>IMPACT.</span>
                </h2>
                <p>
                  Push beyond what you thought possible.
                  <br />
                  Bring the energy. Leave your mark.
                </p>
                <button className="world-action" onClick={() => action(3)}>
                  <Zap size={17} />
                  Trigger gamma impact
                  <ArrowUpRight size={17} />
                </button>
                <span className="interaction-note" aria-live="polite">
                  {impact
                    ? `IMPACT ${String(impact).padStart(2, "0")} / ${reduced || paused ? "LOW-MOTION RESPONSE" : "SHOCKWAVE RELEASED"}`
                    : "LIVE 3D / PRESS TO RELEASE THE SHOCKWAVE"}
                </span>
              </div>
              <div className="gamma-readout">
                <small>REWARDS</small>
                <strong>{eventData.prizePool || "TBA"}</strong>
                <span>
                  {eventData.prizePool
                    ? "OFFICIAL REWARDS"
                    : "OFFICIAL PRIZE DETAILS COMING SOON"}
                </span>
              </div>
              <div className="chapter-footer">
                <span>BUILD SOMETHING THAT MATTERS.</span>
                <a href="#mission">
                  Receive the mission <ArrowDown size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
        <section id="mission" className="chapter mission">
          <div className="chapter-shell">
            <div className="chapter-grid">
              <ChapterLabel
                number="04"
                name="MISSION BRIEFING"
                code="ALL WORLDS / ONE OBJECTIVE"
              />
              <div className="mission-heading">
                <span className="world-kicker">
                  YOUR NEXT CHAPTER STARTS HERE.
                </span>
                <h2>
                  THE MISSION
                  <br />
                  <span>IS YOURS.</span>
                </h2>
                <p>
                  {eventData.organizer}.<br />
                  The experience is ready. Official event details are on their
                  way.
                </p>
              </div>
              <div className="mission-information">
                <dl>
                  {[
                    ["Date", eventData.date],
                    ["Venue", eventData.venue],
                    ["Format", eventData.format],
                    ["Eligibility", eventData.eligibility],
                    ["Team size", eventData.teamSize],
                    ["Registration deadline", eventData.deadline],
                  ].map(([label, value], i) => (
                    <div key={label}>
                      <dt>
                        <small>0{i + 1}</small>
                        {label}
                      </dt>
                      <dd>{value || "To be announced"}</dd>
                    </div>
                  ))}
                </dl>
                <div className="schedule">
                  <h3>
                    MISSION TIMELINE{" "}
                    <span>
                      {eventData.schedule.length
                        ? "OFFICIAL SCHEDULE"
                        : "AWAITING CONFIRMATION"}
                    </span>
                  </h3>
                  {eventData.schedule.length ? (
                    eventData.schedule.map((item) => (
                      <p key={item.title}>
                        <strong>
                          {item.time} / {item.title}
                        </strong>
                        {item.description}
                      </p>
                    ))
                  ) : (
                    <p>
                      The official schedule and challenge format will be
                      published here. No stages or times have been confirmed.
                    </p>
                  )}
                </div>
                <p className="contact-status">
                  CONTACT /{" "}
                  {eventData.contactEmail ? (
                    <a href={`mailto:${eventData.contactEmail}`}>
                      {eventData.contactEmail}
                    </a>
                  ) : (
                    "To be announced"
                  )}
                </p>
              </div>
              <div className="chapter-footer">
                <span>CONFIRMED FACTS. NO GUESSWORK.</span>
                <a href="#registration">
                  Assemble your team <ArrowDown size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
        <section id="registration" className="chapter finale">
          <div className="chapter-shell">
            <div className="chapter-grid">
              <ChapterLabel
                number="05"
                name="ASSEMBLE"
                code="THE CONVERGENCE / YOUR TURN"
              />
              <div className="world-copy">
                <span className="world-kicker">
                  THREE WORLDS. YOUR POSSIBILITY.
                </span>
                <h2>
                  ASSEMBLE
                  <br />
                  <span>YOUR TEAM.</span>
                </h2>
                <p>
                  {eventData.registrationUrl
                    ? "The multiverse is open. Start your next chapter."
                    : "Registration is coming soon. The official link, rules and event details will appear here when confirmed."}
                </p>
                {eventData.registrationUrl ? (
                  <RegistrationLink className="world-action" />
                ) : (
                  <div className="registration-status">
                    <i />
                    <span>REGISTRATION NOT YET OPEN</span>
                  </div>
                )}
                {eventData.contactEmail && (
                  <a
                    href={`mailto:${eventData.contactEmail}`}
                    className="contact-link"
                  >
                    {eventData.contactEmail}
                  </a>
                )}
              </div>
              <footer className="chapter-footer">
                <span>GFG STUDENT CHAPTER / BENNETT UNIVERSITY</span>
                <a href="#faq">
                  Before you enter <ArrowDown size={16} />
                </a>
              </footer>
            </div>
          </div>
        </section>
        <section className="afterword" id="faq" aria-labelledby="faq-heading">
          <div className="faq">
            <span className="eyebrow">THE FINAL CHECKPOINT</span>
            <h2 id="faq-heading">BEFORE YOU ENTER.</h2>
            {eventData.faqs.map((item) => (
              <details key={item.question}>
                <summary>
                  {item.question}
                  <span>+</span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
            <a className="contact-link" href="#top">
              Back to the gateway <ArrowUpRight size={15} />
            </a>
          </div>
        </section>
      </main>
      <div className="journey-controls">
        <span className="chapter-status">
          <i />0{active} / 05 <b>{chapterNames[active]}</b>
        </span>
        <button
          className="motion-control"
          aria-pressed={paused}
          aria-label={paused ? "Resume ambient motion" : "Pause ambient motion"}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
          <span>{paused ? "RESUME" : "PAUSE"}</span>
        </button>
        <span className="scroll-hint">
          SCROLL TO TRAVEL <ArrowDown size={13} />
        </span>
        <div className="progress-track">
          <span />
        </div>
      </div>
    </div>
  );
}
