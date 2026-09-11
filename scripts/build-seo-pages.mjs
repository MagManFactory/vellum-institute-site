import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ORG_LD = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'EducationalOrganization'],
  name: 'Vellum Institute',
  url: 'https://velluminstitute.org',
  description: 'A small, application-based online institute where high school students take live seminars with university faculty, then go further with one-on-one guided research or apprenticeship.'
};

const COURSES = [
  { title: 'AI and Society', tag: 'confirmed', q: 'How artificial intelligence is reshaping work, education, creativity, politics, relationships, and decision-making, ending in an independent project on a major AI-driven question.' },
  { title: 'Social Entrepreneurship', tag: 'confirmed', q: 'Can business solve social problems? Students study real ventures, successful and failed, and develop their own proposal for a sustainable social enterprise.' },
  { title: 'Media Psychology', tag: 'confirmed', q: 'Who are you online? How digital environments shape identity, attention, persuasion, and self-presentation, and what AI adds to questions of authenticity.' },
  { title: 'Geopolitics in the Age of AI', tag: 'confirmed', q: 'How emerging technology is reshaping global power: US-China competition, semiconductors, cybersecurity, information warfare, supply chains, and technological sovereignty.' },
  { title: 'Environmental Sustainability in Business', tag: 'confirmed', q: 'How should firms account for environmental harm across operations and supply chains—and turn sustainability gaps into organizational value? Cases and readings cover climate impact, toxics, resource depletion, and product disposal.' },
  { title: 'Behavioral Economics', tag: 'consideration', q: 'Why smart people make irrational decisions: predictable mistakes, failed incentives, framing, social influence, loss aversion, and bias, explored through a student-designed behavioral experiment or project.' },
  { title: 'Japanese Media, Culture, and Society: From Buddhist Texts to Global Anime', tag: 'consideration', q: 'How anime, manga, gaming, music, fashion, and technology made Japan a global cultural force, and how media shapes how nations are perceived.' }
];

const FAQS = [
  { q: 'Who is Vellum Institute for?', a: 'Academically curious high school students, typically grades 9 through 12, who intend to submit competitive applications to top-ranked colleges and want a genuine seminar experience with a real professor rather than another generic enrichment product. Students apply, they are not simply enrolled.' },
  { q: 'How does the application process work?', a: 'You start with a short inquiry, then a full application ranking up to three courses in order of preference, along with a brief writeup on your college goals. Applications are reviewed on a rolling basis, roughly ten to twelve weeks before a cohort starts, with a final deadline about three weeks before the course begins.' },
  { q: 'Do the seminars carry academic credit, such as AP or IB credit?', a: 'No. A Vellum seminar does not carry AP, IB, or any other transcripted credit, and it is not designed to. Its value is different: a finished piece of original work to discuss in an application essay or interview, and an honest test of college-level seminar work before it counts toward a degree. Families are choosing a real intellectual relationship and a body of work, not a credit substitute.' },
  { q: 'What happens if a course does not fill?', a: 'Every course needs a minimum of eight students to run. If your top-ranked course does not fill, we place you in the next course on your list that does, or let you know as soon as we can so you can decide how to proceed.' },
  { q: 'Is there a cost to apply?', a: 'No. There is no cost or deposit to express interest or to complete a full application. We share full pricing directly with each family once a student is matched to a confirmed cohort, before anything is finalized.' },
  { q: 'Can a student take two courses in the same cohort?', a: 'Yes, when the two courses meet on different schedules. We cap it at two courses per student per cohort. Indicate interest on the application, rank preferences for the second course, and we confirm the schedule works before admitting into both.' },
  { q: 'Who teaches the courses?', a: 'University professors with real subject-matter depth, not teaching assistants or graduate students. We list a course\'s faculty status plainly. A course marked FACULTY CONFIRMED has a professor in place; a course marked FACULTY UNDER CONSIDERATION does not yet, and we will not run it until it does.' },
  { q: 'When do cohorts run?', a: 'Our inaugural cohort runs in spring 2027, February through April. We plan to add summer and fall cohorts after that, depending on demand.' },
  { q: 'What is the research mentorship, and can anyone apply for it?', a: 'It is optional, eight-hour, one-on-one guided research or apprenticeship with the same professor a student already worked with in a course. It is only available to students who have completed a Vellum course, we do not open it to outside applicants.' },
  { q: 'How is this different from a research-mentorship company?', a: 'Most paid research programs match a student to a mentor they have never met. Ours follows a live seminar the student already completed with the professor, so the relationship is real before any guided research or apprenticeship begins. There are no gimmicks, no publishing in an affiliated journal, no manufactured credential. We focus on real project outcomes a student can speak to with substance and highlight in their college applications.' },
  { q: 'I am a college counsellor. How can I get more information?', aHtml: 'Start on the <a href="/counselors/">counselors page</a>. Complete the short survey and we send <em>The Hidden Rules of College</em> as a free gift.', aText: 'Start on the counselors page. Complete the short survey and we send The Hidden Rules of College as a free gift.' }
];

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function courseRowsHtml() {
  return COURSES.map((course, i) => {
    const statusLabel = course.tag === 'confirmed' ? 'FACULTY CONFIRMED' : 'FACULTY UNDER CONSIDERATION';
    const statusClass = course.tag === 'confirmed' ? 'status-open' : 'status-progress';
    return `      <div class="course-row" data-tag="${course.tag}">
        <span class="course-idx">${String(i + 1).padStart(2, '0')}</span>
        <div>
          <div class="course-row-top"><h3>${esc(course.title)}</h3><span class="course-status ${statusClass}">${statusLabel}</span></div>
          <p>${esc(course.q)}</p>
        </div>
        <div class="course-row-meta">8 live sessions<br>Max 15 students</div>
        <span class="course-arrow">&rarr;</span>
      </div>`;
  }).join('\n');
}

function faqItemsHtml() {
  return FAQS.map((item) => {
    const answer = item.aHtml || esc(item.a);
    return `      <div class="faq-item">
        <button class="faq-q" type="button" aria-expanded="false">
          <span>${esc(item.q)}</span>
          <span class="plus">+</span>
        </button>
        <div class="faq-a"><p>${answer}</p></div>
      </div>`;
  }).join('\n');
}

function ldScript(data) {
  return `<script type="application/ld+json">\n${JSON.stringify(data)}\n</script>`;
}

function pageHead({ title, description, path, extraLd = '', extraCss = '' }) {
  const url = `https://velluminstitute.org${path}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-W4TVNVLX3X"></script>
<script src="/js/gtag.js"></script>
<title>${esc(title)}</title>
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://velluminstitute.org/images/why-vellum-manuscript.jpg">
<meta property="og:site_name" content="Vellum Institute">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${ldScript(ORG_LD)}
${extraLd}
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath d='M6 8h9l9 26 9-26h9L28 42h-8L6 8z' fill='%23A9803F'/%3E%3C/svg%3E">
<link rel="stylesheet" href="/css/site-core.css">
${extraCss}
</head>`;
}

function chrome(currentPath) {
  const link = (href, label) => {
    const current = href === currentPath ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}>${label}</a>`;
  };
  return `<noscript><style>.reveal{opacity:1 !important; transform:none !important;} .faq-a{max-height:none !important; overflow:visible;}</style></noscript>
<header class="site-nav" id="siteNav">
  <div class="nav-inner">
    <a class="brand" href="/">
      <svg class="brand-mark" width="30" height="30" viewBox="0 0 48 48" aria-hidden="true"><path d="M6 8h9l9 26 9-26h9L28 42h-8L6 8z" fill="#A9803F"/></svg>
      <span class="brand-word">Vellum Institute</span>
    </a>
    <nav class="nav-links">
      ${link('/courses/', 'Courses')}
      ${link('/how-it-works/', 'How it works')}
      ${link('/pricing/', 'Pricing')}
      ${link('/guided-research/', 'Guided research')}
      ${link('/faq/', 'FAQ')}
      ${link('/newsletter/', 'Newsletter')}
      ${link('/about/', 'About')}
    </nav>
    <div class="nav-cta">
      <a href="/apply/" class="btn-primary">Apply now</a>
      <button class="burger" id="burgerBtn" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </div>
  <div class="mobile-menu" id="mobileMenu">
    ${link('/courses/', 'Courses')}
    ${link('/how-it-works/', 'How it works')}
    ${link('/pricing/', 'Pricing')}
    ${link('/guided-research/', 'Guided research')}
    ${link('/faq/', 'FAQ')}
    ${link('/newsletter/', 'Newsletter')}
    ${link('/about/', 'About')}
    ${link('/apply/', 'Apply now')}
  </div>
</header>`;
}

function footer() {
  return `<footer>
  <div class="wrap footer-top">
    <div class="footer-brand">
      <div class="footer-brand-mark">
        <svg width="26" height="26" viewBox="0 0 48 48" aria-hidden="true"><path d="M6 8h9l9 26 9-26h9L28 42h-8L6 8z" fill="#A9803F"/></svg>
        Vellum Institute
      </div>
      <p class="tag">A small, application-based online institute pairing high school students with university faculty and experienced industry professionals affiliated with premier universities, then a real research relationship.</p>
    </div>
    <div>
      <h5>Explore</h5>
      <ul>
        <li><a href="/courses/">Courses</a></li>
        <li><a href="/how-it-works/">How it works</a></li>
        <li><a href="/guided-research/">Guided research</a></li>
        <li><a href="/pricing/">Pricing</a></li>
      </ul>
    </div>
    <div>
      <h5>Institute</h5>
      <ul>
        <li><a href="/faq/">FAQ</a></li>
        <li><a href="/counselors/">Counselors</a></li>
        <li><a href="/apply/">Apply</a></li>
        <li><a href="mailto:valerie.angstrom@velluminstitute.org">Contact us</a></li>
        <li><a href="/privacy/">Privacy</a></li>
      </ul>
    </div>
    <div>
      <h5>Cohorts</h5>
      <ul>
        <li>Spring 2027 cohort: February&ndash;April (inaugural)</li>
        <li>Summer cohort: July&ndash;August</li>
        <li>Fall cohort: October&ndash;December</li>
      </ul>
    </div>
  </div>
  <div class="wrap footer-word"><span>VELLUM INSTITUTE</span></div>
  <div class="wrap footer-bottom">
    <span>&copy; 2026 Vellum Institute. All rights reserved. · <a href="/privacy/">Privacy</a></span>
    <span>Every course capped at fifteen students. Applications reviewed on a rolling basis.</span>
  </div>
</footer>
<script src="/js/site-nav.js"></script>`;
}

const applyFormHtml = `<form id="applyForm">
        <div class="form-row">
          <div class="form-field">
            <label for="parentName">Parent / guardian name</label>
            <input type="text" id="parentName" required>
          </div>
          <div class="form-field">
            <label for="studentName">Student name</label>
            <input type="text" id="studentName" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="email">Email</label>
            <input type="email" id="email" required>
          </div>
          <div class="form-field">
            <label for="grade">Student's current grade</label>
            <select id="grade" required>
              <option value="">Select one</option>
              <option>9th grade</option>
              <option>10th grade</option>
              <option>11th grade</option>
              <option>12th grade</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field full">
            <label for="schoolName">School name</label>
            <input type="text" id="schoolName" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="state">State / province</label>
            <input type="text" id="state">
          </div>
          <div class="form-field">
            <label for="country">Country</label>
            <select id="country" name="country" required autocomplete="country">
              <option value="">Select country</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field full">
            <label for="curriculum">High school curriculum</label>
            <select id="curriculum" required>
              <option value="">Select one</option>
              <option>American curriculum</option>
              <option>British curriculum (Cambridge / IGCSE, A-Levels)</option>
              <option>International Baccalaureate (IB)</option>
              <option>Other national curriculum (e.g. French Baccalaur&eacute;at, Indian CBSE/ICSE)</option>
              <option>Other / not sure</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field full">
            <label for="courseInterest">Course of interest</label>
            <select id="courseInterest" required></select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field full">
            <label for="notes">Briefly, what are your college goals?</label>
            <textarea id="notes" placeholder="A few sentences is plenty. A fuller writeup is part of the full application." required></textarea>
          </div>
        </div>
        <div class="hp-field" aria-hidden="true">
          <label for="website">Website</label>
          <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
        </div>
        <button type="submit" class="btn-primary">Start the conversation</button>
        <p class="form-note">By submitting, you agree to be contacted by Vellum Institute about this application.</p>
      </form>
      <div class="success-msg" id="successMsg">
        <h3>Thank you, we'll be in touch</h3>
        <p>A member of our team will reach out within two business days with next steps.</p>
      </div>
      <div class="error-msg" id="errorMsg">
        <h3>Something went wrong</h3>
        <p>We could not submit your inquiry just now. Please try again, or email us directly at <a href="mailto:valerie.angstrom@velluminstitute.org">valerie.angstrom@velluminstitute.org</a>.</p>
      </div>`;

const pages = {
  'courses/index.html': {
    title: 'Courses and seminars | Vellum Institute',
    description: 'Live, application-based seminars for high school students, built around big questions. Every course is capped at fifteen students and ends in a substantive project.',
    path: '/courses/',
    extraLd: ldScript({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Vellum Institute seminars',
      itemListElement: COURSES.map((course, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Course',
          name: course.title,
          description: course.q,
          provider: {
            '@type': ['Organization', 'EducationalOrganization'],
            name: 'Vellum Institute',
            url: 'https://velluminstitute.org'
          },
          educationalLevel: 'High school',
          timeRequired: 'P8W'
        }
      }))
    }),
    body: `<section class="page-hero" id="top">
  <div class="wrap">
    <span class="eyebrow-standalone">Catalog</span>
    <h1>Seminars built around big questions</h1>
    <p class="lead">Interdisciplinary and question-driven rather than built around a conventional subject silo. Every course ends in a substantive project.</p>
  </div>
</section>
<section class="courses" id="courses">
  <div class="wrap">
    <div class="course-filters">
      <button class="filter-btn active" type="button" data-filter="all">All courses</button>
      <button class="filter-btn" type="button" data-filter="confirmed">FACULTY CONFIRMED</button>
      <button class="filter-btn" type="button" data-filter="consideration">FACULTY UNDER CONSIDERATION</button>
    </div>
    <div class="course-index" id="courseGrid">
${courseRowsHtml()}
    </div>
  </div>
</section>
<section class="cta-band">
  <div class="wrap cta-inner">
    <h2>Interest is open for our inaugural spring cohort</h2>
    <p>Seats are limited to fifteen per course, and a course only runs once it reaches eight. Reach out early to get your first choice.</p>
    <div class="cta-actions">
      <a href="/apply/" class="btn-primary light">Apply</a>
      <a href="/how-it-works/" class="text-link light">How it works <span class="arrow">&rarr;</span></a>
    </div>
  </div>
</section>
<script src="/js/catalog-ui.js"></script>`
  },
  'how-it-works/index.html': {
    title: 'How Vellum works | Vellum Institute',
    description: 'From a short inquiry to a live seminar and optional guided research: how students apply, get matched to a cohort, and leave with a real body of work.',
    path: '/how-it-works/',
    body: `<section class="page-hero" id="top">
  <div class="wrap">
    <span class="eyebrow-standalone">Process</span>
    <h1>From application to a real body of work</h1>
    <p class="lead">Tell us who your student is, get matched to a cohort, take the seminar, and optionally continue with the same professor.</p>
  </div>
</section>
<section class="how" id="how">
  <div class="wrap">
    <div class="steps">
      <div class="step">
        <span class="step-idx">01</span>
        <h4>Apply</h4>
        <p>Tell us who your student is and which course interests them. It takes two minutes and does not commit you to anything.</p>
      </div>
      <div class="step">
        <span class="step-idx">02</span>
        <h4>Get matched to a cohort</h4>
        <p>We follow up within two business days. If it looks like a good fit, we send a full application ahead of our inaugural spring cohort.</p>
      </div>
      <div class="step">
        <span class="step-idx">03</span>
        <h4>Take the seminar</h4>
        <p>Eight live, ninety-minute sessions with the same small group and the same professor, ending in a substantive independent project.</p>
      </div>
      <div class="step">
        <span class="step-idx">04</span>
        <h4>Go further, optionally</h4>
        <p>Continue with the same professor into one-on-one guided research or apprenticeship and leave with a real body of work behind you.</p>
      </div>
    </div>
  </div>
</section>
<section class="cta-band">
  <div class="wrap cta-inner">
    <h2>Ready to start the conversation?</h2>
    <p>A parent or the student can complete the inquiry. It does not commit you to anything.</p>
    <div class="cta-actions">
      <a href="/apply/" class="btn-primary light">Apply</a>
      <a href="/courses/" class="text-link light">Browse courses <span class="arrow">&rarr;</span></a>
    </div>
  </div>
</section>`
  },
  'pricing/index.html': {
    title: 'Seminar pricing | Vellum Institute',
    description: 'Vellum seminar tuition is the same for every family and shared directly once a student is matched to a cohort. No bidding and no hidden tiers.',
    path: '/pricing/',
    body: `<section class="page-hero" id="top">
  <div class="wrap pricing-layout">
    <div>
      <span class="eyebrow-standalone">Pricing</span>
      <h1>Straightforward, and the same for every family</h1>
      <p class="lead">One price per course, shared directly with every family who reaches out. No bidding and no hidden tiers.</p>
    </div>
    <div class="price-panel">
      <span class="tag-mono">Seminar tuition</span>
      <div class="price-amount">By inquiry</div>
      <p class="price-desc">Shared directly once your student is matched to a cohort.</p>
      <ul class="price-list">
        <li>Eight live 90-minute sessions</li>
        <li>Capped at fifteen students</li>
        <li>Full pricing shared before anything is finalized</li>
      </ul>
    </div>
  </div>
</section>
<section>
  <div class="wrap">
    <p class="body-lg">There is no cost or deposit to express interest or to complete a full application. We share full pricing directly with each family once a student is matched to a confirmed cohort, before anything is finalized.</p>
    <p class="body-lg">Optional guided research or apprenticeship after the seminar is also priced by inquiry and is only open to students who have completed a Vellum course.</p>
    <p style="margin-top:28px;"><a class="btn-primary" href="/apply/">Start the conversation</a></p>
  </div>
</section>`
  },
  'guided-research/index.html': {
    title: 'Guided research and apprenticeship | Vellum Institute',
    description: 'After the seminar, students can continue one-on-one with the same professor for eight hours of guided research or apprenticeship. Open only to students who have completed a Vellum course.',
    path: '/guided-research/',
    body: `<section class="page-hero" id="top">
  <div class="wrap">
    <span class="eyebrow-standalone">After the seminar</span>
    <h1>Go from a seminar to guided research or apprenticeship</h1>
    <p class="lead">The seminar alone gives a student a genuine, college-level experience worth having on its own. For those who want to go further, a student can continue one-on-one with the same professor.</p>
  </div>
</section>
<section class="research on-dark" id="research">
  <div class="wrap research-layout">
    <div>
      <p>The seminar alone gives a student a genuine, college-level experience worth having on its own. For those who want to go further, a student can continue one-on-one with the same professor, someone they have already worked with, rather than a stranger assigned for the purpose.</p>
      <p>This is where a generic "research program" and a Vellum guided research or apprenticeship relationship diverge. There are no gimmicks here, no publishing in an affiliated journal, no manufactured credential. We focus on real project outcomes a student can speak to with substance and highlight in their college applications, supervised closely by a professor who already knows how they think.</p>
    </div>
    <div class="research-panel">
      <div class="price-amount light">By inquiry</div>
      <p class="price-desc light">Eight hours of dedicated one-on-one time</p>
      <ul class="price-list light">
        <li>Only open to students who have completed a Vellum course</li>
        <li>Same professor, building on work already started</li>
        <li>Ends with an institute-approved certificate of completion</li>
        <li>Certificate documents the project topic, findings, and the student's own contribution</li>
      </ul>
    </div>
  </div>
</section>
<section class="cta-band">
  <div class="wrap cta-inner">
    <h2>Start with the seminar</h2>
    <p>Guided research follows a completed Vellum course. Apply for a seminar first.</p>
    <div class="cta-actions">
      <a href="/apply/" class="btn-primary light">Apply</a>
      <a href="/courses/" class="text-link light">Browse courses <span class="arrow">&rarr;</span></a>
    </div>
  </div>
</section>`
  },
  'faq/index.html': {
    title: 'FAQ | Vellum Institute',
    description: 'Answers for families considering Vellum: who it is for, how applications work, credit, cost to apply, faculty, cohorts, and guided research.',
    path: '/faq/',
    extraLd: ldScript({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.aText || item.a
        }
      }))
    }),
    body: `<section class="page-hero" id="top">
  <div class="wrap">
    <span class="eyebrow-standalone">FAQ</span>
    <h1>What families ask before applying</h1>
    <p class="lead">Who Vellum is for, how the application works, what a seminar is, and how guided research fits after the course.</p>
  </div>
</section>
<section class="faq" id="faq">
  <div class="wrap">
    <div class="faq-list" id="faqList">
${faqItemsHtml()}
    </div>
  </div>
</section>
<script src="/js/catalog-ui.js"></script>`
  },
  'apply/index.html': {
    title: 'Apply to Vellum | Vellum Institute',
    description: 'Start a Vellum inquiry. A parent or student can tell us a little about themselves. It starts the conversation and does not commit you to anything.',
    path: '/apply/',
    body: `<section class="page-hero apply" id="apply">
  <div class="wrap apply-layout">
    <div>
      <span class="eyebrow-standalone">Apply</span>
      <h1>Tell us a little about yourself</h1>
      <p class="lead">A parent or the student can complete this, whichever is easier. It starts the conversation, it does not commit you to anything. A member of our team will follow up within two business days with next steps and, if it is a good fit, a full application.</p>
      <div class="apply-facts">
        <div class="apply-fact"><span class="idx">01</span><div><strong>Rolling review.</strong><p>We read every inquiry as it arrives, not on one fixed date.</p></div></div>
        <div class="apply-fact"><span class="idx">02</span><div><strong>Tell us what draws you.</strong><p>A single course of interest is enough for now; a full application follows.</p></div></div>
        <div class="apply-fact"><span class="idx">03</span><div><strong>No payment today.</strong><p>This step starts a conversation. It is not a commitment or a charge.</p></div></div>
      </div>
    </div>
    <div class="apply-panel">
      ${applyFormHtml}
    </div>
  </div>
</section>
<script src="/js/apply-form.js"></script>
<script type="module">
  import { fillCountrySelect } from '/js/countries.js';
  fillCountrySelect(document.getElementById('country'));
</script>`
  }
};

for (const [rel, page] of Object.entries(pages)) {
  const html = `${pageHead(page)}
<body>
${chrome(page.path)}
${page.body}
${footer()}
</body>
</html>
`;
  const out = join(root, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log('wrote', rel);
}

writeFileSync(join(root, 'scripts/seo-content.json'), JSON.stringify({ courses: COURSES, faqs: FAQS }, null, 2) + '\n');
console.log('wrote scripts/seo-content.json');
