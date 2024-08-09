import { LitElement, css, html } from "lit";

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
    ::slotted(*) {
      height: 100%;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      user-select: none;
    }
    .blink_me {
      animation: blinker 1s linear infinite;
    }

    @keyframes blinker {
      50% {
        box-shadow: inset 0 0 2rem 0 rgba(255, 255, 0, 1);
      }
    }

    .top {
      position: absolute;
      top: 50%;
      width: 100%;
      border-top: 1px solid black;
      border-left: 1px solid black;
      border-right: 1px solid black;
      z-index: 1;
    }
    .bottom {
      position: absolute;
      bottom: 50%;
      width: 100%;
      border-bottom: 1px solid black;
      border-left: 1px solid black;
      border-right: 1px solid black;
      z-index: 1;
    }
  `;

  static properties = {
    offset: { type: Number },
    valueRange: { type: Number },
    blinkArray: { type: Array },
    childHeight: { type: Number },
  };

  constructor() {
    super();
    this.listLength = 10;
    this.valueRange = 1;
    this.blinkArray = Array(this.listLength).fill(0);
    this.offset = 0;
  }

  values() {
    const index = this.offset % this.listLength;
    const start = -this.valueRange + 1 + index;
    const end = this.valueRange + index - 1;
    const valueList = [];
    for (let i = start; i <= end; i++) {
      valueList.push(i < 0 ? i + this.listLength : i);
    }
    return valueList;
  }

  setValues() {
    const container = this.shadowRoot.querySelector(".container");
    this.listLength = this.children.length;
    const circumRadius = container.clientHeight / 2;
    this.radius = circumRadius * Math.cos(Math.PI / this.listLength);
    this.x = (2 * Math.PI) / this.listLength;
    this.childHeight = this.radius * 2 * Math.tan(Math.PI / this.listLength);
  }

  updated(changedProperties) {
    if (changedProperties.has("offset")) {
      if (!this.offset) this.offset = 0;
    }
    if (changedProperties.has("symbols")) {
      this.updateValue();
    }

    this.setValues();
  }

  updateValue() {
    this.value = this.values().join(",");
    this.dispatchEvent(new Event("input", { bubbles: false, composed: true }));
  }

  firstUpdated() {
    this.tracking = false;
    this.offset = 0;
    window.addEventListener("mousemove", (event) => this.track(event));
    window.addEventListener("mouseup", () => this.stopTracking());
  }

  startTracking() {
    this.tracking = true;
  }

  stopTracking() {
    if (!this.tracking) return;
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
        this.updateValue();
      } else {
        requestAnimationFrame(lerp);
      }
    };
    lerp();
  }

  startPlaying() {
    this.playing = true;
    this.play();
  }

  play() {
    if (!this.playing) return;
    this.offset -= (0.05 * this.childHeight) / this.listLength;
    this.updateValue();
    requestAnimationFrame(() => this.play());
  }

  stopPlaying() {
    this.playing = false;
    this.offset = Math.round(this.offset);
    this.updateValue();
  }

  track(event) {
    if (!this.tracking) return;
    this.offset -= event.movementY * 0.03;
  }

  transformation(angle) {
    const sin = Math.sin(angle) * this.radius;
    return `translateY(${sin}px) rotateX(${angle}rad)`;
  }

  angleFromZero(x) {
    const radMax = Math.PI * 2;
    const degrees = ((x % radMax) + radMax) % radMax; // Normalize to [0, 360)
    return Math.min(degrees, radMax - degrees);
  }

  indicatorStyle(top) {
    const heights = [];
    if (!this.childHeight) return "";
    for (let i = 0; i < this.valueRange; i++) {
      if (i === 0) {
        heights.push(this.childHeight / 2);
        continue;
      }
      heights.push(Math.cos(this.x * i) * this.childHeight);
    }
    console.log(heights);
    return `transform: translateY(${
      heights.reduce((a, b) => a + b) * (top ? -1 : 1)
    }px); height: ${heights[-1] / 2}px;`;
  }

  distance_from_index(index1) {
    const offset = this.offset % this.listLength;
    const index2 = offset;
    const clockwiseDistance = Math.abs(index1 - index2) % this.listLength;
    const counterClockwiseDistance = Math.abs(
      this.listLength - clockwiseDistance
    );
    return Math.min(clockwiseDistance, counterClockwiseDistance);
  }

  backgroundColor(index) {
    // brightness = 100 - (distance_from_index * 10)
    const distance = this.distance_from_index(index);
    const brightness = 100 - (100 * distance) / this.listLength;
    return `filter: brightness(${brightness}%);`;
  }

  style(index) {
    const angle = (index - this.offset) * this.x;
    return `height: ${this.childHeight}px; transform: ${this.transformation(
      angle
    )}; ${this.backgroundColor(index)}`;
  }

  blinking(index) {
    return (
      this.blinkArray[index] > 0 &&
      this.distance_from_index(index) < this.valueRange
    );
  }

  render() {
    return html`
      <div
        style="font-size: ${this.childHeight * 0.9}px"
        class="container"
        @mousedown="${() => this.startTracking()}"
      >
        <div style="${this.indicatorStyle(true)}" class="top"></div>
        <div style="${this.indicatorStyle(false)}" class="bottom"></div>
        <div class="middle"></div>
        ${Array.from({ length: this.listLength }).map(
          (symbol, index) => html`
            <div
              class="symbol ${this.blinking(index) && "blink_me"} ${Math.round(
                this.offset
              ) ===
                index + 1 && "last"} ${Math.round(this.offset) === index &&
              "first"}"
              style="${this.style(index)}"
            >
              <slot name="${index}"></slot>
            </div>
          `
        )}
      </div>
    `;
  }
}

customElements.define("my-component", MyComponent);
