import { css } from "lit";

/** Shared card styles built on Home Assistant theme tokens only. */
export const cardStyles = css`
  :host {
    --wp-text: var(--primary-text-color);
    --wp-subtext: var(--secondary-text-color);
    --wp-accent: var(--primary-color);
    --wp-on-accent: var(--text-primary-color, #fff);
    --wp-surface: var(--secondary-background-color);
    --wp-divider: var(--divider-color);
    --wp-success: var(--success-color, #43a047);
    --wp-warning: var(--warning-color, #ffa600);
    --wp-error: var(--error-color, #db4437);
    --wp-solar: var(--energy-solar-color, #ff9800);
    --wp-battery: var(--energy-battery-in-color, #f06292);
    --wp-grid: var(--energy-grid-consumption-color, #488fc2);
    --wp-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg, 12px));
    --wp-focus: var(--wp-accent);
    display: block;
  }

  ha-card {
    block-size: 100%;
    box-sizing: border-box;
    padding: var(--ha-space-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-4, 16px);
    color: var(--wp-text);
  }

  .icon {
    inline-size: var(--mdc-icon-size, 24px);
    block-size: var(--mdc-icon-size, 24px);
    flex: none;
  }

  button {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  button:disabled {
    cursor: default;
    opacity: 0.5;
  }
  :where(button, input, select):focus-visible {
    outline: 2px solid var(--wp-focus);
    outline-offset: 2px;
  }

  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--ha-space-3, 12px);
  }
  .title {
    margin: 0;
    font-size: var(--ha-font-size-2xl, 24px);
    font-weight: var(--ha-font-weight-bold, 600);
    line-height: var(--ha-line-height-condensed, 1.2);
  }
  .subtitle {
    margin: var(--ha-space-1, 4px) 0 0;
    color: var(--wp-subtext);
    font-size: var(--ha-font-size-m, 14px);
    line-height: var(--ha-line-height-normal, 1.5);
  }
  .section-title {
    margin: 0;
    font-size: var(--ha-font-size-l, 16px);
    font-weight: var(--ha-font-weight-bold, 600);
  }

  .icon-button {
    display: inline-grid;
    place-items: center;
    inline-size: 40px;
    block-size: 40px;
    border-radius: 50%;
    color: var(--wp-subtext);
    flex: none;
  }
  .icon-button:hover {
    background: var(--wp-surface);
  }

  .stack {
    display: grid;
    gap: var(--ha-space-4, 16px);
  }
  .stack.tight {
    gap: var(--ha-space-3, 12px);
  }

  .value {
    font-variant-numeric: tabular-nums;
  }
  .unit {
    margin-inline-start: 0.2em;
    font-size: 0.7em;
    font-weight: var(--ha-font-weight-normal, 400);
    color: var(--wp-subtext);
  }

  .pill-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ha-space-2, 8px);
    min-block-size: 48px;
    padding-inline: var(--ha-space-6, 24px);
    border-radius: var(--ha-border-radius-pill, 9999px);
    font-size: var(--ha-font-size-l, 16px);
    font-weight: var(--ha-font-weight-medium, 500);
  }
  .pill-button.filled {
    background: var(--wp-accent);
    color: var(--wp-on-accent);
  }
  .pill-button.tonal {
    background: var(--wp-surface);
    color: var(--wp-text);
  }
  .pill-button.outlined {
    border: 1px solid var(--wp-divider);
  }
  .pill-button.block {
    inline-size: 100%;
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--ha-space-3, 12px);
    min-block-size: 48px;
  }
  .row .grow {
    flex: 1;
    min-inline-size: 0;
  }
  .row-button {
    inline-size: 100%;
    text-align: start;
    border-radius: var(--ha-border-radius-md, 8px);
  }
  .row-value {
    color: var(--wp-subtext);
    font-variant-numeric: tabular-nums;
  }

  .divider {
    block-size: 1px;
    background: var(--wp-divider);
    border: none;
    margin: 0;
  }

  .warning {
    display: flex;
    gap: var(--ha-space-2, 8px);
    align-items: center;
    color: var(--wp-subtext);
  }
  .warning .icon {
    color: var(--wp-warning);
  }

  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
`;
