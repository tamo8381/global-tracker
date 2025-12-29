// Utilities to build printable DOM elements for company / system exports
export async function createCompanyPrintElement(company = {}, baseURL = '') {
  // Normalize provided baseURL or fall back to current origin. We avoid importing
  // the api module here to keep the helper lightweight and test-friendly.
  const base = (baseURL && String(baseURL).replace(/\/$/, '')) || (typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '');
  const container = document.createElement('div');
  container.className = 'print-company';
  // Mark elements created by this utility so callers can manage/cleanup them safely.
  container.classList.add('generated-print');
  container.setAttribute('data-generated-print', 'true');
  // Prevent page breaks inside a single company section where possible
  container.style.pageBreakInside = 'avoid';
  container.style.breakInside = 'avoid';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'flex-start';
  header.style.marginBottom = '12px';

  const left = document.createElement('div');
  const title = document.createElement('h1');
  title.textContent = company.name || 'Company';
  title.style.margin = '0';
  title.style.fontSize = '20px';
  const country = document.createElement('div');
  country.innerHTML = `<strong>${company.country?.name || 'N/A'}</strong>`;
  country.style.marginTop = '6px';
  left.appendChild(title);
  left.appendChild(country);

  const right = document.createElement('div');
  right.style.textAlign = 'right';
  right.style.minWidth = '160px';
  const websiteLink = document.createElement('a');
  websiteLink.href = company.website || '#';
  websiteLink.textContent = company.website || 'N/A';
  websiteLink.style.wordBreak = 'break-all';
  websiteLink.style.fontSize = '0.95rem';
  right.appendChild(websiteLink);

  header.appendChild(left);
  header.appendChild(right);

  container.appendChild(header);

  // Helper to render arrays as multi-column lists
  const renderListSection = (titleText, arr) => {
    const secTitle = document.createElement('div');
    secTitle.style.marginTop = '8px';
    secTitle.innerHTML = `<strong>${titleText}</strong>`;
    container.appendChild(secTitle);

    if (!Array.isArray(arr) || arr.length === 0) {
      const none = document.createElement('div');
      none.textContent = 'N/A';
      container.appendChild(none);
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'two-column-list';
    arr.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  };

  renderListSection('IP Addresses', company.ipAddresses || []);
  renderListSection('Subdomains', company.subdomains || []);

  // People table
  const peopleTitle = document.createElement('div');
  peopleTitle.style.marginTop = '12px';
  peopleTitle.innerHTML = '<strong>People</strong>';
  container.appendChild(peopleTitle);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '6px';
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>
    <th style="border:1px solid #ddd;padding:6px;text-align:left">Photo</th>
    <th style="border:1px solid #ddd;padding:6px;text-align:left">Name</th>
    <th style="border:1px solid #ddd;padding:6px;text-align:left">Email</th>
    <th style="border:1px solid #ddd;padding:6px;text-align:left">Position</th>
  </tr>`;
  table.appendChild(thead);
  const tbody = document.createElement('tbody');

  // Helper: try to fetch the image and convert to data URL to avoid cross-origin
  // or mixed-content blocking when printing. If this fails, we fall back to
  // using the original absolute URL so the onerror handler can attempt a
  // backend fallback or SVG placeholder.
  const toDataUrl = async (url) => {
    try {
      if (typeof fetch !== 'function') return null;
      // Abort if the fetch takes too long to avoid long-running tests/environments
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutMs = 1500;
      let timer = null;
      if (controller) {
        timer = setTimeout(() => controller.abort(), timeoutMs);
      }
      const resp = await fetch(url, { mode: 'cors', signal: controller ? controller.signal : undefined });
      if (timer) clearTimeout(timer);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  for (const p of (company.people || [])) {
    const tr = document.createElement('tr');
    const photoTd = document.createElement('td');
    photoTd.style.padding = '6px';
    photoTd.style.verticalAlign = 'middle';
    if (p.photo) {
      const img = document.createElement('img');
      // Use the resolved base (prefer explicit baseURL param, otherwise use server default)
      const fileUrl = `${base}/uploads/${p.photo}`;
      const fallbackOrigin = (typeof window !== 'undefined') ? window.location.origin.replace(/:\d+$/, ':5000') : base;
      const fallbackUrl = `${fallbackOrigin}/uploads/${p.photo}`;
      // Try to inline from primary, then fallback; if both fail, use an SVG
      // placeholder so the photo column always renders an image.
      let dataUrl = null;
      try {
        dataUrl = await toDataUrl(fileUrl);
      } catch (e) {
        dataUrl = null;
      }
      if (!dataUrl) {
        try {
          dataUrl = await toDataUrl(fallbackUrl);
        } catch (e) {
          dataUrl = null;
        }
      }
      if (dataUrl) {
        img.src = dataUrl;
      } else {
        const initials = `${(p.firstName || '').charAt(0) || ''}${(p.lastName || '').charAt(0) || ''}`.toUpperCase() || 'U';
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72'><rect width='100%' height='100%' fill='%23e0e0e0'/><text x='50%' y='50%' font-size='28' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-family='Arial, Helvetica, sans-serif'>${initials}</text></svg>`;
        img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      }
      img.setAttribute('data-print-src', img.src);
      img.alt = `${p.firstName || ''} ${p.lastName || ''}`;
      img.style.width = '36px';
      img.style.height = '36px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
      photoTd.appendChild(img);
    } else {
      const initials = document.createElement('div');
      initials.textContent = `${(p.firstName || '').charAt(0) || ''}${(p.lastName || '').charAt(0) || ''}`.toUpperCase();
      initials.style.width = '36px';
      initials.style.height = '36px';
      initials.style.display = 'flex';
      initials.style.alignItems = 'center';
      initials.style.justifyContent = 'center';
      initials.style.background = '#e0e0e0';
      initials.style.borderRadius = '50%';
      photoTd.appendChild(initials);
    }

    const nameTd = document.createElement('td'); nameTd.style.padding = '6px'; nameTd.textContent = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'N/A';
    const emailTd = document.createElement('td'); emailTd.style.padding = '6px'; emailTd.textContent = p.email || '';
    const posTd = document.createElement('td'); posTd.style.padding = '6px'; posTd.textContent = p.position || '';

    tr.appendChild(photoTd);
    tr.appendChild(nameTd);
    tr.appendChild(emailTd);
    tr.appendChild(posTd);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);

  // Small visual guard to keep sections intact when printing
  const hr = document.createElement('div');
  hr.style.height = '8px';
  hr.style.margin = '8px 0';
  container.appendChild(hr);

  return container;
}

export async function createAllCompaniesPrintElement(fetchCompanies, fetchPeople, baseURL = '') {
  // Fetch all companies & people by paging to avoid server-side page limits
  const fetchAll = async (fn, pageSize = 500) => {
    let page = 1;
    let all = [];
    while (true) {
      const resp = await fn({ page, limit: pageSize });
      const data = resp?.data || [];
      const total = resp?.pagination?.total ?? data.length;
      all = all.concat(data);
      if (all.length >= total || data.length === 0) break;
      page += 1;
    }
    return all;
  };

  const companies = await fetchAll(fetchCompanies);
  const people = await fetchAll(fetchPeople);

  // Group people by company id
  const peopleByCompany = people.reduce((acc, p) => {
    const cid = p.company?._id || p.company;
    if (!cid) return acc;
    acc[cid] = acc[cid] || [];
    acc[cid].push(p);
    return acc;
  }, {});

  const root = document.createElement('div');
  root.className = 'print-company generated-print';
  root.setAttribute('data-generated-print', 'true');

  const title = document.createElement('h1');
  title.textContent = 'Global Export - Companies & People';
  root.appendChild(title);

  for (const c of companies) {
    const cCopy = { ...c, people: peopleByCompany[c._id] || [] };
    const section = await createCompanyPrintElement(cCopy, baseURL);
    section.style.pageBreakInside = 'avoid';
    section.style.marginTop = '18px';
    root.appendChild(section);
    const hr = document.createElement('hr');
    root.appendChild(hr);
  }

  return root;
}

// Helper to print an element inside a temporary iframe to ensure the content
// is fully rendered and isolated from the parent page (avoids blank prints).
export async function printElementInIframe(element, opts = { waitMs: 300 }) {
  if (!(element instanceof HTMLElement)) {
    throw new Error('printElementInIframe requires an HTMLElement');
  }

  const PRINT_STYLES = `
    html,body{height:100%;margin:0;padding:0;color:#000;background:#fff}
    .print-company{padding:12mm;box-sizing:border-box;color:#000;background:#fff;max-width:100%}
    .print-company h1{margin:0 0 6px 0;font-size:20px}
    .print-company img{width:36px;height:36px;object-fit:cover;border-radius:50%;display:inline-block}
    .print-company table{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:8px}
    .print-company th,.print-company td{border:1px solid #ddd;padding:6px;vertical-align:top;word-break:break-word;overflow-wrap:anywhere}
    .print-company ul.two-column-list{-webkit-column-count:2;column-count:2;column-gap:24px;margin:0 0 1em 1.2em;break-inside:avoid;-webkit-column-break-inside:avoid}
    @page{size:A4;margin:12mm}
  `;

  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Print</title><style>${PRINT_STYLES}</style></head><body></body></html>`);
      doc.close();

      // Clone the element into the iframe's body (deep clone)
      const clone = element.cloneNode(true);
      doc.body.appendChild(clone);

      const waitForRender = (ms = opts.waitMs || 300) => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms))));

      // Wait for a short time to ensure images and layout settle
      waitForRender().then(() => {
        try {
          // Attempt to focus and print the iframe's window
          iframe.contentWindow.focus();
          // Use try/catch: some environments may block print
          try { iframe.contentWindow.print(); } catch (e) { console.error('Iframe print failed', e); }
        } finally {
          // Remove iframe after a short delay so printing can start
          setTimeout(() => {
            try { document.body.removeChild(iframe); } catch (e) {}
            resolve();
          }, 1000);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Print an HTML string in an off-screen iframe and resolve when printing completes.
export async function printHTMLString(htmlString, extraCSS = '') {
  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      // Keep iframe off-screen but visible so print works reliably
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '1024px';
      iframe.style.height = '768px';
      iframe.style.border = '0';
      iframe.style.visibility = 'visible';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      const safeCSS = extraCSS || `
        html,body{height:100%;margin:0;padding:0;color:#000;background:#fff}
        .print-company{position:static;box-sizing:border-box;padding:12mm;max-width:100%;}
        .print-company img{width:36px;height:36px;object-fit:cover;border-radius:50%;display:inline-block}
        .print-company ul.two-column-list{-webkit-column-count:2;column-count:2;-webkit-column-gap:24px;column-gap:24px;margin:0 0 1em 1.2em;break-inside:avoid;}
        .print-company table{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:8px}
        .print-company th,.print-company td{border:1px solid #ddd;padding:6px;word-break:break-word;overflow-wrap:anywhere;vertical-align:top}
        @page{size:A4;margin:12mm}
      `;

      doc.open();
      doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Print</title><style>${safeCSS}${extraCSS}</style></head><body>${htmlString}</body></html>`);
      doc.close();
      console.debug('printHTMLString: iframe appended and document written');

      const waitForImages = () => new Promise((r) => {
        const imgs = doc.images || [];
        if (!imgs.length) return r();
        let loaded = 0;
        for (let i = 0; i < imgs.length; i++) {
          const img = imgs[i];
          if (img.complete) {
            loaded += 1;
            if (loaded === imgs.length) return r();
          } else {
            img.onload = img.onerror = () => {
              loaded += 1;
              if (loaded === imgs.length) return r();
            };
          }
        }
      });

      const performPrint = async () => {
        try {
          await waitForImages();
          console.debug('printHTMLString: images loaded');
          // Give fonts and layout a moment
          await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
          setTimeout(() => {
            try {
              iframe.contentWindow.focus();
              console.debug('printHTMLString: invoking print');
              iframe.contentWindow.print();
            } catch (e) {
              console.error('iframe print error', e);
            }
            // cleanup after a short delay to allow printing to start
            setTimeout(() => {
              try { document.body.removeChild(iframe); } catch (e) {}
              resolve();
            }, 1200);
          }, 500);
        } catch (e) {
          try { document.body.removeChild(iframe); } catch (err) {}
          reject(e);
        }
      };

      // If iframe document already loaded, call; otherwise set onload
      if (iframe.contentWindow.document.readyState === 'complete' || iframe.contentWindow.document.readyState === 'interactive') {
        performPrint();
      } else {
        iframe.onload = performPrint;
      }
    } catch (err) {
      reject(err);
    }
  });
}
