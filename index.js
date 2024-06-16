import { html, css, LitElement } from 'lit';

class MyComponent extends LitElement {
  static styles = css`
    .container {
        position: relative;
        height: 100%;
        background-color: #f0f0f0;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .middle {
        position: absolute;
        width: 150%;
        height: 5px;
        background-color: black;
        z-index: -1;

    }
    .symbol {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        transform-origin: center;
        pointer-events: none;
        background-color: #f0f0f0;
        backface-visibility: hidden;
        user-select: none;
    }
  `;

  static properties = {
    symbols: { type: String },
    offset: { type: Number },

  };

  constructor() {
    super();
    this.symbols = '0, 1, 2, 3, 4, 5, 6, 7, 8, 9'
    this.symbolsList = this.symbols.split(',').map(symbol => symbol.trim());
  }

  updated(changedProperties) {
    if (changedProperties.has('symbols')) {
        this.symbolsList = this.symbols.split(',').map(symbol => symbol.trim());
        const container = this.shadowRoot.querySelector('.container');
        const circumRadius = container.clientHeight / 2;
        this.radius = circumRadius * Math.cos(Math.PI / this.symbolsList.length);
        this.x = 2 * Math.PI / this.symbolsList.length;
        this.childHeight = this.radius * 2 * Math.tan(Math.PI / this.symbolsList.length)
    }
  }

  firstUpdated() {
    this.tracking = false;
    this.offset = 0;
    window.addEventListener('mousemove', (event) => this.track(event));
    window.addEventListener('mouseup', () => this.stopTracking());
  }

    startTracking() {
        this.tracking = true;
    }

    stopTracking() {
        this.tracking = false;
        this.lerpToWhole();
    }

    lerp(from, to, t) {
        return from + (to - from) * t;
    }

    lerpToWhole() {
        const target = Math.round(this.offset);
        const step = 0.1;
        const lerp = () => {
            if (this.tracking) return;
            this.offset = this.lerp(this.offset, target, step);
            if (Math.abs(this.offset - target) < 0.001) {
                this.offset = target;
            } else {
                requestAnimationFrame(lerp);
            }
        }
        lerp();
    }

    track(event) {
        if (!this.tracking) return;
        console.log(event.movementY);
        this.offset -= event.movementY * 0.03;
    }

  transformation(angle) {
    const sin = Math.sin(angle) * this.radius;
    return `translateY(${sin}px) rotateX(${angle}rad)`;
  }

  angleFromZero(angle) {
    return (angle + 2 * Math.PI) % (2 * Math.PI);
  }

  backgroundColor(angle) {
    return `rgba(0, 0, 0, ${0.5 - 0.5*Math.abs(this.angleFromZero(angle) - Math.PI) / Math.PI})`
  }
  
  style(index) {
    const angle = (index - this.offset) * this.x;
    return `height: ${this.childHeight}px; transform: ${this.transformation(angle)}; background-color: ${this.backgroundColor(angle)};`
  } 


  render() {
    return html`
      <div style="font-size: ${this.childHeight * 0.9}px" class="container" @mousedown="${() => this.startTracking()}">
        <div class="middle"></div>
        ${this.symbolsList.map((symbol, index) => html`
          <div class="symbol" style="${this.style(index)}">
            ${symbol}
          </div>
        `)}
      </div>
    `;
  }
}

customElements.define('my-component', MyComponent);
