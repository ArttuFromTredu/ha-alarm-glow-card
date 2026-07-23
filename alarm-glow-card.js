/* ── Colour palette ──────────────────────────────────────────────────────── */
const COLORS = {
  Red:    [255,  35,  35],
  Amber:  [255, 160,   0],
  Orange: [255, 110,   0],
  Yellow: [255, 230,   0],
  Lime:   [160, 255,   0],
  Green:  [ 35, 215,  60],
  Teal:   [  0, 185, 160],
  Cyan:   [  0, 215, 215],
  Blue:   [ 25, 120, 255],
  Indigo: [ 85,  35, 225],
  Purple: [155,  30, 255],
  Pink:   [255,  65, 175],
  Rose:   [255,  55,  90],
};

const WRAPPER_ID = 'alarm-glow-wrapper';
const OVERLAY_ID = 'alarm-glow-overlay';
const STYLE_ID   = 'alarm-glow-styles';

/* ── Custom element ──────────────────────────────────────────────────────── */
class AlarmGlowCard extends HTMLElement {

  constructor() {
    super();
    /* Defaults set here so _render() is safe even if setConfig is called late. */
    this._alarmEntity   = 'input_boolean.alarm_active';
    this._colorEntity   = 'input_select.alarm_glow_color';
    this._pulseDuration = 2;
  }

  /* Lovelace calls setConfig before the element is connected. */
  setConfig(config = {}) {
    this._alarmEntity   = config.alarm_entity   ?? 'input_boolean.alarm_active';
    this._colorEntity   = config.color_entity   ?? 'input_select.alarm_glow_color';
    this._pulseDuration = config.pulse_duration ?? 2;
  }

  connectedCallback() {
    /* The card element itself is invisible — visuals live in a body overlay. */
    this.style.display = 'none';
    this._ensureOverlay();
    /* Re-render in case hass was set before we connected. */
    if (this._hass) this._render();
  }

  disconnectedCallback() {
    /*
     * Remove the overlay only when the last instance leaves the DOM.
     * During Lovelace view transitions the incoming card connects before
     * the outgoing one disconnects, so the overlay is never torn down
     * mid-navigation.
     */
    if (!document.querySelector('alarm-glow-card')) {
      document.getElementById(WRAPPER_ID)?.remove();
      document.getElementById(STYLE_ID)?.remove();
    }
  }

  /* Lovelace calls this setter on every state change. */
  set hass(hass) {
    this._hass = hass;
    if (this.isConnected) this._render();
  }

  /* Returning 0 means the card occupies no visible space in the layout. */
  getCardSize() { return 0; }

  /* ── Private ─────────────────────────────────────────────────────────── */
  _ensureOverlay() {
    /* Styles — injected once into <head>. */
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        /* Wrapper: handles smooth fade in/out */
        #${WRAPPER_ID} {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 9999;
          opacity: 0;
          transition: opacity 1s ease;
        }
        /* Inner overlay: handles pulse animation + colour blending */
        #${OVERLAY_ID} {
          position: absolute;
          inset: 0;
          box-sizing: border-box;
          transition: box-shadow 0.8s ease;
        }
        #${OVERLAY_ID}.active {
          animation: alarm-glow-pulse var(--alarm-glow-duration, 2s)
                     ease-in-out infinite;
        }
        @keyframes alarm-glow-pulse {
          0%   { opacity: 0.20; }
          50%  { opacity: 1.00; }
          100% { opacity: 0.20; }
        }
      `;
      document.head.appendChild(style);
    }

    /* Wrapper + overlay appended to <body> so they escape all stacking contexts. */
    if (!document.getElementById(WRAPPER_ID)) {
      const wrapper = document.createElement('div');
      wrapper.id = WRAPPER_ID;
      const overlay = document.createElement('div');
      overlay.id = OVERLAY_ID;
      wrapper.appendChild(overlay);
      document.body.appendChild(wrapper);
    }
  }

  _render() {
    const wrapper = document.getElementById(WRAPPER_ID);
    const overlay = document.getElementById(OVERLAY_ID);
    if (!wrapper || !overlay || !this._hass) return;

    const isActive  = this._hass.states[this._alarmEntity]?.state === 'on';
    const colorName = this._hass.states[this._colorEntity]?.state ?? 'Red';
    const [r, g, b] = COLORS[colorName] ?? COLORS.Red;

    overlay.style.setProperty('--alarm-glow-duration', `${this._pulseDuration}s`);

    if (isActive) {
      /* Update colour and start pulse, then fade the wrapper in. */
      const rgba = (a) => `rgba(${r},${g},${b},${a})`;
      overlay.style.boxShadow = [
        `inset 0 0  40px 10px ${rgba(0.80)}`,
        `inset 0 0  90px 30px ${rgba(0.50)}`,
        `inset 0 0 160px 60px ${rgba(0.25)}`,
      ].join(', ');
      overlay.classList.add('active');
      wrapper.style.opacity = '1';
    } else {
      /* Fade the wrapper out, then stop the animation once invisible. */
      wrapper.style.opacity = '0';
      wrapper.addEventListener('transitionend', () => {
        if (wrapper.style.opacity === '0') {
          overlay.classList.remove('active');
          overlay.style.boxShadow = 'none';
        }
      }, { once: true });
    }
  }
}

customElements.define('alarm-glow-card', AlarmGlowCard);
