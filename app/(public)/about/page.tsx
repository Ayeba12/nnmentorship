"use client";

import React from "react";
import Link from "next/link";

export default function AboutPage() {
  const values = [
    {
      title: "Command Excellence",
      description: "Fostering absolute professionalism, discipline, and tactical command expertise among junior officers and cadets.",
      bgClass: "bg-soft-yellow",
      image: "/assets/fleet-frigate-41.jpg",
    },
    {
      title: "Knowledge Transfer",
      description: "Preserving decades of watchkeeping and operational naval doctrine by bridging the gap between retired veterans and active crew.",
      bgClass: "bg-lilac",
      image: "/assets/cap-doctrine-preservation.jpg",
    },
    {
      title: "Inclusive Growth",
      description: "Providing equal access to mentorship and training resources for all branches, commands, and ranks across the Navy.",
      bgClass: "bg-pink",
      image: "/assets/cap-vetting-credentials.jpg",
    },
    {
      title: "Operational Readiness",
      description: "Supporting fleet combat capabilities and search and rescue readiness through specialized training and advice.",
      bgClass: "bg-green",
      image: "/assets/fleet-patrol-boat.png",
    },
  ];

  const leadership = [
    { name: "Vice Admiral E. O. Ogalla", rank: "Chief of the Naval Staff", role: "Grand Patron" },
    { name: "Rear Admiral A. A. Adebayo", rank: "Director of Naval Training", role: "Program Director" },
    { name: "Commodore C. I. Olowokere", rank: "Command Coordinator", role: "Vetting Officer" },
    { name: "Captain S. U. Mohammed", rank: "Chief Instructor", role: "Course Administrator" },
  ];

  return (
    <div className="main-wrapper">
      {/* ── PAGE HEADER ── */}
      <section className="section-card" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div className="padding-global">
          <div className="container-large" style={{ textAlign: "center" }}>
            <div className="text_title scroll-into-view">About Us</div>
            <div className="spacer-xlarge" />
            <h1 className="scroll-into-view" style={{ maxWidth: "68rem", margin: "0 auto" }}>
              Empowering the Nigerian Navy Through Mentorship
            </h1>
            <div className="spacer-medium" />
            <p className="text-color-tertiary scroll-into-view" style={{ maxWidth: "48rem", margin: "0 auto", fontSize: "1.125rem" }}>
              Our platform bridges the generational gap, connecting active officers and ratings with seasoned mentors to maintain command heritage and operational excellence.
            </p>
          </div>
        </div>
      </section>

      {/* ── EXPERTISE/VISION SECTION ── */}
      <section className="section-card section_expertise" style={{ padding: "4rem 0" }}>
        <div className="padding-global padding-section-bottom">
          <div className="container-large">
            <div className="w-layout-grid grid-col-2">
              <div className="expertise_left">
                <div className="expertise_max">
                  <div className="text_title scroll-into-view">Our Vision</div>
                  <div className="spacer-xlarge" />
                  <h2 className="scroll-into-view">Building the next generation of naval leaders</h2>
                </div>
                <div className="expertise_max">
                  <p className="text-color-tertiary scroll-into-view">
                    We envision a highly proficient maritime force equipped with continuous training, verified doctrinal guides, and personalized career advice, ensuring the Nigerian Navy remains ready to defend our maritime domain.
                  </p>
                </div>
              </div>
              <div className="scroll-into-img">
                <div className="expertise_img">
                  <img
                    src="/assets/navy-about-vision.png"
                    loading="lazy"
                    alt="Vision"
                    className="img"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section className="section-card section_consulting" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="padding-global padding-section-bottom" style={{ paddingTop: "4rem" }}>
          <div className="container-large">
            <div className="w-layout-grid grid-col-3 is-consulting">
              <div className="consulting_card scroll-into-view" style={{ background: "white" }}>
                <div className="card_title-max">
                  <div className="text-all-caps text-color-tertiary text-sm">Platform established</div>
                </div>
                <div className="text-4xl">Est. 2024</div>
              </div>
              <div className="consulting_card scroll-into-view" style={{ background: "white" }}>
                <div className="card_title-max">
                  <div className="text-all-caps text-color-tertiary text-sm">Registered personnel</div>
                </div>
                <div className="text-4xl">240+</div>
              </div>
              <div className="consulting_card scroll-into-view" style={{ background: "white" }}>
                <div className="card_title-max">
                  <div className="text-all-caps text-color-tertiary text-sm">Vetted courses</div>
                </div>
                <div className="text-4xl">18+</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES/SERVICES SECTION ── */}
      <section className="section-card section_features" style={{ padding: "4rem 0" }}>
        <div className="features_wrap" style={{ minHeight: "auto", position: "relative" }}>
          <div className="padding-global" style={{ paddingBottom: "2rem" }}>
            <div className="container-large">
              <div className="text_title scroll-into-view">Our Values</div>
              <div className="spacer-medium" />
              <h2 className="scroll-into-view">Principles guiding our commission</h2>
            </div>
          </div>
          <div className="padding-global">
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {values.map((val, idx) => (
                <div key={idx} className={`service_layout ${val.bgClass}`} style={{ minHeight: "18rem" }}>
                  <div className="service_img">
                    <img src={val.image} alt={val.title} loading="lazy" className="img" />
                  </div>
                  <div className="service_content" style={{ padding: "2rem 3rem" }}>
                    <div className="service_header">
                      <h2 className="heading-style-h3">{val.title}</h2>
                      <div className="max-32-5rem">
                        <div className="text-color-tertiary">{val.description}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LEADERSHIP/TEAM SECTION ── */}
      <section className="section-card" style={{ padding: "6rem 0" }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="text_title scroll-into-view">Leadership</div>
            <div className="spacer-medium" />
            <h2 className="scroll-into-view" style={{ marginBottom: "3rem" }}>Command Advisory Board</h2>
            
            <div className="w-layout-grid grid-col-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem" }}>
              {leadership.map((member, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--bg-secondary)",
                    borderRadius: "0.75rem",
                    padding: "2rem",
                    textAlign: "center",
                  }}
                  className="scroll-into-view"
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "var(--brand-gray-300)",
                      margin: "0 auto 1.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--brand-gray-800)",
                    }}
                  >
                    {member.name.split(" ").pop()?.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>{member.name}</h3>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", fontWeight: 500, marginBottom: "0.25rem" }}>{member.rank}</div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--brand-gray-500)", fontWeight: 600 }}>{member.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="section-card section_joinus" style={{ padding: "4rem 0" }}>
        <div className="padding-global padding-section-bottom">
          <div className="container-large">
            <div className="w-layout-grid grid-col-2">
              <div className="join_left">
                <div>
                  <div className="text_title scroll-into-view">Join us</div>
                  <div className="spacer-medium" />
                  <div className="title-max is-32rem scroll-into-view">
                    <h2 className="heading-style-h2">Ready to make an impact?</h2>
                  </div>
                  <div className="spacer-medium" />
                  <div className="text-color-tertiary scroll-into-view">
                    Whether as an active mentee or an advisor, contribute to our command security and capabilities.
                  </div>
                </div>
                <div className="button_wrap scroll-into-view">
                  <Link href="/signup" className="button is-secondary">
                    Get Started
                  </Link>
                </div>
              </div>
              <div className="join_image scroll-into-img">
                <img
                  src="/assets/navy-ship-sea.png"
                  loading="lazy"
                  alt="Join Us"
                  className="img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
