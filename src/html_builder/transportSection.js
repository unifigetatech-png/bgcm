/**
 * Location, transport, and parking split section for the homepage.
 * Uses billing-free iframe embeds only — no Google API credential tokens in HTML.
 * Replace MAP_IFRAME_EMBED_URL with a Google My Maps embed when the multi-pin layer is ready.
 */

export const GOOGLE_MAPS_DESTINATION_URL = 'https://maps.app.goo.gl/QBPRoi6ZRKDiuNxK7';
export const APPLE_MAPS_DESTINATION_URL = 'https://maps.apple/p/.zKfYe_ArySuDA';

/** Paste your Google My Maps iframe embed URL here (e.g. https://www.google.com/maps/d/embed?mid=YOUR_MAP_ID). */
export const MY_MAPS_IFRAME_EMBED_URL = '';

/** Billing-free street map fallback until MY_MAPS_IFRAME_EMBED_URL is set. */
export const MAP_IFRAME_FALLBACK_URL = 'https://maps.google.com/maps?q=Burleigh+Gold+Coast+Motel,+1908+Gold+Coast+Highway,+Miami+QLD+4220&hl=en-AU&z=15&output=embed';

export function resolveMapIframeEmbedUrl() {
  if (MY_MAPS_IFRAME_EMBED_URL !== '') {
    return MY_MAPS_IFRAME_EMBED_URL;
  }

  return MAP_IFRAME_FALLBACK_URL;
}

/** Resolved map iframe src — prefers MY_MAPS_IFRAME_EMBED_URL when set. */
export const MAP_IFRAME_EMBED_URL = resolveMapIframeEmbedUrl();

const TRANSPORT_METRICS = [
  {
    badge: 'ON-SITE',
    badgeLabel: 'On-site parking',
    title: 'Guaranteed Secure Parking',
    description: 'Free allocated space per room. Stress-free vehicle placement directly inside our secure central courtyard layout — built perfectly to accommodate work utes, corporate vehicles, and family cars.',
  },
  {
    badge: '300 M',
    badgeLabel: '300 metres',
    title: 'Miami One Shopping Centre',
    description: 'A flat 3-minute stroll to stock up on everyday essentials. Features a full Coles supermarket, local pharmacies, specialty retail, and fast dining options just down the path.',
  },
  {
    badge: '200 M',
    badgeLabel: '200 metres',
    title: 'Burleigh Beach Coastline',
    description: 'Exactly a flat 200m walk (6 minutes) to the pristine local sand and fully patrolled swimming zones. Family-friendly foreshore parks and world-class coastal cafés sit just steps away.',
  },
  {
    badge: '100 M',
    badgeLabel: '100 metres',
    title: 'Gold Coast Highway Transit Links',
    description: 'Immediate access to express bus routes 700, 765, and 777 direct to the Gold Coast Airport (~25 min). Steps from the upcoming Christine Ave Light Rail hub (opening mid-July 2026).',
  },
];

export function generateTransportSectionStyles() {
  return `/* ── TRANSPORT & MAP SPLIT ── */
.transport-section-wrapper{
  display:flex;flex-wrap:wrap;width:100%;
  border-radius:8px;overflow:hidden;
  box-shadow:0 8px 30px rgba(0,0,0,0.05);
}
.map-visual-container{
  flex:1;min-width:300px;min-height:520px;
  position:relative;background:#e5e3df;
}
.map-visual-container.map-embed-canvas{overflow:hidden;}
.map-visual-container iframe,
.map-visual-container .map-embed-frame{
  display:block;width:100%;height:100%;
  min-height:520px;border:0;background:#e5e3df;
}
.info-content-panel{
  flex:1;min-width:300px;
  background:#103463;color:var(--white);
  padding:45px 40px;
  display:flex;flex-direction:column;justify-content:center;
}
.info-content-panel .panel-tag{
  color:var(--gold);font-weight:700;
  text-transform:uppercase;letter-spacing:1.5px;
  font-size:0.85rem;display:block;margin-bottom:8px;
}
.info-content-panel .panel-main-title{
  font-size:clamp(1.8rem,4vw,2.3rem);font-weight:800;
  margin:0 0 35px 0;line-height:1.3;
  text-transform:uppercase;letter-spacing:0.5px;color:var(--white);
}
.metric-row-grid{display:flex;flex-direction:column;gap:24px;}
.metric-item{display:flex;align-items:flex-start;gap:20px;}
.metric-badge{
  color:var(--gold);font-size:1.25rem;font-weight:900;
  min-width:95px;background:rgba(255,153,0,0.1);
  padding:4px 8px;border-radius:4px;text-align:center;
  letter-spacing:0.5px;line-height:1.2;
}
.metric-details{flex:1;}
.metric-details strong{display:block;font-size:1.1rem;color:var(--white);font-weight:700;}
.metric-details span{
  display:block;margin-top:3px;font-size:0.95rem;
  color:#d0daf0;line-height:1.5;
}
.routing-actions-wrapper{margin-top:35px;display:flex;gap:15px;flex-wrap:wrap;}
.btn-map-nav{
  background:var(--gold);color:#103463;padding:12px 24px;
  font-weight:700;font-size:0.85rem;text-transform:uppercase;text-decoration:none;
  border-radius:4px;display:inline-block;letter-spacing:0.5px;
  transition:background 0.2s;
}
.btn-map-nav:hover{background:var(--gold-dark);}
.btn-map-nav-apple{
  background:var(--white);color:#103463;padding:12px 24px;
  font-weight:700;font-size:0.85rem;text-transform:uppercase;text-decoration:none;
  border-radius:4px;display:inline-block;letter-spacing:0.5px;
  transition:background 0.2s;
}
.btn-map-nav-apple:hover{background:#f0f0f0;}`;
}

function renderMetricItem(metric) {
  return `
      <div class="metric-item">
        <div class="metric-badge" aria-label="${metric.badgeLabel}">${metric.badge}</div>
        <div class="metric-details">
          <strong>${metric.title}</strong>
          <span>${metric.description}</span>
        </div>
      </div>`;
}

export function generateTransportSectionHtml() {
  const metricsHtml = TRANSPORT_METRICS.map(renderMetricItem).join('\n');
  const mapEmbedUrl = resolveMapIframeEmbedUrl();

  return `<!-- ▼ CONTENT: location-strip ▼ -->
<div class="transport-section-wrapper" aria-label="Location, parking and transport">

  <div class="map-visual-container map-embed-canvas">
    <iframe
      class="map-embed-frame"
      src="${mapEmbedUrl}"
      width="100%"
      height="100%"
      allowfullscreen=""
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      title="Interactive Burleigh Hotspots &amp; Transport Map Layer">
    </iframe>
  </div>

  <div class="info-content-panel">
    <span class="panel-tag">Location, Parking &amp; Transport</span>
    <h2 class="panel-main-title">Easy to Reach.<br>Easy to Park.</h2>

    <div class="metric-row-grid">
${metricsHtml}
    </div>

    <div class="routing-actions-wrapper">
      <a href="${GOOGLE_MAPS_DESTINATION_URL}" target="_blank" rel="noopener noreferrer" class="btn-map-nav" data-track="map" data-provider="google" aria-label="Open directions in Google Maps (opens in new tab)">Open Google Maps →</a>
      <a href="${APPLE_MAPS_DESTINATION_URL}" target="_blank" rel="noopener noreferrer" class="btn-map-nav-apple" data-track="map" data-provider="apple" aria-label="Open directions in Apple Maps (opens in new tab)">Apple Maps Link ↗</a>
    </div>

  </div>
</div>
<!-- ▲ END CONTENT: location-strip ▲ -->`;
}

export function generateTransportSectionResponsiveStyles() {
  return `  .transport-section-wrapper{flex-direction:column;}
  .info-content-panel{padding:44px 28px;}`;
}
