async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  children.forEach((c) => node.appendChild(c));
  return node;
}

function text(t) { return document.createTextNode(t); }

function chips(list) {
  const wrap = el("div", { class: "skill-tags" });
  list.forEach((t) => wrap.appendChild(el("span", { class: "tag-chip" }, [text(t)])));
  return wrap;
}

function withImageFallback(imgEl, label) {
  imgEl.addEventListener("error", () => {
    const placeholder = el("div", {
      style:
        "display:flex;align-items:center;justify-content:center;width:100%;height:100%;" +
        "background:#efeade;border:1px dashed #cfc8b8;color:#8a8071;" +
        "font-family:'IBM Plex Mono',monospace;font-size:0.72rem;text-align:center;padding:8px;",
    }, [text(label || "add image")]);
    imgEl.replaceWith(placeholder);
  }, { once: true });
}

document.getElementById("year").textContent = new Date().getFullYear();

async function renderProfile() {
  let p;
  try {
    p = await loadJSON("data/profile.json");
  } catch (e) {
    console.error(e);
    return;
  }

  const startYear = 2021; 
  const currentYear = new Date().getFullYear();
  const yearsOfExperience = currentYear - startYear;

  let certCount = 0;
  try {
    const certs = await loadJSON("data/certifications.json");
    const uniqueCerts = new Set(certs.map(cert => cert.title));
    certCount = uniqueCerts.size;
  } catch (e) {
    console.warn("Could not load certifications for counting");
  }

  if (p.stats) {
    p.stats.forEach(stat => {
      const label = stat.label.toLowerCase();
      if (label.includes("experience") || label.includes("years")) {
        stat.value = yearsOfExperience + "+";
      }
      if (label.includes("certific")) {
        stat.value = certCount;
      }

    });
  }

  document.getElementById("availabilityBadge").querySelector("span:last-child").textContent = p.availability;
  document.getElementById("heroName").textContent = p.name;
  document.getElementById("heroRoles").textContent = p.roles.join(" • ");
  document.getElementById("heroTagline").textContent = p.tagline;

  const linkedin = p.socials.find((s) => s.label.toLowerCase() === "linkedin");
  if (linkedin) document.getElementById("heroLinkedin").href = linkedin.url;

const socialRow = (containerId, exclude = []) => {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;

    p.socials
      .filter((s) => !exclude.includes(s.label.toLowerCase()))
      .forEach((s) => {
        const icon = el("img", {
          src: `assets/${s.label.toLowerCase()}.svg`,
          alt: s.label,
          class: "social-icon"
        });

        const a = el("a", {
          href: s.url, target: "_blank", rel: "noopener", title: s.label,
          class: "social-icon-btn"
        }, [icon]);
        wrap.appendChild(a);
      });
  };
  socialRow("heroSocials");
  socialRow("contactSocials");
  socialRow("footerSocials");

  const heroSocialsWrap = document.getElementById("heroSocials");
  if (heroSocialsWrap) {
    const heroEmailIcon = el("img", { src: "assets/email.svg", alt: "Email", class: "social-icon" });
    const heroEmailLink = el("a", {
      href: `mailto:${p.email}`, title: "Email",
      class: "social-icon-btn"
    }, [heroEmailIcon]);
    heroSocialsWrap.appendChild(heroEmailLink);
  }

  const photo = document.getElementById("aboutPhoto");
  photo.src = p.photo;
  photo.alt = p.name;
  withImageFallback(photo, "add your photo\n(assets/img/profile.jpg)");

  document.getElementById("aboutLocation").textContent = p.location;
  document.getElementById("aboutName").textContent = p.name;
  document.getElementById("aboutRole").textContent = p.roles.join(" • ");
  document.getElementById("aboutBio").textContent = p.bio;

  const STAT_SECTION_LINKS = [
    { match: (l) => l.includes("experience") || l.includes("years"), href: "#experience" },
    { match: (l) => l.includes("project"), href: "#projects" },
    { match: (l) => l.includes("certific"), href: "#certifications" },
    { match: (l) => l.includes("research") || l.includes("publication"), href: "#research" },
  ];

  const statsRow = document.getElementById("aboutStats");
  p.stats.forEach((s) => {
    const label = s.label.toLowerCase();
    const linked = STAT_SECTION_LINKS.find((x) => x.match(label));
    const inner = [
      el("div", { class: "stat-value" }, [text(s.value)]),
      el("div", { class: "stat-label" }, [text(s.label)]),
    ];
    const box = linked
      ? el("a", { class: "stat-box stat-box-link", href: linked.href }, inner)
      : el("div", { class: "stat-box" }, inner);
    statsRow.appendChild(box);
  });

  const focusWrap = document.getElementById("aboutFocusTags");
  p.focusTags.forEach((t) => focusWrap.appendChild(el("span", { class: "tag-chip" }, [text(t)])));

const emailLink = document.getElementById("contactEmail");
  emailLink.href = `mailto:${p.email}`;
  emailLink.innerHTML = "";
  emailLink.classList.add("email-pill");

  const emailIcon = el("img", {
    src: "assets/email.svg",
    alt: "",
    class: "social-icon"
  });

  emailLink.appendChild(emailIcon);
  emailLink.appendChild(text(p.email));

  return p;
}

async function renderSkills() {
  const grid = document.getElementById("skillsGrid");
  let skills;
  try {
    skills = await loadJSON("data/skills.json");
  } catch (e) {
    grid.textContent = "Could not load skills.json";
    return;
  }
  skills.forEach((group) => {
    const card = el("div", { class: "skill-card" }, [el("h3", {}, [text(group.category)]), chips(group.items)]);
    grid.appendChild(card);
  });
}

async function renderExperience() {
  const timeline = document.getElementById("timeline");
  let items;
  try {
    items = await loadJSON("data/experience.json");
  } catch (e) {
    timeline.textContent = "Could not load experience.json";
    return;
  }
  items.forEach((item) => {
    const node = el("div", { class: "timeline-item" });
    node.appendChild(el("div", { class: "timeline-period" }, [text(item.period)]));
    node.appendChild(el("div", { class: "timeline-role" }, [text(item.role)]));
    node.appendChild(el("div", { class: "timeline-org" }, [text(`${item.org} • ${item.location || ""}`)]));
    const ul = el("ul");
    (item.bullets || []).forEach((b) => ul.appendChild(el("li", {}, [text(b)])));
    node.appendChild(ul);
    node.appendChild(chips(item.tags || []));
    timeline.appendChild(node);
  });
}

async function renderResearch(profile) {
  const statsRow = document.getElementById("researchStats");
  const pubList = document.getElementById("pubList");
  let data;
  try {
    data = await loadJSON("data/research.json");
  } catch (e) {
    pubList.textContent = "Could not load research.json";
    return;
  }

  const profileResearchStat = profile?.stats?.find((s) =>
    s.label.toLowerCase().includes("research") || s.label.toLowerCase().includes("publication")
  );
  const publicationCount = profileResearchStat
    ? profileResearchStat.value
    : (data.publications || []).length;

  data.metrics.forEach((m) => {
    if (m.label.toLowerCase().includes("total publication")) {
      m.value = publicationCount;
    }
    statsRow.appendChild(
      el("div", { class: "stat-box" }, [
        el("div", { class: "stat-value" }, [text(m.value)]),
        el("div", { class: "stat-label" }, [text(m.label)]),
      ])
    );
  });

  document.getElementById("scholarLink").href = data.scholarUrl;

  data.publications.forEach((pub) => {
    const meta = el("div", { class: "pub-meta-row" });
    if (pub.impactFactor) meta.appendChild(el("span", { class: "pub-pill" }, [text(`IF ${pub.impactFactor}`)]));
    if (pub.quartile) meta.appendChild(el("span", { class: "pub-pill" }, [text(pub.quartile)]));
    if (pub.citations) meta.appendChild(el("span", { class: "pub-pill" }, [text(`${pub.citations} citations`)]));

    const card = el("div", { class: "pub-card" }, [
      el("div", { class: "pub-year" }, [text(`Published ${pub.year}`)]),
      el("div", { class: "pub-title" }, [text(pub.title)]),
      el("div", { class: "pub-authors" }, [text(pub.authors)]),
      meta,
      el("div", { class: "pub-venue" }, [text(`${pub.venue} • ${pub.volume}`)]),
    ]);
    pubList.appendChild(card);
  });
}

async function renderProjects() {
  const grid = document.getElementById("projectGrid");
  let projects;
  try {
    projects = await loadJSON("data/projects.json");
  } catch (e) {
    grid.textContent = "Could not load projects.json";
    return;
  }
  projects.forEach((proj) => {
    const card = el("div", { class: "project-card" }, [
      el("div", { class: "project-icon" }, [text(proj.icon || "•")]),
      el("div", { class: "project-category" }, [text(proj.category)]),
      el("div", { class: "project-title" }, [text(proj.title)]),
      el("div", { class: "project-client" }, [text(proj.client)]),
      el("div", { class: "project-desc" }, [text(proj.description)]),
      chips(proj.tags || []),
    ]);
    grid.appendChild(card);
  });
}

async function renderCertifications() {
  const grid = document.getElementById("certGrid");
  const filterRow = document.getElementById("certFilterRow");
  let certs;
  try {
    certs = await loadJSON("data/certifications.json");
  } catch (e) {
    grid.textContent = "Could not load certifications.json";
    return;
  }

  const rawCats = [...new Set(certs.flatMap((c) => Array.isArray(c.category) ? c.category : [c.category]))];
  const customOrder = ["Artificial Intelligence", "Deep Learning", "Machine Learning", "Project Management", "Data Analysis"];
  
  const cats = rawCats.sort((a, b) => {
    const posA = customOrder.indexOf(a) === -1 ? 999 : customOrder.indexOf(a);
    const posB = customOrder.indexOf(b) === -1 ? 999 : customOrder.indexOf(b);
    return posA - posB;
  });

  let active = "All";

  function draw() {
    grid.innerHTML = "";
    
    const visible = active === "All" ? certs : certs.filter((c) => {
      if (Array.isArray(c.category)) {
        return c.category.includes(active);
      }
      return c.category === active;
    });

    visible.forEach((cert) => {
      const img = el("img", { class: "cert-thumb", src: cert.image, alt: cert.title });
      withImageFallback(img, "add certificate image");
      
      const displayCategory = Array.isArray(cert.category) ? cert.category.join(" • ") : cert.category;

      const card = el("a", { class: "cert-card", href: cert.link || cert.image, target: "_blank", rel: "noopener" }, [
        img,
        el("div", { class: "cert-info" }, [
          el("div", { class: "cert-cat" }, [text(displayCategory)]),
          el("div", { class: "cert-title" }, [text(cert.title)]),
        ]),
      ]);
      
      card.classList.add('fade-in-section', 'is-visible'); 
      grid.appendChild(card);
    });
  }

  ["All", ...cats].forEach((cat) => {
    const chip = el("button", { class: "filter-chip" + (cat === "All" ? " active" : "") }, [text(cat)]);
    chip.addEventListener("click", () => {
      active = cat;
      [...filterRow.children].forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      draw();
    });
    filterRow.appendChild(chip);
  });

  draw();
}

async function renderGoogleBadges() {
  const grid = document.getElementById("gsbGrid");
  const updatedLabel = document.getElementById("gsbUpdated");
  let data;
  try {
    data = await loadJSON("data/google-badges.json");
  } catch (e) {
    grid.textContent = "Could not load google-badges.json";
    return;
  }

  if (!data.badges || data.badges.length === 0) {
    grid.appendChild(
      el("p", { class: "gsb-empty" }, [
        text("No badges synced yet — set your public profile URL in .github/workflows/sync-google-badges.yml and run it once from the Actions tab."),
      ])
    );
    return;
  }

  if (updatedLabel && data.updated_at) {
    const d = new Date(data.updated_at);
    updatedLabel.textContent = `Auto-synced daily · last updated ${d.toLocaleDateString()}`;
  }

  data.badges.forEach((b) => {
    const img = el("img", { class: "cert-thumb gsb-thumb", src: b.image, alt: b.title });
    withImageFallback(img, "badge image");
    const card = el("a", { class: "cert-card", href: b.link || "#", target: "_blank", rel: "noopener" }, [
      img,
      el("div", { class: "cert-info" }, [
        el("div", { class: "cert-cat" }, [text("Google Cloud Skills Boost")]),
        el("div", { class: "cert-title" }, [text(b.title)]),
      ]),
    ]);
    grid.appendChild(card);
  });
}

async function renderCredlyBadges() {
  const grid = document.getElementById("credlyGrid");
  const updatedLabel = document.getElementById("credlyUpdated");
  let data;
  try {
    data = await loadJSON("data/credly-badges.json");
  } catch (e) {
    grid.textContent = "Could not load credly-badges.json";
    return;
  }

  if (!data.badges || data.badges.length === 0) {
    grid.appendChild(el("p", { class: "gsb-empty" }, [text("No Credly badges synced yet.")]));
    return;
  }

  if (updatedLabel && data.updated_at) {
    const d = new Date(data.updated_at);
    updatedLabel.textContent = `Auto-synced daily · last updated ${d.toLocaleDateString()}`;
  }

  data.badges.forEach((b) => {
    const img = el("img", { class: "cert-thumb gsb-thumb", src: b.image, alt: b.title });
    withImageFallback(img, "badge image");
    const card = el("a", { class: "cert-card", href: b.link || "#", target: "_blank", rel: "noopener" }, [
      img,
      el("div", { class: "cert-info" }, [
        el("div", { class: "cert-cat" }, [text("Credly Verified")]),
        el("div", { class: "cert-title" }, [text(b.title)]),
      ]),
    ]);
    grid.appendChild(card);
  });
}

async function renderWorkbench() {
  const grid = document.getElementById("workbenchGrid");
  if (!grid) return;
  let projects = await loadJSON("data/workbench.json").catch(() => null);
  if (!projects) return;

  projects.forEach((proj) => {
    const card = el("div", { class: "project-card" }, [
      el("div", { class: "project-category" }, [text(proj.category || "Personal Work")]),
      el("div", { class: "project-title" }, [text(proj.title)]),
      el("div", { class: "project-desc" }, [text(proj.description)]),
      chips(proj.tags || [])
    ]);
    card.classList.add('fade-in-section', 'is-visible');
    grid.appendChild(card);
  });
}

async function renderTestimonials() {
  const track = document.getElementById("testimonialGrid");
  const dotsWrap = document.getElementById("testimonialDots");
  let items;
  try {
    items = await loadJSON("data/testimonials.json");
  } catch (e) {
    track.textContent = "Could not load testimonials.json";
    return;
  }
  if (!items.length) return;

  items.forEach(() => {
    dotsWrap.appendChild(el("button", { class: "dot" }));
  });
  items.forEach((tsm) => {
    const card = el("div", { class: "testimonial-card testimonial-slide" }, [
      el("p", { class: "testimonial-quote" }, [text(`"${tsm.quote}"`)]),
      el("div", { class: "testimonial-person" }, [
        el("div", { class: "avatar" }, [text(tsm.initials)]),
        el("div", {}, [
          el("div", { class: "testimonial-name" }, [text(tsm.name)]),
          el("div", { class: "testimonial-title" }, [text(`${tsm.title} — ${tsm.location}`)]),
        ]),
      ]),
    ]);
    track.appendChild(card);
  });

  const slides = Array.from(track.querySelectorAll(".testimonial-slide"));
  const dots = Array.from(dotsWrap.querySelectorAll(".dot"));
  let current = 0;
  let autoplayTimer = null;

  function setActiveDot(index) {
    dots[current]?.classList.remove("is-active");
    current = index;
    dots[current]?.classList.add("is-active");
  }
  setActiveDot(0);

  function scrollToSlide(index, userInitiated) {

    track.scrollTo({ left: slides[index].offsetLeft, behavior: "smooth" });
    setActiveDot(index);
    if (userInitiated) restartAutoplay();
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => scrollToSlide(i, true));
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          const idx = slides.indexOf(entry.target);
          if (idx !== -1) setActiveDot(idx);
        }
      });
    },
    { root: track, threshold: 0.6 }
  );
  slides.forEach((s) => observer.observe(s));

  function restartAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = setInterval(() => {
      scrollToSlide((current + 1) % slides.length, false);
    }, 6000);
  }
  if (slides.length > 1) restartAutoplay();

  let scrollPauseTimeout;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollPauseTimeout);
    if (autoplayTimer) clearInterval(autoplayTimer);
    scrollPauseTimeout = setTimeout(restartAutoplay, 4000);
  });
}

async function renderHobbies() {
  const grid = document.getElementById("hobbyGrid");
  let items;
  try {
    items = await loadJSON("data/hobbies.json");
  } catch (e) {
    grid.textContent = "Could not load hobbies.json";
    return;
  }
  items.forEach((h) => {
    grid.appendChild(
      el("div", { class: "hobby-card" }, [
        el("div", { class: "hobby-icon" }, [text(h.icon)]),
        el("div", { class: "hobby-title" }, [text(h.title)]),
        el("div", { class: "hobby-desc" }, [text(h.description)]),
      ])
    );
  });
}

async function renderRepos(profile) {
  const grid = document.getElementById("repoGrid");
  const status = document.getElementById("repoStatus");
  const username = profile && profile.githubUsername;
  if (!username) {
    status.textContent = "Set githubUsername in data/profile.json to pull your repos automatically.";
    return;
  }

  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
    if (!res.ok) throw new Error("GitHub API request failed");
    const repos = await res.json();

    if (!Array.isArray(repos) || repos.length === 0) {
      status.textContent = "No public repositories found for this username yet.";
      return;
    }

    status.remove();
    repos.forEach((repo) => {
      const card = el("a", { class: "repo-card", href: repo.html_url, target: "_blank", rel: "noopener" }, [
        el("div", { class: "repo-name" }, [text(repo.name)]),
        el("div", { class: "repo-desc" }, [text(repo.description || "No description provided.")]),
        el("div", { class: "repo-meta" }, [
          el("span", {}, [text(repo.language || "—")]),
          el("span", {}, [text(`★ ${repo.stargazers_count}`)]),
        ]),
      ]);
      grid.appendChild(card);
    });
  } catch (e) {
    status.textContent = "Couldn't reach the GitHub API right now — check back later, or update your username.";
  }
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  const targets = document.querySelectorAll('section, .skill-card, .timeline-item, .project-card, .pub-card, .cert-card, .wb-card, .testimonial-carousel');
  targets.forEach(el => {
    el.classList.add('fade-in-section'); 
    observer.observe(el);
  });
}

async function renderEducation() {
  const wrap = document.getElementById("educationTimeline");
  let items;
  try {
    items = await loadJSON("data/education.json");
  } catch (e) {
    wrap.textContent = "Could not load education.json";
    return;
  }
  items.forEach((item) => {
    const node = el("div", { class: "timeline-item" });
    node.appendChild(el("div", { class: "timeline-period" }, [text(`${item.start} - ${item.end}`)]));
    node.appendChild(el("div", { class: "timeline-role" }, [text(item.course)]));
    node.appendChild(el("div", { class: "timeline-org" }, [text(`${item.institution}${item.location ? " • " + item.location : ""}`)]));
    wrap.appendChild(node);
  });
}

function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("primaryNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

(async function init() {
  initMobileNav();
  const profile = await renderProfile();
  
  try {
    await Promise.all([
      renderSkills(),
      renderEducation(),
      renderExperience(),
      renderResearch(profile),
      renderProjects(),
      renderWorkbench(),
      renderCertifications(),
      renderGoogleBadges(),
      renderCredlyBadges(), 
      renderTestimonials(),
      renderHobbies(),
      renderRepos(profile)
    ]);
  } catch (error) {
    console.error("A section failed to render:", error);
  }
  
  initScrollAnimations();
})();