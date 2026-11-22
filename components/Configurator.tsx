'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Download, RotateCcw, Send, SlidersHorizontal } from 'lucide-react';
import type { ConfiguratorValues } from './configurator/ConfiguratorScene';

const ConfiguratorScene = dynamic(() => import('./configurator/ConfiguratorScene'), {
  ssr: false,
  loading: () => (
    <div className="configurator-loading">
      <span className="spin" />
      Preparing the interactive 3D scene…
    </div>
  ),
});

const initial: ConfiguratorValues = {
  mode: 'wardrobe',
  finish: 'ivory',
  width: 2.13,
  height: 2.49,
  doors: 3,
  shelves: 4,
  overhead: true,
  showInterior: false,
  shelfWidth: 0.91,
};

function Range({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="config-range">
      <span>
        {label}
        <strong>
          {value.toFixed(step < 1 ? 2 : 0)} {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export default function Configurator() {
  const router = useRouter();
  const [values, setValues] = useState<ConfiguratorValues>(initial);
  function update<K extends keyof ConfiguratorValues>(key: K, value: ConfiguratorValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  function changeMode(mode: ConfiguratorValues['mode']) {
    setValues((current) => ({
      ...current,
      mode,
      width: mode === 'wardrobe' ? 2.13 : 2.74,
      height: mode === 'wardrobe' ? 2.49 : 2.56,
      shelfWidth: 0.91,
    }));
  }
  function download() {
    const blob = new Blob(
      [JSON.stringify({ product: 'Do It Now custom configuration', ...values }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `do-it-now-${values.mode}-configuration.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="configurator-layout">
      <div className="configurator-scene-panel">
        <div className="configurator-tabs" role="tablist" aria-label="Configurator type">
          <button
            type="button"
            role="tab"
            aria-selected={values.mode === 'wardrobe'}
            className={values.mode === 'wardrobe' ? 'active' : ''}
            onClick={() => changeMode('wardrobe')}
          >
            Wardrobe
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={values.mode === 'tv'}
            className={values.mode === 'tv' ? 'active' : ''}
            onClick={() => changeMode('tv')}
          >
            TV feature wall
          </button>
        </div>
        <ConfiguratorScene values={values} />
        <p className="configurator-hint">
          Drag to rotate · Scroll or pinch to zoom · Geometry updates with your controls
        </p>
      </div>
      <aside className="configurator-controls">
        <span className="section-kicker">
          <SlidersHorizontal size={15} /> LIVE CONFIGURATION
        </span>
        <h2>{values.mode === 'wardrobe' ? 'Wardrobe study' : 'TV-wall study'}</h2>
        <Range
          label="Overall width"
          value={values.width}
          min={values.mode === 'wardrobe' ? 0.9 : 1.8}
          max={values.mode === 'wardrobe' ? 4 : 5}
          step={0.01}
          unit="m"
          onChange={(value) => update('width', value)}
        />
        <Range
          label="Overall height"
          value={values.height}
          min={1.8}
          max={3.5}
          step={0.01}
          unit="m"
          onChange={(value) => update('height', value)}
        />
        {values.mode === 'wardrobe' ? (
          <>
            <Range
              label="Main doors"
              value={values.doors}
              min={1}
              max={4}
              step={1}
              unit="doors"
              onChange={(value) => update('doors', value)}
            />
            <Range
              label="Internal shelves"
              value={values.shelves}
              min={2}
              max={7}
              step={1}
              unit="shelves"
              onChange={(value) => update('shelves', value)}
            />
            <label className="config-toggle">
              <input
                type="checkbox"
                checked={values.overhead}
                onChange={(event) => update('overhead', event.target.checked)}
              />
              <span>Separate overhead cabinets</span>
            </label>
            <label className="config-toggle">
              <input
                type="checkbox"
                checked={values.showInterior}
                onChange={(event) => update('showInterior', event.target.checked)}
              />
              <span>Show internal shelving</span>
            </label>
          </>
        ) : (
          <>
            <Range
              label="Open-shelf tower width"
              value={values.shelfWidth}
              min={0.6}
              max={1.5}
              step={0.01}
              unit="m"
              onChange={(value) => update('shelfWidth', value)}
            />
            <Range
              label="Standing open shelves"
              value={values.shelves}
              min={3}
              max={7}
              step={1}
              unit="levels"
              onChange={(value) => update('shelves', value)}
            />
            <p className="config-note">
              The tower remains door-free, with a separate console and a single dominant TV panel.
            </p>
          </>
        )}
        <fieldset className="config-finishes">
          <legend>Finish direction</legend>
          {(['ivory', 'walnut', 'sage'] as const).map((finish) => (
            <button
              key={finish}
              type="button"
              className={`${values.finish === finish ? 'active' : ''} finish-${finish}`}
              onClick={() => update('finish', finish)}
            >
              <i />
              {finish === 'ivory' ? 'Ivory + walnut' : finish === 'walnut' ? 'Warm walnut' : 'Sage + oak'}
            </button>
          ))}
        </fieldset>
        <div className="config-summary">
          <strong>Configuration summary</strong>
          <span>
            {values.width.toFixed(2)} m wide × {values.height.toFixed(2)} m high
          </span>
          <span>
            {values.mode === 'wardrobe'
              ? `${values.doors} main doors · ${values.shelves} shelves`
              : `${values.shelfWidth.toFixed(2)} m tower · ${values.shelves} open levels`}
          </span>
          <small>Concept geometry only. Final dimensions and structure require site confirmation.</small>
        </div>
        <button
          type="button"
          className="button"
          onClick={() => router.push(`/studio?config=${encodeURIComponent(JSON.stringify(values))}`)}
        >
          Use in Project Studio <Send size={17} />
        </button>
        <div className="config-secondary-actions">
          <button type="button" className="button button-secondary" onClick={download}>
            <Download size={16} /> Export specification
          </button>
          <button type="button" className="button button-secondary" onClick={() => setValues(initial)}>
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </aside>
    </div>
  );
}
