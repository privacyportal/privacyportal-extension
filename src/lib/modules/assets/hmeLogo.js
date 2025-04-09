/**
 * @param {{
 *  width?: string;
 *  height?: string;
 *  viewBox?: string;
 * }} props
 * @param {SVGElement[]} children
 * @param {{
 *  fillRule?: string;
 *  clipRule?: string;
 *  strokeLinecap?: string;
 *  strokeLinejoin?: string;
 *  strokeMiterlimit?: string;
 * } | undefined} opts
 * @returns {SVGElement}
 */
function svg(props, children, opts = undefined) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (props?.width) svg.setAttribute('width', props.width);
  if (props?.height) svg.setAttribute('height', props.height);
  if (props?.viewBox) svg.setAttribute('viewBox', props.viewBox);
  if (opts?.fillRule) svg.style.fillRule = opts.fillRule;
  if (opts?.clipRule) svg.style.clipRule = opts.clipRule;
  if (opts?.strokeLinejoin) svg.style.strokeLinejoin = opts.strokeLinejoin;
  if (opts?.strokeMiterlimit) svg.style.strokeMiterlimit = opts.strokeMiterlimit;

  for (const child of children) {
    svg.appendChild(child);
  }
  return svg;
}

/**
 * @param {string} d
 * @param {{fill?: string;} | undefined} opts
 * @returns {SVGPathElement}
 */
function path(d, opts = undefined) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  if (opts?.fill) path.style.fill = opts.fill;
  return path;
}

export default function () {
  return svg(
    { width: '100%', height: '100%', viewBox: '0 0 150 150' },
    [
      path('M150,22.5C150,10.082 139.918,0 127.5,0L22.5,0C10.082,0 0,10.082 0,22.5L0,127.5C0,139.918 10.082,150 22.5,150L127.5,150C139.918,150 150,139.918 150,127.5L150,22.5Z', { fill: '#333' }),
      path(
        'M112.979,124.728C120.977,123.051 126.993,115.921 126.993,107.39C126.993,102.517 125.03,98.101 121.857,94.897L126.44,90.314L126.45,90.324C130.816,94.695 133.518,100.73 133.518,107.39C133.518,119.687 124.308,129.85 112.414,131.351L114.651,133.588L110.239,138L100.561,128.322L110.239,118.644L114.651,123.056L112.979,124.728ZM106.337,83.425L104.103,81.191L108.515,76.779L118.192,86.457L108.515,96.135L104.103,91.723L105.781,90.045C97.768,91.71 91.737,98.848 91.737,107.39C91.737,112.261 93.698,116.675 96.87,119.879L96.873,119.882L92.391,124.363L92.293,124.469L92.29,124.465C87.918,120.093 85.212,114.055 85.212,107.39C85.212,95.085 94.434,84.916 106.337,83.425ZM78.539,116.812L30.658,116.812C22.834,116.812 16.482,110.46 16.482,102.636L16.482,36.484C16.482,28.661 22.834,22.309 30.658,22.309L117.06,22.309C124.884,22.309 131.236,28.661 131.236,36.484L131.236,82.065C128.437,79.412 125.165,77.253 121.561,75.728L121.561,36.128C121.561,36.128 86.535,62.757 76.366,70.488C74.751,71.716 72.513,71.711 70.903,70.475C60.81,62.728 26.158,36.128 26.158,36.128L26.158,107.005L76.571,107.005C76.719,110.44 77.402,113.736 78.539,116.812ZM109.365,86.454L109.365,86.461L109.369,86.457L109.365,86.454ZM73.627,59.885L111.21,31.984L36.508,31.984L73.627,59.885Z',
        { fill: '#fff' }
      )
    ],
    {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      strokeLinejoin: 'round',
      strokeMiterlimit: '2'
    }
  );
}
